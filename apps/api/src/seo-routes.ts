import { Hono } from 'hono';
import { z } from 'zod';
import { runSeoAudit, autoFixSeo, generateSeoMetadata } from '@wmai/ai-brain';
import type { WebsitePlan, GeneratedProjectFile } from '@wmai/shared';

export function registerSeoRoutes(
  app: Hono<{ Bindings: any }>,
  helpers: {
    requireUser: (c: any, email: string, installationId: string) => Promise<any>;
    requireSupabase: (env: any) => any;
  }
) {
  // 1. Get current SEO report & audit for project
  app.get('/projects/:id/seo', async (c) => {
    const parsed = z.object({
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse({
      email: c.req.query('email'),
      installationId: c.req.header('X-Device-Id')
    });

    if (!parsed.success) return c.json({ error: 'Email and device identifier are required.' }, 400);
    const access = await helpers.requireUser(c, parsed.data.email, parsed.data.installationId);
    if (!access || !access.ok) return c.json({ error: access?.error || 'Authentication required' }, access?.status || 401);

    const supabase = helpers.requireSupabase(c.env);
    const projectId = c.req.param('id');

    // Get project and latest version
    const { data: project } = await supabase
      .from('projects')
      .select('id,name,plan,production_url')
      .eq('id', projectId)
      .eq('email', parsed.data.email.toLowerCase())
      .maybeSingle();

    if (!project) return c.json({ error: 'Project not found.' }, 404);

    const { data: version } = await supabase
      .from('project_versions')
      .select('version_number,plan,generated_files')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!version) return c.json({ error: 'Project version not found.' }, 404);

    // Get primary custom domain if any
    const { data: primaryDomain } = await supabase
      .from('project_domains')
      .select('domain')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .eq('verification_status', 'active')
      .maybeSingle();

    const domain = primaryDomain?.domain || project.production_url || undefined;
    const plan = (version.plan || project.plan) as WebsitePlan;
    const files = (version.generated_files || []) as GeneratedProjectFile[];

    const audit = runSeoAudit(plan, files, domain);

    return c.json({
      projectId,
      versionNumber: version.version_number,
      audit,
      primaryDomain: primaryDomain?.domain || null
    });
  });

  // 2. Crawl the actual production site and return observed evidence.
  app.post('/projects/:id/seo/live-crawl', async (c) => {
    const parsed = z.object({
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse({
      email: c.req.query('email'),
      installationId: c.req.header('X-Device-Id')
    });
    if (!parsed.success) return c.json({ error: 'Email and device identifier are required.' }, 400);

    const access = await helpers.requireUser(c, parsed.data.email, parsed.data.installationId);
    if (!access || !access.ok) return c.json({ error: access?.error || 'Authentication required' }, access?.status || 401);

    const supabase = helpers.requireSupabase(c.env);
    const projectId = c.req.param('id');
    const { data: project } = await supabase
      .from('projects')
      .select('id,production_url')
      .eq('id', projectId)
      .eq('email', parsed.data.email.toLowerCase())
      .maybeSingle();
    if (!project) return c.json({ error: 'Project not found.' }, 404);

    const rawUrl = String(project.production_url || '').trim();
    let target: URL;
    try {
      target = new URL(rawUrl);
      if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw new Error('Unsafe URL');
      const host = target.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local') || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.16.') || host.startsWith('172.17.') || host.startsWith('172.18.') || host.startsWith('172.19.') || host.startsWith('172.2') || host.startsWith('172.30.') || host.startsWith('172.31.')) throw new Error('Private URL');
    } catch {
      return c.json({ error: 'A public production URL is required before crawling.' }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const checkedAt = new Date().toISOString();
    try {
      const response = await fetch(target.toString(), {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'QuantoraBot/1.0 SEO audit' }
      });
      const html = await response.text();
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
      const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || null;
      const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || null;
      const origin = target.origin;
      const [robotsResponse, sitemapResponse] = await Promise.all([
        fetch(`${origin}/robots.txt`, { signal: controller.signal }).catch(() => null),
        fetch(`${origin}/sitemap.xml`, { signal: controller.signal }).catch(() => null)
      ]);
      return c.json({
        ok: response.ok,
        checkedAt,
        url: target.toString(),
        status: response.status,
        finalUrl: response.url,
        contentType: response.headers.get('content-type'),
        title,
        description,
        canonical,
        robots: { reachable: Boolean(robotsResponse?.ok), status: robotsResponse?.status || null },
        sitemap: { reachable: Boolean(sitemapResponse?.ok), status: sitemapResponse?.status || null },
        issues: [
          ...(response.ok ? [] : ['The production page did not return a successful HTTP status.']),
          ...(title ? [] : ['The live page has no readable title tag.']),
          ...(description ? [] : ['The live page has no readable meta description.']),
          ...(canonical ? [] : ['The live page has no canonical link.']),
          ...(robotsResponse?.ok ? [] : ['robots.txt was not reachable.']),
          ...(sitemapResponse?.ok ? [] : ['sitemap.xml was not reachable.'])
        ]
      });
    } catch (error) {
      const message = error instanceof Error && error.name === 'AbortError' ? 'Live crawl timed out.' : 'Live crawl failed.';
      return c.json({ error: message, checkedAt, url: target.toString() }, 502);
    } finally {
      clearTimeout(timeout);
    }
  });

  // 3. Auto-fix SEO issues and save new version
  app.post('/projects/:id/seo/autofix', async (c) => {
    const parsed = z.object({
      email: z.string().email(),
      installationId: z.string().uuid()
    }).safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) return c.json({ error: 'Email and device identifier are required.' }, 400);
    const access = await helpers.requireUser(c, parsed.data.email, parsed.data.installationId);
    if (!access || !access.ok) return c.json({ error: access?.error || 'Authentication required' }, access?.status || 401);

    const supabase = helpers.requireSupabase(c.env);
    const projectId = c.req.param('id');

    const { data: project } = await supabase
      .from('projects')
      .select('id,name,plan,production_url')
      .eq('id', projectId)
      .eq('email', parsed.data.email.toLowerCase())
      .maybeSingle();

    if (!project) return c.json({ error: 'Project not found.' }, 404);

    const { data: latest } = await supabase
      .from('project_versions')
      .select('version_number,plan,generated_files,preview_html')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) return c.json({ error: 'Project version not found.' }, 404);

    const { data: primaryDomain } = await supabase
      .from('project_domains')
      .select('domain')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .eq('verification_status', 'active')
      .maybeSingle();

    const domain = primaryDomain?.domain || project.production_url || undefined;
    const plan = (latest.plan || project.plan) as WebsitePlan;
    const files = (latest.generated_files || []) as GeneratedProjectFile[];

    const initialAudit = runSeoAudit(plan, files, domain);
    const { plan: fixedPlan, files: fixedFiles, fixedReport, fixesApplied } = autoFixSeo(plan, files, initialAudit, domain);

    // Save as new version
    const newVersionNumber = Number(latest.version_number) + 1;
    const htmlFile = fixedFiles.find((f: GeneratedProjectFile) => f.path === 'index.html');
    const newPreviewHtml = htmlFile ? htmlFile.content : latest.preview_html;

    const { error: insertError } = await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        version_number: newVersionNumber,
        prompt: `SEO Optimization: ${fixesApplied.slice(0, 2).join('; ')}`,
        plan: fixedPlan,
        generated_files: fixedFiles,
        preview_html: newPreviewHtml
      });

    if (insertError) {
      return c.json({ error: 'Could not save SEO-optimized revision.' }, 500);
    }

    await supabase
      .from('projects')
      .update({ plan: fixedPlan, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return c.json({
      success: true,
      projectId,
      versionNumber: newVersionNumber,
      audit: fixedReport,
      fixesApplied,
      fileCount: fixedFiles.length
    });
  });
}
