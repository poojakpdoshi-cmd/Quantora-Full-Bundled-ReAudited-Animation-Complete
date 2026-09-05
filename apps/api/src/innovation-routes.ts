import { z } from 'zod';
import { runCmsModel } from './assistant-chat';
import type { SupabaseClient } from '@supabase/supabase-js';

type InnovationHelpers = {
  requireUser: (context: any, email: string, installationId: string) => Promise<any>;
  requireSupabase: (env: any) => SupabaseClient;
};

const visionSchema = z.object({
  imageDataUrl: z.string().min(32).max(8_000_000),
  prompt: z.string().trim().max(2000).optional()
});

const voiceSchema = z.object({
  command: z.string().trim().min(3).max(3000),
  currentPlan: z.record(z.string(), z.unknown()).optional()
});

const brandSchema = z.object({
  url: z.string().url().max(2048)
});

function parseAccess(context: any, projectId: string) {
  return z.object({
    projectId: z.string().uuid(),
    email: z.string().email(),
    installationId: z.string().uuid()
  }).safeParse({
    projectId,
    email: context.req.query('email'),
    installationId: context.req.header('X-Device-Id')
  });
}

async function authenticateProject(context: any, helpers: InnovationHelpers, projectId: string, email: string, installationId: string) {
  const access = await helpers.requireUser(context, email, installationId);
  if (!access) return { error: context.json({ error: 'Your login session is missing or expired.' }, 401) };
  if (!access.ok) return { error: context.json({ error: access.error }, access.status) };
  const supabase = helpers.requireSupabase(context.env);
  const { data: project, error } = await supabase
    .from('projects')
    .select('id,name,email,plan,website_type')
    .eq('id', projectId)
    .eq('email', email)
    .maybeSingle();
  if (error || !project) return { error: context.json({ error: 'Project was not found.' }, 404) };
  return { supabase, project };
}

function decodeImageDataUrl(value: string): { mimeType: string; data: string } {
  const match = value.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error('Use a PNG, JPEG, or WebP image data URL.');
  if (match[2].length > 7_500_000) throw new Error('Image is too large. Use an image smaller than 6 MB.');
  return { mimeType: match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase(), data: match[2] };
}

function stripModelJson(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function publicUrl(value: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local') || hostname.startsWith('10.') || hostname.startsWith('192.168.') || /^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname)) {
    throw new Error('Private and local URLs are not allowed.');
  }
  return url;
}

function extractBrandEvidence(html: string, baseUrl: URL) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || null;
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || null;
  const colors = [...new Set((html.match(/#[0-9a-f]{3,8}\b/gi) || []).map(value => value.toLowerCase()))].slice(0, 24);
  const fonts = [...new Set((html.match(/(?:font-family|fonts?)[^:;]{0,20}[:=]["']?([A-Za-z][A-Za-z0-9 ,_-]{2,80})/gi) || []).map(value => value.replace(/^.*[:=]/, '').replace(/["']/g, '').trim()).filter(Boolean))].slice(0, 12);
  const images = (html.match(/<img\b/gi) || []).length;
  const headings = (html.match(/<h[1-6]\b/gi) || []).length;
  const links = (html.match(/<a\b/gi) || []).length;
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || null;
  return {
    sourceUrl: baseUrl.toString(),
    title,
    description,
    colors,
    fonts,
    counts: { images, headings, links },
    canonical,
    observedAt: new Date().toISOString(),
    disclaimer: 'These are observed public-page signals, not a claim of ownership, private brand access, or exact design cloning.'
  };
}

export function registerInnovationRoutes(app: any, helpers: InnovationHelpers): void {
  app.post('/projects/:projectId/ai/vision-layout', async (context: any) => {
    const access = parseAccess(context, context.req.param('projectId'));
    const body = visionSchema.safeParse(await context.req.json().catch(() => null));
    if (!access.success || !body.success) return context.json({ error: 'Valid project access and image data are required.' }, 400);
    const email = access.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, access.data.projectId, email, access.data.installationId);
    if ('error' in auth) return auth.error;
    let image;
    try { image = decodeImageDataUrl(body.data.imageDataUrl); } catch (error) { return context.json({ error: error instanceof Error ? error.message : 'Invalid image.' }, 400); }
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) return context.json({ error: 'Vision AI is unavailable until a server-side Gemini vision provider is configured.' }, 503);
    const model = String(context.env.GEMINI_MODEL || 'gemini-2.5-flash');
    const prompt = [
      'Analyze this wireframe, sketch, or website reference image for Quantora.',
      'Return only JSON with keys: brief (string), sections (array of objects with id, name, purpose, layout, components), designTokens (object with colors, typography, spacing), accessibilityRisks (array of strings), and implementationNotes (array of strings).',
      'Do not copy protected logos, private content, or exact proprietary text. Describe structure and create original implementation guidance.',
      body.data.prompt || ''
    ].join(' ');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.data } }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2200, responseMimeType: 'application/json' }
        })
      });
      const data = await response.json().catch(() => ({})) as any;
      if (!response.ok) return context.json({ error: 'Vision provider rejected the image request.' }, 502);
      const raw = data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim();
      if (!raw) return context.json({ error: 'Vision provider returned no layout proposal.' }, 502);
      let proposal: unknown;
      try { proposal = JSON.parse(stripModelJson(raw)); } catch { return context.json({ error: 'Vision provider returned invalid structured output.' }, 502); }
      return context.json({ ok: true, projectId: auth.project.id, proposal, source: 'gemini-vision', reviewedBeforeApply: true });
    } catch (error) {
      console.error('Vision layout request failed', error);
      return context.json({ error: 'Vision provider is temporarily unavailable.' }, 503);
    }
  });

  app.post('/projects/:projectId/ai/voice-edit', async (context: any) => {
    const access = parseAccess(context, context.req.param('projectId'));
    const body = voiceSchema.safeParse(await context.req.json().catch(() => null));
    if (!access.success || !body.success) return context.json({ error: 'A valid voice command and project access are required.' }, 400);
    const email = access.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, access.data.projectId, email, access.data.installationId);
    if ('error' in auth) return auth.error;
    try {
      const raw = await runCmsModel(context.env, 'You convert natural-language website editing commands into safe reviewable operations. Return only JSON: {summary:string, operations:Array<{op:"set"|"add"|"remove", path:string, value?:unknown}>, warnings:string[]}. Never publish, delete data, or claim an operation was applied.', JSON.stringify({ command: body.data.command, currentPlan: body.data.currentPlan || {}, project: { name: auth.project.name, type: auth.project.website_type } }));
      const parsed = JSON.parse(stripModelJson(raw));
      if (!parsed || typeof parsed.summary !== 'string' || !Array.isArray(parsed.operations) || !Array.isArray(parsed.warnings)) throw new Error('Invalid command proposal.');
      return context.json({ ok: true, proposal: parsed, applied: false, requiresApproval: true });
    } catch (error) {
      console.error('Voice edit proposal failed', error);
      return context.json({ error: 'Voice editing is unavailable until a supported server-side AI provider is configured.' }, 503);
    }
  });

  app.post('/projects/:projectId/brand/inspect', async (context: any) => {
    const access = parseAccess(context, context.req.param('projectId'));
    const body = brandSchema.safeParse(await context.req.json().catch(() => null));
    if (!access.success || !body.success) return context.json({ error: 'A valid public URL and project access are required.' }, 400);
    const email = access.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, access.data.projectId, email, access.data.installationId);
    if ('error' in auth) return auth.error;
    let url: URL;
    try { url = publicUrl(body.data.url); } catch (error) { return context.json({ error: error instanceof Error ? error.message : 'Invalid public URL.' }, 400); }
    if (url.hostname.includes('instagram.com')) return context.json({ error: 'Instagram profile inspection requires an approved platform connection or a user-uploaded reference image; direct scraping is not enabled.' }, 400);
    try {
      const response = await fetch(url.toString(), { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'Quantora-Brand-Inspector/1.0' } });
      if (!response.ok) return context.json({ error: `Brand source returned HTTP ${response.status}.` }, 502);
      const html = (await response.text()).slice(0, 2_000_000);
      return context.json({ ok: true, evidence: extractBrandEvidence(html, url), projectId: auth.project.id });
    } catch (error) {
      console.error('Brand inspection failed', error);
      return context.json({ error: 'The public brand source could not be inspected.' }, 502);
    }
  });
}
