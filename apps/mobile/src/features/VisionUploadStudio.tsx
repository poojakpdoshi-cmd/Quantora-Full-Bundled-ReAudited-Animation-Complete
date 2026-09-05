import React, { useState, useRef } from 'react';

interface VisionUploadProps {
  onApplyPrompt: (prompt: string) => void;
  apiBase?: string;
  projectId?: string;
  email?: string;
  token?: string;
  installationId?: string;
}

export const VisionUploadStudio: React.FC<VisionUploadProps> = ({ onApplyPrompt, apiBase = '', projectId = '', email = '', token = '', installationId = '' }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{
    industry: string;
    layout: string;
    primaryColor: string;
    accentColor: string;
    sections: string[];
    suggestedPrompt: string;
  } | null>(null);

  const presets = [
    {
      title: '💎 Luxury Boutique',
      industry: 'Ultra-Luxury Jewelry & Watches',
      layout: 'Cinematic Full-Bleed with Specular Glass Cards',
      primary: '#0284c7 (Ocean Sapphire)',
      accent: '#38bdf8 (Ice Blue)',
      prompt: 'Build a luxury boutique website for royal jewelry and Swiss timepieces with frosted liquid glass styling, payment-free WhatsApp order enquiries, high-contrast typography, and a technically sound SEO foundation without promising rankings or a fixed score.'
    },
    {
      title: '⚡ SaaS Bento Matrix',
      industry: 'AI Telemetry & Cloud Architecture',
      layout: 'Bento Grid with Interactive Metrics',
      primary: '#6366f1 (Electric Indigo)',
      accent: '#a855f7 (Purple Glow)',
      prompt: 'Build a modern high-tech SaaS analytics platform with dark obsidian background, glowing bento matrix cards, a payment-free contact workflow, and live PostgreSQL lead intake.'
    },
    {
      title: '🍽️ Michelin Dining',
      industry: 'Fine Dining & Hospitality',
      layout: 'Editorial Minimalist with Reservation Engine',
      primary: '#059669 (Emerald Green)',
      accent: '#34d399 (Mint Glow)',
      prompt: 'Build an elegant Michelin-star restaurant website with interactive tasting menu, chef story, customer reviews, and direct WhatsApp table booking.'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage({ name: file.name, dataUrl });
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysis = async () => {
    if (!uploadedImage || !apiBase || !projectId || !email || !token || !installationId) return;
    setAnalyzing(true);
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/ai/vision-layout?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-Device-Id': installationId, 'content-type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: uploadedImage.dataUrl })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Vision analysis failed.');
      const proposal = data.proposal || {};
      const sections = Array.isArray(proposal.sections) ? proposal.sections.map((section: any) => typeof section === 'string' ? section : `${section.name || 'Section'} — ${section.purpose || section.layout || ''}`) : [];
      setAnalysisResult({
        industry: String(proposal.brief || 'Observed visual layout'),
        layout: sections[0] || 'Responsive layout proposal',
        primaryColor: Array.isArray(proposal.designTokens?.colors) ? String(proposal.designTokens.colors[0] || 'Not detected') : 'See design tokens',
        accentColor: Array.isArray(proposal.designTokens?.colors) ? String(proposal.designTokens.colors[1] || 'Not detected') : 'See design tokens',
        sections,
        suggestedPrompt: `Implement this reviewed layout proposal for the current project: ${JSON.stringify(proposal)}`
      });
    } catch (error) {
      setAnalysisResult(null);
      window.alert(error instanceof Error ? error.message : 'Vision analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="feature-studio-panel" style={{ padding: '24px 16px' }}>
      <div className="feature-studio-header" style={{ marginBottom: '20px' }}>
        <span className="feature-tag" style={{ background: '#e0f2fe', color: '#0284c7', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
          MULTIMODAL VISION AI CLONE
        </span>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>
          Screenshot to Live React Website
        </h2>
        <p className="feature-description" style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Upload any screenshot, wireframe, napkin sketch, or competitor website photo. Syntropix Vision AI will reverse-engineer the visual hierarchy and synthesize clean, 100% original full-stack React code.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Drag & Drop Dropzone */}
      <div
        style={{
          border: '2px dashed #38bdf8',
          borderRadius: '20px',
          padding: '30px 20px',
          textAlign: 'center',
          background: 'rgba(2, 132, 199, 0.04)',
          marginBottom: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadedImage ? (
          <div>
            <img
              src={uploadedImage.dataUrl}
              alt="Uploaded mockup"
              style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginBottom: '10px' }}
            />
            <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#0284c7' }}>📎 {uploadedImage.name}</p>
            <small style={{ color: '#64748b' }}>Click to replace image</small>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>📸</div>
            <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '18px' }}>
              Tap to Upload Screenshot / Design Mockup
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Supports PNG, JPG, WebP wireframes, UI mockups, and camera photos
            </p>
          </div>
        )}

        <button
          type="button"
          className="nx-button nx-button--primary"
          style={{ marginTop: '16px', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
          disabled={analyzing}
          onClick={(e) => {
            e.stopPropagation();
            if (uploadedImage) void triggerAnalysis();
            else fileInputRef.current?.click();
          }}
        >
          {analyzing ? '🔍 Vision AI Analyzing Layout & Visual Genome…' : uploadedImage ? '⚡ Re-Analyze Screenshot' : '📁 Browse Files or Open Camera'}
        </button>
      </div>

      {/* Quick Archetype Reference Presets */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
          Or Pick a Reference Visual Archetype:
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {presets.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1.5px solid rgba(0,0,0,0.08)',
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              onClick={() => {
                setAnalysisResult({
                  industry: p.industry,
                  layout: p.layout,
                  primaryColor: p.primary,
                  accentColor: p.accent,
                  sections: [
                    'High-Impact Hero Section',
                    'Product / Portfolio Showcase Matrix',
                    'Payment-Free WhatsApp Order Enquiries',
                    'Google Search Console SEO Schema'
                  ],
                  suggestedPrompt: p.prompt
                });
              }}
            >
              <strong style={{ color: '#0f172a', display: 'block', fontSize: '14px', marginBottom: '4px' }}>{p.title}</strong>
              <small style={{ color: '#64748b', fontSize: '12px' }}>{p.industry}</small>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Result Card */}
      {analysisResult && (
        <div
          style={{
            background: '#ffffff',
            border: '2px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#0284c7', fontSize: '18px', fontWeight: 800 }}>✨ Vision Reverse-Engineering Complete</h4>
            <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
              100% ORIGINAL CLEAN CODE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <small style={{ color: '#64748b', display: 'block' }}>Detected Industry</small>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>{analysisResult.industry}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <small style={{ color: '#64748b', display: 'block' }}>Layout Architecture</small>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>{analysisResult.layout}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <small style={{ color: '#64748b', display: 'block' }}>Primary Palette</small>
              <strong style={{ color: '#0284c7', fontSize: '13px' }}>{analysisResult.primaryColor}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <small style={{ color: '#64748b', display: 'block' }}>Accent Palette</small>
              <strong style={{ color: '#38bdf8', fontSize: '13px' }}>{analysisResult.accentColor}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong style={{ fontSize: '13px', color: '#334155' }}>Detected Component Tree:</strong>
            <ul style={{ margin: '6px 0 0 16px', padding: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
              {analysisResult.sections.map((sec, idx) => (
                <li key={idx}>✓ {sec}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="nx-button nx-button--primary"
            style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7, #2563eb)', padding: '14px', fontSize: '15px', fontWeight: 800, borderRadius: '14px' }}
            onClick={() => {
              onApplyPrompt(analysisResult.suggestedPrompt);
            }}
          >
            🚀 Clone &amp; Generate Full-Stack Website Now
          </button>
        </div>
      )}
    </section>
  );
};
