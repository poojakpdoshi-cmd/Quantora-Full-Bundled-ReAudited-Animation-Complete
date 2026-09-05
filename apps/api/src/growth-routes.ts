import { z } from 'zod';
import { runCmsModel } from './assistant-chat';
import type { SupabaseClient } from '@supabase/supabase-js';

type GrowthHelpers = {
  requireUser: (context: any, email: string, installationId: string) => Promise<any>;
  requireSupabase: (env: any) => SupabaseClient;
};

const featureKeys = z.enum(['chatbot', 'localization', 'pwa', 'social', 'cro', 'spatial']);
const catalogItem = z.object({ id: z.string().min(1).max(80), name: z.string().trim().min(1).max(200), priceLabel: z.string().trim().max(80).optional(), description: z.string().trim().max(1000).optional(), active: z.boolean().default(true) });
const catalogSchema = z.object({ merchantWhatsapp: z.string().trim().max(40), currencySymbol: z.string().trim().max(8), items: z.array(catalogItem).max(500) });
const bookingConfigSchema = z.object({ timezone: z.string().trim().min(1).max(80), durationMinutes: z.number().int().min(5).max(480), availability: z.record(z.string(), z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/))).refine(value => Object.keys(value).length <= 7, 'Availability may contain at most seven days'), calendarEnabled: z.boolean() });
const bookingSchema = z.object({ customerName: z.string().trim().min(1).max(160), customerEmail: z.string().email().max(320), customerPhone: z.string().trim().max(40).optional(), startsAt: z.string().datetime(), notes: z.string().trim().max(3000).optional() });
const orderSchema = z.object({ customerName: z.string().trim().min(1).max(160), customerEmail: z.string().email().max(320).optional(), customerPhone: z.string().trim().max(40).optional(), message: z.string().trim().max(3000).optional(), items: z.array(z.object({ id: z.string().max(80), quantity: z.number().int().min(1).max(100) })).max(100) });
const experimentSchema = z.object({ name: z.string().trim().min(1).max(160), variants: z.array(z.object({ key: z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/), label: z.string().trim().min(1).max(160), changes: z.record(z.string(), z.unknown()).default({}) })).min(2).max(5), minimumObservations: z.number().int().min(20).max(1000000).default(100) });

function accessInput(context: any, projectId: string) {
  return z.object({ projectId: z.string().uuid(), email: z.string().email(), installationId: z.string().uuid() }).safeParse({ projectId, email: context.req.query('email'), installationId: context.req.header('X-Device-Id') });
}

async function authProject(context: any, helpers: GrowthHelpers, projectId: string, email: string, installationId: string) {
  const access = await helpers.requireUser(context, email, installationId);
  if (!access) return { error: context.json({ error: 'Your login session is missing or expired.' }, 401) };
  if (!access.ok) return { error: context.json({ error: access.error }, access.status) };
  const supabase = helpers.requireSupabase(context.env);
  const { data: project, error } = await supabase.from('projects').select('id,name,email,plan,website_type').eq('id', projectId).eq('email', email).maybeSingle();
  if (error || !project) return { error: context.json({ error: 'Project was not found.' }, 404) };
  return { supabase, project };
}

function publicProjectId(context: any) {
  const parsed = z.object({ projectId: z.string().uuid() }).safeParse({ projectId: context.req.param('projectId') });
  return parsed.success ? parsed.data.projectId : null;
}

function visitorKey(context: any): string {
  return context.req.header('CF-Connecting-IP') || context.req.header('X-Forwarded-For') || 'anonymous';
}

const chatbotWindows = new Map<string, { startedAt: number; count: number }>();
function allowChat(context: any): boolean {
  const key = `${context.req.param('projectId')}:${visitorKey(context)}`;
  const now = Date.now();
  const current = chatbotWindows.get(key);
  if (!current || now - current.startedAt >= 60_000) { chatbotWindows.set(key, { startedAt: now, count: 1 }); return true; }
  if (current.count >= 20) return false;
  current.count += 1;
  return true;
}

async function cmsContext(supabase: SupabaseClient, projectId: string): Promise<string> {
  const { data } = await supabase.from('cms_documents').select('collection,slug,title,content,seo').eq('project_id', projectId).eq('status', 'published').limit(80);
  return JSON.stringify((data || []).map((doc: any) => ({ collection: doc.collection, slug: doc.slug, title: doc.title, content: doc.content, seo: doc.seo })));
}

function currencyForCountry(country: string): { country: string; currency: string; symbol: string } {
  const map: Record<string, [string, string]> = { IN: ['INR', '₹'], US: ['USD', '$'], CA: ['CAD', '$'], GB: ['GBP', '£'], AE: ['AED', 'د.إ'], EU: ['EUR', '€'], DE: ['EUR', '€'], FR: ['EUR', '€'], ES: ['EUR', '€'], SG: ['SGD', '$'], AU: ['AUD', '$'] };
  const [currency, symbol] = map[country] || ['USD', '$'];
  return { country, currency, symbol };
}

function stripJson(value: string): string { return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(); }

export function registerGrowthRoutes(app: any, helpers: GrowthHelpers): void {
  app.get('/projects/:projectId/commerce/catalog', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    if (!parsed.success) return context.json({ error: 'Valid project access details are required.' }, 400);
    const email = parsed.data.email.toLowerCase();
    const auth = await authProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('commerce_catalogs').select('*').eq('project_id', parsed.data.projectId).maybeSingle();
    if (error) return context.json({ error: 'Could not load the commerce catalogue.' }, 500);
    return context.json({ catalog: data || { project_id: parsed.data.projectId, merchant_whatsapp: '', currency_symbol: '$', items: [] } });
  });

  app.put('/projects/:projectId/commerce/catalog', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const body = catalogSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid catalogue data is required.' }, 400);
    const email = parsed.data.email.toLowerCase();
    const auth = await authProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('commerce_catalogs').upsert({ project_id: parsed.data.projectId, owner_email: email, merchant_whatsapp: body.data.merchantWhatsapp, currency_symbol: body.data.currencySymbol, items: body.data.items, updated_at: new Date().toISOString() }, { onConflict: 'project_id' }).select('*').single();
    if (error) return context.json({ error: 'Could not save the payment-free catalogue.' }, 500);
    return context.json({ saved: true, catalog: data, paymentMode: 'offline_manual' });
  });

  app.post('/public/projects/:projectId/order-enquiries', async (context: any) => {
    const projectId = publicProjectId(context);
    const body = orderSchema.safeParse(await context.req.json().catch(() => null));
    if (!projectId || !body.success) return context.json({ error: 'Valid order enquiry data is required.' }, 400);
    const supabase = helpers.requireSupabase(context.env);
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle();
    if (!project) return context.json({ error: 'Project was not found.' }, 404);
    const { data, error } = await supabase.from('order_enquiries').insert({ project_id: projectId, customer_name: body.data.customerName, customer_email: body.data.customerEmail || '', customer_phone: body.data.customerPhone || '', message: body.data.message || '', items: body.data.items, status: 'new' }).select('id,created_at,status').single();
    if (error) return context.json({ error: 'Could not save the order enquiry.' }, 503);
    return context.json({ received: true, enquiry: data, paymentMode: 'offline_manual', message: 'Your enquiry was received. The merchant will confirm availability and next steps manually.' });
  });

  app.get('/projects/:projectId/booking/config', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    if (!parsed.success) return context.json({ error: 'Valid project access details are required.' }, 400);
    const email = parsed.data.email.toLowerCase();
    const auth = await authProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('booking_configs').select('*').eq('project_id', parsed.data.projectId).maybeSingle();
    if (error) return context.json({ error: 'Could not load booking configuration.' }, 500);
    return context.json({ config: data || null });
  });

  app.put('/projects/:projectId/booking/config', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const body = bookingConfigSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid booking configuration is required.' }, 400);
    const email = parsed.data.email.toLowerCase();
    const auth = await authProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('booking_configs').upsert({ project_id: parsed.data.projectId, owner_email: email, timezone: body.data.timezone, duration_minutes: body.data.durationMinutes, availability: body.data.availability, calendar_enabled: body.data.calendarEnabled, updated_at: new Date().toISOString() }, { onConflict: 'project_id' }).select('*').single();
    if (error) return context.json({ error: 'Could not save booking configuration.' }, 500);
    return context.json({ saved: true, config: data, calendar: body.data.calendarEnabled ? 'requires_google_calendar_oauth' : 'disabled' });
  });

  app.post('/public/projects/:projectId/bookings', async (context: any) => {
    const projectId = publicProjectId(context);
    const body = bookingSchema.safeParse(await context.req.json().catch(() => null));
    if (!projectId || !body.success) return context.json({ error: 'Valid booking data is required.' }, 400);
    const startsAt = new Date(body.data.startsAt);
    if (startsAt.getTime() <= Date.now()) return context.json({ error: 'Choose a future booking time.' }, 400);
    const supabase = helpers.requireSupabase(context.env);
    const { data: config } = await supabase.from('booking_configs').select('duration_minutes').eq('project_id', projectId).maybeSingle();
    const duration = Number(config?.duration_minutes || 30);
    const finish = new Date(startsAt.getTime() + duration * 60_000).toISOString();
    const { data: conflict } = await supabase.from('booking_requests').select('id').eq('project_id', projectId).in('status', ['requested', 'confirmed']).lt('starts_at', finish).gte('starts_at', startsAt.toISOString()).limit(1);
    if (conflict?.length) return context.json({ error: 'That time is already requested. Choose another slot.' }, 409);
    const { data, error } = await supabase.from('booking_requests').insert({ project_id: projectId, customer_name: body.data.customerName, customer_email: body.data.customerEmail, customer_phone: body.data.customerPhone || '', starts_at: startsAt.toISOString(), duration_minutes: duration, notes: body.data.notes || '', status: 'requested' }).select('id,starts_at,status,created_at').single();
    if (error) return context.json({ error: 'Could not save booking request.' }, 503);
    return context.json({ received: true, booking: data, calendarEvent: 'not_created_until_google_calendar_is_connected' });
  });

  app.get('/public/geo-context', async (context: any) => {
    const country = String(context.req.raw?.cf?.country || context.req.header('X-Country') || 'US').toUpperCase().slice(0, 2);
    return context.json({ ...currencyForCountry(country), source: context.req.raw?.cf?.country ? 'cloudflare_request_country' : 'default_or_client_hint', liveExchangeRate: false, note: 'Currency is a display suggestion only; Quantora does not collect online payments.' });
  });

  app.get('/projects/:projectId/features/:featureKey', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const feature = featureKeys.safeParse(context.req.param('featureKey'));
    if (!parsed.success || !feature.success) return context.json({ error: 'Valid project and feature are required.' }, 400);
    const auth = await authProject(context, helpers, parsed.data.projectId, parsed.data.email.toLowerCase(), parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('project_feature_configs').select('feature_key,config,updated_at').eq('project_id', parsed.data.projectId).eq('feature_key', feature.data).maybeSingle();
    if (error) return context.json({ error: 'Could not load feature configuration.' }, 500);
    return context.json({ feature: feature.data, config: data?.config || {}, updatedAt: data?.updated_at || null });
  });

  app.put('/projects/:projectId/features/:featureKey', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const feature = featureKeys.safeParse(context.req.param('featureKey'));
    const body = z.object({ config: z.record(z.string(), z.unknown()) }).safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !feature.success || !body.success) return context.json({ error: 'Valid feature configuration is required.' }, 400);
    const email = parsed.data.email.toLowerCase();
    const auth = await authProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('project_feature_configs').upsert({ project_id: parsed.data.projectId, feature_key: feature.data, config: body.data.config, updated_at: new Date().toISOString() }, { onConflict: 'project_id,feature_key' }).select('feature_key,config,updated_at').single();
    if (error) return context.json({ error: 'Could not save feature configuration.' }, 500);
    return context.json({ saved: true, ...data });
  });

  app.post('/public/projects/:projectId/chat', async (context: any) => {
    const projectId = publicProjectId(context);
    const body = z.object({ message: z.string().trim().min(1).max(2000), history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })).max(20).default([]) }).safeParse(await context.req.json().catch(() => null));
    if (!projectId || !body.success) return context.json({ error: 'Valid chat data is required.' }, 400);
    if (!allowChat(context)) return context.json({ error: 'Chat rate limit reached. Try again shortly.' }, 429);
    const supabase = helpers.requireSupabase(context.env);
    const { data: project } = await supabase.from('projects').select('id,name,website_type').eq('id', projectId).maybeSingle();
    if (!project) return context.json({ error: 'Project was not found.' }, 404);
    try {
      const contextText = await cmsContext(supabase, projectId);
      const reply = await runCmsModel(context.env, 'You are a website support assistant. Answer only from the supplied published website context. If the answer is not present, say that a human should follow up. Do not invent prices, guarantees, policies, or availability.', JSON.stringify({ project: { name: project.name, type: project.website_type }, publishedContext: contextText, history: body.data.history, question: body.data.message }));
      return context.json({ reply, source: 'published_cms_context' });
    } catch (error) {
      console.error('Public chatbot failed', error);
      return context.json({ error: 'The website assistant is temporarily unavailable.' }, 503);
    }
  });

  app.post('/projects/:projectId/social/campaign', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const body = z.object({ content: z.string().trim().min(1).max(12000), channels: z.array(z.enum(['instagram', 'linkedin', 'x'])).min(1).max(3) }).safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid campaign input is required.' }, 400);
    const auth = await authProject(context, helpers, parsed.data.projectId, parsed.data.email.toLowerCase(), parsed.data.installationId);
    if ('error' in auth) return auth.error;
    try {
      const raw = await runCmsModel(context.env, 'Create reviewable social copy. Return only JSON with instagram, linkedin, and x keys, each containing {text:string, hashtags:string[]}. Do not claim publication and do not invent facts not present in the source content.', JSON.stringify({ project: auth.project.name, channels: body.data.channels, sourceContent: body.data.content }));
      const campaign = JSON.parse(stripJson(raw));
      return context.json({ ok: true, campaign, published: false, requiresPlatformOAuth: true });
    } catch (error) {
      console.error('Social campaign generation failed', error);
      return context.json({ error: 'Social campaign generation is unavailable until a supported AI provider is configured.' }, 503);
    }
  });

  app.post('/projects/:projectId/experiments', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const body = experimentSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid experiment data is required.' }, 400);
    const email = parsed.data.email.toLowerCase();
    const auth = await authProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('growth_experiments').insert({ project_id: parsed.data.projectId, owner_email: email, name: body.data.name, variants: body.data.variants, minimum_observations: body.data.minimumObservations, status: 'draft' }).select('*').single();
    if (error) return context.json({ error: 'Could not create experiment.' }, 500);
    return context.json({ created: true, experiment: data });
  });

  app.post('/public/experiments/:experimentId/assign', async (context: any) => {
    const experimentId = context.req.param('experimentId');
    const parsed = z.object({ visitorId: z.string().trim().min(3).max(200) }).safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: 'A visitor identifier is required.' }, 400);
    const supabase = helpers.requireSupabase(context.env);
    const { data: experiment } = await supabase.from('growth_experiments').select('id,status,variants').eq('id', experimentId).maybeSingle();
    if (!experiment || experiment.status !== 'running' || !Array.isArray(experiment.variants) || !experiment.variants.length) return context.json({ error: 'Experiment is not active.' }, 404);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${experimentId}:${parsed.data.visitorId}`));
    const number = new DataView(digest).getUint32(0);
    const variant = experiment.variants[number % experiment.variants.length];
    await supabase.from('growth_experiment_events').insert({ experiment_id: experimentId, variant_key: variant.key, event_type: 'assignment', visitor_hash: String(number) });
    return context.json({ experimentId, variant, measurement: 'assignment recorded without personal visitor data' });
  });

  app.post('/public/experiments/:experimentId/convert', async (context: any) => {
    const experimentId = context.req.param('experimentId');
    const parsed = z.object({ visitorId: z.string().trim().min(3).max(200), variantKey: z.string().min(1).max(60) }).safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: 'Valid conversion data is required.' }, 400);
    const supabase = helpers.requireSupabase(context.env);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${experimentId}:${parsed.data.visitorId}`));
    const visitorHash = String(new DataView(digest).getUint32(0));
    const { error } = await supabase.from('growth_experiment_events').insert({ experiment_id: experimentId, variant_key: parsed.data.variantKey, event_type: 'conversion', visitor_hash: visitorHash });
    if (error) return context.json({ error: 'Could not record conversion.' }, 503);
    return context.json({ recorded: true });
  });

  app.get('/public/projects/:projectId/pwa/manifest', async (context: any) => {
    const projectId = publicProjectId(context);
    if (!projectId) return context.json({ error: 'Valid project is required.' }, 400);
    const supabase = helpers.requireSupabase(context.env);
    const { data: project } = await supabase.from('projects').select('id,name,production_url').eq('id', projectId).maybeSingle();
    if (!project) return context.json({ error: 'Project was not found.' }, 404);
    const { data: config } = await supabase.from('project_feature_configs').select('config').eq('project_id', projectId).eq('feature_key', 'pwa').maybeSingle();
    const settings = (config?.config || {}) as Record<string, unknown>;
    return context.json({ name: String(settings.name || project.name || 'Website'), short_name: String(settings.shortName || project.name || 'Website').slice(0, 12), start_url: '/', display: 'standalone', theme_color: String(settings.themeColor || '#0f172a'), background_color: String(settings.backgroundColor || '#0f172a'), icons: Array.isArray(settings.icons) ? settings.icons : [], generatedBy: 'Quantora', productionUrl: project.production_url || null });
  });

  app.get('/public/projects/:projectId/pwa/sw.js', async (context: any) => {
    const projectId = publicProjectId(context);
    if (!projectId) return context.text('/* invalid project */', 400, { 'content-type': 'application/javascript; charset=utf-8' });
    const supabase = helpers.requireSupabase(context.env);
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle();
    if (!project) return context.text('/* project not found */', 404, { 'content-type': 'application/javascript; charset=utf-8' });
    const script = `const CACHE_NAME = 'quantora-${projectId}-v1';\nself.addEventListener('install', event => { self.skipWaiting(); });\nself.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });\nself.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(fetch(event.request).catch(() => caches.match(event.request))); });\n`;
    return context.text(script, 200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' });
  });

  app.post('/projects/:projectId/localization/translate', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const body = z.object({ locale: z.enum(['hi', 'ar', 'es', 'de', 'fr']), content: z.record(z.string(), z.string()).refine(value => Object.keys(value).length <= 300) }).safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid localization data is required.' }, 400);
    const auth = await authProject(context, helpers, parsed.data.projectId, parsed.data.email.toLowerCase(), parsed.data.installationId);
    if ('error' in auth) return auth.error;
    try {
      const raw = await runCmsModel(context.env, 'Translate the provided website strings. Return only JSON with a translations object containing exactly the same keys and translated string values. Preserve placeholders, URLs, numbers, and product names. For Arabic, use natural Arabic text; the client will apply RTL layout.', JSON.stringify({ locale: body.data.locale, content: body.data.content, project: auth.project.name }));
      const result = JSON.parse(stripJson(raw));
      if (!result || !result.translations || typeof result.translations !== 'object') throw new Error('Invalid translation output.');
      return context.json({ ok: true, locale: body.data.locale, direction: body.data.locale === 'ar' ? 'rtl' : 'ltr', translations: result.translations, persisted: false });
    } catch (error) {
      console.error('Localization failed', error);
      return context.json({ error: 'Translation is unavailable until a supported AI provider is configured.' }, 503);
    }
  });

  app.post('/projects/:projectId/cro/analyze', async (context: any) => {
    const parsed = accessInput(context, context.req.param('projectId'));
    const body = z.object({ plan: z.record(z.string(), z.unknown()).optional(), html: z.string().max(500000).optional() }).safeParse(await context.req.json().catch(() => ({})));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid CRO analysis input is required.' }, 400);
    const auth = await authProject(context, helpers, parsed.data.projectId, parsed.data.email.toLowerCase(), parsed.data.installationId);
    if ('error' in auth) return auth.error;
    const html = body.data.html || '';
    const evidence = [
      { key: 'headline', label: 'Clear headline', passed: /<h1\b/i.test(html) || Boolean((body.data.plan as any)?.tagline), weight: 20 },
      { key: 'cta', label: 'Primary call to action', passed: /(?:contact|start|book|request|enquire|whatsapp|learn more)/i.test(html), weight: 20 },
      { key: 'trust', label: 'Trust or proof section', passed: /(?:testimonial|review|trust|case study|certif)/i.test(html), weight: 15 },
      { key: 'mobile', label: 'Responsive implementation evidence', passed: /viewport|responsive|mobile/i.test(html) || Boolean((body.data.plan as any)?.features), weight: 15 },
      { key: 'form', label: 'Lead capture path', passed: /<form\b/i.test(html) || /contact|enquiry|lead/i.test(JSON.stringify(body.data.plan || {})), weight: 15 },
      { key: 'accessibility', label: 'Accessible image alternatives', passed: !html || !/<img(?![^>]*\balt=)/i.test(html), weight: 15 }
    ];
    const score = evidence.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
    return context.json({ ok: true, score, evidence, source: 'deterministic_project_evidence', disclaimer: 'This is a heuristic CRO review, not a prediction of visitor behavior or guaranteed conversion performance.' });
  });
}
