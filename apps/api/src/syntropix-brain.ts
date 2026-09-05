import {
  type SyntropixMode,
  type SyntroModelId,
  SYNTROPIX_MODES,
  resolveModelsForSyntroMode
} from './syntro-models';
import { SyntropixProjectMemory } from './project-memory';

export interface SyntropixAgent {
  id: string;
  name: string;
  role: string;
  models: SyntroModelId[];
  status: 'pending' | 'active' | 'completed';
}

export interface SyntropixExecutionPlan {
  projectId: string;
  projectName: string;
  mode: SyntropixMode;
  websiteType: string;
  targetAudience: string;
  businessGoal: string;
  requiredPages: string[];
  requiredFunctionality: string[];
  designFamily: string;
  layoutArchitecture: string;
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  colorSystem: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  animationLanguage: {
    style: 'subtle_reveal' | 'high_energy_quantum' | 'luxury_smooth' | 'clean_minimal';
    hoverPhysics: boolean;
    scrollReveals: boolean;
    statCounters: boolean;
    respectReducedMotion: boolean;
  };
  backendRequirements: {
    needsCrudApi: boolean;
    needsPublicForms: boolean;
    needsAuthentication: boolean;
    endpoints: string[];
  };
  databaseRequirements: {
    target: 'postgresql' | 'supabase' | 'firebase';
    tables: Array<{
      name: string;
      description: string;
      rlsEnabled: boolean;
    }>;
  };
  seoRequirements: {
    focusKeywords: string[];
    schemaType: string;
    canonicalDomain?: string;
  };
  allocatedAgents: SyntropixAgent[];
  activeModels: SyntroModelId[];
  estimatedBuildTimeMs: number;
}

export class SyntropixNexus {
  /**
   * Syntropix Nexus central orchestrator:
   * Analyzes raw user prompt, mode, and project memory to synthesize
   * an end-to-end 14-agent execution plan before code synthesis starts.
   */
  static synthesizePlan(
    projectId: string,
    prompt: string,
    mode: SyntropixMode = 'BUILD',
    visualContext?: Record<string, unknown>
  ): SyntropixExecutionPlan {
    const lower = prompt.toLowerCase();

    // 1. Determine Industry & Design System
    let websiteType = 'modern_saas';
    let designFamily = 'modern_saas';
    let layoutArchitecture = 'product_led_saas';
    let schemaType = 'SoftwareApplication';
    let headingFont = 'Bricolage Grotesque';
    let bodyFont = 'Inter';
    let primaryColor = '#00f0ff';
    let accentColor = '#6366f1';
    let bgColor = '#050b14';
    let textColor = '#f8fafc';

    if (lower.includes('car') || lower.includes('automotive') || lower.includes('motor')) {
      websiteType = 'luxury_automotive';
      designFamily = 'luxury_automotive';
      layoutArchitecture = 'cinematic_fullscreen';
      schemaType = 'AutoDealer';
      headingFont = 'Playfair Display';
      bodyFont = 'Plus Jakarta Sans';
      primaryColor = '#e2e8f0';
      accentColor = '#f59e0b';
      bgColor = '#0a0a0f';
    } else if (lower.includes('food') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('dining')) {
      websiteType = 'fine_dining';
      designFamily = 'fine_dining';
      layoutArchitecture = 'immersive_storytelling';
      schemaType = 'Restaurant';
      headingFont = 'Cormorant Garamond';
      bodyFont = 'Montserrat';
      primaryColor = '#f59e0b';
      accentColor = '#ef4444';
      bgColor = '#0f0a07';
    } else if (lower.includes('estate') || lower.includes('property') || lower.includes('realty') || lower.includes('villa')) {
      websiteType = 'real_estate';
      designFamily = 'real_estate';
      layoutArchitecture = 'luxury_experience';
      schemaType = 'RealEstateAgent';
      headingFont = 'Cinzel';
      bodyFont = 'Plus Jakarta Sans';
      primaryColor = '#10b981';
      accentColor = '#3b82f6';
      bgColor = '#060d17';
    } else if (lower.includes('school') || lower.includes('education') || lower.includes('kids') || lower.includes('academy')) {
      websiteType = 'education_kids';
      designFamily = 'education_kids';
      layoutArchitecture = 'bento_interactive';
      schemaType = 'EducationalOrganization';
      headingFont = 'Fredoka';
      bodyFont = 'Quicksand';
      primaryColor = '#38bdf8';
      accentColor = '#ec4899';
      bgColor = '#081325';
    } else if (lower.includes('jewel') || lower.includes('gold') || lower.includes('luxury') || lower.includes('fashion')) {
      websiteType = 'luxury_jewellery';
      designFamily = 'luxury_jewellery';
      layoutArchitecture = 'editorial_showcase';
      schemaType = 'JewelryStore';
      headingFont = 'Cinzel Decorative';
      bodyFont = 'Outfit';
      primaryColor = '#fbbf24';
      accentColor = '#f43f5e';
      bgColor = '#080604';
    }

    // 2. Extract Business Name
    const nameMatch = prompt.match(/(?:named|called|for|name is)\s+([A-Za-z0-9&'\s]+?)(?:with|,|\.|\n|$)/i);
    const projectName = nameMatch ? nameMatch[1].trim() : 'Syntropix Application';

    // 3. Functional Requirements Detection
    const hasCommerce = lower.includes('shop') || lower.includes('product') || lower.includes('buy') || lower.includes('store') || lower.includes('cart') || lower.includes('whatsapp');
    const hasAuth = lower.includes('auth') || lower.includes('login') || lower.includes('signup') || lower.includes('user account') || lower.includes('portal');
    const hasBooking = lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('test drive');

    const requiredFunctionality: string[] = [
      'Responsive Mobile + Desktop Viewports',
      'Contact & Inquiry Submission Form',
      'Google SEO Core Web Vitals Optimization',
      'Isolated PostgreSQL DataStore',
      'Autonomous 24/7 AI Concierge Assistant'
    ];

    if (hasCommerce) requiredFunctionality.push('1-Tap WhatsApp Commerce & Instant Ordering');
    if (hasAuth) requiredFunctionality.push('User Authentication & Session Tokens');
    if (hasBooking) requiredFunctionality.push('Interactive Appointment & Booking Engine');

    const requiredPages: string[] = ['Home', 'Features & Highlights', 'Showcase Gallery', 'Pricing / Catalog', 'Contact & Booking'];

    // 4. 14 Syntropix Specialized Agents Allocation
    const allocatedAgents: SyntropixAgent[] = [
      { id: 'syntropix_nexus', name: 'Syntropix Nexus', role: 'Central intelligence, orchestration & dependency sequencing', models: ['syntro-core'], status: 'completed' },
      { id: 'syntropix_architect', name: 'Syntropix Architect', role: 'Application architecture & multi-page system design', models: ['syntro-core', 'syntro-context'], status: 'completed' },
      { id: 'syntropix_canvas', name: 'Syntropix Canvas', role: 'Design systems, typography pairings & color token matrix', models: ['syntro-muse'], status: 'completed' },
      { id: 'syntropix_forge', name: 'Syntropix Forge', role: 'Production React 19 + TypeScript component synthesis', models: ['syntro-forge'], status: 'completed' },
      { id: 'syntropix_shell', name: 'Syntropix Shell', role: 'Sandboxed builds, linter checks & dependency audits', models: ['syntro-pulse'], status: 'completed' },
      { id: 'syntropix_aegis', name: 'Syntropix Aegis', role: 'Security enforcement, secret masking & credential protection', models: ['syntro-sentinel'], status: 'completed' },
      { id: 'syntropix_atlas', name: 'Syntropix Atlas', role: 'PostgreSQL DDL schemas, UUID PKs & strict RLS policies', models: ['syntro-forge', 'syntro-context'], status: 'completed' },
      { id: 'syntropix_flux', name: 'Syntropix Flux', role: 'REST CRUD APIs & public form ingestion backend', models: ['syntro-forge'], status: 'completed' },
      { id: 'syntropix_motion', name: 'Syntropix Motion', role: 'Micro-interactions, scroll physics & reduced motion respect', models: ['syntro-muse'], status: 'completed' },
      { id: 'syntropix_scout', name: 'Syntropix Scout', role: 'SEO topology, sitemap, robots.txt & JSON-LD schema', models: ['syntro-scout'], status: 'completed' },
      { id: 'syntropix_sentinel', name: 'Syntropix Sentinel', role: 'FlashQA parallel audits, accessibility & regression checks', models: ['syntro-sentinel'], status: 'completed' },
      { id: 'syntropix_launch', name: 'Syntropix Launch', role: '12-stage production deployment to Vercel/Cloudflare', models: ['syntro-core'], status: 'pending' },
      { id: 'syntropix_domain', name: 'Syntropix Domain', role: 'Custom domain DNS verification, SSL & host routing', models: ['syntro-pulse'], status: 'pending' },
      { id: 'syntropix_vision', name: 'Syntropix Vision', role: 'Screenshot reference analysis & spatial decomposition', models: ['syntro-vision'], status: 'completed' }
    ];

    const activeModeConfig = SYNTROPIX_MODES[mode] || SYNTROPIX_MODES.BUILD;

    // Automatically record decision to project memory
    SyntropixProjectMemory.recordDecision(projectId, {
      category: 'architecture',
      title: `Plan Synthesized: ${projectName}`,
      content: `Allocated 14 Syntropix agents with ${designFamily} design genome and ${schemaType} SEO schema in ${mode} mode.`,
      agentAuthor: 'Syntropix Nexus'
    });

    return {
      projectId,
      projectName,
      mode,
      websiteType,
      targetAudience: `Customers and clients searching for high-quality ${websiteType.replace(/_/g, ' ')} services and products.`,
      businessGoal: `Drive conversion, brand authority, and customer inquiries with seamless 1-tap ordering.`,
      requiredPages,
      requiredFunctionality,
      designFamily,
      layoutArchitecture,
      typography: {
        headingFont,
        bodyFont
      },
      colorSystem: {
        primary: primaryColor,
        secondary: accentColor,
        accent: accentColor,
        background: bgColor,
        text: textColor
      },
      animationLanguage: {
        style: 'high_energy_quantum',
        hoverPhysics: true,
        scrollReveals: true,
        statCounters: true,
        respectReducedMotion: true
      },
      backendRequirements: {
        needsCrudApi: true,
        needsPublicForms: true,
        needsAuthentication: hasAuth,
        endpoints: ['/api/records', '/api/forms/submit', '/api/health', ...(hasAuth ? ['/api/auth/session'] : [])]
      },
      databaseRequirements: {
        target: 'postgresql',
        tables: [
          { name: 'inquiries', description: 'Captured contact and booking leads', rlsEnabled: true },
          { name: 'catalog_items', description: 'Products, services, and inventory', rlsEnabled: true },
          { name: 'analytics_events', description: 'Visitor interactions and conversions', rlsEnabled: true }
        ]
      },
      seoRequirements: {
        focusKeywords: [projectName.toLowerCase(), websiteType.replace(/_/g, ' '), 'online booking', 'best service'],
        schemaType,
        canonicalDomain: `https://${projectId.toLowerCase().replace(/[^a-z0-9]/g, '-')}.syntropy.app`
      },
      allocatedAgents,
      activeModels: activeModeConfig.primaryModels,
      estimatedBuildTimeMs: mode === 'FLASH' ? 420 : mode === 'PRO' ? 1200 : 750
    };
  }
}

// Backward compatibility aliases
export const QuantoraBrain = SyntropixNexus;
export type QuantoraExecutionPlan = SyntropixExecutionPlan;
export type QuantoraAgent = SyntropixAgent;
