import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface ProjectMemoryProps {
  activeProject: GeneratedProject | null;
}

export const SyntropixProjectMemory: React.FC<ProjectMemoryProps> = ({ activeProject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'architecture' | 'database' | 'seo' | 'decisions'>('all');

  const [memoryEntries] = useState([
    {
      id: 'mem_1',
      category: 'architecture',
      title: 'Full-Stack Separation with Strict RLS',
      content: 'Separated user application data store from Syntropix platform schema with strict PostgreSQL row-level security.',
      author: 'Syntropix Architect',
      timestamp: 'Just now'
    },
    {
      id: 'mem_2',
      category: 'database',
      title: 'PostgreSQL Relational Schema Initialized',
      content: 'Generated tables: inquiries, catalog_items, analytics_events with UUID PKs and owner_id foreign keys.',
      author: 'Syntropix Atlas',
      timestamp: '2 mins ago'
    },
    {
      id: 'mem_3',
      category: 'seo',
      title: 'Schema.org JSON-LD Topology Active',
      content: 'Bound SoftwareApplication semantic structured data, OpenGraph cards, and canonical URL routing.',
      author: 'Syntropix Scout',
      timestamp: '4 mins ago'
    },
    {
      id: 'mem_4',
      category: 'decisions',
      title: 'Design Genome: High-Energy Quantum Cyan',
      content: 'Locked brand tokens: Primary #00f0ff, Obsidian #050b14, Bricolage Grotesque heading font.',
      author: 'Syntropix Canvas',
      timestamp: '5 mins ago'
    }
  ]);

  const filtered = memoryEntries.filter(e => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesQuery = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <section className="feature-studio-panel">
      <div className="feature-studio-header">
        <span className="feature-tag">ISOLATED PROJECT MEMORY STORE</span>
        <h2>Syntropix Project Memory</h2>
        <p className="feature-description">
          Persistent context and decision history strictly scoped to this project. Syntropix agents use this
          memory to maintain architectural consistency across all future iterations and edits.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search project memory (e.g. 'RLS', 'Schema', 'Design')..."
          style={{
            flex: 1,
            minWidth: '220px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'architecture', 'database', 'seo', 'decisions'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                color: selectedCategory === cat ? '#00f0ff' : '#94a3b8',
                border: selectedCategory === cat ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(item => (
          <div
            key={item.id}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '14px 18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ color: '#fff', fontSize: '14px' }}>{item.title}</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{item.timestamp}</span>
            </div>
            <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.4' }}>{item.content}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {item.author}
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '2px 8px', borderRadius: '4px' }}>
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
