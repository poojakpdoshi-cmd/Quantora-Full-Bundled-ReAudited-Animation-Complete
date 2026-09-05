import { useEffect, useMemo, useState } from 'react';
import { Browser } from '@capacitor/browser';

type BrowserEntry = {
  url: string;
  title: string;
};

const browserHistoryKey = 'quantora-browser-history-v1';
const defaultUrl = 'https://example.com';

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function readHistory(): BrowserEntry[] {
  try {
    const raw = localStorage.getItem(browserHistoryKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is BrowserEntry =>
      Boolean(item) && typeof item === 'object' &&
      typeof item.url === 'string' && typeof item.title === 'string'
    ).slice(0, 8);
  } catch {
    return [];
  }
}

export function BrowserStudio() {
  const initialHistory = useMemo(readHistory, []);
  const [urlInput, setUrlInput] = useState(initialHistory[0]?.url || defaultUrl);
  const [activeUrl, setActiveUrl] = useState(initialHistory[0]?.url || defaultUrl);
  const [history, setHistory] = useState<BrowserEntry[]>(initialHistory);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(browserHistoryKey, JSON.stringify(history));
  }, [history]);

  function visit(value = urlInput): void {
    const nextUrl = normalizeUrl(value);
    if (!nextUrl) {
      setError('Enter a valid website address beginning with http:// or https://.');
      return;
    }
    setError('');
    setActiveUrl(nextUrl);
    setUrlInput(nextUrl);
    setHistory((current) => [
      { url: nextUrl, title: new URL(nextUrl).hostname },
      ...current.filter((item) => item.url !== nextUrl)
    ].slice(0, 8));
  }

  async function openSecureBrowser(): Promise<void> {
    const nextUrl = normalizeUrl(activeUrl);
    if (!nextUrl) {
      setError('The current address is not valid.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Browser.open({ url: nextUrl, presentationStyle: 'popover' });
    } catch {
      setError('The secure browser could not open on this device. Use the preview or device browser instead.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel browser-studio" aria-labelledby="browser-studio-title">
      <div className="browser-heading">
        <div>
          <p className="eyebrow">QUANTORA BROWSER</p>
          <h2 id="browser-studio-title">Browse, verify, and share websites</h2>
          <p className="muted">
            Inspect a generated site inside Quantora, then open the same address in a secure device browser when a site blocks embedded previews.
          </p>
        </div>
        <span className="browser-status">HTTP / HTTPS only</span>
      </div>

      <form
        className="browser-address-bar"
        onSubmit={(event) => {
          event.preventDefault();
          visit();
        }}
      >
        <label htmlFor="quantora-browser-address">Website address</label>
        <div className="browser-address-controls">
          <input
            id="quantora-browser-address"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://your-website.com"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className="primary">Go</button>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} aria-label="Reload website">Reload</button>
          <button type="button" onClick={() => void openSecureBrowser()} disabled={loading}>
            {loading ? 'Opening…' : 'Open securely'}
          </button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="browser-toolbar-note">
        <span>Preview address</span>
        <strong>{activeUrl}</strong>
      </div>

      <div className="browser-frame-wrap">
        <iframe
          key={`${activeUrl}-${reloadKey}`}
          title="Quantora website browser preview"
          src={activeUrl}
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="browser-footer">
        <div>
          <strong>Recent addresses</strong>
          <small>Stored locally on this device. No browsing history is uploaded by this workspace.</small>
        </div>
        <div className="browser-history-list">
          {history.length === 0 ? (
            <span className="muted">No recent addresses</span>
          ) : history.map((entry) => (
            <button key={entry.url} type="button" onClick={() => visit(entry.url)}>
              {entry.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
