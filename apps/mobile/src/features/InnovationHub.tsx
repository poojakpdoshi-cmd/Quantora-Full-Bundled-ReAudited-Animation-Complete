import React, { useMemo, useState } from 'react';
import { VisionUploadStudio } from './VisionUploadStudio';
import { VoicePromptMic } from './VoicePromptMic';

interface InnovationHubProps {
  apiBase: string;
  projectId?: string;
  projectTitle?: string;
  email: string;
  token: string;
  installationId: string;
  onApplyPrompt: (prompt: string) => void;
}

type BrandEvidence = {
  sourceUrl: string;
  title: string | null;
  description: string | null;
  colors: string[];
  fonts: string[];
  counts: { images: number; headings: number; links: number };
  canonical: string | null;
  observedAt: string;
  disclaimer: string;
};

export function InnovationHub({ apiBase, projectId, projectTitle = 'Current project', email, token, installationId, onApplyPrompt }: InnovationHubProps) {
  const [brandUrl, setBrandUrl] = useState('');
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [brandEvidence, setBrandEvidence] = useState<BrandEvidence | null>(null);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceProposal, setVoiceProposal] = useState<any>(null);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'X-Device-Id': installationId, 'content-type': 'application/json' }), [installationId, token]);

  async function inspectBrand() {
    if (!projectId || !brandUrl.trim()) return;
    setBrandLoading(true);
    setBrandError('');
    setBrandEvidence(null);
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/brand/inspect?email=${encodeURIComponent(email)}`, { method: 'POST', headers, body: JSON.stringify({ url: brandUrl.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Brand inspection failed.');
      setBrandEvidence(data.evidence);
    } catch (error) {
      setBrandError(error instanceof Error ? error.message : 'Brand inspection failed.');
    } finally {
      setBrandLoading(false);
    }
  }

  async function proposeVoiceEdit(command = voiceCommand) {
    if (!projectId || !command.trim()) return;
    setVoiceLoading(true);
    setVoiceError('');
    setVoiceProposal(null);
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/ai/voice-edit?email=${encodeURIComponent(email)}`, { method: 'POST', headers, body: JSON.stringify({ command: command.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Voice edit proposal failed.');
      setVoiceProposal(data.proposal);
    } catch (error) {
      setVoiceError(error instanceof Error ? error.message : 'Voice edit proposal failed.');
    } finally {
      setVoiceLoading(false);
    }
  }

  return (
    <section className="feature-studio-container" style={{ color: '#f8fafc', padding: 20 }}>
      <header style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(14,165,233,.12))', border: '1px solid rgba(129,140,248,.35)', borderRadius: 18, padding: 22, marginBottom: 18 }}>
        <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 800, letterSpacing: '.1em' }}>QUANTORA INNOVATION HUB</span>
        <h2 style={{ margin: '6px 0', fontSize: 25 }}>Create from images, voice, and brand evidence</h2>
        <p style={{ color: '#cbd5e1', margin: 0, maxWidth: 780 }}>These workflows generate reviewable proposals. Quantora does not claim that a visual reference was cloned exactly, and voice commands never publish or delete content without explicit approval.</p>
      </header>

      {!projectId && <div style={{ background: 'rgba(245,158,11,.14)', border: '1px solid rgba(245,158,11,.4)', padding: 12, borderRadius: 9, marginBottom: 16 }}>Select a project and sign in to use the authenticated AI tools.</div>}

      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          <VisionUploadStudio apiBase={apiBase} projectId={projectId} email={email} token={token} installationId={installationId} onApplyPrompt={onApplyPrompt} />
        </div>

        <article style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><span style={{ color: '#67e8f9', fontSize: 11, fontWeight: 800 }}>VOICE-COMMAND LIVE EDITING</span><h3 style={{ margin: '5px 0' }}>Describe a change, then review the operations</h3><p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Example: “Make the header darker and add a three-tier pricing section.”</p></div>
            <VoicePromptMic disabled={!projectId || voiceLoading} onTranscript={(text) => { setVoiceCommand(text); void proposeVoiceEdit(text); }} />
          </div>
          <textarea value={voiceCommand} onChange={(event) => setVoiceCommand(event.target.value)} placeholder="Type or dictate an editing command…" style={{ width: '100%', minHeight: 90, marginTop: 14, background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: 12, boxSizing: 'border-box' }} />
          <button type="button" onClick={() => void proposeVoiceEdit()} disabled={!projectId || voiceLoading || !voiceCommand.trim()} style={{ marginTop: 10, background: '#06b6d4', color: '#082f49', border: 0, borderRadius: 8, padding: '9px 13px', fontWeight: 800 }}>{voiceLoading ? 'Preparing proposal…' : 'Create reviewable edit proposal'}</button>
          {voiceError && <p style={{ color: '#fca5a5' }}>{voiceError}</p>}
          {voiceProposal && <div style={{ marginTop: 14, background: '#0f172a', borderRadius: 10, padding: 13 }}><strong>{voiceProposal.summary}</strong><div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 8 }}>{voiceProposal.operations?.map((operation: any, index: number) => <div key={`${operation.path}-${index}`}>{operation.op} <code>{operation.path}</code>{operation.value !== undefined ? ` → ${String(operation.value)}` : ''}</div>)}</div>{voiceProposal.warnings?.length ? <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 8 }}>{voiceProposal.warnings.join(' ')}</div> : null}<button type="button" onClick={() => onApplyPrompt(`Apply this reviewed edit proposal to ${projectTitle}: ${JSON.stringify(voiceProposal)}`)} style={{ marginTop: 10, background: '#6366f1', color: '#fff', border: 0, borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}>Send proposal to website editor</button></div>}
        </article>

        <article style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 18 }}>
          <span style={{ color: '#86efac', fontSize: 11, fontWeight: 800 }}>BRAND CLONE &amp; STYLE INSPECTOR</span>
          <h3 style={{ margin: '5px 0' }}>Inspect a public reference URL</h3>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Quantora reports observable page signals such as title, colors, font hints, image count, headings, links, and canonical URL. It does not scrape private Instagram data or claim ownership of another brand.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input value={brandUrl} onChange={(event) => setBrandUrl(event.target.value)} placeholder="https://example.com" style={{ flex: '1 1 300px', background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,.14)', borderRadius: 8, padding: 10 }} /><button type="button" onClick={() => void inspectBrand()} disabled={!projectId || brandLoading || !brandUrl.trim()} style={{ background: '#10b981', color: '#052e16', border: 0, borderRadius: 8, padding: '9px 13px', fontWeight: 800 }}>{brandLoading ? 'Inspecting…' : 'Inspect public page'}</button></div>
          {brandError && <p style={{ color: '#fca5a5' }}>{brandError}</p>}
          {brandEvidence && <div style={{ marginTop: 14, background: '#0f172a', borderRadius: 10, padding: 13 }}><strong>{brandEvidence.title || 'Untitled page'}</strong><div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 7 }}>Colors: {brandEvidence.colors.length ? brandEvidence.colors.join(', ') : 'None observed'}</div><div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>Font hints: {brandEvidence.fonts.length ? brandEvidence.fonts.join(', ') : 'None observed'}</div><div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>Images: {brandEvidence.counts.images} · Headings: {brandEvidence.counts.headings} · Links: {brandEvidence.counts.links}</div><div style={{ color: '#fbbf24', fontSize: 12, marginTop: 8 }}>{brandEvidence.disclaimer}</div></div>}
        </article>
      </div>
    </section>
  );
}
