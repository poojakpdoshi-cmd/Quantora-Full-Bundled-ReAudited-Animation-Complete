import type {
  WebsitePlan,
  GeneratedProjectFile,
  SeoAuditReport,
  SeoIssue,
  SeoScoreBreakdown
} from '@wmai/shared';
import { generateSeoMetadata, injectSeoIntoFiles } from './seo-engine';

/**
 * Autonomous SEO Agent for auditing and optimizing Nexora projects.
 */
export function runSeoAudit(
  plan: WebsitePlan,
  files: GeneratedProjectFile[],
  domain?: string
): SeoAuditReport {
  const issues: SeoIssue[] = [];
  const metadata = generateSeoMetadata(plan, domain);

  const indexHtmlFile = files.find(f => f.path === 'index.html');
  const indexHtml = indexHtmlFile?.content || '';

  const robotsFile = files.find(f => f.path === 'public/robots.txt' || f.path === 'robots.txt');
  const sitemapFile = files.find(f => f.path === 'public/sitemap.xml' || f.path === 'sitemap.xml');

  // --- 1. TECHNICAL SEO AUDIT ---
  let technicalScore = 100;

  if (!indexHtmlFile) {
    technicalScore -= 50;
    issues.push({
      id: 'missing-index-html',
      severity: 'critical',
      category: 'technical',
      title: 'Missing index.html',
      description: 'The website bundle does not contain a primary index.html document.',
      autoFixable: true,
      remediation: 'Generate a standard HTML5 entry point.'
    });
  }

  if (!robotsFile) {
    technicalScore -= 10;
    issues.push({
      id: 'missing-robots-txt',
      severity: 'warning',
      category: 'technical',
      title: 'Missing robots.txt',
      description: 'Search engine crawlers lack crawler directive instructions.',
      autoFixable: true,
      remediation: 'Generate public/robots.txt with canonical sitemap reference.'
    });
  }

  if (!sitemapFile) {
    technicalScore -= 15;
    issues.push({
      id: 'missing-sitemap-xml',
      severity: 'warning',
      category: 'technical',
      title: 'Missing sitemap.xml',
      description: 'Search engines need an XML sitemap to discover all page routes efficiently.',
      autoFixable: true,
      remediation: 'Generate public/sitemap.xml with page URLs and change frequencies.'
    });
  }

  if (!indexHtml.includes('rel="canonical"')) {
    technicalScore -= 10;
    issues.push({
      id: 'missing-canonical-tag',
      severity: 'warning',
      category: 'technical',
      title: 'Missing Canonical URL',
      description: 'Prevent duplicate content indexing by specifying the preferred canonical link.',
      autoFixable: true,
      remediation: 'Add <link rel="canonical" href="..." /> in <head>.'
    });
  }

  if (!indexHtml.includes('application/ld+json')) {
    technicalScore -= 10;
    issues.push({
      id: 'missing-json-ld',
      severity: 'warning',
      category: 'technical',
      title: 'Missing Schema.org Structured Data',
      description: 'Structured data enables rich search snippets and entity understanding in search engines.',
      autoFixable: true,
      remediation: 'Inject JSON-LD Schema.org metadata into <head>.'
    });
  }

  if (!indexHtml.includes('property="og:title"') && !indexHtml.includes('property="og:image"')) {
    technicalScore -= 5;
    issues.push({
      id: 'missing-open-graph',
      severity: 'info',
      category: 'technical',
      title: 'Missing Open Graph Tags',
      description: 'Social platforms like LinkedIn, Facebook, and WhatsApp use OG tags for rich previews.',
      autoFixable: true,
      remediation: 'Add og:title, og:description, and og:image tags.'
    });
  }

  technicalScore = Math.max(20, Math.min(100, technicalScore));

  // --- 2. CONTENT SEO AUDIT ---
  let contentScore = 100;

  const titleMatch = indexHtml.match(/<title>([^<]*)<\/title>/i);
  const currentTitle = titleMatch ? titleMatch[1].trim() : '';

  if (!currentTitle) {
    contentScore -= 25;
    issues.push({
      id: 'empty-title-tag',
      severity: 'critical',
      category: 'content',
      title: 'Empty or Missing <title> Tag',
      description: 'A concise, keyword-rich title tag is the #1 on-page SEO signal.',
      autoFixable: true,
      remediation: 'Generate an optimized title incorporating business name and primary niche.'
    });
  } else if (currentTitle.length < 15) {
    contentScore -= 10;
    issues.push({
      id: 'short-title-tag',
      severity: 'warning',
      category: 'content',
      title: 'Title Tag is Too Short',
      description: `Current title is only ${currentTitle.length} characters (recommended 45-65 characters).`,
      autoFixable: true,
      remediation: 'Expand title with business category and value proposition.'
    });
  }

  const metaDescMatch = indexHtml.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const currentDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

  if (!currentDesc) {
    contentScore -= 20;
    issues.push({
      id: 'empty-meta-description',
      severity: 'critical',
      category: 'content',
      title: 'Missing Meta Description',
      description: 'Search engines display meta descriptions under your title in search results.',
      autoFixable: true,
      remediation: 'Generate a 120-155 character meta description highlighting key offerings.'
    });
  } else if (currentDesc.length < 50) {
    contentScore -= 10;
    issues.push({
      id: 'short-meta-description',
      severity: 'warning',
      category: 'content',
      title: 'Meta Description is Too Brief',
      description: `Description is ${currentDesc.length} characters (recommended 120-160 characters).`,
      autoFixable: true,
      remediation: 'Provide descriptive summary of services and call to action.'
    });
  }

  // Heading hierarchy check: <h1> count
  const h1Matches = indexHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    contentScore -= 15;
    issues.push({
      id: 'missing-h1',
      severity: 'critical',
      category: 'content',
      title: 'Missing <h1> Heading',
      description: 'Every web page should have exactly one main <h1> heading.',
      autoFixable: true,
      remediation: 'Ensure the hero section uses semantic <h1> for the main business title.'
    });
  } else if (h1Matches.length > 1) {
    contentScore -= 5;
    issues.push({
      id: 'multiple-h1',
      severity: 'warning',
      category: 'content',
      title: 'Multiple <h1> Headings Detected',
      description: `Found ${h1Matches.length} <h1> tags. Multiple H1 tags can dilute topic focus.`,
      autoFixable: true,
      remediation: 'Keep single primary <h1> in hero and use <h2> for subordinate sections.'
    });
  }

  // Check for placeholder artifacts
  if (/lorem ipsum|placeholder|your company here|business name here|undefined|\[object Object\]/i.test(indexHtml)) {
    contentScore -= 25;
    issues.push({
      id: 'placeholder-text-detected',
      severity: 'critical',
      category: 'content',
      title: 'Placeholder or Generic Text Detected',
      description: 'Website contains template placeholder strings that harm credibility and search quality.',
      autoFixable: true,
      remediation: 'Replace all template boilerplate with domain-specific content.'
    });
  }

  contentScore = Math.max(20, Math.min(100, contentScore));

  // --- 3. PERFORMANCE & MOBILE AUDIT ---
  let performanceScore = 100;

  if (!indexHtml.includes('name="viewport"')) {
    performanceScore -= 30;
    issues.push({
      id: 'missing-viewport',
      severity: 'critical',
      category: 'performance',
      title: 'Missing Mobile Viewport Meta Tag',
      description: 'Mobile-friendly viewport meta tag is essential for responsive indexing.',
      autoFixable: true,
      remediation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0" />.'
    });
  }

  // Check images for lazy loading
  const imgTags = indexHtml.match(/<img[^>]*>/gi) || [];
  const nonLazyImages = imgTags.filter(img => !img.includes('loading="lazy"') && !img.includes('fetchpriority="high"'));
  if (imgTags.length > 2 && nonLazyImages.length > 1) {
    performanceScore -= 10;
    issues.push({
      id: 'missing-lazy-loading',
      severity: 'info',
      category: 'performance',
      title: 'Images Missing Lazy Loading',
      description: `${nonLazyImages.length} images lack loading="lazy" attributes.`,
      autoFixable: true,
      remediation: 'Add loading="lazy" on below-the-fold images to improve initial page load.'
    });
  }

  performanceScore = Math.max(30, Math.min(100, performanceScore));

  // --- 4. ACCESSIBILITY AUDIT ---
  let accessibilityScore = 100;

  const imagesWithoutAlt = imgTags.filter(img => !img.includes('alt=') || img.includes('alt=""'));
  if (imagesWithoutAlt.length > 0) {
    accessibilityScore -= Math.min(20, imagesWithoutAlt.length * 5);
    issues.push({
      id: 'missing-image-alt-text',
      severity: 'warning',
      category: 'accessibility',
      title: 'Missing or Empty Image Alt Text',
      description: `${imagesWithoutAlt.length} images are missing descriptive alt attributes for screen readers.`,
      autoFixable: true,
      remediation: 'Provide descriptive alt text for all content images.'
    });
  }

  if (!indexHtml.includes('lang="')) {
    accessibilityScore -= 10;
    issues.push({
      id: 'missing-html-lang',
      severity: 'warning',
      category: 'accessibility',
      title: 'Missing HTML Document Language',
      description: 'The <html> element should declare a valid language code (e.g. lang="en").',
      autoFixable: true,
      remediation: 'Set <html lang="en">.'
    });
  }

  accessibilityScore = Math.max(30, Math.min(100, accessibilityScore));

  // --- OVERALL WEIGHTED SCORE ---
  const overall = Math.round(
    technicalScore * 0.35 +
    contentScore * 0.30 +
    performanceScore * 0.20 +
    accessibilityScore * 0.15
  );

  const score: SeoScoreBreakdown = {
    overall,
    technical: Math.round(technicalScore),
    content: Math.round(contentScore),
    performance: Math.round(performanceScore),
    accessibility: Math.round(accessibilityScore)
  };

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const passedCount = 12 - (criticalCount + warningCount);

  return {
    projectId: plan.businessName || 'project',
    score,
    issues,
    metadata,
    auditedAt: new Date().toISOString(),
    passedCount: Math.max(0, passedCount),
    warningCount,
    criticalCount,
    complianceNotice: 'Optimized for search engines adhering to W3C semantic markup and modern crawlability standards. Ranking outcomes depend on external relevance and domain authority.'
  };
}

/**
 * Automatically remediate detected SEO issues and produce an updated project bundle.
 */
export function autoFixSeo(
  plan: WebsitePlan,
  files: GeneratedProjectFile[],
  audit: SeoAuditReport,
  domain?: string
): {
  plan: WebsitePlan;
  files: GeneratedProjectFile[];
  fixedReport: SeoAuditReport;
  fixesApplied: string[];
} {
  const fixesApplied: string[] = [];
  const updatedPlan = { ...plan };

  // Generate complete fresh SEO metadata
  const seo = generateSeoMetadata(updatedPlan, domain);

  // Apply fixes into project files
  let updatedFiles = injectSeoIntoFiles(files, updatedPlan, domain);
  fixesApplied.push('Injected canonical link, OpenGraph tags, and Twitter Card metadata');
  fixesApplied.push('Generated valid public/robots.txt with sitemap reference');
  fixesApplied.push('Generated valid public/sitemap.xml with route priority and lastmod dates');
  fixesApplied.push('Injected Schema.org JSON-LD Structured Data');

  // Fix HTML lang and image alt tags in index.html
  const htmlIdx = updatedFiles.findIndex(f => f.path === 'index.html');
  if (htmlIdx >= 0) {
    let content = updatedFiles[htmlIdx].content;

    // Fix <html lang="en">
    if (!content.includes('lang=')) {
      content = content.replace(/<html(\s*>|\s+[^>]*>)/i, '<html lang="en">');
      fixesApplied.push('Added lang="en" to <html> root element');
    }

    // Fix empty alt attributes
    if (content.includes('alt=""') || content.includes('<img') && !content.includes('alt=')) {
      content = content.replace(/<img\s+src="([^"]*)"\s+alt=""/gi, `<img src="$1" alt="${escapeAttr(updatedPlan.businessName)} visual representation"`);
      fixesApplied.push('Enhanced image alt tags with descriptive context');
    }

    // Ensure single <h1>
    const h1Count = (content.match(/<h1/gi) || []).length;
    if (h1Count === 0) {
      content = content.replace(/<header[^>]*>/i, `<header>\n      <h1>${escapeAttr(updatedPlan.businessName)}</h1>`);
      fixesApplied.push('Injected semantic <h1> heading for main brand');
    }

    updatedFiles[htmlIdx] = { path: 'index.html', content };
  }

  // Re-run audit on updated files
  const fixedReport = runSeoAudit(updatedPlan, updatedFiles, domain);

  return {
    plan: updatedPlan,
    files: updatedFiles,
    fixedReport,
    fixesApplied
  };
}

function escapeAttr(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
