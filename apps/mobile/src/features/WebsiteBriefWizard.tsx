import React, { useState } from 'react';

export interface WebsiteBrief {
  businessName: string;
  industry: string;
  tagline: string;
  targetAudience: string;
  primaryCta: string;
  themeStyle: string;
  primaryColor: string;
  sections: string[];
  contactPhone?: string;
  contactEmail?: string;
  whatsappNumber?: string;
}

export interface WebsiteBriefWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (compiledPrompt: string, brief: WebsiteBrief) => void;
}

const INDUSTRIES = [
  { id: 'ecommerce', label: 'E-Commerce / Store', icon: '🛍️' },
  { id: 'saas', label: 'SaaS & Tech Platform', icon: '⚡' },
  { id: 'portfolio', label: 'Luxury Portfolio / Agency', icon: '✨' },
  { id: 'restaurant', label: 'Restaurant & Dining', icon: '🍽️' },
  { id: 'clinic', label: 'Healthcare / Dental Clinic', icon: '🏥' },
  { id: 'services', label: 'Professional Services', icon: '💼' },
  { id: 'realestate', label: 'Real Estate & Properties', icon: '🏢' },
  { id: 'education', label: 'Academy / Education', icon: '🎓' }
];

const THEME_STYLES = [
  { id: 'dark-luxe', name: 'Obsidian Luxe Dark', color: '#6366f1', desc: 'Sleek dark mode with glassmorphism & vibrant neon accents' },
  { id: 'electric-cyber', name: 'Electric Cyberpunk', color: '#06b6d4', desc: 'High-contrast cyan & purple glows for modern tech' },
  { id: 'emerald-wealth', name: 'Emerald Heritage', color: '#10b981', desc: 'Prestigious deep green & gold accents for finance/luxury' },
  { id: 'warm-amber', name: 'Warm Amber & Gold', color: '#f59e0b', desc: 'Inviting, prestigious tones for hospitality & jewelry' },
  { id: 'minimal-light', name: 'Nordic Clean Light', color: '#3b82f6', desc: 'Crisp whitespace, elegant typography & subtle borders' }
];

const AVAILABLE_SECTIONS = [
  { id: 'hero', name: 'Hero with Dynamic CTA & Badge', default: true },
  { id: 'features', name: 'Interactive Bento Features Grid', default: true },
  { id: 'pricing', name: 'Tiered Pricing & Token Calculator', default: true },
  { id: 'testimonials', name: 'Client Testimonial & Review Carousel', default: true },
  { id: 'faq', name: 'Interactive FAQ Accordion', default: true },
  { id: 'contact', name: 'Lead Capture & Booking Form', default: true },
  { id: 'whatsapp', name: 'Direct WhatsApp Commerce Float', default: true }
];

export const WebsiteBriefWizard: React.FC<WebsiteBriefWizardProps> = ({
  isOpen,
  onClose,
  onGenerate
}) => {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0].id);
  const [tagline, setTagline] = useState('');
  const [targetAudience, setTargetAudience] = useState('High-intent customers and clients seeking premium quality.');
  const [primaryCta, setPrimaryCta] = useState('Get Started Today');
  const [themeStyle, setThemeStyle] = useState(THEME_STYLES[0].id);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    AVAILABLE_SECTIONS.filter((s) => s.default).map((s) => s.id)
  );
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    const selectedTheme = THEME_STYLES.find((t) => t.id === themeStyle) || THEME_STYLES[0];
    const indObj = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[0];

    const brief: WebsiteBrief = {
      businessName: businessName.trim() || 'Nexora Project',
      industry: indObj.label,
      tagline: tagline.trim() || 'Engineered with intention, precision, and purpose.',
      targetAudience: targetAudience.trim(),
      primaryCta: primaryCta.trim(),
      themeStyle: selectedTheme.name,
      primaryColor: selectedTheme.color,
      sections: selectedSections,
      whatsappNumber: whatsappNumber.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined
    };

    const compiledPrompt = `Build a high-converting, state-of-the-art ${brief.industry} website for "${brief.businessName}".
Tagline: "${brief.tagline}".
Target Audience: ${brief.targetAudience}.
Primary Call to Action: "${brief.primaryCta}".
Visual Aesthetic: ${brief.themeStyle} (${brief.primaryColor}).
Required Key Sections: ${brief.sections.join(', ')}.
${brief.whatsappNumber ? `Direct WhatsApp Support: ${brief.whatsappNumber}.` : ''}
${brief.contactEmail ? `Contact Email: ${brief.contactEmail}.` : ''}
Ensure full responsive design, WCAG AA accessibility, rich animations, and integrated lead capture form.`;

    onGenerate(compiledPrompt, brief);
    onClose();
  };

  return (
    <div className="brief-wizard-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div className="brief-wizard-card" style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        color: '#f8fafc',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#6366f1', fontWeight: 800 }}>
              AI WEBSITE BRIEF WIZARD · STEP {step} OF 4
            </span>
            <h2 style={{ fontSize: '20px', margin: '4px 0 0', fontWeight: 800 }}>
              {step === 1 && 'Brand & Core Identity'}
              {step === 2 && 'Audience & Core Objective'}
              {step === 3 && 'Visual Aesthetic & Theme'}
              {step === 4 && 'Key Sections & Conversion Features'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Wizard Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Business or Brand Name *
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Jewels, Lumina Health, CloudScale AI"
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Industry & Business Category
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '10px',
                  marginTop: '4px'
                }}>
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => setIndustry(ind.id)}
                      style={{
                        background: industry === ind.id ? 'rgba(99, 102, 241, 0.2)' : '#1e293b',
                        border: `1px solid ${industry === ind.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '10px',
                        padding: '12px 8px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: industry === ind.id ? 700 : 500
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{ind.icon}</span>
                      <span style={{ textAlign: 'center' }}>{ind.label}</span>
                    </button>
                  ))}
                </div>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Tagline or Value Proposition
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Handcrafted bespoke luxury engineered for discerning taste."
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Target Audience & Key Demographics
                <textarea
                  rows={3}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Describe who your primary customers are..."
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none'
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Primary Call to Action (Button text)
                <input
                  type="text"
                  value={primaryCta}
                  onChange={(e) => setPrimaryCta(e.target.value)}
                  placeholder="e.g. Book a Private Consultation, Request Free Demo, Explore Catalog"
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  WhatsApp Number (Optional)
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Contact Email (Optional)
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@domain.com"
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 4px' }}>
                Select the visual atmosphere and design tokens for your website:
              </p>
              {THEME_STYLES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setThemeStyle(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: themeStyle === t.id ? 'rgba(99, 102, 241, 0.15)' : '#1e293b',
                    border: `1.5px solid ${themeStyle === t.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: t.color,
                        display: 'inline-block'
                      }} />
                      <strong style={{ fontSize: '14px' }}>{t.name}</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>{t.desc}</p>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${themeStyle === t.id ? '#6366f1' : '#64748b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: themeStyle === t.id ? '#6366f1' : 'none'
                  }}>
                    {themeStyle === t.id && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 4px' }}>
                Toggle which semantic sections should be synthesized in the build:
              </p>
              {AVAILABLE_SECTIONS.map((sec) => {
                const isSelected = selectedSections.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#1e293b',
                      border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400 }}>
                      {sec.name}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0b1120'
        }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#94a3b8',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !businessName.trim()) {
                  alert('Please enter a business name to continue.');
                  return;
                }
                setStep((s) => s + 1);
              }}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 22px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 24px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 800,
                boxShadow: '0 4px 20px rgba(99,102,241,0.5)'
              }}
            >
              ✨ Generate Bespoke Website
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
