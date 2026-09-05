import type { SupabaseClient } from '@supabase/supabase-js';
import { runCmsModel } from './assistant-chat';

export interface CmsDocumentPayload {
  id?: string;
  projectId: string;
  collection: 'pages' | 'products' | 'blog' | 'services' | 'testimonials' | 'faqs' | 'navigation' | 'settings';
  slug: string;
  title: string;
  status?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'archived';
  content: Record<string, unknown>;
  seo?: Record<string, unknown>;
  sortOrder?: number;
  authorId?: string;
  changeNote?: string;
  changeSource?: 'manual' | 'ai' | 'import';
}

export interface CmsAiAssistRequest {
  action: 'draft' | 'rewrite' | 'shorten' | 'expand' | 'seo' | 'faqs';
  targetField: string;
  currentContent: string;
  tone?: string;
  briefPrompt?: string;
  businessContext?: {
    name?: string;
    industry?: string;
    tagline?: string;
  };
}

export interface CmsAiAssistResponse {
  original: string;
  proposed: string;
  changeSummary: string;
  suggestedSeo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  suggestedFaqs?: Array<{ question: string; answer: string }>;
}

export async function getCmsProjectData(supabase: SupabaseClient, projectId: string) {
  const [{ data: docs, error: docsErr }, { data: media, error: mediaErr }] = await Promise.all([
    supabase
      .from('cms_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('cms_media')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
  ]);

  if (docsErr) throw docsErr;

  return {
    project: { id: projectId, name: `Project ${projectId.slice(0, 8)}` },
    settings: {
      project_id: projectId,
      enabled: true,
      public_slug: projectId,
      content_version: docs?.length || 1
    },
    documents: docs || [],
    media: media || []
  };
}

export async function saveCmsDocument(supabase: SupabaseClient, payload: CmsDocumentPayload) {
  const now = new Date().toISOString();
  const slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-_/]/g, '-') || 'untitled';

  let docId = payload.id;

  if (docId) {
    // Update existing document
    const { data: updated, error } = await supabase
      .from('cms_documents')
      .update({
        collection: payload.collection,
        slug,
        title: payload.title.trim() || 'Untitled',
        status: payload.status || 'draft',
        content: payload.content || {},
        seo: payload.seo || {},
        sort_order: payload.sortOrder ?? 0,
        author_id: payload.authorId,
        updated_at: now
      })
      .eq('id', docId)
      .select('*')
      .single();

    if (error) throw error;

    // Fetch highest revision version_number
    const { data: revs } = await supabase
      .from('cms_revisions')
      .select('version_number')
      .eq('document_id', docId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVer = ((revs && revs[0]?.version_number) || 0) + 1;

    // Create revision record
    await supabase.from('cms_revisions').insert({
      document_id: docId,
      version_number: nextVer,
      change_source: payload.changeSource || 'manual',
      change_note: payload.changeNote || (payload.changeSource === 'ai' ? 'AI Content Assistant optimization' : 'Manual content update'),
      snapshot: {
        title: updated.title,
        slug: updated.slug,
        content: updated.content,
        seo: updated.seo
      },
      status: updated.status,
      author_id: payload.authorId,
      created_at: now
    });

    return updated;
  }

  // Create new document
  const { data: created, error } = await supabase
    .from('cms_documents')
    .insert({
      project_id: payload.projectId,
      collection: payload.collection,
      slug,
      title: payload.title.trim() || 'Untitled',
      status: payload.status || 'draft',
      content: payload.content || {},
      seo: payload.seo || {},
      sort_order: payload.sortOrder ?? 0,
      author_id: payload.authorId,
      created_at: now,
      updated_at: now
    })
    .select('*')
    .single();

  if (error) throw error;

  // Record initial revision
  await supabase.from('cms_revisions').insert({
    document_id: created.id,
    version_number: 1,
    change_source: payload.changeSource || 'manual',
    change_note: 'Initial document creation',
    snapshot: {
      title: created.title,
      slug: created.slug,
      content: created.content,
      seo: created.seo
    },
    status: created.status,
    author_id: payload.authorId,
    created_at: now
  });

  return created;
}

export async function publishCmsDocument(supabase: SupabaseClient, documentId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cms_documents')
    .update({
      status: 'published',
      published_at: now,
      updated_at: now
    })
    .eq('id', documentId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getCmsRevisions(supabase: SupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from('cms_revisions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function revertCmsRevision(supabase: SupabaseClient, documentId: string, revisionId: string) {
  const { data: rev, error: revErr } = await supabase
    .from('cms_revisions')
    .select('*')
    .eq('id', revisionId)
    .eq('document_id', documentId)
    .single();

  if (revErr || !rev) throw new Error('Revision not found.');

  const now = new Date().toISOString();
  const snapshot = rev.snapshot as Record<string, any>;

  const { data: updated, error: updateErr } = await supabase
    .from('cms_documents')
    .update({
      title: snapshot.title,
      slug: snapshot.slug,
      content: snapshot.content,
      seo: snapshot.seo,
      updated_at: now
    })
    .eq('id', documentId)
    .select('*')
    .single();

  if (updateErr) throw updateErr;

  return updated;
}

/**
 * AI Content Assistant Engine
 * Synthesizes structured copy, rewrites for tone, and outputs visual diffs
 */
export async function generateAiCmsProposalWithModel(
  env: Record<string, unknown>,
  req: CmsAiAssistRequest
): Promise<CmsAiAssistResponse> {
  const system = [
    'You are Quantora CMS Content Assistant.',
    'Return only valid JSON, with no Markdown fences.',
    'The JSON schema is { proposed: string, changeSummary: string, suggestedSeo?: { title?: string, description?: string, keywords?: string[] }, suggestedFaqs?: Array<{ question: string, answer: string }> }.',
    'Do not invent factual claims, guarantees, prices, certifications, rankings, or customer testimonials.',
    'Keep the proposal suitable for a public website and within the requested field scope.'
  ].join(' ');
  const raw = await runCmsModel(env as never, system, JSON.stringify({
    action: req.action,
    targetField: req.targetField,
    currentContent: req.currentContent,
    tone: req.tone || 'clear and professional',
    briefPrompt: req.briefPrompt || '',
    businessContext: req.businessContext || {}
  }));
  const normalized = raw.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```$/i, '').trim();
  let parsed: Partial<CmsAiAssistResponse>;
  try {
    parsed = JSON.parse(normalized) as Partial<CmsAiAssistResponse>;
  } catch {
    throw new Error('CMS AI returned invalid structured output.');
  }
  if (typeof parsed.proposed !== 'string' || !parsed.proposed.trim() || typeof parsed.changeSummary !== 'string') {
    throw new Error('CMS AI returned an incomplete proposal.');
  }
  return {
    original: req.currentContent || '',
    proposed: parsed.proposed.trim(),
    changeSummary: parsed.changeSummary.trim(),
    suggestedSeo: parsed.suggestedSeo,
    suggestedFaqs: parsed.suggestedFaqs
  };
}

export function generateAiCmsProposal(req: CmsAiAssistRequest): CmsAiAssistResponse {
  const bizName = req.businessContext?.name || 'Quantora Business';
  const industry = req.businessContext?.industry || 'Services';
  const original = req.currentContent || '';

  if (req.action === 'seo') {
    const suggestedTitle = `${bizName} | Premium ${industry} Solutions`.slice(0, 60);
    const suggestedDescription = `Discover ${bizName} — exceptional ${industry.toLowerCase()} designed for maximum performance and conversion.`.slice(0, 155);
    const suggestedKeywords = [bizName.toLowerCase(), industry.toLowerCase(), 'quality', 'trusted', 'innovative'];

    return {
      original,
      proposed: suggestedDescription,
      changeSummary: 'Generated high-impact title tag, meta description, and keywords for search engines.',
      suggestedSeo: {
        title: suggestedTitle,
        description: suggestedDescription,
        keywords: suggestedKeywords
      }
    };
  }

  if (req.action === 'faqs') {
    const faqs = [
      {
        question: `How does ${bizName} ensure premium quality?`,
        answer: `At ${bizName}, every deliverable is crafted with strict attention to detail, verified standards, and dedicated support.`
      },
      {
        question: 'What is the typical turnaround or project timeline?',
        answer: 'Most standard requests are deployed and live within 24 to 48 hours with comprehensive onboarding.'
      },
      {
        question: 'How can I get started or request a consultation?',
        answer: 'Simply tap the Contact button or send a message via our WhatsApp channel to speak directly with an expert.'
      }
    ];

    return {
      original,
      proposed: JSON.stringify(faqs, null, 2),
      changeSummary: `Synthesized 3 industry-tailored FAQs with clear value propositions for ${bizName}.`,
      suggestedFaqs: faqs
    };
  }

  if (req.action === 'rewrite') {
    const tone = req.tone || 'Luxe & Prestigious';
    let proposed = '';

    if (tone.toLowerCase().includes('luxe') || tone.toLowerCase().includes('luxury')) {
      proposed = `Engineered for those who demand distinction. ${bizName} sets the benchmark in ${industry.toLowerCase()}, delivering bespoke experiences with uncompromising craftsmanship and elevated aesthetics.`;
    } else if (tone.toLowerCase().includes('conversational')) {
      proposed = `Looking for the easiest way to elevate your ${industry.toLowerCase()}? ${bizName} makes it seamless, fast, and remarkably effective from day one.`;
    } else if (tone.toLowerCase().includes('punchy')) {
      proposed = `Built to outperform. ${bizName} delivers next-generation ${industry.toLowerCase()} with unmatched precision and speed.`;
    } else {
      proposed = `${bizName} is dedicated to providing industry-leading ${industry.toLowerCase()} solutions tailored to your unique objectives and long-term success.`;
    }

    return {
      original,
      proposed,
      changeSummary: `Rewritten for ${tone} tone with enhanced persuasion and clarity.`
    };
  }

  if (req.action === 'shorten') {
    const words = original.split(/\s+/);
    const shortened = words.slice(0, Math.max(8, Math.floor(words.length * 0.6))).join(' ') + '.';
    return {
      original,
      proposed: shortened,
      changeSummary: `Condensed copy by ~40% to improve reading speed and mobile readability.`
    };
  }

  if (req.action === 'expand') {
    const expanded = `${original} Furthermore, ${bizName} integrates dedicated quality assurance and proactive client communication to ensure every milestone exceeds expectations.`;
    return {
      original,
      proposed: expanded,
      changeSummary: 'Expanded explanation with additional value propositions and reassurance.'
    };
  }

  // Default 'draft' action
  const drafted = `Welcome to ${bizName}. We deliver world-class ${industry.toLowerCase()} engineered with intention, elegance, and verified performance for our clients worldwide.`;
  return {
    original,
    proposed: drafted,
    changeSummary: `Drafted fresh content based on the ${industry} business profile.`
  };
}
