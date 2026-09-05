import React, { useMemo, useState } from 'react';

interface GrowthToolsHubProps {
  apiBase: string;
  projectId?: string;
  email: string;
  token: string;
  installationId: string;
}

export function GrowthToolsHub({ apiBase, projectId, email, token, installationId }: GrowthToolsHubProps) {
  const [active, setActive] = useState<'commerce' | 'booking' | 'chatbot' | 'social' | 'experiments' | 'pwa' | 'localization' | 'cro'>('commerce');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalog, setCatalog] = useState({ merchantWhatsapp: '', currencySymbol: '$', items: [{ id: 'item-1', name: '', priceLabel: '', description: '', active: true }] });
  const [booking, setBooking] = useState({ timezone: 'UTC', durationMinutes: 30, availability: { monday: ['09:00-17:00'] }, calendarEnabled: false });
  const [chatbot, setChatbot] = useState({ enabled: false, name: 'Website Assistant', greeting: 'How can I help?', humanHandoff: true });
  const [socialContent, setSocialContent] = useState('');
  const [socialChannels, setSocialChannels] = useState<string[]>(['instagram', 'linkedin', 'x']);
  const [campaign, setCampaign] = useState<any>(null);
  const [experiment, setExperiment] = useState({ name: 'Homepage CTA experiment', variantA: 'Get started', variantB: 'Request a quote' });
  const [pwa, setPwa] = useState({ name: 'My Website', shortName: 'Website', themeColor: '#0f172a', backgroundColor: '#0f172a', icons: [] as unknown[] });
  const [locale, setLocale] = useState<'hi' | 'ar' | 'es' | 'de' | 'fr'>('hi');
  const [translationInput, setTranslationInput] = useState('{"headline":"Welcome","cta":"Contact us"}');
  const [translation, setTranslation] = useState<any>(null);
  const [croHtml, setCroHtml] = useState('');
  const [cro, setCro] = useState<any>(null);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'X-Device-Id': installationId, 'content-type': 'application/json' }), [installationId, token]);

  async function request(path: string, init: RequestInit = {}) {
    if (!projectId) throw new Error('Select a project first.');
    const response = await fetch(`${apiBase}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Feature request failed.');
    return data;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Feature request failed.'); } finally { setBusy(false); }
  }

  async function saveCatalog() {
    const validItems = catalog.items.filter(item => item.name.trim()).map(item => ({ ...item, name: item.name.trim() }));
    const data = await request(`/projects/${projectId}/commerce/catalog?email=${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify({ ...catalog, items: validItems }) });
    setCatalog({ ...catalog, items: data.catalog.items }); setMessage('Payment-free WhatsApp catalogue saved.');
  }

  async function saveBooking() {
    await request(`/projects/${projectId}/booking/config?email=${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify(booking) });
    setMessage('Booking configuration saved. Google Calendar remains disabled until its OAuth connection is configured.');
  }

  async function saveChatbot() {
    await request(`/projects/${projectId}/features/chatbot?email=${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify({ config: chatbot }) });
    setMessage('Chatbot configuration saved. The public widget answers from published CMS content only.');
  }

  async function generateCampaign() {
    const data = await request(`/projects/${projectId}/social/campaign?email=${encodeURIComponent(email)}`, { method: 'POST', body: JSON.stringify({ content: socialContent, channels: socialChannels }) });
    setCampaign(data.campaign); setMessage('Reviewable social campaign generated; nothing was published.');
  }

  async function createExperiment() {
    const data = await request(`/projects/${projectId}/experiments?email=${encodeURIComponent(email)}`, { method: 'POST', body: JSON.stringify({ name: experiment.name, variants: [{ key: 'a', label: experiment.variantA, changes: { cta: experiment.variantA } }, { key: 'b', label: experiment.variantB, changes: { cta: experiment.variantB } }], minimumObservations: 100 }) });
    setMessage(`Experiment ${data.experiment.id} created as a draft. It will not auto-publish a winner.`);
  }

  async function savePwa() {
    await request(`/projects/${projectId}/features/pwa?email=${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify({ config: pwa }) });
    setMessage('PWA settings saved. The published site must use HTTPS for installation.');
  }

  async function translate() {
    let content: Record<string, string>;
    try { content = JSON.parse(translationInput); } catch { throw new Error('Enter a valid JSON object of strings.'); }
    const data = await request(`/projects/${projectId}/localization/translate?email=${encodeURIComponent(email)}`, { method: 'POST', body: JSON.stringify({ locale, content }) });
    setTranslation(data); setMessage(`Translation proposal generated with ${data.direction.toUpperCase()} direction. Review before saving.`);
  }

  async function analyzeCro() {
    const data = await request(`/projects/${projectId}/cro/analyze?email=${encodeURIComponent(email)}`, { method: 'POST', body: JSON.stringify({ html: croHtml }) });
    setCro(data); setMessage('CRO analysis completed from supplied evidence; no visitor behavior was fabricated.');
  }

  const tabs: Array<[typeof active, string]> = [['commerce', 'WhatsApp enquiries'], ['booking', 'Booking'], ['chatbot', 'AI chatbot'], ['social', 'Social campaigns'], ['experiments', 'A/B experiments'], ['pwa', 'PWA'], ['localization', 'Localization'], ['cro', 'CRO evidence']];
  return (
    <section className="feature-studio-container" style={{ color: '#f8fafc', padding: 20 }}>
      <header style={{ background: 'linear-gradient(135deg, rgba(16,185,129,.16), rgba(99,102,241,.15))', border: '1px solid rgba(129,140,248,.35)', borderRadius: 18, padding: 22, marginBottom: 16 }}><span style={{ color: '#a7f3d0', fontSize: 11, fontWeight: 800, letterSpacing: '.1em' }}>GROWTH &amp; PLATFORM TOOLS</span><h2 style={{ margin: '6px 0' }}>Build useful business workflows without online payments</h2><p style={{ color: '#cbd5e1', margin: 0 }}>WhatsApp handles payment-free enquiries. Token allocation remains manual and admin-controlled. AI, publishing, localization, and CRO outputs remain reviewable before they affect a live site.</p></header>
      {!projectId && <div style={{ background: 'rgba(245,158,11,.14)', border: '1px solid rgba(245,158,11,.4)', padding: 12, borderRadius: 9, marginBottom: 12 }}>Select a project and sign in to configure these tools.</div>}
      <nav style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 16 }}>{tabs.map(([id, label]) => <button type="button" key={id} onClick={() => setActive(id)} style={{ background: active === id ? '#6366f1' : '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 11px', whiteSpace: 'nowrap' }}>{label}</button>)}</nav>
      {error && <div style={{ background: 'rgba(239,68,68,.14)', border: '1px solid rgba(239,68,68,.4)', padding: 11, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {message && <div style={{ background: 'rgba(16,185,129,.14)', border: '1px solid rgba(16,185,129,.4)', padding: 11, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
      <article style={{ background: '#1e293b', padding: 18, borderRadius: 14, border: '1px solid rgba(255,255,255,.1)' }}>
        {active === 'commerce' && <div><h3>Payment-free WhatsApp catalogue</h3><p style={{ color: '#94a3b8' }}>Save products or services and generate enquiry messages. No online checkout or payment collection is available.</p><label>Merchant WhatsApp<input value={catalog.merchantWhatsapp} onChange={e => setCatalog({ ...catalog, merchantWhatsapp: e.target.value })} placeholder="+91…" /></label><label>Display currency symbol<input value={catalog.currencySymbol} onChange={e => setCatalog({ ...catalog, currencySymbol: e.target.value })} /></label>{catalog.items.map((item, index) => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8, marginTop: 8 }}><input value={item.name} onChange={e => setCatalog({ ...catalog, items: catalog.items.map((current, i) => i === index ? { ...current, name: e.target.value } : current) })} placeholder="Product or service" /><input value={item.priceLabel} onChange={e => setCatalog({ ...catalog, items: catalog.items.map((current, i) => i === index ? { ...current, priceLabel: e.target.value } : current) })} placeholder="Listed price" /><input value={item.description} onChange={e => setCatalog({ ...catalog, items: catalog.items.map((current, i) => i === index ? { ...current, description: e.target.value } : current) })} placeholder="Description" /></div>)}<button type="button" onClick={() => setCatalog({ ...catalog, items: [...catalog.items, { id: `item-${Date.now()}`, name: '', priceLabel: '', description: '', active: true }] })}>Add item</button><button type="button" disabled={busy || !projectId} onClick={() => void run(saveCatalog)}>Save catalogue</button></div>}
        {active === 'booking' && <div><h3>Appointment and table booking</h3><p style={{ color: '#94a3b8' }}>Requests are stored for manual confirmation. Google Calendar events are optional and require a separate OAuth connection.</p><label>Timezone<input value={booking.timezone} onChange={e => setBooking({ ...booking, timezone: e.target.value })} /></label><label>Duration in minutes<input type="number" min="5" max="480" value={booking.durationMinutes} onChange={e => setBooking({ ...booking, durationMinutes: Number(e.target.value) })} /></label><label><input type="checkbox" checked={booking.calendarEnabled} onChange={e => setBooking({ ...booking, calendarEnabled: e.target.checked })} /> Enable calendar integration when connected</label><button type="button" disabled={busy || !projectId} onClick={() => void run(saveBooking)}>Save booking settings</button></div>}
        {active === 'chatbot' && <div><h3>Embedded AI customer-support chatbot</h3><p style={{ color: '#94a3b8' }}>The public assistant uses published CMS documents and answers “I don’t know” when the answer is absent.</p><label><input type="checkbox" checked={chatbot.enabled} onChange={e => setChatbot({ ...chatbot, enabled: e.target.checked })} /> Enable widget</label><label>Bot name<input value={chatbot.name} onChange={e => setChatbot({ ...chatbot, name: e.target.value })} /></label><label>Greeting<input value={chatbot.greeting} onChange={e => setChatbot({ ...chatbot, greeting: e.target.value })} /></label><button type="button" disabled={busy || !projectId} onClick={() => void run(saveChatbot)}>Save chatbot configuration</button></div>}
        {active === 'social' && <div><h3>AI social campaign generator</h3><p style={{ color: '#94a3b8' }}>Generate reviewable copy; no social account is connected and nothing is auto-published.</p><textarea value={socialContent} onChange={e => setSocialContent(e.target.value)} placeholder="Paste the published post or product content…" /><div>{(['instagram', 'linkedin', 'x'] as const).map(channel => <label key={channel}><input type="checkbox" checked={socialChannels.includes(channel)} onChange={e => setSocialChannels(e.target.checked ? [...socialChannels, channel] : socialChannels.filter(value => value !== channel))} /> {channel}</label>)}</div><button type="button" disabled={busy || !projectId || !socialContent.trim()} onClick={() => void run(generateCampaign)}>Generate campaign</button>{campaign && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{JSON.stringify(campaign, null, 2)}</pre>}</div>}
        {active === 'experiments' && <div><h3>Controlled A/B experiments</h3><p style={{ color: '#94a3b8' }}>Experiments start as drafts. Quantora records anonymized assignment/conversion events and does not auto-publish a winner.</p><label>Experiment name<input value={experiment.name} onChange={e => setExperiment({ ...experiment, name: e.target.value })} /></label><label>Variant A<input value={experiment.variantA} onChange={e => setExperiment({ ...experiment, variantA: e.target.value })} /></label><label>Variant B<input value={experiment.variantB} onChange={e => setExperiment({ ...experiment, variantB: e.target.value })} /></label><button type="button" disabled={busy || !projectId} onClick={() => void run(createExperiment)}>Create draft experiment</button></div>}
        {active === 'pwa' && <div><h3>One-click PWA settings</h3><p style={{ color: '#94a3b8' }}>This generates install metadata. HTTPS and valid icon assets are required for browser installation.</p><label>App name<input value={pwa.name} onChange={e => setPwa({ ...pwa, name: e.target.value })} /></label><label>Short name<input value={pwa.shortName} onChange={e => setPwa({ ...pwa, shortName: e.target.value })} /></label><label>Theme color<input type="color" value={pwa.themeColor} onChange={e => setPwa({ ...pwa, themeColor: e.target.value })} /></label><button type="button" disabled={busy || !projectId} onClick={() => void run(savePwa)}>Save PWA settings</button></div>}
        {active === 'localization' && <div><h3>Multilingual and RTL localization</h3><p style={{ color: '#94a3b8' }}>Submit a JSON map of strings. Arabic responses are marked RTL. Review translations before publishing.</p><select value={locale} onChange={e => setLocale(e.target.value as typeof locale)}><option value="hi">Hindi</option><option value="ar">Arabic (RTL)</option><option value="es">Spanish</option><option value="de">German</option><option value="fr">French</option></select><textarea value={translationInput} onChange={e => setTranslationInput(e.target.value)} /><button type="button" disabled={busy || !projectId} onClick={() => void run(translate)}>Generate translation proposal</button>{translation && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{JSON.stringify(translation, null, 2)}</pre>}</div>}
        {active === 'cro' && <div><h3>Evidence-based CRO analysis</h3><p style={{ color: '#94a3b8' }}>Paste generated HTML to inspect headline, CTA, trust, form, responsive, and image-alt evidence. This is not a predictive guarantee.</p><textarea value={croHtml} onChange={e => setCroHtml(e.target.value)} placeholder="Paste a page HTML snapshot…" /><button type="button" disabled={busy || !projectId} onClick={() => void run(analyzeCro)}>Analyze evidence</button>{cro && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{JSON.stringify(cro, null, 2)}</pre>}</div>}
      </article>
    </section>
  );
}
