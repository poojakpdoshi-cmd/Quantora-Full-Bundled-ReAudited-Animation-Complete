import React, { useState, useEffect } from 'react';
import type { SyntropixMode } from '../syntro-models';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionType: string, payload?: any) => void;
}

export const SyntropixCommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectAction('toggle_bar');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  if (!isOpen) return null;

  const quickCommands = [
    { label: '⚡ Run FlashQA Parallel Audit', category: 'QA', action: 'navigate_tab', payload: 'qa' },
    { label: '💻 Open Build Diagnostics', category: 'Terminal', action: 'navigate_tab', payload: 'terminal' },
    { label: '🧠 Open Project Memory & Decision History', category: 'Memory', action: 'navigate_tab', payload: 'project-memory' },
    { label: '🧩 Open Modular Component Library', category: 'Components', action: 'navigate_tab', payload: 'components' },
    { label: '🖼️ Screenshot to Live Website (Vision AI)', category: 'Vision', action: 'navigate_tab', payload: 'vision' },
    { label: '🎨 Open Brand Studio & Design Genome', category: 'Design', action: 'navigate_tab', payload: 'brand-studio' },
    { label: '📊 View Live Multi-Agent Activity Timeline', category: 'Pipeline', action: 'navigate_tab', payload: 'activity' },
    { label: '🛍️ Payment-Free WhatsApp Order Enquiries', category: 'Commerce', action: 'navigate_tab', payload: 'wa-commerce' },
    { label: '💼 Client Proposal & Pitch Script Studio', category: 'Agency', action: 'navigate_tab', payload: 'agency-pitch' },
    { label: '🛡️ Switch Creation Mode to PRO', category: 'Mode', action: 'set_mode', payload: 'PRO' },
    { label: '🧠 Switch Creation Mode to THINK', category: 'Mode', action: 'set_mode', payload: 'THINK' }
  ];

  const filtered = quickCommands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a101f',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.1)',
          overflow: 'hidden',
          animation: 'quantoraFadeUp 0.15s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: '#00f0ff', fontSize: '16px', marginRight: '12px' }}>⌘</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Syntropix or type a command (e.g. 'FlashQA', 'Shell', 'PRO Mode')..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              outline: 'none'
            }}
          />
          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px' }}>
            ESC
          </span>
        </div>

        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length ? (
            filtered.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                className="command-bar-item"
                onClick={() => {
                  onSelectAction(item.action, item.payload);
                  onClose();
                }}
              >
                <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{item.label}</span>
                <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {item.category}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No matching commands. Press Enter to prompt Syntropix Nexus directly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const QuantoraCommandBar = SyntropixCommandBar;
