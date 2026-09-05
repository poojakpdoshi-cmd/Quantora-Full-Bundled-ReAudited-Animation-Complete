import React, { useEffect, useRef, useState } from 'react';
import type { GeneratedProject } from './types';

interface AIConciergeProps {
  activeProject: GeneratedProject | null;
}

export function AIConciergeStudio({ activeProject }: AIConciergeProps) {
  const [botName, setBotName] = useState('Quantora AI Concierge');
  const [welcomeGreeting, setWelcomeGreeting] = useState('Hi there! Welcome to our website. How can I assist your inquiry today?');
  const [businessKnowledge, setBusinessKnowledge] = useState(
    'Describe your real services, pricing boundaries, support hours and contact options here. Do not promise rankings, performance scores or checkout capabilities unless they are configured and verified.'
  );
  const [themeColor, setThemeColor] = useState('#00f0ff');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hi there! Welcome to our website. How can I assist your inquiry today?' }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [saved, setSaved] = useState(false);
  const responseTimerRef = useRef<number | null>(null);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current);
  }, []);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputQuery('');
    setIsTyping(true);

    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    responseTimerRef.current = window.setTimeout(() => {
      let botReply = "Thanks for your message. This is a preview assistant; connect a verified website backend before using it for live customer replies. Would you like to leave an enquiry for the site owner?";
      if (userText.toLowerCase().includes('price') || userText.toLowerCase().includes('cost')) {
        botReply = "Pricing should be confirmed by the site owner. Add verified package details to the knowledge field before publishing a live assistant.";
      } else if (userText.toLowerCase().includes('hour') || userText.toLowerCase().includes('time')) {
        botReply = "Add the business's verified support hours to the knowledge field before presenting availability to visitors.";
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      setIsTyping(false);
    }, 1000);
  }

  function saveWidgetConfig() {
    setSaved(true);
    if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="feature-studio-container ai-concierge-studio">
      <div className="feature-header">
        <span className="feature-badge">🤖 AI CONCIERGE PREVIEW</span>
        <h2>AI Sales Concierge & Lead Assistant</h2>
        <p className="feature-subtitle">
          Configure and preview a conversational assistant for {activeProject ? 'the active website' : 'a selected website'}. This screen is a local preview; it does not deploy a production bot or guarantee automated replies until a backend integration is configured.
        </p>
      </div>

      <div className="concierge-grid">
        <div className="concierge-config-card">
          <h3>Concierge Knowledge & Personality</h3>

          <label className="input-group">
            <span>Assistant Display Name</span>
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="e.g. LuxBot Concierge"
            />
          </label>

          <label className="input-group">
            <span>Welcome Greeting</span>
            <input
              type="text"
              value={welcomeGreeting}
              onChange={(e) => setWelcomeGreeting(e.target.value)}
            />
          </label>

          <label className="input-group">
            <span>Business Knowledge & Guidelines (AI Context)</span>
            <textarea
              rows={4}
              value={businessKnowledge}
              onChange={(e) => setBusinessKnowledge(e.target.value)}
              placeholder="Describe your services, pricing guidelines, delivery timeline, etc."
            />
          </label>

          <label className="input-group">
            <span>Widget Accent Color</span>
            <div className="color-picker-row">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                style={{ width: '45px', height: '40px', padding: 0, border: 'none', borderRadius: '8px' }}
              />
              <span className="color-code">{themeColor}</span>
            </div>
          </label>

          <button
            type="button"
            className="nx-button nx-button--primary"
            onClick={saveWidgetConfig}
            style={{ marginTop: '16px' }}
          >
            {saved ? '✓ Preview settings saved locally' : '⚡ Save preview settings'}
          </button>
        </div>

        <div className="concierge-preview-card">
          <h3>Interactive Live Preview</h3>

          <div className="chatbot-widget-mockup" style={{ borderColor: themeColor }}>
            <div className="widget-header" style={{ background: `linear-gradient(135deg, ${themeColor}22, #0b121e)` }}>
              <div className="bot-avatar" style={{ borderColor: themeColor }}>🤖</div>
              <div>
                <strong>{botName}</strong>
                <span className="online-indicator">● Preview mode</span>
              </div>
            </div>

            <div className="widget-messages-body">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender}-bubble`}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="chat-bubble bot-bubble typing-bubble">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="widget-input-form">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask anything about our services..."
              />
              <button type="submit" style={{ background: themeColor, color: '#000' }}>
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
