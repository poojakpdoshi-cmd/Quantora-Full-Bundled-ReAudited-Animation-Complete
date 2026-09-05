import React, { useState } from 'react';

interface ElementInfo {
  name: string;
  builtBy: string[];
  files: string[];
  purpose: string;
}

interface ExplainOverlayProps {
  onActionTriggered: (action: string, element: string) => void;
  onClose: () => void;
}

export const ExplainWebsiteOverlay: React.FC<ExplainOverlayProps> = ({
  onActionTriggered,
  onClose
}) => {
  const [selectedElement] = useState<ElementInfo>({
    name: 'Hero Showcase Section',
    builtBy: ['Syntropix Architect', 'Syntropix Canvas', 'Syntropix Forge'],
    files: ['src/App.tsx', 'src/styles.css', 'src/motion.css'],
    purpose: 'Primary conversion focal point with animated headline, quantum CTA, and live metrics badge'
  });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        background: '#090f1e',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 240, 255, 0.1)',
        zIndex: 9990,
        overflow: 'hidden',
        animation: 'quantoraFadeUp 0.2s ease'
      }}
    >
      <div style={{
        background: 'rgba(0, 240, 255, 0.08)',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00f0ff', fontSize: '15px' }}>🔍</span>
          <strong style={{ color: '#fff', fontSize: '13px' }}>Explain My Website</strong>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>SELECTED ELEMENT</small>
          <h4 style={{ margin: '2px 0 0 0', color: '#00f0ff', fontSize: '15px' }}>{selectedElement.name}</h4>
        </div>

        <div>
          <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>BUILT BY AGENTS</small>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            {selectedElement.builtBy.map((agent, i) => (
              <span key={i} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {agent}
              </span>
            ))}
          </div>
        </div>

        <div>
          <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>SOURCE FILES</small>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            {selectedElement.files.map((file, i) => (
              <span key={i} style={{ fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                {file}
              </span>
            ))}
          </div>
        </div>

        <div>
          <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>FUNCTIONAL PURPOSE</small>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            {selectedElement.purpose}
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            type="button"
            className="studio-btn secondary"
            style={{ fontSize: '11px', padding: '6px' }}
            onClick={() => onActionTriggered('more_premium', selectedElement.name)}
          >
            ✨ Make More Premium
          </button>
          <button
            type="button"
            className="studio-btn secondary"
            style={{ fontSize: '11px', padding: '6px' }}
            onClick={() => onActionTriggered('change_layout', selectedElement.name)}
          >
            📐 Change Layout
          </button>
          <button
            type="button"
            className="studio-btn secondary"
            style={{ fontSize: '11px', padding: '6px' }}
            onClick={() => onActionTriggered('improve_animation', selectedElement.name)}
          >
            ⚡ Improve Animation
          </button>
          <button
            type="button"
            className="studio-btn secondary"
            style={{ fontSize: '11px', padding: '6px' }}
            onClick={() => onActionTriggered('improve_a11y', selectedElement.name)}
          >
            ♿ Boost Accessibility
          </button>
        </div>
      </div>
    </div>
  );
};
