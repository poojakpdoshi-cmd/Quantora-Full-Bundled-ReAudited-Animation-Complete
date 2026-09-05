import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface ComponentItem {
  id: string;
  name: string;
  category: 'Hero' | 'Cards' | 'Pricing' | 'Forms' | 'Navigation';
  previewDescription: string;
  dependencies: string[];
}

interface ComponentLibraryProps {
  activeProject: GeneratedProject | null;
  onInsertComponent?: (componentName: string) => void;
}

export const SyntropixComponentLibrary: React.FC<ComponentLibraryProps> = ({
  activeProject,
  onInsertComponent
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [components] = useState<ComponentItem[]>([
    {
      id: 'comp_hero_1',
      name: 'Quantum Kinetic Hero',
      category: 'Hero',
      previewDescription: 'High-energy hero section with quantum glow headlines, split CTA buttons, and floating metrics badge.',
      dependencies: ['src/components/Hero.tsx', 'src/motion.css']
    },
    {
      id: 'comp_cards_1',
      name: 'Bento Showcase Grid',
      category: 'Cards',
      previewDescription: 'Responsive 3-column bento box layout with subtle glassmorphic backgrounds and hover tilt physics.',
      dependencies: ['src/components/FeatureBento.tsx']
    },
    {
      id: 'comp_pricing_1',
      name: 'Tiered Enterprise Matrix',
      category: 'Pricing',
      previewDescription: 'Monthly/Annual display toggle pricing table with highlight ribbons and payment-free WhatsApp order enquiry.',
      dependencies: ['src/components/PricingTable.tsx']
    },
    {
      id: 'comp_form_1',
      name: 'Autonomous Lead Ingestion Form',
      category: 'Forms',
      previewDescription: 'Contact and booking enquiry form preview with client-side validation and instant feedback; connect a verified backend before publishing.',
      dependencies: ['src/components/ContactForm.tsx', 'src/api/records.ts']
    }
  ]);

  const filtered = selectedCategory === 'All'
    ? components
    : components.filter(c => c.category === selectedCategory);

  return (
    <section className="feature-studio-panel">
      <div className="feature-studio-header">
        <span className="feature-tag">MODULAR UI BLOCKS</span>
        <h2>Quantora Component Library</h2>
        <p className="feature-description">
          Save, customize, and compose reusable React 19 + TypeScript component modules directly into your project.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', 'Hero', 'Cards', 'Pricing', 'Forms'].map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.03)',
              color: selectedCategory === cat ? '#00f0ff' : '#94a3b8',
              border: selectedCategory === cat ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {filtered.map(comp => (
          <div
            key={comp.id}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ color: '#fff', fontSize: '15px' }}>{comp.name}</strong>
                <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {comp.category}
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                {comp.previewDescription}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {comp.dependencies.map((dep, i) => (
                  <span key={i} style={{ fontSize: '10px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '2px 6px', borderRadius: '4px' }}>
                    {dep}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="studio-btn primary"
              style={{ fontSize: '12px', padding: '8px 12px' }}
              onClick={() => onInsertComponent?.(comp.name)}
            >
              + Insert into Project
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
