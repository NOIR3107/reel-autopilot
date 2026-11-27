// Lyric-panel motivation reel: grainy black-and-white "footage" (silhouettes at glowing chart screens, drawn in SVG),
// words landing one at a time in bold white with a small yellow lead word, and a red brush-script hook over a bright chart.
// Words and timing come from a JSON script (data/lyric-*.json); tools/lyric_beat.py makes the matching original beat.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/kaushan-script/400.css';

const FPS = 30, clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const lyricSeconds = (s) => {
  const last = s.segments[s.segments.length - 1];
  return (last.beat + last.beats + s.tail) * 60 / s.bpm;
};
const rnd = (i) => { const x = Math.sin(i * 91.7) * 43758.55; return x - Math.floor(x); };

// rising candlestick series (growth, with pullbacks)
const candles = (n, seed, rise) => {
  let v = 50; const out = [];
  for (let i = 0; i < n; i++) {
    const o = v, c = v + (rnd(seed + i) - 0.42) * 9 + rise;
    out.push({o, c, h: Math.max(o, c) + rnd(seed + i + 50) * 4, l: Math.min(o, c) - rnd(seed + i + 90) * 4}); v = c;
  }
  return out;
};
const linePts = (n, seed, w, h, x0, y0) => Array.from({length: n}, (_, i) => `${x0 + i * w / (n - 1)},${y0 + h - (i / n) * h * 0.7 - rnd(seed + i) * h * 0.3}`).join(' ');

const Person = ({x, y, s = 1, sit, step = 0}) => ( // a soft black silhouette
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#soft)">
    <ellipse cx={0} cy={-210} rx={46} ry={56} fill="#050505" />
    <path d="M-28,-160 Q0,-150 28,-160 L34,-140 Q110,-128 122,-40 L140,140 L-140,140 L-122,-40 Q-110,-128 -34,-140 Z" fill="#050505" />
    {!sit && <><path d={`M-70,130 L${-60 + step * 30},420 L${-20 + step * 30},420 L-5,140 Z`} fill="#050505" /><path d={`M70,130 L${60 - step * 30},420 L${20 - step * 30},420 L5,140 Z`} fill="#050505" /></>}
  </g>
);

const Screen = ({x, y, w, h, t, seed, bright = 1, chart = 'line'}) => {
  const k = interpolate(t, [0, 1.2], [0.3, 1], clamp);
  return (
    <g>
      <rect x={x - 30} y={y - 30} width={w + 60} height={h + 60} fill="#fff" opacity={0.12 * bright} filter="url(#glow)" />
      <rect x={x} y={y} width={w} height={h} fill={`rgb(${200 * bright},${200 * bright},${200 * bright})`} />
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={x} x2={x + w} y1={y + h * g} y2={y + h * g} stroke="#0002" strokeWidth={2} />)}
      {chart === 'line'
        ? <polyline points={linePts(28, seed, w * 0.9 * k, h * 0.75, x + w * 0.05, y + h * 0.1)} fill="none" stroke="#222" strokeWidth={5} />
        : candles(26, seed, 1.6).slice(0, Math.ceil(26 * k)).map((c, i) => {
            const cx = x + 30 + i * (w - 60) / 26, sy = (v) => y + h - 30 - (v - 20) * (h - 60) / 120;
            return <g key={i}><line x1={cx} x2={cx} y1={sy(c.h)} y2={sy(c.l)} stroke="#222" strokeWidth={3} /><rect x={cx - 7} y={sy(Math.max(c.o, c.c))} width={14} height={Math.max(3, Math.abs(sy(c.o) - sy(c.c)))} fill={c.c > c.o ? '#fff' : '#222'} stroke="#222" strokeWidth={3} /></g>;
          })}
    </g>
  );
};

// each scene is a dim room; t = seconds into the segment (drives the slow push-in and small moves)
const Scene = ({kind, t, seed}) => {
  const push = 1 + t * 0.035;
  const room = (children, light = 0.18) => (
    <svg width={1080} height={1920} style={{position: 'absolute', transform: `scale(${push})`}}>
      <defs>
        <filter id="soft"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id="glow" x="-0.5" y="-0.5" width="2" height="2"><feGaussianBlur stdDeviation="40" /></filter>
        <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.35" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.92" /></radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`rgb(${light * 255 * 0.5},${light * 255 * 0.5},${light * 255 * 0.5})`} />
      <rect y={1350} width={1080} height={570} fill="#141414" /><rect y={1350} width={1080} height={8} fill="#2a2a2a" />
      {children}
      <rect width={1080} height={1920} fill="url(#vig)" />
    </svg>
  );
  if (kind === 'screen') return room(<><Screen x={60} y={520} w={1100} h={860} t={t} seed={seed} bright={0.95} />
    <Person x={430 + t * 14} y={1720} s={2.6} sit /></>);
  if (kind === 'desk') return room(<>
    <rect x={760} y={300} width={22} height={900} fill="#fff" opacity={0.7} filter="url(#soft)" />
    <rect x={720} y={300} width={110} height={900} fill="#fff" opacity={0.12} filter="url(#glow)" />
    <rect x={600} y={1120} width={420} height={18} fill="#2a2a2a" />
    <g transform="translate(700 860) skewX(-6)"><rect width={300} height={210} fill="#d8dde3" /><rect x={20} y={20} width={260} height={170} fill="#aeb6c0" opacity={0.6} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={30} y={35 + i * 30} width={120 + rnd(seed + i) * 120} height={10} fill="#556" opacity={0.6} />)}</g>
    <rect x={620} y={900} width={500} height={400} fill="#fff" opacity={0.08} filter="url(#glow)" />
    <rect x={120} y={380} width={520} height={900} fill="#fff" opacity={0.55} filter="url(#glow)" />
    <rect x={170} y={430} width={420} height={800} fill="#cfcfcf" opacity={0.6} />
    {[0, 1].map((i) => <rect key={i} x={170 + i * 210} y={430} width={8} height={800} fill="#222" />)}
    <Person x={380} y={1500} s={1.9} sit /></>, 0.16);
  if (kind === 'walk') return room(<><Screen x={-40} y={300} w={1160} h={950} t={t} seed={seed + 7} chart="candles" bright={0.9} />
    <Person x={260 + t * 170} y={1260} s={1.3} step={Math.sin(t * 7)} /></>);
  if (kind === 'window') return room(<>
    {Array.from({length: 20}, (_, i) => <rect key={i} x={240} y={300 + i * 52} width={600} height={30} fill="#fff" opacity={0.8} filter="url(#soft)" />)}
    <rect x={200} y={260} width={680} height={1080} fill="#fff" opacity={0.2} filter="url(#glow)" />
    <Person x={560 - t * 20} y={1380} s={1.5} /></>, 0.08);
  if (kind === 'stairs') return room(<>
    <rect x={0} y={0} width={1080} height={700} fill="#fff" opacity={0.25} filter="url(#glow)" />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={0} y={1700 - i * 130} width={1080 - i * 70} height={130} fill={`rgb(${30 + i * 14},${30 + i * 14},${30 + i * 14})`} />)}
    <Person x={300 + t * 60} y={1300 - t * 90} s={0.9} step={Math.sin(t * 6)} /></>, 0.15);
  // 'chart': bright white chart, the hook lives here
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', transform: `scale(${1 + t * 0.03})`}}>
      <defs><radialGradient id="vig2" cx="0.5" cy="0.5" r="0.7"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient></defs>
      <rect width={1080} height={1920} fill="#f4f4f4" />
      {Array.from({length: 12}, (_, i) => <g key={i}><line x1={0} x2={1080} y1={160 * i} y2={160 * i} stroke="#ddd" strokeWidth={2} /><text x={1000} y={160 * i - 10} fontSize={22} fill="#999" fontFamily="Montserrat">{(81000 - i * 1100).toLocaleString()}</text></g>)}
      {candles(34, seed, 2.4).map((c, i) => {
        const cx = 40 + i * 28, sy = (v) => 1700 - (v - 30) * 9;
        return <g key={i}><line x1={cx} x2={cx} y1={sy(c.h)} y2={sy(c.l)} stroke="#111" strokeWidth={3} /><rect x={cx - 9} y={sy(Math.max(c.o, c.c))} width={18} height={Math.max(4, Math.abs(sy(c.o) - sy(c.c)))} fill={c.c > c.o ? '#f4f4f4' : '#111'} stroke="#111" strokeWidth={3} /></g>;
      })}
      <rect width={1080} height={1920} fill="url(#vig2)" />
    </svg>
  );
};

const STYLE = {s: {size: 54, color: '#fff', weight: 800}, y: {size: 54, color: '#ffd400', weight: 900}, m: {size: 92, color: '#fff', weight: 900}, b: {size: 150, color: '#fff', weight: 900}};

export const Lyric = ({script, audio}) => {
  const f = useCurrentFrame(), t = f / FPS, beat = 60 / script.bpm;
  const segs = script.segments;
  const seg = [...segs].reverse().find((s) => t >= s.beat * beat) || segs[0];
  const si = segs.indexOf(seg), st = t - seg.beat * beat, len = seg.beats * beat;
  const flash = interpolate(st, [0, 0.12], [0.5, 0], clamp), serif = seg.hookStyle === 'serif';
  const shake = Math.sin(f * 1.7) * 2 + Math.cos(f * 2.3) * 2;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: seg.hook ? 'contrast(1.1)' : 'grayscale(1) contrast(1.25) brightness(0.95)', transform: `translate(${shake}px, ${-shake}px)`}}>
        <Scene kind={seg.scene} t={st} seed={si * 17 + 3} />
      </AbsoluteFill>
      {/* film grain + a breathing flicker */}
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: 0.22, mixBlendMode: 'overlay'}}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 17} /></filter>
        <rect width={1080} height={1920} filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{background: '#000', opacity: 0.06 + 0.05 * Math.sin(f * 0.9)}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />

      {seg.lines && (
        <div style={{position: 'absolute', top: 1010, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Montserrat', lineHeight: 0.95, textAlign: 'center'}}>
          {seg.lines.map(([k, w], i) => {
            const at = (i * len * 0.7) / seg.lines.length, a = st - at, S = STYLE[k];
            if (a < 0) return <div key={i} style={{height: S.size}} />;
            return <div key={i} style={{fontSize: S.size, fontWeight: S.weight, color: S.color, letterSpacing: k === 'b' ? -2 : 1,
              textShadow: '0 6px 30px #000c', transform: `scale(${interpolate(a, [0, 0.09], [1.35, 1], clamp)})`, opacity: interpolate(a, [0, 0.06], [0, 1], clamp)}}>{w}</div>;
          })}
        </div>
      )}
      {seg.hook && (
        <div style={{position: 'absolute', top: serif ? 640 : 700, left: 0, right: 0, textAlign: 'center', fontFamily: serif ? 'Lora, Georgia, serif' : '"Kaushan Script"', fontWeight: serif ? 700 : 400, color: '#ec1c24', lineHeight: serif ? 0.95 : 0.85,
          textShadow: serif ? '0 6px 30px #0004' : '0 4px 0 #9b0d12, 0 10px 40px #0005', transform: `rotate(${serif ? 0 : -6}deg) scale(${interpolate(st, [0, 0.12], [1.3, 1], clamp) * (1 + st * 0.02)})`}}>
          {seg.hook.map((w, i) => (
            <div key={i} style={{fontSize: serif ? 300 : 215 - i * 5, letterSpacing: serif ? -8 : 0, opacity: st >= (seg.wordAt ? seg.wordAt[i] : i * beat * 0.5) ? 1 : 0, marginLeft: serif ? 0 : i ? 60 : -120}}>{w}</div>
          ))}
          {seg.outro && <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: 46, color: '#fff', background: '#111', display: 'inline-block', padding: '14px 28px', marginTop: serif ? 120 : 260, transform: `rotate(${serif ? 0 : 6}deg)`,
            opacity: interpolate(st, seg.outroAt ? [seg.outroAt, seg.outroAt + 0.3] : [beat * 2.5, beat * 3], [0, 1], clamp)}}>{seg.outro.toUpperCase()}</div>}
        </div>
      )}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
