import React, { useEffect, useMemo, useRef, useState } from 'react';

type Dimension = '3D' | '4D' | '5D';
type Tier = 'flagship' | 'mid' | 'budget' | 'fallback';

type Blueprint = {
  version: string;
  dimension: Dimension;
  round: number;
  title: string;
  rationale: string;
  layers: {
    spatial3D: { enabled: boolean; material: string; shader: string; objects: unknown[] };
    temporal4D: { enabled: boolean; scrollScenes: unknown[] };
    sensory5D: { enabled: boolean; gyroscope: boolean; haptics: boolean; audio: boolean; localTimeLighting: boolean };
  };
  performance: { tiering: boolean; lowTierFallback: string; pauseOffscreen: boolean; reducedMotion: boolean; targetFps: string };
  scenes: unknown[];
  accessibility: string[];
  assets: { proceduralFirst: boolean; maxModelBytes: number; externalAssetsApproved: boolean };
};

interface SpatialStudioProps {
  apiBase: string;
  projectId?: string;
  projectTitle?: string;
  email: string;
  token: string;
  installationId: string;
  onUseBlueprint?: (prompt: string) => void;
}

function profileDevice(canvas: HTMLCanvasElement): { tier: Tier; webgl: boolean; deviceMemory: number | null; cores: number } {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const webgl = Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const cores = navigator.hardwareConcurrency || 2;
  if (!webgl) return { tier: 'fallback', webgl: false, deviceMemory: memory, cores };
  if ((memory !== null && memory >= 8) || cores >= 8) return { tier: 'flagship', webgl: true, deviceMemory: memory, cores };
  if ((memory !== null && memory >= 4) || cores >= 4) return { tier: 'mid', webgl: true, deviceMemory: memory, cores };
  return { tier: 'budget', webgl: true, deviceMemory: memory, cores };
}

function shaderSource() {
  return {
    vertex: `attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}`,
    fragment: `precision mediump float; uniform vec2 resolution; uniform float time; uniform float tilt; uniform float scroll; uniform vec3 tint; void main(){ vec2 uv=(gl_FragCoord.xy*2.0-resolution)/min(resolution.x,resolution.y); float r=length(uv); float waves=sin(r*8.0-time*0.8+tilt*2.0+scroll*5.0); float glow=0.12/(abs(waves)+0.18); vec3 color=tint*(0.28+glow)+vec3(0.015,0.025,0.06); gl_FragColor=vec4(color,1.0); }`
  };
}

function SpatialCanvas({ tier, tilt, scroll, enabled, reducedMotion }: { tier: Tier; tilt: number; scroll: number; enabled: boolean; reducedMotion: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const shader = useMemo(shaderSource, []);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !enabled) return;
    const gl = canvas.getContext('webgl', { antialias: tier === 'flagship', powerPreference: tier === 'budget' ? 'low-power' : 'default' });
    if (!gl) return;
    const compile = (type: number, source: string) => { const item = gl.createShader(type); if (!item) throw new Error('Shader creation failed.'); gl.shaderSource(item, source); gl.compileShader(item); if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item) || 'Shader compile failed.'); return item; };
    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, shader.vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, shader.fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed.');
    } catch { return; }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    const resolution = gl.getUniformLocation(program, 'resolution');
    const time = gl.getUniformLocation(program, 'time');
    const tiltLocation = gl.getUniformLocation(program, 'tilt');
    const scrollLocation = gl.getUniformLocation(program, 'scroll');
    const tint = gl.getUniformLocation(program, 'tint');
    let frame = 0;
    let start = performance.now();
    let active = true;
    const observer = new IntersectionObserver(entries => { active = entries[0]?.isIntersecting ?? true; }, { threshold: 0.01 });
    observer.observe(canvas);
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!active) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio > 1 && tier === 'flagship' ? 1.5 : 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, reducedMotion ? 0 : (now - start) / 1000);
      gl.uniform1f(tiltLocation, tilt);
      gl.uniform1f(scrollLocation, scroll);
      const color = tier === 'flagship' ? [0.1, 0.8, 1.0] : tier === 'mid' ? [0.25, 0.55, 1.0] : [0.35, 0.35, 0.75];
      gl.uniform3f(tint, color[0], color[1], color[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); gl.deleteProgram(program); };
  }, [enabled, reducedMotion, scroll, shader, tier, tilt]);
  return <canvas ref={ref} aria-label="Procedural spatial preview" style={{ display: 'block', width: '100%', height: tier === 'fallback' ? 170 : 260, borderRadius: 18, background: '#050b14' }} />;
}

export function SpatialStudio({ apiBase, projectId, projectTitle = 'Current project', email, token, installationId, onUseBlueprint }: SpatialStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimension, setDimension] = useState<Dimension>('5D');
  const [prompt, setPrompt] = useState(`Build a ${dimension} premium website for ${projectTitle}`);
  const [feedback, setFeedback] = useState('');
  const [round, setRound] = useState(1);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [savedBlueprint, setSavedBlueprint] = useState<Blueprint | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tilt, setTilt] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [sensory, setSensory] = useState(true);
  const [audio, setAudio] = useState(false);
  const [profile, setProfile] = useState<{ tier: Tier; webgl: boolean; deviceMemory: number | null; cores: number } | null>(null);
  const [motionReduced, setMotionReduced] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) setProfile(profileDevice(canvas));
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const onScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setScroll(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sensory || dimension !== '5D') return;
    const onOrientation = (event: DeviceOrientationEvent) => setTilt(Math.max(-1, Math.min(1, Number(event.gamma || 0) / 45)));
    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [dimension, sensory]);

  function haptic() { if (sensory && 'vibrate' in navigator) navigator.vibrate(8); }
  function toggleAudio() {
    if (!audio) { const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext; if (AudioContextClass) { const context = new AudioContextClass(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = 174; gain.gain.value = 0.015; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.12); } }
    setAudio(value => !value); haptic();
  }

  async function requestBlueprint(nextRound = round, nextFeedback = feedback) {
    if (!projectId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/spatial/blueprint?email=${encodeURIComponent(email)}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'X-Device-Id': installationId, 'content-type': 'application/json' }, body: JSON.stringify({ prompt: prompt || `Build a ${dimension} website for ${projectTitle}`, dimension, round: nextRound, feedback: nextFeedback, currentBlueprint: blueprint }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not create spatial blueprint.');
      setBlueprint(data.spatial); setRound(nextRound); setMessage(`Blueprint proposal round ${nextRound} is ready for review.`); haptic();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create spatial blueprint.'); }
    finally { setBusy(false); }
  }

  async function approveBlueprint() {
    if (!projectId || !blueprint) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/spatial/blueprint?email=${encodeURIComponent(email)}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'X-Device-Id': installationId, 'content-type': 'application/json' }, body: JSON.stringify({ prompt, dimension, round, approve: true, blueprint }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not approve spatial blueprint.');
      setSavedBlueprint(blueprint); setMessage('Spatial blueprint approved and saved to the project.'); haptic();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not approve spatial blueprint.'); }
    finally { setBusy(false); }
  }

  const tier = profile?.tier || 'mid';
  return <section className="feature-studio-container" style={{ color: '#f8fafc', padding: 20 }}>
    <header style={{ background: 'linear-gradient(135deg, rgba(14,165,233,.2), rgba(168,85,247,.2))', border: '1px solid rgba(125,211,252,.35)', borderRadius: 18, padding: 22, marginBottom: 16 }}>
      <span style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 800, letterSpacing: '.12em' }}>QUANTORA SPATIAL ENGINE</span>
      <h2 style={{ margin: '6px 0' }}>Design a {dimension} website experience</h2>
      <p style={{ color: '#cbd5e1', margin: 0 }}>3D adds depth, 4D adds scroll-driven time, and 5D adds optional device reactivity. Quantora uses lightweight procedural rendering, adaptive tiers, offscreen pause, reduced-motion fallback, and a normal content path.</p>
    </header>
    {!projectId && <div style={{ background: 'rgba(245,158,11,.14)', border: '1px solid rgba(245,158,11,.4)', padding: 12, borderRadius: 9, marginBottom: 12 }}>Select a project and sign in to create a spatial blueprint.</div>}
    {error && <div style={{ background: 'rgba(239,68,68,.14)', border: '1px solid rgba(239,68,68,.4)', padding: 11, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
    {message && <div style={{ background: 'rgba(16,185,129,.14)', border: '1px solid rgba(16,185,129,.4)', padding: 11, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
    <article style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>{(['3D', '4D', '5D'] as Dimension[]).map(value => <button type="button" key={value} onClick={() => { setDimension(value); setPrompt(`Build a ${value} premium website for ${projectTitle}`); haptic(); }} style={{ background: dimension === value ? '#06b6d4' : '#0f172a', color: dimension === value ? '#082f49' : '#e2e8f0', border: 0, borderRadius: 8, padding: '9px 16px', fontWeight: 800 }}>{value}</button>)}</div>
      <label>Describe the experience<textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Build a 5D luxury boutique with floating product layers…" /></label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}><button type="button" disabled={busy || !projectId || round > 3} onClick={() => void requestBlueprint(round, feedback)} style={{ background: '#6366f1', color: '#fff', border: 0, borderRadius: 8, padding: '10px 14px', fontWeight: 800 }}>{busy ? 'Researching…' : `Research & propose blueprint ${round}/3`}</button><label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={sensory} onChange={event => setSensory(event.target.checked)} /> Enable gyroscope/haptics</label><label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={audio} onChange={toggleAudio} /> Spatial audio</label></div>
    </article>
    <article style={{ background: '#020617', borderRadius: 18, padding: 12, marginBottom: 16, border: '1px solid rgba(125,211,252,.25)' }}><canvas ref={canvasRef} width="2" height="2" style={{ display: 'none' }} /><SpatialCanvas tier={tier} tilt={tilt} scroll={scroll} enabled={Boolean(profile?.webgl) && tier !== 'fallback'} reducedMotion={motionReduced} /><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', color: '#94a3b8', fontSize: 12, padding: '9px 2px 0' }}><span>Adaptive tier: <strong style={{ color: '#e0f2fe' }}>{tier}</strong> · {profile?.webgl ? 'WebGL' : 'CSS fallback'} · {profile?.cores || '—'} cores</span><span>Scroll time: {Math.round(scroll * 100)}% · Tilt: {tilt.toFixed(2)} · {motionReduced ? 'Reduced motion' : 'Motion enabled'}</span></div></article>
    {blueprint && <article style={{ background: '#1e293b', borderRadius: 16, padding: 18, border: '1px solid rgba(167,139,250,.4)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><div><span style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 800 }}>BLUEPRINT PROPOSAL · ROUND {blueprint.round}/3</span><h3 style={{ margin: '6px 0' }}>{blueprint.title}</h3><p style={{ color: '#cbd5e1' }}>{blueprint.rationale}</p></div><span style={{ color: '#a7f3d0', fontSize: 12 }}>Not applied yet</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 9 }}><div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}><strong>3D spatial</strong><p style={{ color: '#94a3b8', fontSize: 12 }}>{blueprint.layers.spatial3D.enabled ? `${blueprint.layers.spatial3D.material} · ${blueprint.layers.spatial3D.shader}` : 'Off'}</p></div><div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}><strong>4D temporal</strong><p style={{ color: '#94a3b8', fontSize: 12 }}>{blueprint.layers.temporal4D.enabled ? `${blueprint.layers.temporal4D.scrollScenes.length} scroll scenes` : 'Off'}</p></div><div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}><strong>5D sensory</strong><p style={{ color: '#94a3b8', fontSize: 12 }}>{blueprint.layers.sensory5D.enabled ? [blueprint.layers.sensory5D.gyroscope && 'gyro', blueprint.layers.sensory5D.haptics && 'haptics', blueprint.layers.sensory5D.audio && 'audio'].filter(Boolean).join(' · ') || 'enabled' : 'Off'}</p></div><div style={{ background: '#0f172a', borderRadius: 10, padding: 12 }}><strong>Performance</strong><p style={{ color: '#94a3b8', fontSize: 12 }}>{blueprint.performance.lowTierFallback} · {blueprint.performance.targetFps}</p></div></div><label style={{ marginTop: 13 }}>If rejected, describe the next direction<textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="White marble, green emeralds, slower camera path…" /></label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}><button type="button" disabled={busy || round >= 3} onClick={() => void requestBlueprint(round + 1, feedback)} style={{ background: '#334155', color: '#fff', border: 0, borderRadius: 8, padding: '9px 12px' }}>Reject &amp; research round {round + 1}</button><button type="button" disabled={busy} onClick={() => void approveBlueprint()} style={{ background: '#10b981', color: '#052e16', border: 0, borderRadius: 8, padding: '9px 12px', fontWeight: 800 }}>Approve &amp; save blueprint</button></div></article>}
    {savedBlueprint && <div style={{ color: '#86efac', marginTop: 12 }}>Saved spatial blueprint version {savedBlueprint.version}. <button type="button" onClick={() => onUseBlueprint?.(`${prompt}\n\nApproved spatial blueprint: ${JSON.stringify(savedBlueprint)}`)} style={{ marginLeft: 8, background: '#06b6d4', color: '#082f49', border: 0, borderRadius: 8, padding: '8px 11px', fontWeight: 800 }}>Use blueprint in builder</button></div>}
  </section>;
}
