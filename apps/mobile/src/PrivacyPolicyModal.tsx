import React from 'react';

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        animation: 'privacyFadeIn 0.2s ease-out'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '2px solid rgba(255, 255, 255, 0.98)',
          borderRadius: '28px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25), 0 8px 24px rgba(0, 0, 0, 0.08), inset 0 2px 6px #ffffff',
          overflow: 'hidden',
          animation: 'privacyScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(2, 132, 199, 0.12)',
            flexShrink: 0
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 850, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '2px' }}>
              💎 QUANTORA • LEGAL & TRUST
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Privacy & Security Policy
            </h2>
            <small style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 600 }}>
              Official Authority: quantoraby.quantacy@gmail.com • Powered by Quantacy AI
            </small>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              color: '#0f172a',
              fontSize: '15px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            aria-label="Close Privacy Policy"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: '20px 24px 30px',
            overflowY: 'auto',
            flex: 1,
            fontSize: '13.5px',
            color: '#334155',
            lineHeight: '1.65'
          }}
        >
          <div style={{ background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(2, 132, 199, 0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '12.5px', fontWeight: 600 }}>
              🛡️ <strong>Our Commitment to You:</strong> Quantora (powered by Quantacy AI) is engineered with zero-compromise privacy protocols. We do not sell your personal data, train public frontier models on your private codebases, or inspect your private credentials.
            </p>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>
            1. Account Verification & OTP Policy
          </h3>
          <p style={{ margin: '0 0 12px' }}>
            To authenticate your workspace without storing vulnerable plaintext passwords, Quantora utilizes time-sensitive 6-digit cryptographic verification codes. Official verification emails are dispatched exclusively from <strong>quantoraby.quantacy@gmail.com</strong>.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '18px', marginBottom: '6px' }}>
            2. Codebase & Intellectual Property Ownership
          </h3>
          <p style={{ margin: '0 0 12px' }}>
            <strong>You own 100% of your created websites, layouts, graphics, scripts, and databases.</strong> Quantora acts strictly as an autonomous compiler and development environment. You may export, deploy, monetize, and transfer your full-stack source code at any time without licensing restrictions.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '18px', marginBottom: '6px' }}>
            3. Zero Secret Leakage & Sandboxing
          </h3>
          <p style={{ margin: '0 0 12px' }}>
            All terminal execution, package installations, and AI synthesis occur inside isolated memory sandboxes. API keys, database URLs, and environment variables are encrypted at rest using AES-GCM-256 and are never exposed in public logs.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '18px', marginBottom: '6px' }}>
            4. Data Retention & Workspace Deletion
          </h3>
          <p style={{ margin: '0 0 12px' }}>
            You have the absolute right to purge your conversation history, project vaults, and generated assets at any moment from the Settings or Admin Room. Purging immediately wipes records from active storage.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '18px', marginBottom: '6px' }}>
            5. Contact & Trust Officer
          </h3>
          <p style={{ margin: '0 0 16px' }}>
            If you have questions regarding our privacy architecture or security compliance, contact our official engineering desk at:
            <br />
            <strong>Official Support:</strong> <a href="mailto:quantoraby.quantacy@gmail.com" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>quantoraby.quantacy@gmail.com</a>
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(2, 132, 199, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.7)',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            © {new Date().getFullYear()} Quantora by Quantacy AI. All rights reserved.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
