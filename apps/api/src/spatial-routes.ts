import { z } from 'zod';
import { runCmsModel } from './assistant-chat';
import type { SupabaseClient } from '@supabase/supabase-js';

type SpatialHelpers = {
  requireUser: (context: any, email: string, installationId: string) => Promise<any>;
  requireSupabase: (env: any) => SupabaseClient;
};

const requestSchema = z.object({
  prompt: z.string().trim().min(5).max(4000),
  dimension: z.enum(['3D', '4D', '5D']).default('3D'),
  round: z.number().int().min(1).max(3).default(1),
  feedback: z.string().trim().max(2000).optional(),
  currentBlueprint: z.record(z.string(), z.unknown()).optional(),
  approve: z.boolean().default(false),
  blueprint: z.record(z.string(), z.unknown()).optional()
});

function accessInput(context: any, projectId: string) {
  return z.object({ projectId: z.string().uuid(), email: z.string().email(), installationId: z.string().uuid() }).safeParse({ projectId, email: context.req.query('email'), installationId: context.req.header('X-Device-Id') });
}

async function authProject(context: any, helpers: SpatialHelpers, projectId: string, email: string, installationId: string) {
  const access = await helpers.requireUser(context, email, installationId);
  if (!access) return { error: context.json({ error: 'Your login session is missing or expired.' }, 401) };
  if (!access.ok) return { error: context.json({ error: access.error }, access.status) };
  const supabase = helpers.requireSupabase(context.env);
  const { data: project, error } = await supabase.from('projects').select('id,name,email,website_type').eq('id', projectId).eq('email', email).maybeSingle();
  if (error || !project) return { error: context.json({ error: 'Project was not found.' }, 404) };
  return { supabase, project };
}

function stripJson(value: string): string { return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(); }

function safeBlueprint(value: any, dimension: string, round: number) {
  const layers = value?.layers || {};
  const performance = value?.performance || {};
  return {
    version: String(value?.version || `spatial-${Date.now()}`),
    dimension,
    round,
    title: String(value?.title || 'Spatial website experience'),
    rationale: String(value?.rationale || 'A responsive spatial experience proposal.'),
    layers: {
      spatial3D: { enabled: Boolean(layers.spatial3D?.enabled ?? true), material: String(layers.spatial3D?.material || 'procedural-glass'), shader: String(layers.spatial3D?.shader || 'liquid-glass'), objects: Array.isArray(layers.spatial3D?.objects) ? layers.spatial3D.objects.slice(0, 24) : [] },
      temporal4D: { enabled: Boolean(layers.temporal4D?.enabled ?? dimension !== '3D'), scrollScenes: Array.isArray(layers.temporal4D?.scrollScenes) ? layers.temporal4D.scrollScenes.slice(0, 12) : [] },
      sensory5D: { enabled: Boolean(layers.sensory5D?.enabled ?? dimension === '5D'), gyroscope: Boolean(layers.sensory5D?.gyroscope), haptics: Boolean(layers.sensory5D?.haptics), audio: Boolean(layers.sensory5D?.audio), localTimeLighting: Boolean(layers.sensory5D?.localTimeLighting) }
    },
    performance: { tiering: true, lowTierFallback: String(performance.lowTierFallback || 'css-3d'), pauseOffscreen: true, reducedMotion: true, targetFps: dimension === '5D' ? '60+ adaptive' : '60 adaptive' },
    scenes: Array.isArray(value?.scenes) ? value.scenes.slice(0, 16) : [],
    accessibility: Array.isArray(value?.accessibility) ? value.accessibility.slice(0, 20) : ['Respect prefers-reduced-motion.', 'Provide a non-spatial content path.', 'Keep interactive controls keyboard reachable.'],
    assets: { proceduralFirst: true, maxModelBytes: 400000, externalAssetsApproved: false }
  };
}

export function registerSpatialRoutes(app: any, helpers: SpatialHelpers): void {
  app.post('/projects/:projectId/spatial/blueprint', async (context: any) => {
    const access = accessInput(context, context.req.param('projectId'));
    const body = requestSchema.safeParse(await context.req.json().catch(() => null));
    if (!access.success || !body.success) return context.json({ error: 'Valid spatial prompt and project access are required.' }, 400);
    const email = access.data.email.toLowerCase();
    const auth = await authProject(context, helpers, access.data.projectId, email, access.data.installationId);
    if ('error' in auth) return auth.error;

    if (body.data.approve) {
      if (!body.data.blueprint) return context.json({ error: 'Approved blueprint data is required.' }, 400);
      const blueprint = safeBlueprint(body.data.blueprint, body.data.dimension, body.data.round);
      const { data, error } = await auth.supabase.from('project_feature_configs').upsert({ project_id: access.data.projectId, feature_key: 'spatial', config: blueprint, updated_at: new Date().toISOString() }, { onConflict: 'project_id,feature_key' }).select('feature_key,config,updated_at').single();
      if (error) return context.json({ error: 'Could not persist the spatial blueprint.' }, 503);
      await auth.supabase.from('audit_logs').insert({ actor_email: email, action: 'approve_spatial_blueprint', target_type: 'project', target_id: access.data.projectId, metadata: { dimension: body.data.dimension, round: body.data.round, blueprintVersion: blueprint.version } });
      return context.json({ approved: true, applied: true, spatial: data });
    }

    try {
      const instruction = 'You are Quantora Spatial Research. Analyze the user prompt as a public-brand and interaction design brief, then produce a practical 3D/4D/5D website blueprint. Return only JSON with keys: version,title,rationale,layers,scenes,performance,accessibility. `layers` must contain spatial3D {enabled,material,shader,objects}, temporal4D {enabled,scrollScenes}, sensory5D {enabled,gyroscope,haptics,audio,localTimeLighting}. Use procedural shader ideas and adaptive tiers; never guarantee 60 or 120 FPS on every device. Keep assets lightweight and provide a non-spatial fallback. Do not claim that private competitor research was performed.';
      const prompt = JSON.stringify({ project: { name: auth.project.name, websiteType: auth.project.website_type }, requestedDimension: body.data.dimension, round: body.data.round, userPrompt: body.data.prompt, feedback: body.data.feedback || '', currentBlueprint: body.data.currentBlueprint || null });
      const raw = await runCmsModel(context.env, instruction, prompt);
      const parsed = JSON.parse(stripJson(raw));
      const blueprint = safeBlueprint(parsed, body.data.dimension, body.data.round);
      return context.json({ proposed: true, requiresApproval: true, researchSource: 'configured-server-model', spatial: blueprint });
    } catch (error) {
      console.error('Spatial blueprint generation failed', error);
      return context.json({ error: 'Spatial blueprint generation is unavailable until a supported server-side AI provider is configured.' }, 503);
    }
  });

  app.get('/projects/:projectId/spatial/blueprint', async (context: any) => {
    const access = accessInput(context, context.req.param('projectId'));
    if (!access.success) return context.json({ error: 'Valid project access details are required.' }, 400);
    const auth = await authProject(context, helpers, access.data.projectId, access.data.email.toLowerCase(), access.data.installationId);
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('project_feature_configs').select('feature_key,config,updated_at').eq('project_id', access.data.projectId).eq('feature_key', 'spatial').maybeSingle();
    if (error) return context.json({ error: 'Could not load the spatial blueprint.' }, 500);
    return context.json({ spatial: data?.config || null, updatedAt: data?.updated_at || null });
  });
}
