import type {
  WebsitePlan,
  GeneratedProjectFile,
  SeoMetadata
} from '@wmai/shared';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanBaseUrl(domainOrUrl?: string): string {
  if (!domainOrUrl || !domainOrUrl.trim()) return 'https://nexora.app';
  let clean = domainOrUrl.trim().toLowerCase();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/+$/, '');
}

/**
 * Generate bespoke robots.txt for the website.
 */
export function generateRobotsTxt(baseUrl: string): string {
  const base = cleanBaseUrl(baseUrl);
  return `# Nexora.Ai Production SEO Engine
# Legitimate search engine crawler rules

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

# Canonical XML Sitemap
Sitemap: ${base}/sitemap.xml
`;
}

/**
 * Generate valid W3C/Google XML Sitemap.
 */
export function generateSitemapXml(plan: WebsitePlan, baseUrl: string): string {
  const base = cleanBaseUrl(baseUrl);
  const now = new Date().toISOString().split('T')[0];

  const pages = Array.isArray(plan.pages) && plan.pages.length > 0
    ? plan.pages
    : ['home', 'about', 'services', 'contact'];

  const urlEntries = pages.map((page, index) => {
    const slug = page.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const path = index === 0 || slug === 'home' ? '' : `/${slug}`;
    const priority = index === 0 || slug === 'home' ? '1.0' : '0.8';
    const freq = index === 0 ? 'daily' : 'weekly';

    return `  <url>
    <loc>${escapeXml(`${base}${path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

/**
 * Generate Schema.org JSON-LD Structured Data tailored to the business niche.
 */
export function generateJsonLd(plan: WebsitePlan, baseUrl: string): Record<string, unknown> {
  const base = cleanBaseUrl(baseUrl);
  const businessName = plan.businessName || 'Nexora Project';
  const tagline = plan.tagline || 'Engineered with intention and purpose.';
  const websiteType = plan.websiteType || 'Business';

  // Determine Schema.org @type
  let schemaType = 'Organization';
  const lowerType = websiteType.toLowerCase();
  if (/restaurant|cafe|dining|bistro|bakery/i.test(lowerType)) {
    schemaType = 'FoodEstablishment';
  } else if (/clinic|health|doctor|dental|therapy|medical/i.test(lowerType)) {
    schemaType = 'MedicalBusiness';
  } else if (/store|shop|retail|ecommerce|boutique/i.test(lowerType)) {
    schemaType = 'Store';
  } else if (/real estate|realty|property/i.test(lowerType)) {
    schemaType = 'RealEstateAgent';
  } else if (/automotive|cars|dealership|motors/i.test(lowerType)) {
    schemaType = 'AutoDealer';
  } else if (/school|tuition|academy|education|learning/i.test(lowerType)) {
    schemaType = 'EducationalOrganization';
  } else if (/hotel|resort|travel|hospitality/i.test(lowerType)) {
    schemaType = 'LodgingBusiness';
  } else if (/tech|software|saas|app|platform/i.test(lowerType)) {
    schemaType = 'SoftwareApplication';
  } else {
    schemaType = 'LocalBusiness';
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: businessName,
    description: tagline,
    url: base,
  };

  if (plan.contact?.email || plan.contact?.phone) {
    jsonLd.contactPoint = {
      '@type': 'ContactPoint',
      telephone: plan.contact.phone || undefined,
      email: plan.contact.email || undefined,
      contactType: 'customer support'
    };
  }

  if (plan.features && plan.features.length > 0) {
    jsonLd.knowsAbout = plan.features;
  }

  // If there are FAQs, include FAQPage structured data
  const faqSections = (plan.sections || []).filter(
    s => /faq|question|help/i.test(s.title) || /faq/i.test(s.badge || '')
  );

  if (faqSections.length > 0) {
    jsonLd.mainEntity = faqSections.map(s => ({
      '@type': 'Question',
      name: s.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: s.body
      }
    }));
  }

  return jsonLd;
}

/**
 * Generate full SEO metadata for a WebsitePlan.
 */
export function generateSeoMetadata(plan: WebsitePlan, domain?: string): SeoMetadata {
  const base = cleanBaseUrl(domain);
  const businessName = plan.businessName || 'Nexora Project';
  const tagline = plan.tagline || 'Engineered with intention and purpose.';
  const websiteType = plan.websiteType || 'Business';

  // Construct high-relevance title (50-60 chars target)
  const title = `${businessName} — ${websiteType} | ${tagline.split('.')[0]}`.slice(0, 65);

  // Construct high-relevance description (120-160 chars target)
  const featuresSummary = plan.features?.slice(0, 3).join(', ') || 'innovative solutions';
  const description = `${businessName} provides premium ${websiteType.toLowerCase()} services including ${featuresSummary}. ${tagline}`.slice(0, 155);

  // Extract keywords
  const keywords = Array.from(new Set([
    businessName.toLowerCase(),
    websiteType.toLowerCase(),
    ...(plan.features || []).map(f => f.toLowerCase()),
    ...(plan.pages || []).map(p => p.toLowerCase()),
    'quality',
    'professional'
  ])).slice(0, 10);

  const jsonLd = generateJsonLd(plan, base);
  const robotsTxt = generateRobotsTxt(base);
  const sitemapXml = generateSitemapXml(plan, base);

  return {
    title,
    description,
    canonicalUrl: base,
    openGraph: {
      title,
      description,
      url: base,
      type: 'website'
    },
    twitterCard: {
      card: 'summary_large_image',
      title,
      description
    },
    jsonLd,
    robotsTxt,
    sitemapXml,
    keywords,
    viewport: 'width=device-width, initial-scale=1.0',
    language: 'en'
  };
}

/**
 * Injects robots.txt, sitemap.xml, and updated HTML SEO headers into generated project files.
 */
export function injectSeoIntoFiles(
  files: GeneratedProjectFile[],
  plan: WebsitePlan,
  domain?: string
): GeneratedProjectFile[] {
  const base = cleanBaseUrl(domain);
  const seo = generateSeoMetadata(plan, base);

  const updatedFiles = [...files];

  // 1. Ensure public/robots.txt exists
  const robotsIndex = updatedFiles.findIndex(f => f.path === 'public/robots.txt' || f.path === 'robots.txt');
  if (robotsIndex >= 0) {
    updatedFiles[robotsIndex] = { path: updatedFiles[robotsIndex].path, content: seo.robotsTxt || generateRobotsTxt(base) };
  } else {
    updatedFiles.push({ path: 'public/robots.txt', content: seo.robotsTxt || generateRobotsTxt(base) });
  }

  // 2. Ensure public/sitemap.xml exists
  const sitemapIndex = updatedFiles.findIndex(f => f.path === 'public/sitemap.xml' || f.path === 'sitemap.xml');
  if (sitemapIndex >= 0) {
    updatedFiles[sitemapIndex] = { path: updatedFiles[sitemapIndex].path, content: seo.sitemapXml || generateSitemapXml(plan, base) };
  } else {
    updatedFiles.push({ path: 'public/sitemap.xml', content: seo.sitemapXml || generateSitemapXml(plan, base) });
  }

  // 3. Inject SEO headers into index.html
  const htmlIndex = updatedFiles.findIndex(f => f.path === 'index.html');
  if (htmlIndex >= 0) {
    let html = updatedFiles[htmlIndex].content;

    // Check if canonical tag exists, if not add it before </head>
    const canonicalTag = `<link rel="canonical" href="${escapeXml(base)}" />`;
    const ogTags = `
    <!-- Production Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeXml(base)}" />
    <meta property="og:title" content="${escapeXml(seo.title)}" />
    <meta property="og:description" content="${escapeXml(seo.description)}" />
    <meta property="og:image" content="${escapeXml(base)}/og-image.png" />

    <!-- Production Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(seo.title)}" />
    <meta name="twitter:description" content="${escapeXml(seo.description)}" />
    <meta name="twitter:image" content="${escapeXml(base)}/og-image.png" />

    <!-- Structured Data JSON-LD -->
    <script type="application/ld+json">
${JSON.stringify(seo.jsonLd, null, 2)}
    </script>`;

    if (!html.includes('rel="canonical"')) {
      html = html.replace('</head>', `${canonicalTag}\n${ogTags}\n  </head>`);
    } else {
      // Update existing canonical href
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, canonicalTag);
    }

    // Ensure title and description are up to date
    if (html.includes('<title>')) {
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeXml(seo.title)}</title>`);
    }
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeXml(seo.description)}" />`);
    }

    updatedFiles[htmlIndex] = { path: 'index.html', content: html };
  }

  return updatedFiles;
}
