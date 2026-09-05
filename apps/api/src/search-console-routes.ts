import { Hono } from 'hono';
import { z } from 'zod';

const SEARCH_CONSOLE_PROVIDER = 'google_search_console';
const READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SITES_URL = 'https://www.googleapis.com/webmasters/v3/sites';
const GOOGLE_SEARCH_ANALYTICS_URL = 'https://www.googleapis.com/webmasters/v3/sites';
const GOOGLE_INSPECTION_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const MAX_QUERY_ROWS = 500;

type SearchConsoleBindings = {
  GOOGLE_SEARCH_CONSOLE_CLIENT_ID?: string;
  GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET?: string;
  GOOGLE_SEARCH_CONSOLE_REDIRECT_URI?: string;
  TOKEN_ENCRYPTION_KEY?: string;
};

type RouteHelpers = {
  requireUser: (context: any, email: string, installationId: string) => Promise<any>;
  requireSupabase: (env: any) => any;
};

type SearchConsoleContext = {
  env: SearchConsoleBindings;
  req: any;
  json: (body: unknown, status?: number) => Response;
  html: (body: string, status?: number) => Response;
};

type ConnectionRecord = {
  id: string;
  status: string;
  token_expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

type SiteEntry = {
  siteUrl?: string;
  permissionLevel?: string;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + 0x8000, bytes.length)));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('TOKEN_ENCRYPTION_KEY must contain exactly 64 hexadecimal characters.');
  }
  return new Uint8Array(hex.match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)));
}

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function encryptionKey(env: SearchConsoleBindings): Promise<CryptoKey> {
  if (!env.TOKEN_ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY is not configured.');
  return crypto.subtle.importKey('raw', arrayBuffer(hexToBytes(env.TOKEN_ENCRYPTION_KEY)), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptSecret(env: SearchConsoleBindings, value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(env), new TextEncoder().encode(value)));
  return `${toBase64Url(iv)}.${toBase64Url(encrypted)}`;
}

async function decryptSecret(env: SearchConsoleBindings, value: string): Promise<string> {
  const [ivValue, encryptedValue] = value.split('.');
  if (!ivValue || !encryptedValue) throw new Error('Stored Search Console token is invalid.');
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: arrayBuffer(fromBase64Url(ivValue)) },
    await encryptionKey(env),
    arrayBuffer(fromBase64Url(encryptedValue))
  );
  return new TextDecoder().decode(decrypted);
}

async function hmacKey(env: SearchConsoleBindings): Promise<CryptoKey> {
  if (!env.TOKEN_ENCRYPTION_KEY) throw new Error('TOKEN_ENCRYPTION_KEY is not configured.');
  return crypto.subtle.importKey('raw', arrayBuffer(hexToBytes(env.TOKEN_ENCRYPTION_KEY)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function hashNonce(nonce: string): Promise<string> {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))));
}

async function createState(env: SearchConsoleBindings, payload: Record<string, unknown>): Promise<string> {
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(env), new TextEncoder().encode(encoded)));
  return `${encoded}.${toBase64Url(signature)}`;
}

async function verifyState(env: SearchConsoleBindings, state: string): Promise<Record<string, unknown> | null> {
  const [encoded, signature] = state.split('.');
  if (!encoded || !signature) return null;
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(env), arrayBuffer(fromBase64Url(signature)), new TextEncoder().encode(encoded));
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as Record<string, unknown>;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (typeof payload.email !== 'string' || typeof payload.nonce !== 'string' || typeof payload.installationId !== 'string' || typeof payload.projectId !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

function accessInput(context: SearchConsoleContext, body?: Record<string, unknown>) {
  return z.object({
    email: z.string().email(),
    installationId: z.string().uuid()
  }).safeParse({
    email: body?.email ?? context.req.query('email'),
    installationId: body?.installationId ?? context.req.header('X-Device-Id')
  });
}

function validSiteUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 4 || value.length > 2048) return false;
  return value.startsWith('sc-domain:') || /^https?:\/\/[^\s]+\/$/.test(value);
}

function propertyMetadata(connection: ConnectionRecord, projectId: string): string | null {
  const properties = connection.metadata?.projectProperties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return null;
  const value = (properties as Record<string, unknown>)[projectId];
  return typeof value === 'string' && validSiteUrl(value) ? value : null;
}

function siteContainsUrl(siteUrl: string, candidate: string): boolean {
  try {
    if (siteUrl.startsWith('sc-domain:')) {
      const host = new URL(candidate).hostname.toLowerCase();
      const domain = siteUrl.slice('sc-domain:'.length).toLowerCase();
      return host === domain || host.endsWith(`.${domain}`);
    }
    const property = new URL(siteUrl);
    const inspected = new URL(candidate);
    return inspected.origin === property.origin && inspected.pathname.startsWith(property.pathname);
  } catch {
    return false;
  }
}

async function fetchJson(url: string, accessToken: string, init: RequestInit = {}): Promise<{ response: Response; data: any }> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function projectAccess(context: SearchConsoleContext, helpers: RouteHelpers, projectId: string, email: string, installationId: string) {
  const access = await helpers.requireUser(context, email, installationId);
  if (!access || !access.ok) return { error: context.json({ error: access?.error || 'Authentication required.' }, access?.status || 401) };
  const supabase = helpers.requireSupabase(context.env);
  const { data: project } = await supabase.from('projects').select('id,name,production_url').eq('id', projectId).eq('email', email.toLowerCase()).maybeSingle();
  if (!project) return { error: context.json({ error: 'Project not found.' }, 404) };
  return { supabase, project };
}

async function getConnection(supabase: any, email: string): Promise<ConnectionRecord | null> {
  const { data } = await supabase.from('backend_connections').select('id,status,token_expires_at,metadata').eq('owner_email', email.toLowerCase()).eq('provider', SEARCH_CONSOLE_PROVIDER).maybeSingle();
  return data as ConnectionRecord | null;
}

async function accessToken(context: SearchConsoleContext, supabase: any, connection: ConnectionRecord, email: string): Promise<string> {
  const { data: credentials } = await supabase.from('encrypted_provider_credentials').select('encrypted_access_token,encrypted_refresh_token').eq('connection_id', connection.id).maybeSingle();
  if (!credentials?.encrypted_access_token) throw new Error('Search Console credentials are unavailable. Reconnect the property.');
  if (connection.status !== 'connected') throw new Error('Search Console connection is not active. Reconnect the property.');
  if (connection.token_expires_at && new Date(connection.token_expires_at).getTime() > Date.now() + 60000) {
    return decryptSecret(context.env, credentials.encrypted_access_token);
  }
  if (!credentials.encrypted_refresh_token || !context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || !context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET) {
    throw new Error('Search Console OAuth credentials are expired or incomplete. Reconnect the property.');
  }
  const refreshToken = await decryptSecret(context.env, credentials.encrypted_refresh_token);
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
      client_secret: context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const tokenData = await tokenResponse.json().catch(() => ({})) as Record<string, unknown>;
  if (!tokenResponse.ok || typeof tokenData.access_token !== 'string') {
    await supabase.from('backend_connections').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', connection.id);
    throw new Error('Google rejected the Search Console token. Reconnect the property.');
  }
  await supabase.from('encrypted_provider_credentials').update({ encrypted_access_token: await encryptSecret(context.env, tokenData.access_token), updated_at: new Date().toISOString() }).eq('connection_id', connection.id);
  await supabase.from('backend_connections').update({ token_expires_at: new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000).toISOString(), status: 'connected', updated_at: new Date().toISOString() }).eq('id', connection.id);
  return tokenData.access_token;
}

function missingConfiguration(context: SearchConsoleContext): Response | null {
  if (!context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || !context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || !context.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI || !context.env.TOKEN_ENCRYPTION_KEY) {
    return context.json({ error: 'Google Search Console integration is not configured on the backend.' }, 503);
  }
  return null;
}

export function registerSearchConsoleRoutes(app: Hono<{ Bindings: any }>, helpers: RouteHelpers) {
  app.get('/projects/:id/search-console/connect', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const parsed = accessInput(context);
    if (!parsed.success) return context.json({ error: 'Email and device identifier are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
    const supabase = owned.supabase;
    await supabase.from('search_console_oauth_states').delete().eq('owner_email', parsed.data.email.toLowerCase()).lt('expires_at', new Date().toISOString());
    const stateHash = await hashNonce(nonce);
    const { error: stateError } = await supabase.from('search_console_oauth_states').insert({ owner_email: parsed.data.email.toLowerCase(), installation_id: parsed.data.installationId, project_id: projectId, state_hash: stateHash, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    if (stateError) return context.json({ error: 'Could not start the secure Google authorization flow.' }, 503);
    const state = await createState(context.env, { email: parsed.data.email.toLowerCase(), installationId: parsed.data.installationId, projectId, nonce, exp: Date.now() + 10 * 60 * 1000 });
    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizationUrl.search = new URLSearchParams({ client_id: context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!, redirect_uri: context.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI!, response_type: 'code', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', scope: READONLY_SCOPE, state }).toString();
    return context.json({ authorizationUrl: authorizationUrl.toString(), scope: READONLY_SCOPE, projectId });
  });

  app.get('/auth/google/search-console/callback', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const error = context.req.query('error');
    if (error) return context.html(`<main><h1>Search Console connection cancelled</h1><p>${String(error).replace(/[<>]/g, '')}</p><p>You can close this window and return to Quantora.</p></main>`, 400);
    const code = context.req.query('code');
    const stateValue = context.req.query('state');
    if (!code || !stateValue) return context.html('<main><h1>Search Console connection failed</h1><p>The OAuth callback did not contain the required code or state.</p></main>', 400);
    const state = await verifyState(context.env, stateValue);
    if (!state) return context.html('<main><h1>Search Console connection expired</h1><p>Start the connection again from Quantora.</p></main>', 400);
    const email = String(state.email).toLowerCase();
    const nonceHash = await hashNonce(String(state.nonce));
    const supabase = helpers.requireSupabase(context.env);
    const installationId = String(state.installationId);
    const projectId = String(state.projectId);
    const now = new Date().toISOString();
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('email', email).maybeSingle();
    if (!project) return context.html('<main><h1>Search Console project access could not be verified</h1><p>Return to Quantora and start the connection again.</p></main>', 403);
    const { data: consumedState, error: consumeError } = await supabase.from('search_console_oauth_states').update({ consumed_at: now }).eq('owner_email', email).eq('installation_id', installationId).eq('project_id', projectId).eq('state_hash', nonceHash).is('consumed_at', null).gt('expires_at', now).select('id').maybeSingle();
    if (consumeError || !consumedState) return context.html('<main><h1>Search Console authorization was already used</h1><p>Start a new connection from Quantora.</p></main>', 400);
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: String(code), client_id: context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!, client_secret: context.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET!, redirect_uri: context.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI!, grant_type: 'authorization_code' }) });
    const tokenData = await tokenResponse.json().catch(() => ({})) as Record<string, unknown>;
    if (!tokenResponse.ok || typeof tokenData.access_token !== 'string') return context.html('<main><h1>Search Console token exchange failed</h1><p>Google did not return a usable authorization token.</p></main>', 502);
    const existing = await getConnection(supabase, email);
    const connectionPayload = { owner_email: email, provider: SEARCH_CONSOLE_PROVIDER, status: 'connected', granted_scopes: typeof tokenData.scope === 'string' ? tokenData.scope.split(' ') : [READONLY_SCOPE], token_expires_at: new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000).toISOString(), metadata: existing?.metadata || {}, connected_at: existing?.status ? undefined : new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: connection, error: connectionError } = await supabase.from('backend_connections').upsert(connectionPayload, { onConflict: 'owner_email,provider' }).select('id').single();
    if (connectionError || !connection) return context.html('<main><h1>Search Console connection could not be saved</h1><p>Try again after checking the backend database configuration.</p></main>', 503);
    const oldCredentials = existing ? await supabase.from('encrypted_provider_credentials').select('encrypted_refresh_token').eq('connection_id', connection.id).maybeSingle() : { data: null };
    const encryptedRefreshToken = typeof tokenData.refresh_token === 'string' ? await encryptSecret(context.env, tokenData.refresh_token) : oldCredentials.data?.encrypted_refresh_token || null;
    const { error: credentialError } = await supabase.from('encrypted_provider_credentials').upsert({ connection_id: connection.id, encrypted_access_token: await encryptSecret(context.env, tokenData.access_token), encrypted_refresh_token: encryptedRefreshToken, encryption_version: 1, updated_at: new Date().toISOString() }, { onConflict: 'connection_id' });
    if (credentialError) return context.html('<main><h1>Search Console credentials could not be saved</h1><p>Try again after checking the backend encryption configuration.</p></main>', 503);
    return context.html('<main><h1>Google Search Console connected</h1><p>Your authorization was saved securely. Return to Quantora to choose a verified property.</p><p>You can close this window.</p></main>');
  });

  app.get('/projects/:id/search-console/status', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const parsed = accessInput(context);
    if (!parsed.success) return context.json({ error: 'Email and device identifier are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const connection = await getConnection(owned.supabase, parsed.data.email);
    return context.json({ connected: Boolean(connection && connection.status === 'connected'), status: connection?.status || 'not_connected', selectedProperty: connection ? propertyMetadata(connection, projectId) : null, scopes: connection?.status === 'connected' ? [READONLY_SCOPE] : [] });
  });

  app.get('/projects/:id/search-console/properties', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const parsed = accessInput(context);
    if (!parsed.success) return context.json({ error: 'Email and device identifier are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const connection = await getConnection(owned.supabase, parsed.data.email);
    if (!connection) return context.json({ error: 'Connect Google Search Console first.' }, 409);
    try {
      const token = await accessToken(context, owned.supabase, connection, parsed.data.email);
      const result = await fetchJson(GOOGLE_SITES_URL, token);
      if (!result.response.ok) return context.json({ error: 'Google Search Console properties could not be loaded.', googleStatus: result.response.status }, result.response.status === 401 ? 401 : 502);
      const sites = Array.isArray(result.data.siteEntry) ? result.data.siteEntry.filter((site: SiteEntry) => validSiteUrl(site.siteUrl)).map((site: SiteEntry) => ({ siteUrl: site.siteUrl, permissionLevel: site.permissionLevel || 'unknown' })) : [];
      return context.json({ properties: sites, selectedProperty: propertyMetadata(connection, projectId) });
    } catch (propertyError) {
      return context.json({ error: propertyError instanceof Error ? propertyError.message : 'Search Console properties could not be loaded.' }, 502);
    }
  });

  app.put('/projects/:id/search-console/property', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const body = await context.req.json().catch(() => null) as Record<string, unknown> | null;
    const parsed = accessInput(context, body || undefined);
    const siteUrl = body?.siteUrl;
    if (!parsed.success || !validSiteUrl(siteUrl)) return context.json({ error: 'Email, device identifier, and a valid verified property are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const connection = await getConnection(owned.supabase, parsed.data.email);
    if (!connection) return context.json({ error: 'Connect Google Search Console first.' }, 409);
    try {
      const token = await accessToken(context, owned.supabase, connection, parsed.data.email);
      const result = await fetchJson(GOOGLE_SITES_URL, token);
      const sites = Array.isArray(result.data.siteEntry) ? result.data.siteEntry : [];
      if (!result.response.ok || !sites.some((site: SiteEntry) => site.siteUrl === siteUrl)) return context.json({ error: 'That property was not returned as verified for this Google account.' }, 403);
      const currentMetadata = connection.metadata && typeof connection.metadata === 'object' ? connection.metadata : {};
      const currentProperties = currentMetadata.projectProperties && typeof currentMetadata.projectProperties === 'object' ? currentMetadata.projectProperties : {};
      const metadata = { ...currentMetadata, projectProperties: { ...currentProperties, [projectId]: siteUrl } };
      await owned.supabase.from('backend_connections').update({ metadata, updated_at: new Date().toISOString() }).eq('id', connection.id);
      return context.json({ selectedProperty: siteUrl });
    } catch (propertyError) {
      return context.json({ error: propertyError instanceof Error ? propertyError.message : 'The Search Console property could not be selected.' }, 502);
    }
  });

  app.post('/projects/:id/search-console/query', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const body = await context.req.json().catch(() => null) as Record<string, unknown> | null;
    const parsed = accessInput(context, body || undefined);
    const query = z.object({ startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dimensions: z.array(z.enum(['date', 'query', 'page', 'country', 'device', 'searchAppearance'])).max(3).default(['date']), rowLimit: z.number().int().min(1).max(MAX_QUERY_ROWS).default(250) }).safeParse(body || {});
    if (!parsed.success || !query.success || query.data.startDate > query.data.endDate) return context.json({ error: 'Valid Search Console date range and dimensions are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const connection = await getConnection(owned.supabase, parsed.data.email);
    if (!connection) return context.json({ error: 'Connect Google Search Console first.' }, 409);
    const siteUrl = propertyMetadata(connection, projectId);
    if (!siteUrl) return context.json({ error: 'Select a verified Search Console property for this project first.' }, 409);
    try {
      const token = await accessToken(context, owned.supabase, connection, parsed.data.email);
      const result = await fetchJson(`${GOOGLE_SEARCH_ANALYTICS_URL}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, token, { method: 'POST', body: JSON.stringify({ startDate: query.data.startDate, endDate: query.data.endDate, dimensions: query.data.dimensions, type: 'web', rowLimit: query.data.rowLimit, dataState: 'final' }) });
      if (!result.response.ok) return context.json({ error: 'Search Console analytics query failed.', googleStatus: result.response.status }, result.response.status === 401 ? 401 : 502);
      return context.json({ siteUrl, startDate: query.data.startDate, endDate: query.data.endDate, dimensions: query.data.dimensions, rows: Array.isArray(result.data.rows) ? result.data.rows : [], responseAggregationType: result.data.responseAggregationType || null });
    } catch (queryError) {
      return context.json({ error: queryError instanceof Error ? queryError.message : 'Search Console analytics query failed.' }, 502);
    }
  });

  app.post('/projects/:id/search-console/inspect', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const body = await context.req.json().catch(() => null) as Record<string, unknown> | null;
    const parsed = accessInput(context, body || undefined);
    const inspectionUrl = typeof body?.inspectionUrl === 'string' ? body.inspectionUrl : '';
    const languageCode = typeof body?.languageCode === 'string' && /^[a-z]{2}-[A-Z]{2}$/.test(body.languageCode) ? body.languageCode : 'en-US';
    if (!parsed.success || !/^https?:\/\/[^\s]+$/.test(inspectionUrl)) return context.json({ error: 'Email, device identifier, and a valid inspection URL are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const connection = await getConnection(owned.supabase, parsed.data.email);
    if (!connection) return context.json({ error: 'Connect Google Search Console first.' }, 409);
    const siteUrl = propertyMetadata(connection, projectId);
    if (!siteUrl) return context.json({ error: 'Select a verified Search Console property for this project first.' }, 409);
    if (!siteContainsUrl(siteUrl, inspectionUrl)) return context.json({ error: 'The inspection URL must be inside the selected Search Console property.' }, 400);
    try {
      const token = await accessToken(context, owned.supabase, connection, parsed.data.email);
      const result = await fetchJson(GOOGLE_INSPECTION_URL, token, { method: 'POST', body: JSON.stringify({ inspectionUrl, siteUrl, languageCode }) });
      if (!result.response.ok) return context.json({ error: 'Search Console URL inspection failed.', googleStatus: result.response.status }, result.response.status === 401 ? 401 : 502);
      return context.json({ inspectionUrl, siteUrl, result: result.data.inspectionResult || null });
    } catch (inspectionError) {
      return context.json({ error: inspectionError instanceof Error ? inspectionError.message : 'Search Console URL inspection failed.' }, 502);
    }
  });

  app.get('/projects/:id/search-console/sitemaps', async (rawContext) => {
    const context = rawContext as SearchConsoleContext;
    const configError = missingConfiguration(context);
    if (configError) return configError;
    const parsed = accessInput(context);
    if (!parsed.success) return context.json({ error: 'Email and device identifier are required.' }, 400);
    const projectId = String(context.req.param('id'));
    const owned = await projectAccess(context, helpers, projectId, parsed.data.email, parsed.data.installationId);
    if (owned.error) return owned.error;
    const connection = await getConnection(owned.supabase, parsed.data.email);
    if (!connection) return context.json({ error: 'Connect Google Search Console first.' }, 409);
    const siteUrl = propertyMetadata(connection, projectId);
    if (!siteUrl) return context.json({ error: 'Select a verified Search Console property for this project first.' }, 409);
    try {
      const token = await accessToken(context, owned.supabase, connection, parsed.data.email);
      const result = await fetchJson(`${GOOGLE_SITES_URL}/${encodeURIComponent(siteUrl)}/sitemaps`, token);
      if (!result.response.ok) return context.json({ error: 'Search Console sitemaps could not be loaded.', googleStatus: result.response.status }, result.response.status === 401 ? 401 : 502);
      return context.json({ siteUrl, sitemaps: Array.isArray(result.data.sitemap) ? result.data.sitemap : [] });
    } catch (sitemapError) {
      return context.json({ error: sitemapError instanceof Error ? sitemapError.message : 'Search Console sitemaps could not be loaded.' }, 502);
    }
  });
}
