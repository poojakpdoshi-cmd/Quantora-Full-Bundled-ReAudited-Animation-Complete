import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface SeoMonitoringDashboardProps {
  apiBase: string;
  projectId?: string;
  projectTitle?: string;
  productionUrl?: string;
  email: string;
  token: string;
  installationId: string;
}

type AuditIssue = {
  id?: string;
  severity?: string;
  category?: string;
  title?: string;
  description?: string;
  explanation?: string;
  remediation?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
};

type AuditResponse = {
  projectId: string;
  versionNumber: number;
  primaryDomain?: string | null;
  audit?: {
    overallScore?: number;
    technicalScore?: number;
    contentScore?: number;
    issues?: AuditIssue[];
    [key: string]: unknown;
  };
};

type CrawlResponse = {
  ok: boolean;
  checkedAt: string;
  url: string;
  status: number;
  finalUrl?: string;
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  robots?: { reachable: boolean; status: number | null };
  sitemap?: { reachable: boolean; status: number | null };
  issues?: string[];
};

type SearchConsoleStatus = {
  connected: boolean;
  status: string;
  selectedProperty: string | null;
  scopes: string[];
};

type SearchConsoleProperty = {
  siteUrl: string;
  permissionLevel: string;
};

type SearchConsoleQueryResponse = {
  siteUrl: string;
  startDate: string;
  endDate: string;
  rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
};

type SearchConsoleSitemap = {
  path?: string;
  isPending?: boolean;
  lastSubmitted?: string;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
};

type Tab = 'overview' | 'technical' | 'crawler' | 'opportunities' | 'reports';

export function SeoMonitoringDashboard({
  apiBase,
  projectId,
  projectTitle = 'Website',
  productionUrl = '',
  email,
  token,
  installationId
}: SeoMonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [crawl, setCrawl] = useState<CrawlResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [searchConsoleStatus, setSearchConsoleStatus] = useState<SearchConsoleStatus | null>(null);
  const [searchConsoleProperties, setSearchConsoleProperties] = useState<SearchConsoleProperty[]>([]);
  const [searchConsoleRows, setSearchConsoleRows] = useState<SearchConsoleQueryResponse['rows']>([]);
  const [searchConsoleSitemaps, setSearchConsoleSitemaps] = useState<SearchConsoleSitemap[]>([]);
  const [searchConsoleLoading, setSearchConsoleLoading] = useState(false);
  const [searchConsoleAction, setSearchConsoleAction] = useState(false);
  const [searchConsoleError, setSearchConsoleError] = useState('');
  const [searchConsoleStartDate, setSearchConsoleStartDate] = useState(() => new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10));
  const [searchConsoleEndDate, setSearchConsoleEndDate] = useState(() => new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10));
  const [inspectionUrl, setInspectionUrl] = useState(productionUrl);
  const [inspectionResult, setInspectionResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'X-Device-Id': installationId,
    'content-type': 'application/json'
  }), [token, installationId]);
  const endpointBase = projectId ? `${apiBase}/projects/${projectId}` : '';
  const issues = Array.isArray(audit?.audit?.issues) ? audit.audit.issues : [];
  const openIssues = issues.filter(issue => String(issue.severity || '').toLowerCase() !== 'good');

  const loadSearchConsoleStatus = useCallback(async () => {
    if (!projectId || !email || !token) return;
    setSearchConsoleError('');
    try {
      const response = await fetch(`${endpointBase}/search-console/status?email=${encodeURIComponent(email)}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not read Search Console status.');
      setSearchConsoleStatus(data as SearchConsoleStatus);
    } catch (statusError) {
      setSearchConsoleError(statusError instanceof Error ? statusError.message : 'Could not read Search Console status.');
    }
  }, [email, endpointBase, headers, projectId, token]);

  useEffect(() => {
    void loadSearchConsoleStatus();
  }, [loadSearchConsoleStatus]);

  useEffect(() => {
    setInspectionUrl(productionUrl);
    setInspectionResult(null);
  }, [productionUrl]);

  async function connectSearchConsole() {
    if (!projectId) return;
    const popup = window.open('about:blank', '_blank');
    setSearchConsoleAction(true);
    setSearchConsoleError('');
    try {
      const response = await fetch(`${endpointBase}/search-console/connect?email=${encodeURIComponent(email)}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not start Google authorization.');
      if (popup) {
        popup.location.href = String(data.authorizationUrl);
        setMessage('Google authorization opened in a new tab. Approve access, then refresh the connection status here.');
      } else {
        setMessage('Your browser blocked the Google authorization tab. Allow popups and try again.');
      }
    } catch (connectError) {
      if (popup && !popup.closed) popup.close();
      setSearchConsoleError(connectError instanceof Error ? connectError.message : 'Could not start Google authorization.');
    } finally {
      setSearchConsoleAction(false);
    }
  }

  async function loadSearchConsoleProperties() {
    if (!projectId) return;
    setSearchConsoleLoading(true);
    setSearchConsoleError('');
    try {
      const response = await fetch(`${endpointBase}/search-console/properties?email=${encodeURIComponent(email)}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load Search Console properties.');
      setSearchConsoleProperties(Array.isArray(data.properties) ? data.properties as SearchConsoleProperty[] : []);
      setSearchConsoleStatus(current => current ? { ...current, selectedProperty: data.selectedProperty || current.selectedProperty } : current);
    } catch (propertyError) {
      setSearchConsoleError(propertyError instanceof Error ? propertyError.message : 'Could not load Search Console properties.');
    } finally {
      setSearchConsoleLoading(false);
    }
  }

  async function selectSearchConsoleProperty(siteUrl: string) {
    if (!projectId) return;
    setSearchConsoleAction(true);
    setSearchConsoleError('');
    try {
      const response = await fetch(`${endpointBase}/search-console/property`, { method: 'PUT', headers, body: JSON.stringify({ email, installationId, siteUrl }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not select the Search Console property.');
      setSearchConsoleStatus(current => current ? { ...current, selectedProperty: data.selectedProperty || siteUrl } : { connected: true, status: 'connected', selectedProperty: data.selectedProperty || siteUrl, scopes: [] });
      setMessage(`Search Console property selected: ${data.selectedProperty || siteUrl}`);
      await loadSearchConsoleSitemaps();
    } catch (propertyError) {
      setSearchConsoleError(propertyError instanceof Error ? propertyError.message : 'Could not select the Search Console property.');
    } finally {
      setSearchConsoleAction(false);
    }
  }

  async function loadSearchConsoleAnalytics() {
    if (!projectId) return;
    setSearchConsoleLoading(true);
    setSearchConsoleError('');
    try {
      const response = await fetch(`${endpointBase}/search-console/query`, { method: 'POST', headers, body: JSON.stringify({ email, installationId, startDate: searchConsoleStartDate, endDate: searchConsoleEndDate, dimensions: ['date'], rowLimit: 250 }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load Search Console analytics.');
      setSearchConsoleRows(Array.isArray(data.rows) ? data.rows as SearchConsoleQueryResponse['rows'] : []);
    } catch (analyticsError) {
      setSearchConsoleError(analyticsError instanceof Error ? analyticsError.message : 'Could not load Search Console analytics.');
    } finally {
      setSearchConsoleLoading(false);
    }
  }

  async function loadSearchConsoleSitemaps() {
    if (!projectId) return;
    try {
      const response = await fetch(`${endpointBase}/search-console/sitemaps?email=${encodeURIComponent(email)}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load Search Console sitemaps.');
      setSearchConsoleSitemaps(Array.isArray(data.sitemaps) ? data.sitemaps as SearchConsoleSitemap[] : []);
    } catch (sitemapError) {
      setSearchConsoleError(sitemapError instanceof Error ? sitemapError.message : 'Could not load Search Console sitemaps.');
    }
  }

  async function inspectSearchConsoleUrl() {
    if (!projectId || !inspectionUrl.trim()) return;
    setSearchConsoleAction(true);
    setSearchConsoleError('');
    try {
      const response = await fetch(`${endpointBase}/search-console/inspect`, { method: 'POST', headers, body: JSON.stringify({ email, installationId, inspectionUrl: inspectionUrl.trim(), languageCode: 'en-US' }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not inspect this URL in Search Console.');
      setInspectionResult(data.result as Record<string, unknown> | null);
      setMessage(`Google index status received for ${inspectionUrl.trim()}.`);
    } catch (inspectionError) {
      setSearchConsoleError(inspectionError instanceof Error ? inspectionError.message : 'Could not inspect this URL in Search Console.');
    } finally {
      setSearchConsoleAction(false);
    }
  }

  const loadAudit = useCallback(async () => {
    if (!projectId || !email || !token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${endpointBase}/seo?email=${encodeURIComponent(email)}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load SEO audit.');
      setAudit(data as AuditResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load SEO audit.');
    } finally {
      setLoading(false);
    }
  }, [endpointBase, email, headers, projectId, token]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  async function runLiveCrawl() {
    if (!projectId) return;
    setCrawling(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${endpointBase}/seo/live-crawl?email=${encodeURIComponent(email)}`, { method: 'POST', headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Live crawl failed.');
      setCrawl(data as CrawlResponse);
      setActiveTab('crawler');
      setMessage(`Live site checked at ${new Date(data.checkedAt).toLocaleString()}.`);
    } catch (crawlError) {
      setError(crawlError instanceof Error ? crawlError.message : 'Live crawl failed.');
    } finally {
      setCrawling(false);
    }
  }

  async function applySeoFixes() {
    if (!projectId) return;
    setFixing(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${endpointBase}/seo/autofix`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, installationId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'SEO autofix failed.');
      setMessage(`${Array.isArray(data.fixesApplied) ? data.fixesApplied.length : 0} SEO fixes saved as a new project version.`);
      await loadAudit();
    } catch (fixError) {
      setError(fixError instanceof Error ? fixError.message : 'SEO autofix failed.');
    } finally {
      setFixing(false);
    }
  }

  function exportReportCsv() {
    const rows = issues.map(issue => [
      issue.category || '', issue.severity || '', issue.title || '', issue.description || issue.explanation || '', issue.remediation || issue.suggestedFix || '', issue.autoFixable ? 'Yes' : 'No'
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const csv = ['Category,Severity,Title,Description,Remediation,AutoFixable', ...rows].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `quantora-seo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  const score = audit?.audit?.overallScore ?? null;
  const technicalScore = audit?.audit?.technicalScore ?? null;
  const contentScore = audit?.audit?.contentScore ?? null;
  const card = (label: string, value: string) => <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,.08)' }}><small style={{ color: '#94a3b8', textTransform: 'uppercase' }}>{label}</small><h3 style={{ margin: '8px 0 0', fontSize: 23 }}>{value}</h3></div>;

  return (
    <section className="feature-studio-container seo-dashboard-container" style={{ color: '#f8fafc', padding: 20 }}>
      <header style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.16), rgba(16,185,129,.08))', border: '1px solid rgba(99,102,241,.35)', borderRadius: 16, padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div><span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 800, letterSpacing: '.1em' }}>SEO OPTIMIZATION, MONITORING &amp; REPORTING</span><h2 style={{ margin: '5px 0', fontSize: 23 }}>{projectTitle} — SEO Center</h2><small style={{ color: '#94a3b8' }}>Target domain: {productionUrl || 'Not published yet'}</small></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}><button type="button" onClick={() => void runLiveCrawl()} disabled={crawling || !projectId} style={{ background: '#6366f1', border: 0, color: '#fff', padding: '9px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{crawling ? 'Crawling…' : 'Crawl live site'}</button><button type="button" onClick={exportReportCsv} disabled={!issues.length} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,.15)', color: '#fff', padding: '9px 14px', borderRadius: 8, cursor: 'pointer' }}>Export report</button></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}><span style={{ background: 'rgba(99,102,241,.18)', color: '#c7d2fe', padding: '4px 9px', borderRadius: 20, fontSize: 11 }}>Completed by Quantora</span><span style={{ background: 'rgba(16,185,129,.16)', color: '#a7f3d0', padding: '4px 9px', borderRadius: 20, fontSize: 11 }}>Verified on live site only after crawl</span><span style={{ background: 'rgba(245,158,11,.16)', color: '#fde68a', padding: '4px 9px', borderRadius: 20, fontSize: 11 }}>Google data: Search Console connection required</span></div>
        <p style={{ color: '#cbd5e1', fontSize: 12, margin: '12px 0 0' }}>Quantora reports observed technical data. Google indexing, queries, impressions, and rankings are shown only after a real Search Console integration.</p>
      </header>

            {error && <div style={{ background: 'rgba(239,68,68,.14)', border: '1px solid rgba(239,68,68,.45)', padding: 11, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {message && <div style={{ background: 'rgba(16,185,129,.14)', border: '1px solid rgba(16,185,129,.45)', padding: 11, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
      {searchConsoleError && <div className="search-console-error" role="alert">{searchConsoleError}</div>}

      <section className="search-console-panel" aria-labelledby="search-console-title">
        <div className="search-console-heading">
          <div>
            <span className="search-console-kicker">GOOGLE SEARCH CONSOLE</span>
            <h3 id="search-console-title">Connect verified Google data</h3>
            <p>Search Console measures search performance and index status. It does not guarantee indexing or ranking, and Quantora never invents Google metrics.</p>
          </div>
          <div className="search-console-buttons">
            <button type="button" onClick={() => void connectSearchConsole()} disabled={searchConsoleAction || !projectId}>{searchConsoleAction ? 'Opening…' : 'Connect Google'}</button>
            <button type="button" className="secondary" onClick={() => void loadSearchConsoleStatus()} disabled={!projectId}>Refresh status</button>
          </div>
        </div>
        <div className="search-console-status-grid">
          <div><span>Connection</span><strong>{searchConsoleStatus?.connected ? 'Connected' : 'Not connected'}</strong></div>
          <div><span>Selected property</span><strong>{searchConsoleStatus?.selectedProperty || 'None selected'}</strong></div>
          <div><span>Scope</span><strong>{searchConsoleStatus?.connected ? 'Read-only' : '—'}</strong></div>
        </div>
        {searchConsoleStatus?.connected && <div className="search-console-workspace">
          <div className="search-console-toolbar">
            <button type="button" onClick={() => void loadSearchConsoleProperties()} disabled={searchConsoleLoading}>Load verified properties</button>
            <select aria-label="Verified Search Console property" value={searchConsoleStatus.selectedProperty || ''} onChange={event => void selectSearchConsoleProperty(event.target.value)} disabled={!searchConsoleProperties.length || searchConsoleAction}>
              <option value="">{searchConsoleProperties.length ? 'Select a property' : 'Load properties first'}</option>
              {searchConsoleProperties.map(property => <option key={property.siteUrl} value={property.siteUrl}>{property.siteUrl} · {property.permissionLevel}</option>)}
            </select>
          </div>
          {searchConsoleStatus.selectedProperty && <div className="search-console-tools-grid">
            <div className="search-console-tool">
              <h4>Performance data</h4>
              <p>Read finalized clicks, impressions, CTR and average position for a selected date range.</p>
              <div className="search-console-date-row"><label>From<input type="date" value={searchConsoleStartDate} onChange={event => setSearchConsoleStartDate(event.target.value)} /></label><label>To<input type="date" value={searchConsoleEndDate} onChange={event => setSearchConsoleEndDate(event.target.value)} /></label></div>
              <button type="button" onClick={() => void loadSearchConsoleAnalytics()} disabled={searchConsoleLoading}>{searchConsoleLoading ? 'Loading…' : 'Load analytics'}</button>
              {searchConsoleRows.length > 0 && <div className="search-console-results"><strong>{searchConsoleRows.length} daily rows returned</strong>{searchConsoleRows.slice(-7).map((row, index) => <div key={`${row.keys?.join('-') || 'row'}-${index}`}><span>{row.keys?.join(' · ') || 'Summary'}</span><span>{Number(row.clicks || 0).toFixed(0)} clicks · {Number(row.impressions || 0).toFixed(0)} impressions · pos. {Number(row.position || 0).toFixed(1)}</span></div>)}</div>}
            </div>
            <div className="search-console-tool">
              <h4>Index inspection</h4>
              <p>Ask Google for the indexed status of a URL inside the selected property.</p>
              <input type="url" value={inspectionUrl} onChange={event => setInspectionUrl(event.target.value)} placeholder="https://example.com/page" aria-label="URL to inspect" />
              <button type="button" onClick={() => void inspectSearchConsoleUrl()} disabled={searchConsoleAction || !inspectionUrl.trim()}>Inspect URL</button>
              {inspectionResult && <pre className="search-console-json">{JSON.stringify(inspectionResult, null, 2)}</pre>}
            </div>
            <div className="search-console-tool search-console-tool-wide">
              <div className="search-console-tool-heading"><div><h4>Sitemaps</h4><p>Read the sitemap entries Google reports for the selected property.</p></div><button type="button" className="secondary" onClick={() => void loadSearchConsoleSitemaps()} disabled={searchConsoleLoading}>Refresh sitemaps</button></div>
              {searchConsoleSitemaps.length ? <div className="search-console-results">{searchConsoleSitemaps.map((sitemap, index) => <div key={`${sitemap.path || 'sitemap'}-${index}`}><span>{sitemap.path || 'Unnamed sitemap'}</span><span>{sitemap.errors || 0} errors · {sitemap.warnings || 0} warnings</span></div>)}</div> : <p className="search-console-muted">No sitemap rows loaded yet.</p>}
            </div>
          </div>}
        </div>}
        {!searchConsoleStatus?.connected && <p className="search-console-muted">Connect with the Google account that owns the website property. Authorization is stored server-side; no Google token is placed in the browser.</p>}
      </section>

      <nav style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 18 }}>
{[['overview', 'Overview'], ['technical', 'Technical audit'], ['crawler', 'Live crawl'], ['opportunities', 'Opportunities'], ['reports', 'Reports']].map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id as Tab)} style={{ background: activeTab === id ? '#6366f1' : '#1e293b', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: '8px 13px', borderRadius: 8, whiteSpace: 'nowrap', cursor: 'pointer' }}>{label}</button>)}</nav>

      {activeTab === 'overview' && <div style={{ display: 'grid', gap: 15 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>{card('SEO score', score === null ? 'Not available' : `${score}/100`)}{card('Technical score', technicalScore === null ? 'Not available' : `${technicalScore}/100`)}{card('Content score', contentScore === null ? 'Not available' : `${contentScore}/100`)}{card('Open findings', loading ? 'Loading…' : String(openIssues.length))}</div><div style={{ background: '#1e293b', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,.08)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><h3 style={{ margin: 0 }}>Observed SEO findings</h3><p style={{ color: '#94a3b8', fontSize: 12 }}>Source: generated project files, version {audit?.versionNumber ?? '—'}.</p></div><button type="button" onClick={() => void applySeoFixes()} disabled={fixing || !issues.length} style={{ background: '#10b981', border: 0, color: '#06281d', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>{fixing ? 'Applying…' : 'Save automatic fixes'}</button></div>{loading ? <p>Loading audit…</p> : !audit ? <p style={{ color: '#fbbf24' }}>No audit data is available yet.</p> : issues.length === 0 ? <p style={{ color: '#a7f3d0' }}>No findings were returned by the audit.</p> : <div style={{ display: 'grid', gap: 9 }}>{issues.slice(0, 12).map((issue, index) => <div key={issue.id || index} style={{ background: '#0f172a', padding: 12, borderRadius: 9 }}><strong>{issue.title || 'SEO finding'}</strong><div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{issue.description || issue.explanation || 'No description supplied.'}</div>{(issue.remediation || issue.suggestedFix) && <div style={{ color: '#c7d2fe', fontSize: 12, marginTop: 5 }}>Fix: {issue.remediation || issue.suggestedFix}</div>}</div>)}</div>}</div></div>}

      {activeTab === 'technical' && <div style={{ background: '#1e293b', padding: 18, borderRadius: 12 }}><h3>Technical audit</h3><p style={{ color: '#94a3b8', fontSize: 13 }}>These findings come from the project-file audit. They are not a Google ranking guarantee.</p>{issues.length ? issues.map((issue, index) => <div key={issue.id || index} style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,.08)' }}><strong>{issue.category || 'General'} · {issue.severity || 'Unknown'}</strong><div style={{ color: '#cbd5e1', marginTop: 4 }}>{issue.title}</div><div style={{ color: '#94a3b8', fontSize: 12 }}>{issue.remediation || issue.suggestedFix || issue.description || issue.explanation}</div></div>) : <p>No audit findings available.</p>}</div>}

      {activeTab === 'crawler' && <div style={{ background: '#1e293b', padding: 18, borderRadius: 12 }}><h3>Observed live-site crawl</h3>{!crawl ? <p style={{ color: '#fbbf24' }}>Run a crawl to verify the actual published URL. No live-site result is being simulated.</p> : <div style={{ display: 'grid', gap: 9 }}>{[['HTTP status', `${crawl.status}`], ['Final URL', crawl.finalUrl || crawl.url], ['Title', crawl.title || 'Missing'], ['Meta description', crawl.description ? 'Present' : 'Missing'], ['Canonical', crawl.canonical || 'Missing'], ['robots.txt', crawl.robots?.reachable ? `Reachable (${crawl.robots.status})` : 'Not reachable'], ['sitemap.xml', crawl.sitemap?.reachable ? `Reachable (${crawl.sitemap.status})` : 'Not reachable'], ['Checked at', new Date(crawl.checkedAt).toLocaleString()]].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '9px 0' }}><span style={{ color: '#94a3b8' }}>{label}</span><strong style={{ textAlign: 'right' }}>{value}</strong></div>)}{crawl.issues?.length ? <div style={{ marginTop: 10, color: '#fbbf24' }}>{crawl.issues.map(issue => <div key={issue}>• {issue}</div>)}</div> : <div style={{ color: '#a7f3d0', marginTop: 10 }}>No crawl issues were observed.</div>}</div>}</div>}

      {activeTab === 'opportunities' && <div style={{ background: '#1e293b', padding: 18, borderRadius: 12 }}><h3>SEO opportunities</h3><p style={{ color: '#94a3b8', fontSize: 13 }}>Recommendations are based on real audit findings. No search-volume or ranking numbers are fabricated here.</p>{openIssues.length ? <ul>{openIssues.slice(0, 10).map((issue, index) => <li key={issue.id || index} style={{ marginBottom: 9 }}>{issue.remediation || issue.suggestedFix || issue.title || 'Review this finding.'}</li>)}</ul> : <p>No opportunities available until an audit returns findings.</p>}</div>}

      {activeTab === 'reports' && <div style={{ background: '#1e293b', padding: 18, borderRadius: 12 }}><h3>SEO report status</h3><p style={{ color: '#94a3b8', fontSize: 13 }}>A report is generated from the current audit and live crawl only. Google Search Console metrics are unavailable until the user connects a verified property.</p><div style={{ color: '#cbd5e1' }}>Project: {projectTitle}</div><div style={{ color: '#cbd5e1' }}>Audit version: {audit?.versionNumber ?? 'Not loaded'}</div><div style={{ color: '#cbd5e1' }}>Last live crawl: {crawl ? new Date(crawl.checkedAt).toLocaleString() : 'Not run'}</div></div>}
    </section>
  );
}
