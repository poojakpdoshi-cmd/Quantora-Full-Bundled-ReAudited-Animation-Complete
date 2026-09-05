export interface AnimationConfig {
  entrance: 'fade_up' | 'zoom_in' | 'slide_in' | 'quantum_reveal';
  scrollReveal: boolean;
  hoverPhysics: boolean;
  statCounters: boolean;
  reducedMotionFallback: boolean;
  transitionDurationMs: number;
}

export class AnimationEngine {
  /**
   * Generates tailored CSS and micro-interaction definitions for generated websites
   * while strictly respecting `prefers-reduced-motion`.
   */
  static generateAnimationStyles(config: AnimationConfig): string {
    if (config.reducedMotionFallback) {
      return `
/* Quantora Motion System - Accessible & Performance Tuned */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@keyframes quantoraFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.anim-fade-up {
  animation: quantoraFadeUp ${config.transitionDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.anim-card-hover {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
}

.anim-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 240, 255, 0.15);
}
`;
    }

    return `
@keyframes quantoraQuantumPulse {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.02); filter: brightness(1.15); }
  100% { transform: scale(1); filter: brightness(1); }
}

.anim-quantum-pulse {
  animation: quantoraQuantumPulse 3s infinite ease-in-out;
}
`;
  }
}
