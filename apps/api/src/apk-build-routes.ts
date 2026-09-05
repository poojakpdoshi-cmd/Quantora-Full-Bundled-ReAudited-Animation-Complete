import { Hono, type Context } from 'hono';
import { z } from 'zod';

type BuildBindings = {
  APK_BUILD_SERVICE_URL?: string;
  APK_BUILD_SERVICE_TOKEN?: string;
};

type AccessResult =
  | { ok: true; role: 'admin' | 'subscriber'; maxDevices: number; activeDevices: number; subscriptionExpiresAt: string | null }
  | { ok: false; status: 403 | 409 | 503; error: string };

type BuildContext = Context<any>;

type BuildRouteOptions = {
  requireUser: (context: BuildContext, email: string, installationId?: string) => Promise<AccessResult | null>;
  requireSupabase: (env: any) => any;
};

const buildRequestSchema = z.object({
  email: z.string().email(),
  installationId: z.string().uuid(),
  appName: z.string().trim().min(1).max(48),
  packageName: z.string().trim().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,5}$/),
  versionName: z.string().trim().regex(/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.-]+)?$/),
  versionCode: z.coerce.number().int().min(1).max(2_100_000_000),
  previewHtml: z.string().min(1).max(5 * 1024 * 1024),
  files: z.array(z.object({ path: z.string().min(1).max(180), content: z.string().max(2 * 1024 * 1024) })).max(300).optional()
});

const statusQuerySchema = z.object({
  email: z.string().email(),
  installationId: z.string().uuid()
});

function serviceUrl(context: BuildContext): string | null {
  const value = context.env.APK_BUILD_SERVICE_URL?.trim().replace(/\/$/, '');
  return value || null;
}

async function ownsProject(context: BuildContext, options: BuildRouteOptions, projectId: string, email: string): Promise<boolean> {
  const supabase = options.requireSupabase(context.env);
  const { data } = await supabase.from('projects').select('id').eq('id', projectId).eq('email', email).maybeSingle();
  return Boolean(data);
}

async function authorizeProject(context: BuildContext, options: BuildRouteOptions, email: string, installationId: string, projectId: string): Promise<Response | null> {
  const access = await options.requireUser(context, email, installationId);
  if (!access) return context.json({ error: 'Your login session is missing or expired.' }, 401);
  if (!access.ok) return context.json({ error: access.error }, access.status);
  if (!(await ownsProject(context, options, projectId, email))) return context.json({ error: 'Project not found.' }, 404);
  return null;
}

export function registerApkBuildRoutes(app: Hono<any>, options: BuildRouteOptions): void {
  app.post('/projects/:id/build-apk', async (context: BuildContext) => {
    const service = serviceUrl(context);
    if (!service || !context.env.APK_BUILD_SERVICE_TOKEN) return context.json({ error: 'Real APK builds are not configured on this deployment.' }, 503);
    const parsed = buildRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: 'Invalid APK build request.', details: parsed.error.flatten() }, 400);
    const email = parsed.data.email.toLowerCase();
    const projectId = context.req.param('id') || '';
    const installationId = parsed.data.installationId || '';
    const authorizationError = await authorizeProject(context, options, email, installationId, projectId);
    if (authorizationError) return authorizationError;
    const { email: _email, installationId: _installationId, ...buildPayload } = parsed.data;
    let upstream: Response;
    try {
      upstream = await fetch(`${service}/v1/apk-builds`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${context.env.APK_BUILD_SERVICE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload, projectId })
      });
    } catch (error) {
      console.error('APK build service create request failed:', error);
      return context.json({ error: 'The APK build service is temporarily unavailable.' }, 502);
    }
    const body = await upstream.text();
    return new Response(body, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8' } });
  });

  app.get('/projects/:id/build-apk/:jobId', async (context: BuildContext) => {
    const service = serviceUrl(context);
    if (!service || !context.env.APK_BUILD_SERVICE_TOKEN) return context.json({ error: 'Real APK builds are not configured on this deployment.' }, 503);
    const parsed = statusQuerySchema.safeParse({ email: context.req.query('email'), installationId: context.req.query('installationId') });
    if (!parsed.success) return context.json({ error: 'email and installationId query parameters are required.' }, 400);
    const projectId = context.req.param('id') || '';
    const email = parsed.data.email.toLowerCase();
    const installationId = parsed.data.installationId || '';
    const jobId = context.req.param('jobId') || '';
    const authorizationError = await authorizeProject(context, options, email, installationId, projectId);
    if (authorizationError) return authorizationError;
    let upstream: Response;
    try {
      upstream = await fetch(`${service}/v1/apk-builds/${encodeURIComponent(jobId)}`, { headers: { 'Authorization': `Bearer ${context.env.APK_BUILD_SERVICE_TOKEN}` } });
    } catch (error) {
      console.error('APK build service status request failed:', error);
      return context.json({ error: 'The APK build service is temporarily unavailable.' }, 502);
    }
    const body = await upstream.text();
    if (upstream.ok) {
      try {
        const job = JSON.parse(body) as { projectId?: string };
        if (job.projectId !== projectId) return context.json({ error: 'Build job does not belong to this project.' }, 404);
      } catch {
        return context.json({ error: 'Invalid build-service response.' }, 502);
      }
    }
    return new Response(body, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8' } });
  });

  app.get('/projects/:id/build-apk/:jobId/download', async (context: BuildContext) => {
    const service = serviceUrl(context);
    if (!service || !context.env.APK_BUILD_SERVICE_TOKEN) return context.json({ error: 'Real APK builds are not configured on this deployment.' }, 503);
    const parsed = statusQuerySchema.safeParse({ email: context.req.query('email'), installationId: context.req.query('installationId') });
    if (!parsed.success) return context.json({ error: 'email and installationId query parameters are required.' }, 400);
    const projectId = context.req.param('id') || '';
    const email = parsed.data.email.toLowerCase();
    const installationId = parsed.data.installationId || '';
    const jobId = context.req.param('jobId') || '';
    const authorizationError = await authorizeProject(context, options, email, installationId, projectId);
    if (authorizationError) return authorizationError;
    const jobUrl = `${service}/v1/apk-builds/${encodeURIComponent(jobId)}`;
    let statusResponse: Response;
    try {
      statusResponse = await fetch(jobUrl, { headers: { 'Authorization': `Bearer ${context.env.APK_BUILD_SERVICE_TOKEN}` } });
    } catch (error) {
      console.error('APK build service artifact status request failed:', error);
      return context.json({ error: 'The APK build service is temporarily unavailable.' }, 502);
    }
    if (!statusResponse.ok) return new Response(statusResponse.body, { status: statusResponse.status, headers: statusResponse.headers });
    const job = await statusResponse.json().catch(() => null) as { projectId?: string; status?: string } | null;
    if (!job || job.projectId !== projectId || job.status !== 'ready') return context.json({ error: 'APK artifact is not ready for this project.' }, 404);
    let upstream: Response;
    try {
      upstream = await fetch(`${jobUrl}/download`, { headers: { 'Authorization': `Bearer ${context.env.APK_BUILD_SERVICE_TOKEN}` } });
    } catch (error) {
      console.error('APK build service download request failed:', error);
      return context.json({ error: 'The APK build service is temporarily unavailable.' }, 502);
    }
    return new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
  });
}
