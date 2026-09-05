import React, { useEffect, useRef, useState } from 'react';
import type { GeneratedProject } from './types';

interface SyntropixShellProps {
  activeProject: GeneratedProject | null;
  onExecuteCustomCommand?: (command: string) => Promise<any>;
}

export const SyntropixShell: React.FC<SyntropixShellProps> = ({
  activeProject
}) => {
  const [command, setCommand] = useState('npm run build');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [history, setHistory] = useState<Array<{
    cmd: string;
    exitCode: number;
    output: string;
    durationMs: number;
    timestamp: string;
  }>>([
    {
      cmd: 'quantora init --engine=cloudflare-fast-qa',
      exitCode: 0,
      output: `[QUANTORA AI SANDBOX BOOTSTRAP]\n✓ Project: ${activeProject?.title || 'Quantora Web App'}\n✓ Engine: Cloudflare Workers AI Fast Q&A\n✓ Workspace: ${activeProject?.id || 'quantora-app-v1'}\n✓ Mode: diagnostics preview only\n✓ No arbitrary shell, filesystem, network, or deployment access is provided.`,
      durationMs: 38,
      timestamp: new Date().toLocaleTimeString()
    },
    {
      cmd: 'git status',
      exitCode: 0,
      output: `On branch main\nYour branch is up to date with 'origin/main'.\nProject: ${activeProject?.id || 'quantora-app-v1'}\nDiagnostics preview has no repository or host access.`,
      durationMs: 24,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  useEffect(() => () => {
    if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
  }, []);

  const handleRun = async (cmdToRun?: string) => {
    const targetCmd = cmdToRun || command;
    if (!targetCmd.trim()) return;

    setRunning(true);
    const start = Date.now();

    // Deliberately limited diagnostics preview. This component does not execute shell commands.
    if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = window.setTimeout(() => {
      let output = '';
      let code = 0;
      const lower = targetCmd.toLowerCase();

      if (lower.includes('build')) {
        output = `[DIAGNOSTICS PREVIEW] Build command accepted for review: ${targetCmd}\nProject: ${activeProject?.id || 'No project selected'}\nNo compiler, Gradle task, filesystem command, or deployment was executed in this screen.\nUse the authenticated APK Builder or the configured build service for a real build.`;
      } else if (lower.includes('test')) {
        output = `[DIAGNOSTICS PREVIEW] Test command accepted for review: ${targetCmd}\nProject: ${activeProject?.id || 'No project selected'}\nNo test runner was executed in this screen. Results will appear only when a configured build service reports them.`;
      } else if (lower.includes('ls')) {
        output = `[DIAGNOSTICS PREVIEW] File listing requested for ${activeProject?.id || 'the selected project'}.\nThis preview does not inspect a remote filesystem. No files were read.`;
      } else if (lower.includes('status') || lower.includes('healthcheck')) {
        output = `[QUANTORA DIAGNOSTICS SUMMARY]\n● Q&A provider: configured by the API environment; live availability was not tested here\n● Build service: use APK Builder status for a real job result\n● Project memory: not inspected by this preview\n● Security boundary: no host, filesystem, network, or deployment access is provided\n● Accessibility: run the project's configured audit; no score is fabricated here`;
      } else if (lower.includes('rm -rf') || lower.includes('curl') || lower.includes('wget') || lower.includes('deploy')) {
        output = `[QUANTORA SECURITY BOUNDARY] This diagnostics preview does not execute deployment, host, filesystem, or network commands.`;
        code = 126;
      } else {
        output = `[DIAGNOSTICS PREVIEW] '${targetCmd}' was not run. Choose one of the allowlisted read-only diagnostics above.`;
        code = 2;
      }

      setHistory((prev) => [
        ...prev,
        {
          cmd: targetCmd,
          exitCode: code,
          output,
          durationMs: Date.now() - start,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setRunning(false);
    }, 240);
  };

  const copyAllLogs = () => {
    const fullLog = history.map((h) => `$ ${h.cmd}\n${h.output}`).join('\n\n');
    void navigator.clipboard?.writeText(fullLog);
    setCopied(true);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="feature-studio-panel" style={{ maxWidth: '980px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div className="feature-studio-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="feature-tag" style={{ background: '#0284c7', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800 }}>
            BUILD DIAGNOSTICS PREVIEW
          </span>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
            ● Cloudflare Fast Q&A Core Active
          </span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
          Quantora Build Diagnostics
        </h2>
        <p className="feature-description" style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
          Review allowlisted build and test diagnostics. This is not an interactive terminal and does not execute commands on a host.
        </p>
      </div>

      {/* Preset Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'npm run build', icon: '⚡' },
          { label: 'npm test', icon: '🧪' },
          { label: 'quantora status', icon: '💎' },
          { label: 'ls -la', icon: '📂' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className="studio-btn secondary"
            style={{
              fontSize: '11.5px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1.5px solid rgba(2, 132, 199, 0.3)',
              color: '#0f172a',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
            }}
            onClick={() => handleRun(item.label)}
            disabled={running}
          >
            {item.icon} $ {item.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={copyAllLogs}
            style={{
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              color: '#0284c7',
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy Logs'}
          </button>
          <button
            type="button"
            onClick={() => setHistory([])}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🗑 Clear
          </button>
        </div>
      </div>

      {/* macOS Dark Acrylic Terminal Window */}
      <div
        style={{
          background: '#090d16',
          border: '1.8px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* macOS Traffic Lights Header */}
        <div
          style={{
            background: '#040711',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          </div>

          <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
            quantora / diagnostics / {activeProject?.id || 'website-app'}
          </span>

          <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
            NODE 20 • VITE 6
          </span>
        </div>

        {/* Terminal Body */}
        <div
          style={{
            padding: '16px',
            fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
            color: '#38bdf8',
            fontSize: '12.5px',
            minHeight: '340px',
            maxHeight: '480px',
            overflowY: 'auto'
          }}
        >
          {history.length === 0 && (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
              Diagnostics cleared. Choose an allowlisted diagnostic above.
            </div>
          )}

          {history.map((h, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong style={{ color: '#38bdf8' }}>quantora</strong>
                  <span style={{ color: '#94a3b8' }}>@</span>
                  <span style={{ color: '#a78bfa' }}>diagnostics</span>:
                  <span style={{ color: '#34d399' }}>~/app</span>$ {h.cmd}
                </span>
                <span style={{ color: '#64748b', fontSize: '10.5px' }}>
                  {h.durationMs}ms · {h.exitCode === 0 ? '✓ Code 0' : `✖ Code ${h.exitCode}`}
                </span>
              </div>
              <pre
                style={{
                  margin: '6px 0 0 0',
                  color: h.exitCode === 0 ? '#e2e8f0' : '#f87171',
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  fontFamily: 'inherit'
                }}
              >
                {h.output}
              </pre>
            </div>
          ))}

          {running && (
            <div style={{ color: '#38bdf8', animation: 'pulse 1s infinite' }}>
              quantora/diagnostics$ {command} ▊
            </div>
          )}
        </div>
      </div>

      {/* Interactive Command Input Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRun();
        }}
        style={{ display: 'flex', gap: '8px', marginTop: '12px' }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1.8px solid rgba(2, 132, 199, 0.35)',
            borderRadius: '12px',
            padding: '0 12px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.1)'
          }}
        >
          <span style={{ color: '#0284c7', fontFamily: 'monospace', fontWeight: 800, marginRight: '8px' }}>
            $
          </span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Choose an allowlisted diagnostic above"
            disabled={running}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#0f172a',
              padding: '10px 0',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>

        <button
          type="submit"
          className="studio-btn primary"
          disabled={running || !command.trim()}
          style={{
            padding: '0 22px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            color: '#fff',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
          }}
        >
          {running ? 'Checking…' : 'Run diagnostic ⏎'}
        </button>
      </form>
    </section>
  );
};

export const QuantoraTerminal = SyntropixShell;

