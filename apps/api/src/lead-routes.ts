import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

type LeadHelpers = {
  requireUser: (context: any, email: string, installationId: string) => Promise<any>;
  requireSupabase: (env: any) => SupabaseClient;
};

const statusSchema = z.enum(['New', 'Contacted', 'Negotiating', 'Won', 'Lost']);
const fieldSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(120)).max(30).optional()
});

async function authenticateProject(context: any, helpers: LeadHelpers, projectId: string, email: string, installationId: string) {
  const access = await helpers.requireUser(context, email, installationId);
  if (!access) return { error: context.json({ error: 'Your login session is missing or expired.' }, 401) };
  if (!access.ok) return { error: context.json({ error: access.error }, access.status) };

  const supabase = helpers.requireSupabase(context.env);
  const { data: project, error } = await supabase
    .from('projects')
    .select('id,name,email')
    .eq('id', projectId)
    .eq('email', email)
    .maybeSingle();

  if (error || !project) return { error: context.json({ error: 'Project was not found.' }, 404) };
  return { supabase, project };
}

export function registerLeadRoutes(app: any, helpers: LeadHelpers): void {
  app.get('/projects/:projectId/leads', async (context: any) => {
    const parsed = z.object({
      projectId: z.string().uuid(),
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse({
      projectId: context.req.param('projectId'),
      email: context.req.query('email'),
      installationId: context.req.header('X-Device-Id')
    });
    if (!parsed.success) return context.json({ error: 'Valid lead access details are required.' }, 400);

    const email = parsed.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;

    const { data, error } = await auth.supabase
      .from('lead_records')
      .select('id,name,contact_email,phone,message,status,deal_value,notes,source,created_at,updated_at')
      .eq('project_id', parsed.data.projectId)
      .eq('owner_email', email)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return context.json({ error: 'Could not load lead records.' }, 500);
    return context.json({ leads: (data || []).map((lead: any) => ({
      id: String(lead.id),
      name: String(lead.name || ''),
      email: String(lead.contact_email || ''),
      phone: String(lead.phone || ''),
      projectTitle: String(auth.project.name || ''),
      message: String(lead.message || ''),
      status: lead.status,
      createdAt: lead.created_at,
      dealValue: lead.deal_value || undefined,
      notes: String(lead.notes || ''),
      source: String(lead.source || 'website_form')
    })) });
  });

  app.patch('/projects/:projectId/leads/:leadId', async (context: any) => {
    const parsed = z.object({
      projectId: z.string().uuid(),
      leadId: z.string().uuid(),
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse({
      projectId: context.req.param('projectId'),
      leadId: context.req.param('leadId'),
      email: context.req.query('email'),
      installationId: context.req.header('X-Device-Id')
    });
    const body = z.object({
      status: statusSchema.optional(),
      notes: z.string().max(5000).optional(),
      dealValue: z.string().max(120).optional()
    }).safeParse(await context.req.json().catch(() => null));

    if (!parsed.success || !body.success || Object.keys(body.data).length === 0) {
      return context.json({ error: 'Valid lead changes are required.' }, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;

    const changes: Record<string, unknown> = {};
    if (body.data.status !== undefined) changes.status = body.data.status;
    if (body.data.notes !== undefined) changes.notes = body.data.notes;
    if (body.data.dealValue !== undefined) changes.deal_value = body.data.dealValue;

    const { data, error } = await auth.supabase
      .from('lead_records')
      .update(changes)
      .eq('id', parsed.data.leadId)
      .eq('project_id', parsed.data.projectId)
      .eq('owner_email', email)
      .select('*')
      .single();

    if (error || !data) return context.json({ error: 'Lead record was not found or could not be updated.' }, 404);
    return context.json({ lead: data });
  });

  app.get('/projects/:projectId/forms/config', async (context: any) => {
    const parsed = z.object({
      projectId: z.string().uuid(),
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse({
      projectId: context.req.param('projectId'),
      email: context.req.query('email'),
      installationId: context.req.header('X-Device-Id')
    });
    if (!parsed.success) return context.json({ error: 'Valid form access details are required.' }, 400);

    const email = parsed.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;

    const { data, error } = await auth.supabase
      .from('website_forms')
      .select('id,form_config,public_key')
      .eq('project_id', parsed.data.projectId)
      .eq('active', true)
      .maybeSingle();
    if (error) return context.json({ error: 'Could not load form configuration.' }, 500);
    return context.json({ formId: data?.id || null, publicKey: data?.public_key || null, fields: Array.isArray(data?.form_config) ? data.form_config : [] });
  });

  app.put('/projects/:projectId/forms/config', async (context: any) => {
    const parsed = z.object({
      projectId: z.string().uuid(),
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse({
      projectId: context.req.param('projectId'),
      email: context.req.query('email'),
      installationId: context.req.header('X-Device-Id')
    });
    const body = z.object({ fields: z.array(fieldSchema).min(1).max(30) }).safeParse(await context.req.json().catch(() => null));
    if (!parsed.success || !body.success) return context.json({ error: 'Valid form configuration is required.' }, 400);

    const email = parsed.data.email.toLowerCase();
    const auth = await authenticateProject(context, helpers, parsed.data.projectId, email, parsed.data.installationId);
    if ('error' in auth) return auth.error;

    let { data: form } = await auth.supabase
      .from('website_forms')
      .select('id,public_key')
      .eq('project_id', parsed.data.projectId)
      .eq('active', true)
      .maybeSingle();

    if (!form) {
      const created = await auth.supabase
        .from('website_forms')
        .insert({ project_id: parsed.data.projectId, name: 'Contact form', form_config: body.data.fields })
        .select('id,public_key')
        .single();
      if (created.error || !created.data) return context.json({ error: 'Could not create the project form.' }, 500);
      form = created.data;
    } else {
      const updated = await auth.supabase
        .from('website_forms')
        .update({ form_config: body.data.fields })
        .eq('id', form.id)
        .eq('project_id', parsed.data.projectId)
        .select('id,public_key')
        .single();
      if (updated.error || !updated.data) return context.json({ error: 'Could not save form configuration.' }, 500);
      form = updated.data;
    }

    return context.json({ saved: true, formId: form.id, publicKey: form.public_key, fields: body.data.fields });
  });
}
