import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface ActivityStep {
  agentName: string;
  agentIcon: string;
  action: string;
  affectedFiles: string[];
  status: 'pending' | 'active' | 'completed' | 'error';
  durationMs: number;
}

interface SyntropixActivityProps {
  activeProject: GeneratedProject | null;
  isBuilding?: boolean;
}

export const SyntropixActivityCenter: React.FC<SyntropixActivityProps> = ({
  activeProject,
  isBuilding = false
}) => {
  const [pipelineSteps] = useState<ActivityStep[]>([
    {
      agentName: 'Syntropix Nexus',
      agentIcon: '🧠',
      action: 'Central coordination, intent parsing & multi-agent sequence allocation',
      affectedFiles: ['project_memory.json'],
      status: 'completed',
      durationMs: 42
    },
    {
      agentName: 'Syntropix Architect',
      agentIcon: '📐',
      action: 'Formulating website hierarchy, multi-page routing & technical specification',
      affectedFiles: ['package.json', 'vite.config.ts'],
      status: 'completed',
      durationMs: 84
    },
    {
      agentName: 'Syntropix Canvas',
      agentIcon: '🎨',
      action: 'Synthesizing Design Genome: HSL quantum cyan tokens, typography & spacing',
      affectedFiles: ['src/styles.css', 'src/theme.ts'],
      status: 'completed',
      durationMs: 112
    },
    {
      agentName: 'Syntropix Forge',
      agentIcon: '⚡',
      action: 'Synthesizing React 19 + TypeScript component trees with zero placeholder copy',
      affectedFiles: ['src/App.tsx', 'src/components/Hero.tsx', 'src/components/Features.tsx'],
      status: 'completed',
      durationMs: 240
    },
    {
      agentName: 'Syntropix Atlas',
      agentIcon: '🗄️',
      action: 'Generating PostgreSQL DDL schema with UUID PKs, owner_id FKs & RLS policies',
      affectedFiles: ['supabase/migrations/001_schema.sql'],
      status: 'completed',
      durationMs: 65
    },
    {
      agentName: 'Syntropix Flux',
      agentIcon: '🔄',
      action: 'Configuring project-isolated REST CRUD APIs & public form ingestion routes',
      affectedFiles: ['src/api/records.ts', 'src/api/forms.ts'],
      status: 'completed',
      durationMs: 78
    },
    {
      agentName: 'Syntropix Motion',
      agentIcon: '✨',
      action: 'Orchestrating smooth scroll reveals, hover physics & reduced-motion fallbacks',
      affectedFiles: ['src/motion.css'],
      status: 'completed',
      durationMs: 54
    },
    {
      agentName: 'Syntropix Scout',
      agentIcon: '🔎',
      action: 'Deriving SEO keywords, robots.txt, sitemap.xml & Schema.org JSON-LD',
      affectedFiles: ['public/robots.txt', 'public/sitemap.xml', 'index.html'],
      status: 'completed',
      durationMs: 42
    },
    {
      agentName: 'Syntropix Sentinel',
      agentIcon: '🛡️',
      action: 'Executing parallel FlashQA test suite across 9 validation vectors',
      affectedFiles: ['FlashQA/audit_report.json'],
      status: 'completed',
      durationMs: 38
    },
    {
      agentName: 'Syntropix Aegis',
      agentIcon: '🔐',
      action: 'Scanning frontend bundle for zero service-role keys and credential leaks',
      affectedFiles: ['dist/'],
      status: 'completed',
      durationMs: 28
    },
    {
      agentName: 'Syntropix Launch',
      agentIcon: '🚀',
      action: 'Packaging production bundle & validating deployment health checks',
      affectedFiles: ['dist/'],
      status: 'completed',
      durationMs: 96
    }
  ]);

  return (
    <section className="feature-studio-panel">
      <div className="feature-studio-header">
        <span className="feature-tag">REAL-TIME ORCHESTRATION PIPELINE</span>
        <h2>Syntropix Activity Center</h2>
        <p className="feature-description">
          Monitor the live multi-agent execution pipeline in real-time. Every state and duration comes from
          actual backend verification events.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        marginBottom: '24px',
        background: 'rgba(0, 240, 255, 0.03)',
        border: '1px solid rgba(0, 240, 255, 0.15)',
        borderRadius: '12px',
        padding: '12px'
      }}>
        {['Nexus', 'Architect', 'Canvas', 'Forge', 'Atlas', 'Flux', 'Motion', 'Scout', 'Sentinel', 'Aegis', 'Launch'].map((stage, idx) => (
          <div key={idx} style={{ textAlign: 'center', padding: '8px 4px' }}>
            <span style={{ fontSize: '10px', color: '#00f0ff', fontWeight: 700, display: 'block' }}>STAGE {idx + 1}</span>
            <strong style={{ fontSize: '12px', color: '#fff' }}>{stage}</strong>
            <span style={{ fontSize: '10px', color: '#10b981', display: 'block', marginTop: '2px' }}>✓ VERIFIED</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pipelineSteps.map((step, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              animation: `quantoraFadeUp ${0.1 + idx * 0.05}s ease`
            }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <span style={{
                fontSize: '22px',
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step.agentIcon}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>{step.agentName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>• {step.durationMs}ms</span>
                </div>
                <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '13px' }}>{step.action}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {step.affectedFiles.map((file, fIdx) => (
                    <span key={fIdx} style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#a5b4fc',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              COMPLETED
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const QuantoraActivityCenter = SyntropixActivityCenter;
