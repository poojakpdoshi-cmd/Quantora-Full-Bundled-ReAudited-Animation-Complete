export type SyntroModelId =
  | 'syntro-pulse'
  | 'syntro-core'
  | 'syntro-forge'
  | 'syntro-vision'
  | 'syntro-context'
  | 'syntro-scout'
  | 'syntro-sentinel'
  | 'syntro-muse';

export interface SyntroModelProfile {
  id: SyntroModelId;
  displayName: string;
  tagline: string;
  strengths: string[];
  latencyTier: 'instant' | 'fast' | 'deep_reasoning';
}

export const SYNTRO_MODEL_PROFILES: Record<SyntroModelId, SyntroModelProfile> = {
  'syntro-pulse': {
    id: 'syntro-pulse',
    displayName: 'Syntro Pulse',
    tagline: 'Ultra-fast routing, lightweight classification & instant micro-edits',
    strengths: ['Sub-100ms classification', 'Quick CSS/copy tweaks', 'Command intent routing'],
    latencyTier: 'instant'
  },
  'syntro-core': {
    id: 'syntro-core',
    displayName: 'Syntro Core',
    tagline: 'Central multi-agent reasoning, architectural planning & strategy',
    strengths: ['High-level planning', 'Domain classification', 'Agent allocation'],
    latencyTier: 'fast'
  },
  'syntro-forge': {
    id: 'syntro-forge',
    displayName: 'Syntro Forge',
    tagline: 'Production full-stack code synthesis, refactoring & debugging',
    strengths: ['React 19 + TypeScript', 'Vite module synthesis', 'Zero placeholder copy'],
    latencyTier: 'fast'
  },
  'syntro-vision': {
    id: 'syntro-vision',
    displayName: 'Syntro Vision',
    tagline: 'Multimodal screenshot, wireframe & design hierarchy reconstruction',
    strengths: ['Spatial layout derivation', 'Color palette extraction', 'Clean-room design synthesis'],
    latencyTier: 'fast'
  },
  'syntro-context': {
    id: 'syntro-context',
    displayName: 'Syntro Context',
    tagline: 'Long-context architectural reasoning for complex full-stack apps',
    strengths: ['Multi-page state machines', 'Deep DDL relationships', 'Scalable component trees'],
    latencyTier: 'deep_reasoning'
  },
  'syntro-scout': {
    id: 'syntro-scout',
    displayName: 'Syntro Scout',
    tagline: 'SEO strategy, keyword topology & structured schema discoverability',
    strengths: ['Technical SEO audits', 'Schema.org JSON-LD', 'Canonical & OpenGraph metadata'],
    latencyTier: 'fast'
  },
  'syntro-sentinel': {
    id: 'syntro-sentinel',
    displayName: 'Syntro Sentinel',
    tagline: 'Autonomous QA, security scanning & regression prevention',
    strengths: ['Parallel FlashQA audits', 'WCAG AAA accessibility', 'Zero secret leakage checks'],
    latencyTier: 'fast'
  },
  'syntro-muse': {
    id: 'syntro-muse',
    displayName: 'Syntro Muse',
    tagline: 'Visual creativity, bespoke design genomes & animation choreography',
    strengths: ['Curated HSL color systems', 'Typography pairing', 'Micro-interaction physics'],
    latencyTier: 'fast'
  }
};

export type SyntropixMode = 'FLASH' | 'BUILD' | 'THINK' | 'CREATE' | 'PRO';

export interface SyntropixModeConfig {
  mode: SyntropixMode;
  name: string;
  tagline: string;
  icon: string;
  primaryModels: SyntroModelId[];
  description: string;
}

export const SYNTROPIX_MODES: Record<SyntropixMode, SyntropixModeConfig> = {
  FLASH: {
    mode: 'FLASH',
    name: 'Flash Mode',
    tagline: 'Instant micro-edits & rapid responses',
    icon: '⚡',
    primaryModels: ['syntro-pulse'],
    description: 'Ultra-fast turnarounds for text tweaks, color adjustments, and quick layout fixes.'
  },
  BUILD: {
    mode: 'BUILD',
    name: 'Build Mode',
    tagline: 'Balanced speed & full-stack quality',
    icon: '🔨',
    primaryModels: ['syntro-core', 'syntro-forge'],
    description: 'The standard recommended mode for synthesising production websites with full code structure.'
  },
  THINK: {
    mode: 'THINK',
    name: 'Think Mode',
    tagline: 'Deep reasoning & complex architectures',
    icon: '🧠',
    primaryModels: ['syntro-core', 'syntro-context'],
    description: 'Heavy multi-tier reasoning for complex state, multi-page data flows, and database schemas.'
  },
  CREATE: {
    mode: 'CREATE',
    name: 'Create Mode',
    tagline: 'Maximum visual creativity & motion',
    icon: '🎨',
    primaryModels: ['syntro-muse', 'syntro-vision'],
    description: 'Pushes visual aesthetics to the highest standard with custom design genomes and dynamic animations.'
  },
  PRO: {
    mode: 'PRO',
    name: 'Pro Mode',
    tagline: 'Production-grade QA, security & deployment',
    icon: '🛡️',
    primaryModels: ['syntro-forge', 'syntro-sentinel', 'syntro-scout'],
    description: 'Rigorous end-to-end pipeline with parallel FlashQA testing, SEO schema, and deployment preparation.'
  }
};

export function resolveModelsForSyntroMode(mode: SyntropixMode): SyntroModelProfile[] {
  const config = SYNTROPIX_MODES[mode] || SYNTROPIX_MODES.BUILD;
  return config.primaryModels.map((id) => SYNTRO_MODEL_PROFILES[id]);
}

// Aliases for compatibility
export type QuantaModelId = SyntroModelId;
export type QuantoraMode = SyntropixMode;
export const QUANTA_MODEL_PROFILES = SYNTRO_MODEL_PROFILES;
export const QUANTORA_MODES = SYNTROPIX_MODES;
export const resolveModelsForMode = resolveModelsForSyntroMode;
