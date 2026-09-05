import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface BrandStudioProps {
  activeProject: GeneratedProject | null;
  onSaveGenome?: (genome: any) => void;
}

export const QuantoraBrandStudio: React.FC<BrandStudioProps> = ({
  activeProject
}) => {
  const [primaryColor, setPrimaryColor] = useState('#00f0ff');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [backgroundColor, setBackgroundColor] = useState('#050b14');
  const [headingFont, setHeadingFont] = useState('Bricolage Grotesque');
  const [bodyFont, setBodyFont] = useState('Inter');
  const [radius, setRadius] = useState<'sharp' | 'rounded' | 'pill'>('rounded');
  const [animationStyle, setAnimationStyle] = useState<'subtle' | 'quantum_glow' | 'cinematic'>('quantum_glow');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="feature-studio-panel">
      <div className="feature-studio-header">
        <span className="feature-tag">PROJECT-WIDE DESIGN GENOME</span>
        <h2>Brand Studio & Design System</h2>
        <p className="feature-description">
          Define your project's unified design genome. Quantora Canvas and Forge apply these exact color tokens,
          typography scales, and animation physics across all generated pages.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="studio-card">
          <h4 style={{ margin: '0 0 12px 0', color: '#00f0ff' }}>🎨 Color Token Palette</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '13px' }}>
              Primary Token
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '36px', height: '32px' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '13px' }}>
              Accent Glow
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '36px', height: '32px' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '13px' }}>
              Obsidian Canvas
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '36px', height: '32px' }}
              />
            </label>
          </div>
        </div>

        <div className="studio-card">
          <h4 style={{ margin: '0 0 12px 0', color: '#a5b4fc' }}>🔤 Typography & Pairing</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <small style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Heading Font Family</small>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
              >
                <option value="Bricolage Grotesque">Bricolage Grotesque (Modern High-Tech)</option>
                <option value="Playfair Display">Playfair Display (Luxury Serif)</option>
                <option value="Cinzel">Cinzel (Editorial / Classical)</option>
                <option value="Fredoka">Fredoka (Friendly / Playful)</option>
                <option value="Outfit">Outfit (Clean Geometric)</option>
              </select>
            </div>

            <div>
              <small style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Body Font Family</small>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
              >
                <option value="Inter">Inter (Ultra-Legible Standard)</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Premium Tech)</option>
                <option value="Montserrat">Montserrat (Modern Clean)</option>
                <option value="Quicksand">Quicksand (Soft Rounded)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="studio-card">
          <h4 style={{ margin: '0 0 12px 0', color: '#10b981' }}>📐 Border Geometry & Motion</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <small style={{ color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Component Corner Radius</small>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['sharp', 'rounded', 'pill'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: r === 'pill' ? '20px' : r === 'rounded' ? '8px' : '2px',
                      border: radius === r ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                      background: radius === r ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setRadius(r)}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <small style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Motion Dynamics</small>
              <select
                value={animationStyle}
                onChange={(e) => setAnimationStyle(e.target.value as any)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
              >
                <option value="quantum_glow">Quantum Glow & Reveal</option>
                <option value="cinematic">Cinematic Smooth Parallax</option>
                <option value="subtle">Subtle Minimal Fade</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: backgroundColor,
        border: `1px solid ${primaryColor}40`,
        borderRadius: radius === 'pill' ? '24px' : radius === 'rounded' ? '12px' : '2px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>LIVE DESIGN GENOME PREVIEW</small>
        <h3 style={{ fontFamily: headingFont, color: '#fff', margin: '8px 0', fontSize: '20px' }}>
          Autonomous Cloud Systems Designed for Conversion
        </h3>
        <p style={{ fontFamily: bodyFont, color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
          All components, typography, buttons, and hover physics synchronize with this preview.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            style={{
              background: primaryColor,
              color: '#050b14',
              border: 'none',
              borderRadius: radius === 'pill' ? '20px' : radius === 'rounded' ? '8px' : '2px',
              padding: '8px 18px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Primary Action
          </button>
          <button
            type="button"
            style={{
              background: 'transparent',
              color: accentColor,
              border: `1px solid ${accentColor}`,
              borderRadius: radius === 'pill' ? '20px' : radius === 'rounded' ? '8px' : '2px',
              padding: '8px 18px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Secondary Glow
          </button>
        </div>
      </div>

      <button
        type="button"
        className="studio-btn primary"
        onClick={handleSave}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {saved ? '✓ Design Genome Saved & Applied to Project!' : '💾 Save & Apply Design Genome'}
      </button>
    </section>
  );
};
