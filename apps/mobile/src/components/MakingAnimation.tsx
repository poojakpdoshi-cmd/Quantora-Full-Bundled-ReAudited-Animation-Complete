import React from 'react';

type MakingAnimationProps = {
  status: 'queued' | 'running';
  progress: number;
  currentStep?: string | null;
  currentAgent?: string | null;
};

function stageLabel(currentStep?: string | null, currentAgent?: string | null): string {
  const raw = String(currentStep || currentAgent || '').trim();
  if (!raw) return 'Preparing your website workspace';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export default function MakingAnimation({
  status,
  progress,
  currentStep,
  currentAgent
}: MakingAnimationProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  const isQueued = status === 'queued';
  const label = isQueued ? 'Thinking through your brief' : 'Making your website';

  return (
    <section className="quantora-making-animation" aria-live="polite" aria-label={`${label}, ${safeProgress}% complete`}>
      <div className="quantora-making-orbit" aria-hidden="true">
        <span className="quantora-making-orbit-dot quantora-making-orbit-dot-one" />
        <span className="quantora-making-orbit-dot quantora-making-orbit-dot-two" />
        <span className="quantora-making-orbit-dot quantora-making-orbit-dot-three" />
        <span className="quantora-making-core">Q</span>
      </div>
      <div className="quantora-making-copy">
        <div className="quantora-making-title-row">
          <strong>{label}</strong>
          <span>{safeProgress}%</span>
        </div>
        <div className="quantora-making-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeProgress}>
          <span style={{ transform: `scaleX(${safeProgress / 100})` }} />
        </div>
        <p>{stageLabel(currentStep, currentAgent)}<span className="quantora-making-ellipsis" aria-hidden="true">…</span></p>
        <small>This is live build progress from Quantora; no result is shown until the server finishes.</small>
      </div>
    </section>
  );
}
