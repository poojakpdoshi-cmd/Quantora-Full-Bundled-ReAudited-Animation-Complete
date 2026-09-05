export type QuantaModelId =
  | 'quanta-pulse'
  | 'quanta-core'
  | 'quanta-forge'
  | 'quanta-vision'
  | 'quanta-atlas'
  | 'quanta-scout'
  | 'quanta-sentinel'
  | 'quanta-muse';

export interface QuantaModelProfile {
  id: QuantaModelId;
  displayName: string;
  tagline: string;
  strengths: string[];
  latencyTier: 'instant' | 'fast' | 'deep_reasoning';
}

export const QUANTA_MODEL_PROFILES: Record<QuantaModelId, QuantaModelProfile> = {
  'quanta-pulse': {
    id: 'quanta-pulse',
    displayName: 'Quanta Pulse',
    tagline: 'Ultra-fast routing, lightweight classification & instant micro-edits',
    strengths: ['Sub-100ms classification', 'Quick CSS/copy tweaks', 'Command intent routing'],
    latencyTier: 'instant'
  },
  'quanta-core': {
    id: 'quanta-core',
    displayName: 'Quanta Core',
    tagline: 'Central multi-agent reasoning, architectural planning & strategy',
    strengths: ['High-level planning', 'Domain classification', 'Agent allocation'],
    latencyTier: 'fast'
  },
  'quanta-forge': {
    id: 'quanta-forge',
    displayName: 'Quanta Forge',
    tagline: 'Production full-stack code synthesis, refactoring & debugging',
    strengths: ['React 19 + TypeScript', 'Vite module synthesis', 'Zero placeholder copy'],
    latencyTier: 'fast'
  },
  'quanta-vision': {
    id: 'quanta-vision',
    displayName: 'Quanta Vision',
    tagline: 'Multimodal screenshot, wireframe & design hierarchy reconstruction',
    strengths: ['Spatial layout derivation', 'Color palette extraction', 'Clean-room design synthesis'],
    latencyTier: 'fast'
  },
  'quanta-atlas': {
    id: 'quanta-atlas',
    displayName: 'Quanta Atlas',
    tagline: 'Long-context architectural reasoning for complex full-stack apps',
    strengths: ['Multi-page state machines', 'Deep DDL relationships', 'Scalable component trees'],
    latencyTier: 'deep_reasoning'
  },
  'quanta-scout': {
    id: 'quanta-scout',
    displayName: 'Quanta Scout',
    tagline: 'SEO strategy, keyword topology & structured schema discoverability',
    strengths: ['Technical SEO audits', 'Schema.org JSON-LD', 'Canonical & OpenGraph metadata'],
    latencyTier: 'fast'
  },
  'quanta-sentinel': {
    id: 'quanta-sentinel',
    displayName: 'Quanta Sentinel',
    tagline: 'Autonomous QA, security scanning & regression prevention',
    strengths: ['Parallel FlashQA audits', 'WCAG AAA accessibility', 'Zero secret leakage checks'],
    latencyTier: 'fast'
  },
  'quanta-muse': {
    id: 'quanta-muse',
    displayName: 'Quanta Muse',
    tagline: 'Visual creativity, bespoke design genomes & animation choreography',
    strengths: ['Curated HSL color systems', 'Typography pairing', 'Micro-interaction physics'],
    latencyTier: 'fast'
  }
};

export type QuantoraMode = 'FLASH' | 'BUILD' | 'THINK' | 'CREATE' | 'PRO';

export interface QuantoraModeConfig {
  mode: QuantoraMode;
  name: string;
  tagline: string;
  icon: string;
  primaryModels: QuantaModelId[];
  description: string;
}

export const QUANTORA_MODES: Record<QuantoraMode, QuantoraModeConfig> = {
  FLASH: {
    mode: 'FLASH',
    name: 'Flash Mode',
    tagline: 'Instant micro-edits & rapid responses',
    icon: '⚡',
    primaryModels: ['quanta-pulse'],
    description: 'Ultra-fast turnarounds for text tweaks, color adjustments, and quick layout fixes.'
  },
  BUILD: {
    mode: 'BUILD',
    name: 'Build Mode',
    tagline: 'Balanced speed & full-stack quality',
    icon: '🔨',
    primaryModels: ['quanta-core', 'quanta-forge'],
    description: 'The standard recommended mode for synthesising production websites with full code structure.'
  },
  THINK: {
    mode: 'THINK',
    name: 'Think Mode',
    tagline: 'Deep reasoning & complex architectures',
    icon: '🧠',
    primaryModels: ['quanta-core', 'quanta-atlas'],
    description: 'Heavy multi-tier reasoning for complex state, multi-page data flows, and database schemas.'
  },
  CREATE: {
    mode: 'CREATE',
    name: 'Create Mode',
    tagline: 'Maximum visual creativity & motion',
    icon: '🎨',
    primaryModels: ['quanta-muse', 'quanta-vision'],
    description: 'Pushes visual aesthetics to the highest standard with custom design genomes and dynamic animations.'
  },
  PRO: {
    mode: 'PRO',
    name: 'Pro Mode',
    tagline: 'Production-grade QA, security & deployment',
    icon: '🛡️',
    primaryModels: ['quanta-forge', 'quanta-sentinel', 'quanta-scout'],
    description: 'Rigorous end-to-end pipeline with parallel FlashQA testing, SEO schema, and deployment preparation.'
  }
};

export function resolveModelsForMode(mode: QuantoraMode): QuantaModelProfile[] {
  const config = QUANTORA_MODES[mode] || QUANTORA_MODES.BUILD;
  return config.primaryModels.map((id) => QUANTA_MODEL_PROFILES[id]);
}
