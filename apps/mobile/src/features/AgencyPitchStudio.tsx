import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface AgencyPitchProps {
  projects: GeneratedProject[];
  activeProject: GeneratedProject | null;
  onSelectProject: (proj: GeneratedProject) => void;
}

export function AgencyPitchStudio({ projects, activeProject, onSelectProject }: AgencyPitchProps) {
  const [clientName, setClientName] = useState('Dr. Sharma Dental Clinic');
  const [clientPhone, setClientPhone] = useState('+91 98765 43210');
  const [dealAmount, setDealAmount] = useState('18,500');
  const [currency, setCurrency] = useState('₹');
  const [timeline, setTimeline] = useState('48 Hours');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProject?.id || projects[0]?.id || '');
  const [copied, setCopied] = useState('');
  const [previewMode, setPreviewMode] = useState<'script' | 'invoice'>('script');

  const selectedProj = projects.find(p => p.id === selectedProjectId) || activeProject || projects[0];

  const previewUrl = selectedProj?.previewUrl || 'Preview available inside Quantora; no public URL has been configured.';

  const pitchScript = `Hi ${clientName.trim() || 'Sir/Madam'},

I prepared a website concept for your business with a clearer digital presence and conversion-focused structure.

I built a custom live website preview specifically for your brand:
🔗 Live Preview: ${previewUrl}

What's Included:
✅ Responsive mobile and tablet layout
✅ Payment-free WhatsApp order or booking enquiry
✅ SEO preparation and measurable audit recommendations (no ranking guarantee)
✅ Contact forms with backend lead handling configured separately
✅ Custom Domain & SSL Security

💰 Package Investment: ${currency}${dealAmount} (One-Time Setup)
⚡ Delivery Timeline: ${timeline}

Let me know if you would like me to link your official domain and go live!

Best regards,
Quantora Agency Partner`;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 3000);
  }

  function openWhatsApp() {
    const cleanNumber = clientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(pitchScript);
    const url = cleanNumber.length > 5 
      ? `https://wa.me/${cleanNumber}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div className="feature-studio-container agency-pitch-studio">
      <div className="feature-header">
        <span className="feature-badge">💼 AGENCY MONETIZATION SUITE</span>
        <h2>1-Click Client Pitch & Proposal Studio</h2>
        <p className="feature-subtitle">
          Turn your generated websites into high-paying client deals. Generate tailored WhatsApp pitch scripts, live demos, and instant quotations in 10 seconds.
        </p>
      </div>

      <div className="agency-grid">
        <div className="agency-input-card">
          <h3>Deal & Client Parameters</h3>

          <label className="input-group">
            <span>Select Target Website Project</span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                const proj = projects.find(p => p.id === e.target.value);
                if (proj) onSelectProject(proj);
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.id} ({p.version ? `v${p.version}` : 'Latest'})
                </option>
              ))}
              {projects.length === 0 && <option value="">No projects yet (Using Demo)</option>}
            </select>
          </label>

          <div className="input-row">
            <label className="input-group">
              <span>Client Business Name</span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Luxury Gym"
              />
            </label>

            <label className="input-group">
              <span>Client WhatsApp Number</span>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </label>
          </div>

          <div className="input-row">
            <label className="input-group">
              <span>Quotation Amount</span>
              <div className="amount-input-wrap">
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ width: '45px', textAlign: 'center' }}
                />
                <input
                  type="text"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  placeholder="15,000"
                />
              </div>
            </label>

            <label className="input-group">
              <span>Delivery Timeline</span>
              <input
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="24 - 48 Hours"
              />
            </label>
          </div>

          <div className="action-buttons-group">
            <button
              type="button"
              className="nx-button nx-button--primary whatsapp-pitch-btn"
              onClick={openWhatsApp}
            >
              🚀 Send Pitch on WhatsApp
            </button>
            <button
              type="button"
              className="nx-button nx-button--secondary"
              onClick={() => copyToClipboard(pitchScript, 'pitch')}
            >
              {copied === 'pitch' ? '✓ Copied Script!' : '📋 Copy Pitch Script'}
            </button>
          </div>
        </div>

        <div className="agency-preview-card">
          <div className="preview-tabs">
            <button
              type="button"
              className={previewMode === 'script' ? 'active' : ''}
              onClick={() => setPreviewMode('script')}
            >
              📱 WhatsApp Pitch Preview
            </button>
            <button
              type="button"
              className={previewMode === 'invoice' ? 'active' : ''}
              onClick={() => setPreviewMode('invoice')}
            >
              📄 Instant Quotation Invoice
            </button>
          </div>

          {previewMode === 'script' ? (
            <div className="script-preview-box">
              <pre>{pitchScript}</pre>
            </div>
          ) : (
            <div className="invoice-preview-box printable-invoice">
              <div className="invoice-header">
                <div>
                  <h4>PROPOSAL & QUOTATION</h4>
                  <p className="invoice-number">REF: SYN-{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
                <div className="invoice-brand">
                  <strong>Syntropix.ai Partner Studio</strong>
                  <span>Web Architecture & Deployment</span>
                </div>
              </div>

              <div className="invoice-parties">
                <div>
                  <small>PREPARED FOR:</small>
                  <strong>{clientName}</strong>
                  <span>{clientPhone}</span>
                </div>
                <div>
                  <small>ESTIMATED DELIVERY:</small>
                  <strong>{timeline}</strong>
                  <span>Draft proposal · verify before launch</span>
                </div>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Deliverable Feature</th>
                    <th>Specification</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Custom Web Architecture</td>
                    <td>Vite + React + Tailwind Responsive Layout</td>
                    <td style={{ textAlign: 'right' }}>Included</td>
                  </tr>
                  <tr>
                    <td>Payment-free WhatsApp Enquiries</td>
                    <td>Direct order or booking enquiry routing</td>
                    <td style={{ textAlign: 'right' }}>Included</td>
                  </tr>
                  <tr>
                    <td>SEO Foundations</td>
                    <td>Schema, sitemap and OpenGraph preparation; verify live results</td>
                    <td style={{ textAlign: 'right' }}>Included</td>
                  </tr>
                  <tr>
                    <td>Lead Capture Integration</td>
                    <td>Form submission handling when the selected backend is configured</td>
                    <td style={{ textAlign: 'right' }}>Included</td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-total">
                <span>Total Investment:</span>
                <strong>{currency}{dealAmount}</strong>
              </div>

              <button
                type="button"
                className="nx-button nx-button--compact print-invoice-btn"
                onClick={printInvoice}
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
