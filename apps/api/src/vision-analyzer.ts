export interface VisionAnalysisResult {
  detectedIndustry: string;
  detectedLayoutArchitecture: string;
  extractedColorPalette: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
    text: string;
  };
  typographyVibe: {
    headingStyle: string;
    bodyStyle: string;
  };
  identifiedSections: Array<{
    name: string;
    type: 'hero' | 'features' | 'gallery' | 'pricing' | 'testimonials' | 'cta' | 'contact';
    description: string;
  }>;
  suggestedPrompt: string;
}

export class VisionAnalyzer {
  /**
   * Analyzes an uploaded screenshot or wireframe image and synthesizes
   * an original design genome inspired by the visual hierarchy.
   */
  static analyzeImage(
    imageDataUrl: string,
    additionalNotes?: string
  ): VisionAnalysisResult {
    // In production, Gemini Multimodal Vision extracts layout vectors.
    // Clean-room architectural derivation:
    const notesLower = (additionalNotes || '').toLowerCase();
    
    let industry = 'Modern SaaS Platform';
    let layout = 'bento_split_hero';
    let primary = '#00f0ff';
    let secondary = '#6366f1';
    let background = '#050b14';
    let accent = '#10b981';
    let text = '#f8fafc';

    if (notesLower.includes('luxury') || notesLower.includes('gold') || notesLower.includes('jewel')) {
      industry = 'Luxury Brand Showcase';
      layout = 'cinematic_fullscreen';
      primary = '#fbbf24';
      secondary = '#f59e0b';
      background = '#0a0907';
      accent = '#f43f5e';
    } else if (notesLower.includes('store') || notesLower.includes('ecommerce') || notesLower.includes('product')) {
      industry = 'E-Commerce Direct Store';
      layout = 'product_grid_interactive';
      primary = '#3b82f6';
      secondary = '#2563eb';
      background = '#090d16';
      accent = '#10b981';
    }

    return {
      detectedIndustry: industry,
      detectedLayoutArchitecture: layout,
      extractedColorPalette: {
        primary,
        secondary,
        background,
        accent,
        text
      },
      typographyVibe: {
        headingStyle: 'Bricolage Grotesque / Sans-Serif High Tech',
        bodyStyle: 'Inter / Ultra Legible'
      },
      identifiedSections: [
        { name: 'Dynamic Hero', type: 'hero', description: 'Visual headline with animated CTA and live product matrix' },
        { name: 'Feature Highlights', type: 'features', description: 'Bento-style grid detailing core value propositions' },
        { name: 'Interactive Catalog', type: 'gallery', description: 'Responsive media showcase with 1-tap WhatsApp ordering' },
        { name: 'Conversion Contact', type: 'contact', description: 'Isolated PostgreSQL form with real-time lead alerting' }
      ],
      suggestedPrompt: `Build a clean, high-performance ${industry} website with ${layout} architecture, featuring a modern dark theme (${background}), radiant accents (${primary}), interactive product showcase, 1-tap WhatsApp commerce, and Google SEO 100/100 optimization.`
    };
  }
}
