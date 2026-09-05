export type QuantoraModelKey = 'zephyr' | 'meridian' | 'craft' | 'zenith';

export interface QuantoraModelInfo {
  id: QuantoraModelKey;
  name: string;
  role: string;
  tagline: string;
  icon: string;
  speed: string;
  contextWindow: string;
  description: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  engineModel: string;
}

export const QUANTORA_MODELS: Record<QuantoraModelKey, QuantoraModelInfo> = {
  zephyr: {
    id: 'zephyr',
    name: 'Quantora Zephyr',
    role: 'Fastest',
    tagline: 'Light, fast, effortless responses',
    icon: '⚡',
    speed: '< 200ms Instant',
    contextWindow: '32k tokens',
    description: 'Ultra-fast lightweight Q&A powered by Cloudflare Workers AI. Designed for rapid brainstorming, quick CSS/copy edits, and instant chat answers.',
    badgeColor: '#0284c7',
    borderColor: 'rgba(2, 132, 199, 0.45)',
    glowColor: 'rgba(2, 132, 199, 0.25)',
    engineModel: '@cf/meta/llama-3.1-8b-instruct-fast'
  },
  meridian: {
    id: 'meridian',
    name: 'Quantora Meridian',
    role: 'Deep Research',
    tagline: 'Precise, high-level thinking',
    icon: '🧠',
    speed: 'Deep Reasoning',
    contextWindow: '128k tokens',
    description: 'Advanced architecture & research model. Solves complex domain logic, multi-page data schemas, and high-level architectural strategy.',
    badgeColor: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.45)',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    engineModel: '@cf/openai/gpt-oss-20b'
  },
  craft: {
    id: 'craft',
    name: 'Quantora Craft',
    role: 'Building',
    tagline: 'Skillful creation & code synthesis',
    icon: '🛠️',
    speed: 'Production Code',
    contextWindow: '128k tokens',
    description: 'Dedicated full-stack software engineer. Synthesizes complete React 19 apps, animations, backend routers, and pixel-perfect UIs with 0 placeholders.',
    badgeColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    engineModel: 'openai/gpt-oss-120b'
  },
  zenith: {
    id: 'zenith',
    name: 'Quantora Zenith',
    role: 'Most Powerful',
    tagline: 'Highest possible point of intelligence',
    icon: '👑',
    speed: 'Flagship Multi-Agent',
    contextWindow: '200k tokens',
    description: 'The supreme flagship model. Orchestrates all neural agents simultaneously to design, build, review, and QA entire web ecosystems at maximum fidelity.',
    badgeColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    engineModel: 'quantora-zenith-multiagent'
  }
};
