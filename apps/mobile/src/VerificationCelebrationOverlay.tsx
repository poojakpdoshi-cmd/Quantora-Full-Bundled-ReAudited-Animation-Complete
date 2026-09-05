import React, { useEffect, useState } from 'react';

interface VerificationCelebrationOverlayProps {
  show: boolean;
  onComplete: () => void;
  email?: string;
}

export const VerificationCelebrationOverlay: React.FC<VerificationCelebrationOverlayProps> = ({
  show,
  onComplete,
  email
}) => {
  const [phase, setPhase] = useState<'burst' | 'settled' | 'fadeout'>('burst');

  useEffect(() => {
    if (!show) return;

    // Sequence stages matching reference video
    const t1 = setTimeout(() => setPhase('settled'), 500);
    const t2 = setTimeout(() => setPhase('fadeout'), 2600);
    const t3 = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [show, onComplete]);

  if (!show) return null;

  // Generate 45 celebratory confetti particles
  const confettiList = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    left: `${(i * 2.2 + (i % 7) * 4) % 100}%`,
    delay: `${(i % 10) * 0.15}s`,
    duration: `${2 + (i % 5) * 0.4}s`,
    size: `${6 + (i % 4) * 3}px`,
    color: ['#facc15', '#10b981', '#38bdf8', '#fbbf24', '#34d399', '#60a5fa', '#f59e0b'][i % 7],
    rotation: `${(i * 37) % 360}deg`
  }));

  // Generate 24 sparkling stars around the checkmark
  const starsList = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 2 * Math.PI;
    const radius = 100 + (i % 3) * 25;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return {
      id: i,
      x,
      y,
      delay: `${(i % 6) * 0.12}s`,
      size: `${10 + (i % 3) * 6}px`,
      color: i % 2 === 0 ? '#fde047' : '#6ee7b7'
    };
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(circle at 50% 45%, #0d1b2a 0%, #060d17 60%, #02060d 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.45s ease-out',
        pointerEvents: 'all'
      }}
    >
      {/* 1. Gold & Emerald Confetti Rain */}
      {confettiList.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: c.left,
            width: c.size,
            height: `${parseInt(c.size) * 1.5}px`,
            background: c.color,
            borderRadius: '2px',
            boxShadow: `0 0 10px ${c.color}`,
            transform: `rotate(${c.rotation})`,
            animation: `quantoraConfettiFall ${c.duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
            animationDelay: c.delay,
            zIndex: 1
          }}
        />
      ))}

      {/* 2. Swirling Energy Ribbons Burst (Canvas effect via CSS 3D rings) */}
      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#10b981',
          borderBottomColor: '#f59e0b',
          boxShadow: '0 0 50px rgba(16, 185, 129, 0.6), inset 0 0 40px rgba(245, 158, 11, 0.4)',
          animation: 'quantoraRibbonSpin 2.2s linear infinite',
          filter: 'blur(1px)',
          zIndex: 2
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: '2.5px solid transparent',
          borderLeftColor: '#38bdf8',
          borderRightColor: '#34d399',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.5)',
          animation: 'quantoraRibbonSpinReverse 1.8s linear infinite',
          zIndex: 2
        }}
      />

      {/* 3. Glowing Center Particle Core */}
      <div
        style={{
          position: 'absolute',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(56, 189, 248, 0.2) 50%, transparent 75%)',
          filter: 'blur(20px)',
          animation: 'quantoraCorePulse 1.4s ease-in-out infinite alternate',
          zIndex: 2
        }}
      />

      {/* 4. Sparkling Orbit Stars */}
      <div style={{ position: 'absolute', width: 0, height: 0, zIndex: 3 }}>
        {starsList.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.x}px`,
              top: `${s.y}px`,
              fontSize: s.size,
              color: s.color,
              filter: `drop-shadow(0 0 6px ${s.color})`,
              animation: `quantoraStarTwinkle 1.2s ease-in-out infinite alternate`,
              animationDelay: s.delay,
              transform: 'translate(-50%, -50%)'
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* 5. 3D Metallic Emerald & Crystal Checkmark on Glowing Pedestal Disc */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          animation: 'quantoraCheckmarkZoom 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Holographic Pedestal Base */}
        <div
          style={{
            position: 'absolute',
            bottom: '-25px',
            width: '180px',
            height: '40px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.4) 60%, transparent 80%)',
            boxShadow: '0 0 40px #10b981, 0 0 80px rgba(52, 211, 153, 0.6)',
            border: '2px solid rgba(110, 231, 183, 0.6)',
            filter: 'drop-shadow(0 0 15px #10b981)',
            transform: 'rotateX(65deg)',
            zIndex: 1
          }}
        />

        {/* 3D Glass Emerald Badge with Glossy Bevel */}
        <div
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #34d399 35%, #059669 70%, #064e3b 100%)',
            border: '4px solid #a7f3d0',
            boxShadow: '0 0 50px rgba(16, 185, 129, 0.8), 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 6px 12px #ffffff, inset 0 -6px 16px #064e3b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 5
          }}
        >
          {/* Beveled 3D Checkmark SVG */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 12px #ffffff)',
              animation: 'quantoraCheckmarkDraw 0.5s ease-out 0.2s forwards'
            }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>

          {/* Glint Sparkle on Checkmark Tip */}
          <span
            style={{
              position: 'absolute',
              top: '12px',
              right: '18px',
              fontSize: '20px',
              color: '#ffffff',
              filter: 'drop-shadow(0 0 8px #ffffff)',
              animation: 'quantoraGlint 1s infinite'
            }}
          >
            ✨
          </span>
        </div>
      </div>

      {/* 6. Frosted Glass Success Banner */}
      <div
        style={{
          marginTop: '36px',
          padding: '16px 28px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
          textAlign: 'center',
          zIndex: 10,
          animation: 'quantoraBannerSlideUp 0.5s ease-out 0.3s forwards',
          maxWidth: '90%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px' }}>💎</span>
          <span style={{ color: '#6ee7b7', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
            VERIFICATION SUCCESSFUL
          </span>
          <span style={{ fontSize: '18px' }}>✨</span>
        </div>

        <h2 style={{ margin: 0, color: '#ffffff', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.3px' }}>
          Welcome to Quantora
        </h2>

        {email && (
          <p style={{ margin: '4px 0 8px', color: '#93c5fd', fontSize: '13px', fontWeight: 600 }}>
            {email}
          </p>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '9999px', padding: '4px 14px', marginTop: '6px' }}>
          <span style={{ fontSize: '14px' }}>🎁</span>
          <span style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 800 }}>
            +200 Generation Credits Unlocked
          </span>
        </div>
      </div>

      {/* CSS Keyframe Styles for Animation */}
      <style>{`
        @keyframes quantoraConfettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0.2;
          }
        }
        @keyframes quantoraRibbonSpin {
          0% { transform: rotate(0deg) scale(0.9); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(0.9); }
        }
        @keyframes quantoraRibbonSpinReverse {
          0% { transform: rotate(360deg) scale(1.05); }
          50% { transform: rotate(180deg) scale(0.85); }
          100% { transform: rotate(0deg) scale(1.05); }
        }
        @keyframes quantoraCorePulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0.9; }
        }
        @keyframes quantoraStarTwinkle {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }
        @keyframes quantoraCheckmarkZoom {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes quantoraGlint {
          0%, 100% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes quantoraBannerSlideUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
