import React, { useState, useRef, useEffect } from 'react';
import type { DesignStudioElement, DesignStudioElementType, WebsitePlan } from '@wmai/shared';
import './design-studio.css';

export interface DesignStudioProps {
  currentPlan?: WebsitePlan | null;
  onApplyToProject?: (elementCode: string, targetSection?: string) => void;
  onClose?: () => void;
}

const DEFAULT_TEMPLATES: Array<{ name: string; category: string; elements: DesignStudioElement[] }> = [
  {
    name: 'Luxury Hero Badge & CTA',
    category: 'Hero',
    elements: [
      {
        id: 'el-1',
        type: 'badge',
        content: 'BESPOKE MASTERPIECE · 2026 EDITION',
        x: 40,
        y: 40,
        width: 280,
        height: 36,
        styles: {
          background: 'rgba(217, 119, 6, 0.15)',
          color: '#fbbf24',
          fontSize: 11,
          fontWeight: '800',
          borderRadius: 999,
          borderColor: 'rgba(217, 119, 6, 0.4)',
          borderWidth: 1,
          textAlign: 'center',
          letterSpacing: '0.14em'
        }
      },
      {
        id: 'el-2',
        type: 'heading',
        content: 'Engineering the Extraordinary',
        x: 40,
        y: 90,
        width: 520,
        height: 110,
        styles: {
          color: '#f8fafc',
          fontSize: 44,
          fontWeight: '900',
          fontFamily: 'Playfair Display, serif',
          lineHeight: '1.05'
        }
      },
      {
        id: 'el-3',
        type: 'text',
        content: 'Every curve, surface and interaction engineered without compromise for discerning clientele.',
        x: 40,
        y: 210,
        width: 480,
        height: 60,
        styles: {
          color: '#94a3b8',
          fontSize: 16,
          fontWeight: '400',
          fontFamily: 'Inter, sans-serif'
        }
      },
      {
        id: 'el-4',
        type: 'button',
        content: 'Experience Showroom',
        x: 40,
        y: 285,
        width: 210,
        height: 48,
        styles: {
          background: 'linear-gradient(135deg, #d97706, #b45309)',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: '700',
          borderRadius: 999,
          boxShadow: '0 12px 30px rgba(217, 119, 6, 0.35)',
          textAlign: 'center'
        }
      }
    ]
  },
  {
    name: 'Bento Feature Card',
    category: 'Features',
    elements: [
      {
        id: 'el-b1',
        type: 'card',
        content: '',
        x: 40,
        y: 40,
        width: 340,
        height: 240,
        styles: {
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          borderRadius: 20,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }
      },
      {
        id: 'el-b2',
        type: 'icon',
        content: '⚡',
        x: 65,
        y: 65,
        width: 50,
        height: 50,
        styles: {
          background: 'rgba(99, 102, 241, 0.2)',
          borderRadius: 12,
          fontSize: 24,
          textAlign: 'center',
          borderColor: 'rgba(99, 102, 241, 0.4)',
          borderWidth: 1
        }
      },
      {
        id: 'el-b3',
        type: 'heading',
        content: 'Sub-Millisecond Engine',
        x: 65,
        y: 130,
        width: 290,
        height: 32,
        styles: {
          color: '#f8fafc',
          fontSize: 20,
          fontWeight: '800',
          fontFamily: 'Inter, sans-serif'
        }
      },
      {
        id: 'el-b4',
        type: 'text',
        content: 'Built on edge architecture with automatic worldwide distribution and caching.',
        x: 65,
        y: 170,
        width: 290,
        height: 55,
        styles: {
          color: '#94a3b8',
          fontSize: 13.5,
          fontWeight: '400',
          fontFamily: 'Inter, sans-serif'
        }
      }
    ]
  },
  {
    name: 'Social Proof & Rating',
    category: 'Testimonials',
    elements: [
      {
        id: 'el-sp1',
        type: 'card',
        content: '',
        x: 40,
        y: 40,
        width: 420,
        height: 180,
        styles: {
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 18,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          boxShadow: '0 16px 36px rgba(0,0,0,0.4)'
        }
      },
      {
        id: 'el-sp2',
        type: 'text',
        content: '★★★★★',
        x: 65,
        y: 65,
        width: 140,
        height: 24,
        styles: {
          color: '#fbbf24',
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: '0.1em'
        }
      },
      {
        id: 'el-sp3',
        type: 'text',
        content: '"Nexora transformed our digital presence completely. The speed and bespoke design feel incredible."',
        x: 65,
        y: 95,
        width: 370,
        height: 50,
        styles: {
          color: '#e2e8f0',
          fontSize: 14,
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }
      },
      {
        id: 'el-sp4',
        type: 'text',
        content: 'Elena Vance — Founder, Apex Ventures',
        x: 65,
        y: 155,
        width: 370,
        height: 24,
        styles: {
          color: '#38bdf8',
          fontSize: 12,
          fontWeight: '700'
        }
      }
    ]
  }
];

export const DesignStudio: React.FC<DesignStudioProps> = ({
  currentPlan,
  onApplyToProject,
  onClose
}) => {
  const [elements, setElements] = useState<DesignStudioElement[]>(DEFAULT_TEMPLATES[0].elements);
  const [selectedId, setSelectedId] = useState<string | null>('el-2');
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(16);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'jsx' | 'html' | 'svg' | 'png'>('jsx');
  const [thirdPartyModal, setThirdPartyModal] = useState<'canva' | 'figma' | 'adobe' | null>(null);
  const [figmaUrl, setFigmaUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Sync with currentPlan if available
  useEffect(() => {
    if (currentPlan?.theme?.primary) {
      setElements((prev) =>
        prev.map((el) =>
          el.type === 'button'
            ? { ...el, styles: { ...el.styles, background: currentPlan.theme.primary } }
            : el
        )
      );
    }
  }, [currentPlan]);

  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedId(id);
    const target = elements.find((el) => el.id === id);
    if (!target || target.locked) return;

    draggingRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      elX: target.x,
      elY: target.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { id, startX, startY, elX, elY } = draggingRef.current;
    const scale = zoom / 100;
    const deltaX = (e.clientX - startX) / scale;
    const deltaY = (e.clientY - startY) / scale;

    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, x: Math.max(0, snap(elX + deltaX)), y: Math.max(0, snap(elY + deltaY)) }
          : el
      )
    );
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  const updateSelectedStyle = (updates: Partial<NonNullable<DesignStudioElement['styles']>>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedId
          ? { ...el, styles: { ...el.styles, ...updates } }
          : el
      )
    );
  };

  const updateSelectedProp = (updates: Partial<DesignStudioElement>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedId
          ? { ...el, ...updates }
          : el
      )
    );
  };

  const addElement = (type: DesignStudioElementType) => {
    const newId = `el-${Date.now()}`;
    const baseElement: DesignStudioElement = {
      id: newId,
      type,
      content:
        type === 'heading'
          ? 'New Section Headline'
          : type === 'button'
          ? 'Call to Action'
          : type === 'badge'
          ? 'NEW BADGE'
          : type === 'icon'
          ? '✦'
          : type === 'card'
          ? ''
          : 'Detailed description text for the component.',
      x: 100,
      y: 100,
      width: type === 'card' ? 320 : type === 'button' ? 180 : type === 'icon' ? 44 : 260,
      height: type === 'card' ? 200 : type === 'button' ? 44 : type === 'icon' ? 44 : 50,
      styles: {
        background: type === 'button' ? (currentPlan?.theme?.primary || '#6366f1') : type === 'card' ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: '#f8fafc',
        fontSize: type === 'heading' ? 28 : type === 'badge' ? 11 : 14,
        fontWeight: type === 'heading' || type === 'button' || type === 'badge' ? '700' : '400',
        borderRadius: type === 'button' ? 999 : type === 'card' ? 16 : 8,
        fontFamily: type === 'heading' ? (currentPlan?.designGenome?.typography?.headingFont || 'Playfair Display, serif') : 'Inter, sans-serif',
        textAlign: type === 'button' || type === 'badge' || type === 'icon' ? 'center' : 'left'
      }
    };
    setElements((prev) => [...prev, baseElement]);
    setSelectedId(newId);
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const clone: DesignStudioElement = {
      ...selectedElement,
      id: `el-${Date.now()}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20
    };
    setElements((prev) => [...prev, clone]);
    setSelectedId(clone.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    const index = elements.findIndex((el) => el.id === selectedId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= elements.length) return;

    const newElements = [...elements];
    const [moved] = newElements.splice(index, 1);
    newElements.splice(targetIndex, 0, moved);
    setElements(newElements);
  };

  const loadTemplate = (tmpl: typeof DEFAULT_TEMPLATES[number]) => {
    setElements(tmpl.elements);
    setSelectedId(tmpl.elements[0]?.id || null);
    setStatusMessage(`Loaded template: ${tmpl.name}`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const generateJsxCode = (): string => {
    return `<div style={{ position: 'relative', minHeight: 400, background: '#090d16', borderRadius: 20, overflow: 'hidden' }}>
  ${elements
    .map((el) => {
      const s = el.styles || {};
      const styleStr = Object.entries(s)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${typeof v === 'number' ? v : `'${v}'`}`)
        .join(', ');

      if (el.type === 'card') {
        return `  <div style={{ position: 'absolute', left: ${el.x}, top: ${el.y}, width: ${el.width}, height: ${el.height}, ${styleStr} }} />`;
      }
      if (el.type === 'button') {
        return `  <button style={{ position: 'absolute', left: ${el.x}, top: ${el.y}, width: ${el.width}, height: ${el.height}, border: 0, cursor: 'pointer', ${styleStr} }}>
    ${el.content || 'Button'}
  </button>`;
      }
      if (el.type === 'heading') {
        return `  <h3 style={{ position: 'absolute', margin: 0, left: ${el.x}, top: ${el.y}, width: ${el.width}, ${styleStr} }}>
    ${el.content || 'Heading'}
  </h3>`;
      }
      return `  <div style={{ position: 'absolute', left: ${el.x}, top: ${el.y}, width: ${el.width}, ${styleStr} }}>
    ${el.content || ''}
  </div>`;
    })
    .join('\n')}
</div>`;
  };

  const handleApplyToProject = () => {
    const code = generateJsxCode();
    onApplyToProject?.(code);
    setStatusMessage('Element successfully synchronized to website project!');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  return (
    <div className="nexora-design-studio">
      {/* Studio Top Navigation Bar */}
      <header className="studio-topbar">
        <div className="studio-title-area">
          <span className="studio-icon">🎨</span>
          <div>
            <h2>Nexora Design Studio</h2>
            <small>Native Visual Canvas & Component Stager</small>
          </div>
        </div>

        <div className="studio-topbar-tools">
          <div className="zoom-controls">
            <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))}>-</button>
            <span>{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 10))}>+</button>
          </div>

          <button
            type="button"
            className={`tool-toggle-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Visual Grid"
          >
            # Grid
          </button>
          <button
            type="button"
            className={`tool-toggle-btn ${snapToGrid ? 'active' : ''}`}
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Toggle Snap to Grid"
          >
            🧲 Snap
          </button>

          {/* Third-Party Integrations */}
          <div className="integration-buttons">
            <button
              type="button"
              className="integ-btn canva"
              onClick={() => setThirdPartyModal('canva')}
            >
              Canva
            </button>
            <button
              type="button"
              className="integ-btn figma"
              onClick={() => setThirdPartyModal('figma')}
            >
              Figma
            </button>
            <button
              type="button"
              className="integ-btn adobe"
              onClick={() => setThirdPartyModal('adobe')}
            >
              Adobe
            </button>
          </div>

          <button
            type="button"
            className="studio-btn export"
            onClick={() => setExportModalOpen(true)}
          >
            📦 Export
          </button>

          <button
            type="button"
            className="studio-btn apply"
            onClick={handleApplyToProject}
          >
            🚀 Apply to Website
          </button>

          {onClose && (
            <button type="button" className="studio-btn close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </header>

      {statusMessage && <div className="studio-toast-banner">{statusMessage}</div>}

      {/* Main Studio Workspace */}
      <div className="studio-workspace">
        {/* Left Toolbar: Add Elements & Presets */}
        <aside className="studio-left-panel">
          <div className="panel-section">
            <h4>ADD ELEMENTS</h4>
            <div className="element-add-grid">
              <button type="button" onClick={() => addElement('heading')}>
                <span>H1</span> Heading
              </button>
              <button type="button" onClick={() => addElement('text')}>
                <span>T</span> Text
              </button>
              <button type="button" onClick={() => addElement('button')}>
                <span>🔘</span> Button
              </button>
              <button type="button" onClick={() => addElement('badge')}>
                <span>🏷️</span> Badge
              </button>
              <button type="button" onClick={() => addElement('card')}>
                <span>🃏</span> Bento Card
              </button>
              <button type="button" onClick={() => addElement('icon')}>
                <span>✦</span> Icon
              </button>
            </div>
          </div>

          <div className="panel-section templates-section">
            <h4>PRESET TEMPLATES</h4>
            <div className="templates-list">
              {DEFAULT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  className="template-card-btn"
                  onClick={() => loadTemplate(tmpl)}
                >
                  <strong>{tmpl.name}</strong>
                  <small>{tmpl.category} · {tmpl.elements.length} elements</small>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Hierarchy */}
          <div className="panel-section layers-section">
            <h4>LAYERS ({elements.length})</h4>
            <div className="layers-list">
              {[...elements].reverse().map((el) => (
                <div
                  key={el.id}
                  className={`layer-item ${selectedId === el.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(el.id)}
                >
                  <span className="layer-type-tag">{el.type}</span>
                  <span className="layer-name">{(el.content || '').slice(0, 18) || el.type}</span>
                  <button
                    type="button"
                    className="layer-lock-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setElements((prev) =>
                        prev.map((item) =>
                          item.id === el.id ? { ...item, locked: !item.locked } : item
                        )
                      );
                    }}
                  >
                    {el.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Canvas Viewport */}
        <main
          className="studio-canvas-viewport"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            className={`studio-canvas-artboard ${showGrid ? 'grid-active' : ''}`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center'
            }}
          >
            {elements.map((el) => {
              const isSelected = selectedId === el.id;
              const s = el.styles || {};

              return (
                <div
                  key={el.id}
                  className={`canvas-element ${isSelected ? 'selected' : ''} ${el.locked ? 'locked' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    minHeight: `${el.height}px`,
                    background: s.background || s.backgroundColor || 'transparent',
                    color: s.color || '#f8fafc',
                    fontSize: `${s.fontSize || 14}px`,
                    fontWeight: s.fontWeight || '400',
                    fontFamily: s.fontFamily || 'inherit',
                    borderRadius: `${s.borderRadius || 0}px`,
                    borderWidth: `${s.borderWidth || 0}px`,
                    borderColor: s.borderColor || 'transparent',
                    borderStyle: s.borderWidth ? 'solid' : 'none',
                    boxShadow: s.boxShadow || 'none',
                    textAlign: s.textAlign || 'left',
                    letterSpacing: s.letterSpacing || 'normal',
                    padding: s.padding !== undefined ? (typeof s.padding === 'number' ? `${s.padding}px` : s.padding) : (el.type === 'button' || el.type === 'badge' ? '8px 16px' : '4px'),
                    opacity: s.opacity !== undefined ? s.opacity : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    boxSizing: 'border-box'
                  }}
                  onPointerDown={(e) => handlePointerDown(el.id, e)}
                >
                  {el.content}

                  {isSelected && !el.locked && (
                    <div className="selection-handles">
                      <div className="handle top-left" />
                      <div className="handle top-right" />
                      <div className="handle bottom-left" />
                      <div className="handle bottom-right" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Inspector: Property Editor */}
        <aside className="studio-right-panel">
          {selectedElement ? (
            <div className="inspector-content">
              <div className="inspector-header">
                <h3>{selectedElement.type.toUpperCase()} PROPERTIES</h3>
                <div className="inspector-actions">
                  <button type="button" onClick={() => moveLayer('up')} title="Bring Forward">▲</button>
                  <button type="button" onClick={() => moveLayer('down')} title="Send Backward">▼</button>
                  <button type="button" onClick={duplicateSelected} title="Duplicate">📋</button>
                  <button type="button" onClick={deleteSelected} title="Delete" className="danger">🗑️</button>
                </div>
              </div>

              {/* Content input */}
              {selectedElement.type !== 'card' && (
                <div className="prop-field">
                  <label>Content</label>
                  <input
                    type="text"
                    value={selectedElement.content || ''}
                    onChange={(e) => updateSelectedProp({ content: e.target.value })}
                  />
                </div>
              )}

              {/* Dimensions */}
              <div className="prop-row-2">
                <div className="prop-field">
                  <label>Width (px)</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateSelectedProp({ width: Number(e.target.value) })}
                  />
                </div>
                <div className="prop-field">
                  <label>Height (px)</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateSelectedProp({ height: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Typography */}
              <div className="prop-section-title">TYPOGRAPHY</div>
              <div className="prop-row-2">
                <div className="prop-field">
                  <label>Size (px)</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.fontSize || 14}
                    onChange={(e) => updateSelectedStyle({ fontSize: Number(e.target.value) })}
                  />
                </div>
                <div className="prop-field">
                  <label>Weight</label>
                  <select
                    value={selectedElement.styles?.fontWeight || '400'}
                    onChange={(e) => updateSelectedStyle({ fontWeight: e.target.value })}
                  >
                    <option value="400">Regular (400)</option>
                    <option value="600">Semi-Bold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>

              <div className="prop-field">
                <label>Font Family</label>
                <select
                  value={selectedElement.styles?.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => updateSelectedStyle({ fontFamily: e.target.value })}
                >
                  <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                  <option value="Playfair Display, serif">Playfair Display (Luxury Serif)</option>
                  <option value="Outfit, sans-serif">Outfit (Geometric Tech)</option>
                  <option value="Cinzel, serif">Cinzel (Editorial Royal)</option>
                  <option value="Space Grotesk, sans-serif">Space Grotesk (Brutalist)</option>
                  <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (SaaS)</option>
                </select>
              </div>

              {/* Colors & Appearance */}
              <div className="prop-section-title">APPEARANCE</div>
              <div className="prop-row-2">
                <div className="prop-field">
                  <label>Text Color</label>
                  <input
                    type="color"
                    value={selectedElement.styles?.color || '#f8fafc'}
                    onChange={(e) => updateSelectedStyle({ color: e.target.value })}
                  />
                </div>
                <div className="prop-field">
                  <label>Background</label>
                  <input
                    type="color"
                    value={selectedElement.styles?.background?.startsWith('#') ? selectedElement.styles.background : '#6366f1'}
                    onChange={(e) => updateSelectedStyle({ background: e.target.value })}
                  />
                </div>
              </div>

              <div className="prop-row-2">
                <div className="prop-field">
                  <label>Corner Radius</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.borderRadius || 0}
                    onChange={(e) => updateSelectedStyle({ borderRadius: Number(e.target.value) })}
                  />
                </div>
                <div className="prop-field">
                  <label>Border Width</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.borderWidth || 0}
                    onChange={(e) => updateSelectedStyle({ borderWidth: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-hint">
              <p>Select any canvas element to customize typography, colors, shadows and layout.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="studio-modal-overlay">
          <div className="studio-modal">
            <div className="modal-header">
              <h3>Export Component</h3>
              <button type="button" onClick={() => setExportModalOpen(false)}>✕</button>
            </div>

            <div className="format-picker">
              <button
                type="button"
                className={exportFormat === 'jsx' ? 'active' : ''}
                onClick={() => setExportFormat('jsx')}
              >
                React JSX
              </button>
              <button
                type="button"
                className={exportFormat === 'html' ? 'active' : ''}
                onClick={() => setExportFormat('html')}
              >
                HTML / CSS
              </button>
              <button
                type="button"
                className={exportFormat === 'svg' ? 'active' : ''}
                onClick={() => setExportFormat('svg')}
              >
                SVG Vector
              </button>
            </div>

            <pre className="code-preview-box">
              <code>{generateJsxCode()}</code>
            </pre>

            <div className="modal-actions">
              <button
                type="button"
                className="studio-btn apply"
                onClick={() => {
                  navigator.clipboard.writeText(generateJsxCode());
                  setStatusMessage('Code copied to clipboard!');
                  setExportModalOpen(false);
                  setTimeout(() => setStatusMessage(''), 3000);
                }}
              >
                📋 Copy Code to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Third Party Integrations Modal */}
      {thirdPartyModal && (
        <div className="studio-modal-overlay">
          <div className="studio-modal">
            <div className="modal-header">
              <h3>{thirdPartyModal === 'canva' ? 'Canva Integration' : thirdPartyModal === 'figma' ? 'Figma Design Bridge' : 'Adobe Express Integration'}</h3>
              <button type="button" onClick={() => setThirdPartyModal(null)}>✕</button>
            </div>

            <div className="integration-content">
              {thirdPartyModal === 'canva' && (
                <div className="integ-box">
                  <p>Design stunning banners, logos or vector art in Canva and drop them straight into your Nexora project.</p>
                  <a
                    href="https://www.canva.com"
                    target="_blank"
                    rel="noreferrer"
                    className="studio-btn canva-cta"
                  >
                    Open Canva Studio ↗
                  </a>
                </div>
              )}

              {thirdPartyModal === 'figma' && (
                <div className="integ-box">
                  <p>Paste a Figma frame link or prototype to embed or inspect tokens directly inside Nexora Studio.</p>
                  <input
                    type="url"
                    placeholder="https://www.figma.com/file/..."
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    className="figma-input"
                  />
                  {figmaUrl && (
                    <div className="figma-embed-preview">
                      <iframe
                        title="Figma Embed"
                        src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaUrl)}`}
                        className="figma-iframe"
                      />
                    </div>
                  )}
                </div>
              )}

              {thirdPartyModal === 'adobe' && (
                <div className="integ-box">
                  <p>Enhance visuals, remove backgrounds and generate AI artwork via Adobe Express.</p>
                  <a
                    href="https://express.adobe.com"
                    target="_blank"
                    rel="noreferrer"
                    className="studio-btn adobe-cta"
                  >
                    Launch Adobe Express ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
