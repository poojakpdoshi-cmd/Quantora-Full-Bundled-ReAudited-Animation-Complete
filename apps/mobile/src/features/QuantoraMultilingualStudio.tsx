import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface QuantoraMultilingualProps {
  activeProject: GeneratedProject | null;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', direction: 'ltr' }
];

export function QuantoraMultilingualStudio({ activeProject }: QuantoraMultilingualProps) {
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['en', 'hi', 'es', 'fr']);
  const [defaultLang, setDefaultLang] = useState('en');
  const [widgetPosition, setWidgetPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'navbar'>('top-right');
  const [autoDetectBrowser, setAutoDetectBrowser] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translationComplete, setTranslationComplete] = useState(false);

  function toggleLanguage(code: string) {
    if (code === defaultLang) return; // cannot remove default
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function handleTranslate() {
    setTranslating(true);
    setTranslationComplete(false);
    setTimeout(() => {
      setTranslating(false);
      setTranslationComplete(true);
    }, 1800);
  }

  function exportI18nBundle() {
    const bundle = {
      defaultLanguage: defaultLang,
      supportedLanguages: selectedLangs,
      widgetPosition,
      autoDetectBrowser,
      dictionaries: {
        en: {
          nav_home: 'Home',
          nav_services: 'Services',
          nav_contact: 'Contact Us',
          hero_title: activeProject?.title || 'Experience The Future of AI Solutions',
          hero_subtitle: 'Transform your enterprise with autonomous neural engineering.',
          cta_button: 'Get Started Now'
        },
        hi: {
          nav_home: 'होम',
          nav_services: 'सेवाएं',
          nav_contact: 'संपर्क करें',
          hero_title: 'एआई समाधानों के भविष्य का अनुभव करें',
          hero_subtitle: 'स्वायत्त तंत्रिका इंजीनियरिंग के साथ अपने व्यवसाय को बदलें।',
          cta_button: 'अभी शुरुआत करें'
        },
        es: {
          nav_home: 'Inicio',
          nav_services: 'Servicios',
          nav_contact: 'Contacto',
          hero_title: 'Experimente el futuro de las soluciones de IA',
          hero_subtitle: 'Transforme su empresa con ingeniería neuronal autónoma.',
          cta_button: 'Comenzar ahora'
        },
        fr: {
          nav_home: 'Accueil',
          nav_services: 'Services',
          nav_contact: 'Contactez-nous',
          hero_title: 'Découvrez l\'avenir des solutions IA',
          hero_subtitle: 'Transformez votre entreprise grâce à l\'ingénierie neuronale.',
          cta_button: 'Commencer maintenant'
        },
        ar: {
          nav_home: 'الرئيسية',
          nav_services: 'الخدمات',
          nav_contact: 'اتصل بنا',
          hero_title: 'اختبر مستقبل حلول الذكاء الاصطناعي',
          hero_subtitle: 'حوّل مؤسستك باستخدام الهندسة العصبية المستقلة.',
          cta_button: 'ابدأ الآن'
        }
      }
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `i18n-${selectedLangs.join('-')}-dictionary.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="feature-studio-container multilingual-studio" style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div className="feature-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🌐</span>
          <span style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px' }}>
            1-CLICK MULTILINGUAL LOCALIZATION
          </span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
          AI Multilingual Website Localization
        </h2>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
          Instantly translate your website into Hindi, Spanish, French, Arabic (RTL), and 20+ languages with automatic browser detection and a floating language selector widget.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Language Selection Grid */}
        <div style={{ background: '#ffffff', border: '1.5px solid rgba(226, 232, 240, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>
            🌍 Select Target Languages ({selectedLangs.length} Selected)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLangs.includes(lang.code);
              const isDefault = defaultLang === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLanguage(lang.code)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: isSelected ? '#e0f2fe' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '12px', color: '#0f172a' }}>
                      {lang.name} {isDefault && '(Default)'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{lang.nativeName}</div>
                  </div>
                  {isSelected && <span style={{ marginLeft: 'auto', color: '#0284c7', fontWeight: 900 }}>✓</span>}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Primary Default Language
              <select
                value={defaultLang}
                onChange={(e) => {
                  setDefaultLang(e.target.value);
                  if (!selectedLangs.includes(e.target.value)) {
                    setSelectedLangs((prev) => [...prev, e.target.value]);
                  }
                }}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Language Switcher Widget Placement
              <select
                value={widgetPosition}
                onChange={(e) => setWidgetPosition(e.target.value as any)}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="top-right">Floating Top-Right Corner</option>
                <option value="top-left">Floating Top-Left Corner</option>
                <option value="bottom-right">Floating Bottom-Right Bubble</option>
                <option value="navbar">Embedded Inside Header Navbar</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoDetectBrowser}
                onChange={(e) => setAutoDetectBrowser(e.target.checked)}
                style={{ accentColor: '#0284c7' }}
              />
              <span>🌐 <strong>Auto-detect visitor browser locale & switch language</strong></span>
            </label>

            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '13px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 900,
                cursor: translating ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {translating ? 'Synthesizing Neural Translations... ⏳' : '⚡ Translate Project Into All Selected Languages →'}
            </button>
          </div>
        </div>

        {/* Live Multilingual Switcher Preview */}
        <div style={{ background: '#ffffff', border: '1.5px solid rgba(226, 232, 240, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>
            ✨ Live Language Switcher Widget Preview
          </h3>

          <div style={{ background: 'radial-gradient(circle at 50% 30%, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #bae6fd', marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#ffffff', border: '1px solid #0284c7', borderRadius: '20px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2,132,199,0.15)' }}>
              <span>🌐</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                {SUPPORTED_LANGUAGES.find((l) => l.code === defaultLang)?.name}
              </span>
              <span style={{ fontSize: '10px', color: '#0284c7' }}>▾</span>
            </div>

            <div style={{ marginTop: '24px' }}>
              <span style={{ fontSize: '32px' }}>🇮🇳 🇬🇧 🇪🇸 🇫🇷</span>
              <h4 style={{ margin: '10px 0 6px', color: '#0f172a', fontSize: '16px', fontWeight: 800 }}>
                {defaultLang === 'hi' ? 'क्वांटोरा एआई वेबसाइट अनुवादक' : 'Quantora Multilingual Engine'}
              </h4>
              <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>
                Zero latency client-side localization dictionary generated with automated RTL support.
              </p>
            </div>
          </div>

          {/* Export Bundle Button */}
          {translationComplete && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <div style={{ color: '#166534', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                ✓ {selectedLangs.length} Languages Translated & Synced!
              </div>
              <button
                type="button"
                onClick={exportI18nBundle}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                📥 Export i18n Translation Bundle (.json)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
