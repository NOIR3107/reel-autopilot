// "Last country standing" in the viral ring style: black screen, thin white circle, glowing flag balls, a fan of neon lines
// from each ball to every spot it bounced. Physics lives in ringSim.mjs (seeded, India wins).
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {simulate, SEED, TEAMS, WIN, FPS, CX, CY, R, BR} from './ringSim.mjs';

const SIM = simulate(SEED);
const OUTS = SIM.events.filter((e) => e.type === 'out');
export const ringSeconds = () => SIM.frames.length / FPS;
export const ringEvents = () => ({outs: OUTS.map((e) => +e.t.toFixed(2)), bounces: SIM.events.filter((e) => e.type === 'bounce').map((e) => +e.t.toFixed(2)),
  cuts: SIM.events.filter((e) => e.type === 'cut').map((e) => +e.t.toFixed(2)), end: +(SIM.end / FPS).toFixed(2), seconds: +ringSeconds().toFixed(2)});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const FONT = 'Helvetica, Arial, sans-serif';

const star = (cx, cy, r, rot = 0) => Array.from({length: 10}, (_, k) => {
  const a = rot - Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.4 : r;
  return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
}).join(' ');

// Flags drawn as vectors in a -1..1 box (crisp at any size, no emoji font needed)
const FLAG = {
  us: <>{Array.from({length: 13}, (_, k) => <rect key={k} x={-1.4} y={-1 + k * 0.154} width={2.8} height={0.155} fill={k % 2 ? '#fff' : '#c8102e'} />)}
    <rect x={-1.4} y={-1} width={1.3} height={1.08} fill="#1f3a93" />
    {Array.from({length: 12}, (_, k) => <circle key={k} cx={-1.2 + (k % 4) * 0.3} cy={-0.82 + Math.floor(k / 4) * 0.3} r={0.07} fill="#fff" />)}</>,
  cn: <><rect x={-1.4} y={-1} width={2.8} height={2} fill="#de2910" /><polygon points={star(-0.45, -0.3, 0.42)} fill="#ffde00" />
    {[[0.15, -0.75], [0.4, -0.45], [0.4, -0.05], [0.15, 0.25]].map(([x, y], k) => <polygon key={k} points={star(x, y, 0.13, k)} fill="#ffde00" />)}</>,
  in: <><rect x={-1.4} y={-1} width={2.8} height={0.67} fill="#ff9933" /><rect x={-1.4} y={-0.34} width={2.8} height={0.68} fill="#fff" />
    <rect x={-1.4} y={0.33} width={2.8} height={0.67} fill="#138808" /><circle r={0.27} fill="none" stroke="#000080" strokeWidth={0.06} />
    {Array.from({length: 12}, (_, k) => <line key={k} x1={0} y1={0} x2={Math.cos(k * 0.5236) * 0.27} y2={Math.sin(k * 0.5236) * 0.27} stroke="#000080" strokeWidth={0.03} />)}</>,
  br: <><rect x={-1.4} y={-1} width={2.8} height={2} fill="#009c3b" /><polygon points="0,-0.8 1.05,0 0,0.8 -1.05,0" fill="#ffdf00" />
    <circle r={0.42} fill="#002776" /><path d="M-0.42,0.02 Q0,-0.2 0.42,0.1" stroke="#fff" strokeWidth={0.08} fill="none" /></>,
  jp: <><rect x={-1.4} y={-1} width={2.8} height={2} fill="#fff" /><circle r={0.55} fill="#bc002d" /></>,
  de: <><rect x={-1.4} y={-1} width={2.8} height={0.67} fill="#111" /><rect x={-1.4} y={-0.34} width={2.8} height={0.68} fill="#dd0000" />
    <rect x={-1.4} y={0.33} width={2.8} height={0.67} fill="#ffce00" /></>,
};

const Ball = ({team, x, y, s = 1, glow = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={BR + 10} fill={team.color} opacity={0.22 * glow} filter="url(#blur)" />
    <g transform={`scale(${BR})`} clipPath="url(#disc)">{FLAG[team.id]}</g>
    <circle r={BR} fill="url(#shine)" />
    <circle r={BR} fill="none" stroke={team.color} strokeWidth={4} />
  </g>
);

export const Ring = ({music = true}) => {
  const f = useCurrentFrame(), t = f / FPS;
  const fr = SIM.frames[Math.min(f, SIM.frames.length - 1)];
  const endT = SIM.end / FPS, won = t >= endT;
  // little camera punch on every knockout
  const lastOut = OUTS.filter((e) => e.t <= t).pop();
  const punch = lastOut ? interpolate(t - lastOut.t, [0, 0.08, 0.5], [0, 1, 0], clamp) : 0;
  const zoom = 1 + punch * 0.04 + (won ? interpolate(t, [endT, endT + 1.2], [0, 0.08], clamp) : 0);
  const recentCut = SIM.events.filter((e) => e.type === 'cut' && e.t <= t && e.t > t - 0.15);
  const alive = fr.filter((b) => b.alive).length;

  return (
    <AbsoluteFill style={{background: '#000', fontFamily: FONT}}>
      {music && <Audio src={staticFile('ring-sound.wav')} />}
      <svg width={1080} height={1920} style={{position: 'absolute', transform: `scale(${zoom})`, transformOrigin: `${CX}px ${CY}px`}}>
        <defs>
          <clipPath id="disc"><circle r={1} /></clipPath>
          <filter id="blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="10" /></filter>
          <filter id="lineGlow" x="-0.2" y="-0.2" width="1.4" height="1.4"><feGaussianBlur stdDeviation="5" /></filter>
          <radialGradient id="shine" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.35" /></radialGradient>
        </defs>
        {/* lines: a soft glow pass, then the sharp neon pass */}
        {[0, 1].map((pass) => (
          <g key={pass} filter={pass ? undefined : 'url(#lineGlow)'} opacity={pass ? 0.95 : 0.8}>
            {fr.map((b, i) => b.alive && b.lines.map((a, k) => (
              <line key={`${i}-${k}`} x1={b.x} y1={b.y} x2={CX + Math.cos(a) * R} y2={CY + Math.sin(a) * R} stroke={TEAMS[i].color} strokeWidth={pass ? 1.6 : 4} />
            )))}
          </g>
        ))}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#fff" strokeWidth={4} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#fff" strokeWidth={14} opacity={0.12} filter="url(#lineGlow)" />
        {/* knockout bursts */}
        {OUTS.map((e, k) => {
          const age = t - e.t; if (age < 0 || age > 0.7) return null;
          const p = SIM.frames[Math.round(e.t * FPS)][e.i];
          return <g key={k}>
            <circle cx={p.x} cy={p.y} r={BR + age * 260} fill="none" stroke={TEAMS[e.i].color} strokeWidth={10 * (1 - age / 0.7)} opacity={1 - age / 0.7} />
            {Array.from({length: 10}, (_, j) => { const a = j * 0.628 + k; return <circle key={j} cx={p.x + Math.cos(a) * age * 320} cy={p.y + Math.sin(a) * age * 320} r={7 * (1 - age / 0.7)} fill={TEAMS[e.i].color} />; })}
          </g>;
        })}
        {recentCut.map((e, k) => { const p = fr[e.by]; return <circle key={k} cx={p.x} cy={p.y} r={BR + 14} fill="none" stroke="#fff" strokeWidth={3} opacity={0.7} />; })}
        {fr.map((b, i) => b.alive && <Ball key={i} team={TEAMS[i]} x={b.x} y={b.y} s={won && i === WIN ? interpolate(t, [endT, endT + 0.6], [1, 1.5], clamp) : 1} />)}
      </svg>

      {/* top: hook, then countries left */}
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: 74, letterSpacing: 1, opacity: interpolate(t, [0, 0.3], [0, 1], clamp)}}>
        LAST COUNTRY STANDING
      </div>
      <div style={{position: 'absolute', top: 245, left: 0, right: 0, textAlign: 'center', color: '#fff9', fontWeight: 700, fontSize: 40}}>
        {won ? ' ' : t < 3 ? 'touch a rival\'s line to cut it' : `${alive} left`}
      </div>

      {/* bottom scoreboard: lines left per country */}
      <div style={{position: 'absolute', top: 1490, left: 70, right: 70, opacity: won ? interpolate(t, [endT, endT + 0.4], [1, 0], clamp) : 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '22px 26px'}}>
        {TEAMS.map((tm, i) => {
          const b = fr[i], out = !b.alive;
          return <div key={tm.id} style={{width: 280, display: 'flex', alignItems: 'center', gap: 14, opacity: out ? 0.3 : 1}}>
            <svg width={56} height={56} viewBox="-30 -30 60 60"><g transform="scale(26)" clipPath="url(#disc2)"><clipPath id="disc2"><circle r={1} /></clipPath>{FLAG[tm.id]}</g><circle r={26} fill="none" stroke={tm.color} strokeWidth={3} /></svg>
            <div style={{color: out ? '#888' : '#fff', fontWeight: 800, fontSize: 34, flex: 1, textDecoration: out ? 'line-through' : 'none'}}>{tm.name}</div>
            <div style={{color: tm.color, fontWeight: 900, fontSize: 38, fontVariantNumeric: 'tabular-nums'}}>{out ? '✕' : b.lines.length}</div>
          </div>;
        })}
      </div>

      {/* knockout callout */}
      {lastOut && !won && t - lastOut.t < 1.1 && (
        <div style={{position: 'absolute', top: 1395, left: 0, right: 0, textAlign: 'center', color: TEAMS[lastOut.i].color, fontWeight: 900, fontSize: 64,
          transform: `scale(${interpolate(t - lastOut.t, [0, 0.12], [1.4, 1], clamp)})`, opacity: interpolate(t - lastOut.t, [0.8, 1.1], [1, 0], clamp)}}>
          {TEAMS[lastOut.i].name} IS OUT
        </div>
      )}

      {won && (
        <AbsoluteFill style={{background: `rgba(0,0,0,${interpolate(t, [endT + 1, endT + 1.6], [0, 0.55], clamp)})`}}>
          <div style={{position: 'absolute', top: 1410, left: 0, right: 0, textAlign: 'center', color: TEAMS[WIN].color, fontWeight: 900, fontSize: 120,
            transform: `scale(${interpolate(t, [endT + 0.2, endT + 0.45], [2, 1], clamp)})`, opacity: interpolate(t, [endT + 0.2, endT + 0.35], [0, 1], clamp), textShadow: `0 0 40px ${TEAMS[WIN].color}`}}>
            INDIA WINS
          </div>
          <div style={{position: 'absolute', top: 1570, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 50, opacity: interpolate(t, [endT + 1.2, endT + 1.6], [0, 1], clamp)}}>
            Comment the next country to race
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
