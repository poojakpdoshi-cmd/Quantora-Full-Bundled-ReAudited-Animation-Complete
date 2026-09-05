export interface ProjectMemoryEntry {
  id: string;
  projectId: string;
  category: 'brand' | 'architecture' | 'database' | 'seo' | 'decisions' | 'fixes';
  title: string;
  content: string;
  timestamp: string;
  agentAuthor: string;
}

export interface ProjectMemoryStore {
  projectId: string;
  brandIdentity: {
    name: string;
    tagline: string;
    designFamily: string;
    colors: Record<string, string>;
    typography: { heading: string; body: string };
  };
  architecture: {
    framework: string;
    pages: string[];
    components: string[];
  };
  databaseSchema: {
    target: string;
    tables: string[];
    rlsEnforced: boolean;
  };
  seoStrategy: {
    focusKeywords: string[];
    schemaType: string;
    canonicalDomain: string;
  };
  decisions: ProjectMemoryEntry[];
  fixes: ProjectMemoryEntry[];
  lastUpdated: string;
}

const memoryCache = new Map<string, ProjectMemoryStore>();

export class SyntropixProjectMemory {
  /**
   * Retrieves or initializes persistent project-scoped memory.
   * Enforces strict project isolation.
   */
  static getMemory(projectId: string): ProjectMemoryStore {
    if (!memoryCache.has(projectId)) {
      memoryCache.set(projectId, {
        projectId,
        brandIdentity: {
          name: 'Syntropix Application',
          tagline: 'Transforming complexity into structure',
          designFamily: 'modern_saas',
          colors: { primary: '#00f0ff', accent: '#6366f1', background: '#050b14' },
          typography: { heading: 'Bricolage Grotesque', body: 'Inter' }
        },
        architecture: {
          framework: 'React 19 + TypeScript + Vite',
          pages: ['Home', 'Features', 'Pricing', 'Contact'],
          components: ['Hero', 'FeatureGrid', 'PricingTable', 'ContactForm', 'Footer']
        },
        databaseSchema: {
          target: 'PostgreSQL (Supabase/RLS)',
          tables: ['inquiries', 'catalog_items', 'analytics_events'],
          rlsEnforced: true
        },
        seoStrategy: {
          focusKeywords: ['online booking', 'enterprise platform', 'cloud services'],
          schemaType: 'SoftwareApplication',
          canonicalDomain: `https://${projectId.toLowerCase().replace(/[^a-z0-9]/g, '-')}.syntropy.app`
        },
        decisions: [
          {
            id: `dec_${Date.now()}_1`,
            projectId,
            category: 'architecture',
            title: 'Full-Stack Separation with Strict RLS',
            content: 'Enforced per-project logical database isolation and zero service-role key leaks in frontend builds.',
            timestamp: new Date().toISOString(),
            agentAuthor: 'Syntropix Architect'
          }
        ],
        fixes: [],
        lastUpdated: new Date().toISOString()
      });
    }
    return memoryCache.get(projectId)!;
  }

  /**
   * Adds a decision or fix record to the project's isolated memory.
   */
  static recordDecision(
    projectId: string,
    entry: Omit<ProjectMemoryEntry, 'id' | 'projectId' | 'timestamp'>
  ): ProjectMemoryEntry {
    const memory = this.getMemory(projectId);
    const newEntry: ProjectMemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      ...entry,
      timestamp: new Date().toISOString()
    };

    if (entry.category === 'fixes') {
      memory.fixes.unshift(newEntry);
    } else {
      memory.decisions.unshift(newEntry);
    }
    memory.lastUpdated = new Date().toISOString();
    return newEntry;
  }

  /**
   * Updates brand or architecture memory fields.
   */
  static updateMemory(projectId: string, partial: Partial<ProjectMemoryStore>): ProjectMemoryStore {
    const memory = this.getMemory(projectId);
    Object.assign(memory, partial, { lastUpdated: new Date().toISOString() });
    return memory;
  }

  /**
   * Searches project memory entries for relevant context.
   */
  static searchMemory(projectId: string, query: string): ProjectMemoryEntry[] {
    const memory = this.getMemory(projectId);
    const q = query.toLowerCase();
    const all = [...memory.decisions, ...memory.fixes];
    return all.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.agentAuthor.toLowerCase().includes(q)
    );
  }

  /**
   * Clears memory for a specific project.
   */
  static clearMemory(projectId: string): void {
    memoryCache.delete(projectId);
  }
}
