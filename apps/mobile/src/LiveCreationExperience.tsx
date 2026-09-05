import React, { useMemo, useState, useEffect } from 'react';
import type { LiveCreationStage, LiveCreationStageId, WebsitePlan } from '@wmai/shared';
import './live-creation.css';

export interface LiveCreationProps {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep?: string | null;
  currentAgent?: string | null;
  errorMessage?: string | null;
  failedStage?: string | null;
  retryable?: boolean;
  events?: Array<{
    id?: string | number;
    event_type?: string | null;
    eventType?: string | null;
    agent_name?: string | null;
    agentName?: string | null;
    title?: string;
    detail?: string | null;
    progress?: number | null;
    created_at?: string | null;
    createdAt?: string | null;
    status?: string | null;
  }>;
  prompt?: string;
  plan?: WebsitePlan | null;
  previewHtml?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onViewPreview?: () => void;
  onDismiss?: () => void;
}

const STAGES: Array<{ id: LiveCreationStageId; name: string; title: string; subtitle: string; minProgress: number; icon: string }> = [
  { id: 'initializing', name: 'Initializing', title: 'Waking up Nexora...', subtitle: 'Spinning up the neural pipeline and reserving resources.', minProgress: 5, icon: '⚡' },
  { id: 'analyzing', name: 'Analyzing', title: 'Understanding your idea...', subtitle: 'Extracting domain entities, target audience and key user requirements.', minProgress: 15, icon: '🔍' },
  { id: 'planning', name: 'Planning', title: 'Planning your website structure...', subtitle: 'Synthesizing application spec, page hierarchy and layout architecture.', minProgress: 28, icon: '📐' },
  { id: 'designing', name: 'Designing', title: 'Creating your visual identity...', subtitle: 'Formulating Design Genome, typography pairing and curated color palettes.', minProgress: 45, icon: '🎨' },
  { id: 'content', name: 'Content Intelligence', title: 'Creating your website content...', subtitle: 'Generating industry copy, conversion highlights and custom badges.', minProgress: 60, icon: '✍️' },
  { id: 'building', name: 'Building', title: 'Building your website components...', subtitle: 'Synthesizing React components, clean responsive CSS and navigation.', minProgress: 75, icon: '🛠️' },
  { id: 'validating', name: 'Visual QA Engine', title: 'Checking your website...', subtitle: 'Running WCAG AA contrast, link integrity and mobile responsive audits.', minProgress: 88, icon: '🛡️' },
  { id: 'finalizing', name: 'Finalizing', title: 'Putting everything together...', subtitle: 'Packaging project files, bundling assets and preparing live preview.', minProgress: 95, icon: '✨' },
  { id: 'completed', name: 'Ready', title: 'Your website is ready.', subtitle: 'All checks passed with 100% verified production quality.', minProgress: 100, icon: '🚀' }
];

export const LiveCreationExperience: React.FC<LiveCreationProps> = ({
  status,
  progress,
  currentStep,
  currentAgent,
  errorMessage,
  failedStage,
  retryable,
  events = [],
  prompt = '',
  plan,
  previewHtml,
  onCancel,
  onRetry,
  onViewPreview,
  onDismiss
}) => {
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (status === 'completed' || status === 'failed' || status === 'cancelled') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Determine active stage based on progress and currentStep
  const activeStageIndex = useMemo(() => {
    if (status === 'completed') return STAGES.length - 1;
    const step = (currentStep || '').toLowerCase();
    if (step.includes('init') || step.includes('received')) return 0;
    if (step.includes('analyz') || step.includes('intent')) return 1;
    if (step.includes('plan')) return 2;
    if (step.includes('design') || step.includes('genome') || step.includes('thinkmax')) return 3;
    if (step.includes('content') || step.includes('copy')) return 4;
    if (step.includes('code') || step.includes('build') || step.includes('synthesiz') || step.includes('file')) return 5;
    if (step.includes('validat') || step.includes('review') || step.includes('qa') || step.includes('repair')) return 6;
    if (step.includes('final') || step.includes('pack')) return 7;

    // Fallback based on progress number
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (progress >= STAGES[i].minProgress) return i;
    }
    return 0;
  }, [status, currentStep, progress]);

  const activeStage = STAGES[activeStageIndex];
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  return (
    <div className={`nexora-live-creation-overlay ${status}`}>
      <div className="live-creation-shell">
        {/* Header Bar */}
        <header className="live-creation-header">
          <div className="live-brand-badge">
            <div className="live-pulse-dot" />
            <span className="live-brand-text">NEXORA BRAIN 🧠</span>
            <span className="live-version-tag">Live Engine</span>
          </div>

          <div className="live-header-actions">
            <span className="live-timer" title="Elapsed generation time">
              ⏱️ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
            <button
              type="button"
              className={`live-icon-btn ${showLogDrawer ? 'active' : ''}`}
              onClick={() => setShowLogDrawer(!showLogDrawer)}
              title="Toggle Neural Event Stream"
            >
              📜 <span className="hide-on-mobile">Logs ({events.length})</span>
            </button>
            {status !== 'completed' && status !== 'failed' && onCancel && (
              <button
                type="button"
                className="live-cancel-btn"
                onClick={() => setCancelPromptOpen(true)}
              >
                ✕ Cancel
              </button>
            )}
            {(status === 'completed' || status === 'failed') && onDismiss && (
              <button
                type="button"
                className="live-close-btn"
                onClick={onDismiss}
              >
                ✕ Close
              </button>
            )}
          </div>
        </header>

        {/* Main Creation Grid */}
        <div className="live-creation-body">
          {/* Left Column: Neural Orb & Stage Info */}
          <div className="live-neural-column">
            <div className="neural-orb-container">
              <div className={`neural-orb-glow stage-${activeStage.id}`}>
                <div className="neural-ring ring-1" />
                <div className="neural-ring ring-2" />
                <div className="neural-ring ring-3" />
                <div className="neural-core">
                  <span className="neural-emoji">{status === 'completed' ? '✨' : activeStage.icon}</span>
                  <div className="neural-percentage">{clampedProgress}%</div>
                </div>
              </div>
            </div>

            <div className="neural-stage-description">
              <span className="stage-eyebrow">
                STAGE {activeStageIndex + 1} OF {STAGES.length} · {activeStage.name.toUpperCase()}
              </span>
              <h2 className="stage-headline">{status === 'completed' ? 'Website Successfully Built!' : activeStage.title}</h2>
              <p className="stage-subtext">
                {latestEvent?.detail || activeStage.subtitle}
              </p>
              {currentAgent && (
                <div className="agent-badge">
                  <span className="agent-dot" />
                  <span>Active Agent: <strong>{currentAgent}</strong></span>
                </div>
              )}
            </div>

            {/* Overall Progress Bar */}
            <div className="live-progress-track-wrapper">
              <div className="live-progress-track">
                <div
                  className="live-progress-fill"
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
              <div className="live-progress-labels">
                <span>{status === 'failed' ? 'Interrupted' : 'Real-time generation'}</span>
                <span>{clampedProgress}% Completed</span>
              </div>
            </div>

            {/* Error & Recovery Banner */}
            {status === 'failed' && (
              <div className="live-error-banner" role="alert">
                <div className="live-error-title">
                  <span>⚠️</span>
                  <strong>Generation Interrupted</strong>
                </div>
                <p className="live-error-msg">{errorMessage || 'An unexpected error occurred during synthesis.'}</p>
                {failedStage && (
                  <small className="live-failed-stage">Failed at stage: {failedStage}</small>
                )}
                {retryable && onRetry && (
                  <div className="live-error-actions">
                    <button
                      type="button"
                      className="live-action-btn primary"
                      onClick={onRetry}
                    >
                      🔄 Resume & Retry Failed Stage
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Completed Action Banner */}
            {status === 'completed' && (
              <div className="live-success-banner">
                <div className="live-success-title">
                  <span>🎉</span>
                  <strong>Experience Ready to Launch!</strong>
                </div>
                <p>Your design genome, custom components, responsive styles and copy are compiled.</p>
                {onViewPreview && (
                  <button
                    type="button"
                    className="live-action-btn launch"
                    onClick={onViewPreview}
                  >
                    👁️ Open Live Website Preview
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Progressive Website Evolving Preview */}
          <div className="live-preview-column">
            <div className="live-preview-window">
              <div className="window-header">
                <div className="window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="window-url-bar">
                  <span className="url-lock" aria-hidden="true">◌</span>
                  <span className="url-text">{status === 'completed' ? 'Local preview · not publicly deployed' : 'Preparing local preview'}</span>
                </div>
                <div className="window-badge">
                  {status === 'completed' ? 'READY' : `STAGE ${activeStageIndex + 1}`}
                </div>
              </div>

              <div className="window-viewport">
                {/* Visual progression representation */}
                {previewHtml && status === 'completed' ? (
                  <iframe
                    title="Live Website Preview"
                    srcDoc={previewHtml}
                    className="live-preview-iframe"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="progressive-canvas-stage">
                    <div className="canvas-wireframe-header">
                      <div className="canvas-logo-box">
                        {plan?.businessName ? plan.businessName.slice(0, 2).toUpperCase() : 'Q'}
                      </div>
                      <div className="canvas-nav-skeleton">
                        <span className="sk-bar" />
                        <span className="sk-bar" />
                        <span className="sk-bar" />
                      </div>
                    </div>

                    <div className="canvas-hero-skeleton">
                      <div className="canvas-badge-skeleton">
                        {plan?.designGenome?.family ? `GENOME: ${String(plan.designGenome.family).toUpperCase()}` : 'INITIALIZING GENOME...'}
                      </div>
                      <h3 className="canvas-title-preview">
                        {plan?.businessName || prompt.slice(0, 40) || 'Designing your tailored presence...'}
                      </h3>
                      <p className="canvas-tagline-preview">
                        {plan?.tagline || 'Nexora AI is assembling bespoke components, responsive styles and SEO semantics...'}
                      </p>
                      <div className="canvas-cta-skeleton">
                        <div className="sk-btn" style={{ background: plan?.theme?.primary || '#6366f1' }} />
                        <div className="sk-btn secondary" />
                      </div>
                    </div>

                    {/* Section Cards Progressive Stream */}
                    <div className="canvas-sections-skeleton">
                      {(plan?.sections && plan.sections.length > 0 ? plan.sections.slice(0, 3) : [
                        { title: 'Bespoke Experience', body: 'Generating domain-specific copy...' },
                        { title: 'Engineered Architecture', body: 'Structuring clean semantic layout...' },
                        { title: 'Verified Conversion', body: 'Auditing WCAG AA compliance...' }
                      ]).map((sec: { title?: string; body?: string }, idx: number) => (
                        <div key={idx} className={`canvas-card-skeleton ${activeStageIndex >= 4 ? 'revealed' : ''}`}>
                          <div className="card-idx">0{idx + 1}</div>
                          <h4>{sec.title || ''}</h4>
                          <p>{(sec.body || '').slice(0, 70)}...</p>
                        </div>
                      ))}
                    </div>

                    {/* Stage scanning animation beam */}
                    <div className="canvas-scan-beam" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Generation Stage Stepper */}
        <div className="live-stages-timeline">
          {STAGES.map((stg, idx) => {
            const isDone = activeStageIndex > idx || status === 'completed';
            const isCurrent = activeStageIndex === idx && status !== 'completed' && status !== 'failed';
            const isPending = activeStageIndex < idx && status !== 'completed';
            const isFailPoint = status === 'failed' && activeStageIndex === idx;

            return (
              <div
                key={stg.id}
                className={`timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''} ${isFailPoint ? 'failed' : ''}`}
              >
                <div className="step-marker">
                  {isDone ? '✓' : isFailPoint ? '✕' : stg.icon}
                </div>
                <div className="step-info">
                  <span className="step-name">{stg.name}</span>
                  <span className="step-percent">{stg.minProgress}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Neural Event Stream Drawer */}
        {showLogDrawer && (
          <aside className="live-event-drawer">
            <div className="drawer-header">
              <h3>Neural Event Stream ({events.length})</h3>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setShowLogDrawer(false)}
              >
                ✕
              </button>
            </div>
            <div className="drawer-events-list">
              {events.length === 0 ? (
                <p className="no-events">Waiting for neural event telemetry...</p>
              ) : (
                events.map((ev, i) => (
                  <div key={ev.id || i} className="event-item">
                    <div className="event-top">
                      <span className="event-agent">{ev.agent_name || ev.agentName || 'Nexora Core'}</span>
                      <span className="event-time">
                        {ev.created_at || ev.createdAt ? new Date(ev.created_at || ev.createdAt!).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <strong className="event-title">{ev.title || ev.event_type || ev.eventType}</strong>
                    {ev.detail && <p className="event-detail">{ev.detail}</p>}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelPromptOpen && (
          <div className="cancel-confirm-modal-overlay">
            <div className="cancel-confirm-modal">
              <h3>Cancel Generation?</h3>
              <p>Are you sure you want to stop the generation job? Tokens used for this generation will be refunded to your balance.</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={() => setCancelPromptOpen(false)}
                >
                  Continue Generating
                </button>
                <button
                  type="button"
                  className="modal-btn danger"
                  onClick={() => {
                    setCancelPromptOpen(false);
                    onCancel?.();
                  }}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
