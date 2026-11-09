// Escape the Ring, country edition. Every frame comes precomputed from raceSim.mjs (via scripts/race.mjs).
// The last second before the winning escape plays in slow motion with the camera on the winner.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {CX, CY, BALL, RINGS, GAP_HALF, ringAngle, toSim, toOut, slowAt, raceLen} from './raceSim.mjs';

const FONT = 'Bricolage Grotesque Variable';
export const OUTRO = 150;
export const raceFrames = (p) => raceLen(p.end ?? 60) + OUTRO;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const hue = (k) => [330, 280, 200, 150, 45][k % 5];

const arc = (R, a0, a1) => {
  const p = (a) => `${CX + Math.cos(a) * R} ${CY + Math.sin(a) * R}`;
  return `M ${p(a0)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
};
const pop = (f, at, len = 40) => interpolate(f - at, [0, 5, len - 8, len], [0, 1, 1, 0], cl);

export const Race = ({countries = [], frames = [[]], breaks = [], bounces = [], close = [], winner = 0, seed = 1, end = 60, music = true}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const sf = Math.min(toSim(f, end), end - 1), rf = Math.floor(sf), fr = sf - rf;
  const at = (i) => { const a = frames[rf]?.[i] ?? [CX, CY], b = frames[Math.min(rf + 1, end - 1)]?.[i] ?? a; return [a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr]; };
  const broken = breaks.filter((b) => b.frame <= rf).length, out = f - raceLen(end), finalRing = broken === RINGS.length - 1;
  const hit = bounces.some((b) => b <= rf && rf - b < 3);
  const score = countries.map((c, i) => ({c, i, n: breaks.filter((b) => b.by === i && b.frame <= rf).length})).sort((a, b) => b.n - a.n);
  const toast = breaks.slice(0, -1).find((b) => f >= toOut(b.frame, end) && f < toOut(b.frame, end) + 45);
  const near = close.find((c) => f >= toOut(c.frame, end) && f < toOut(c.frame, end) + 40 && !toast);
  const W = countries[winner] ?? {}, win = out >= 0 ? spring({frame: out, fps, config: {damping: 12}}) : 0;
  // camera: push in on the winner during the slow motion, ease back out for the celebration
  const cam = interpolate(f, [slowAt(end), slowAt(end) + 20, raceLen(end) - 4, raceLen(end) + 8], [0, 1, 1, 0], cl);
  const [wx, wy] = at(winner), slow = f >= slowAt(end) && out < 0;

  return <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 52%, #1b2a6b 0%, #0b1033 55%, #05061a 100%)', fontFamily: FONT, color: '#fff', overflow: 'hidden'}}>
    {music && <Audio src={staticFile('race-sound.wav')} />}
    <AbsoluteFill style={{transformOrigin: `${wx}px ${wy}px`, transform: `translate(${(CX - wx) * cam}px, ${(CY - wy) * cam}px) scale(${1 + cam * 0.6})`}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.35))'}}>
        {RINGS.map((R, k) => {
          const br = breaks.find((b) => b.ring === k), bf = br ? toOut(br.frame, end) : Infinity;
          if (f < bf) {
            const a = ringAngle(k, sf, seed), on = k === broken, red = on && finalRing;
            const light = on ? (hit ? 78 : 60) : 45;
            return <path key={k} d={arc(R, a + GAP_HALF, a - GAP_HALF + Math.PI * 2)} fill="none" strokeLinecap="round"
              stroke={red ? `hsl(0 95% ${light + Math.sin(f / 3) * 8}%)` : `hsl(${hue(k)} 95% ${light}%)`} strokeWidth={on ? (hit ? 18 : 14) : 9} opacity={on ? 1 : 0.55} />;
          }
          const t = (f - bf) / 30; // shatter: the ring flies apart for a second
          if (t > 1.1) return null;
          const a0 = ringAngle(k, br.frame, seed), span = Math.PI * 2 - GAP_HALF * 2;
          return <g key={k} opacity={1 - t / 1.1}>{Array.from({length: 18}, (_, j) => {
            const a = a0 + GAP_HALF + (j / 18) * span, push = t * (120 + (j % 4) * 40), px = CX + Math.cos(a) * (R + push), py = CY + Math.sin(a) * (R + push);
            return <path key={j} d={arc(R + push, a, a + (span / 18) * 0.8)} fill="none" stroke={`hsl(${hue(k)} 95% 62%)`} strokeWidth={12} strokeLinecap="round" transform={`rotate(${t * (j % 2 ? 90 : -90)} ${px} ${py})`} />;
          })}</g>;
        })}
      </svg>
      {countries.map((c, i) => {
        const [x, y] = at(i), isW = i === winner;
        if (out >= 0 && !isW) return null;
        const s = isW ? 1 + win * 2.2 : 1, X = isW ? interpolate(win, [0, 1], [x, CX]) : x, Y = isW ? interpolate(win, [0, 1], [y, CY - 40]) : y;
        return <React.Fragment key={c.name}>
          {out < 0 && [3, 2, 1].map((k) => { const p = frames[Math.max(0, rf - k * 2)]?.[i]; return p && <div key={k} style={{position: 'absolute', left: p[0] - BALL, top: p[1] - BALL, width: BALL * 2, height: BALL * 2, borderRadius: '50%', background: c.color, opacity: 0.12 * (4 - k)}} />; })}
          <div style={{position: 'absolute', left: X - BALL, top: Y - BALL, width: BALL * 2, height: BALL * 2, transform: `scale(${s})`, borderRadius: '50%',
            background: '#fff', border: `5px solid ${c.color}`, boxShadow: `0 0 18px ${c.color}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58, lineHeight: 1}}>{c.flag}</div>
          {out < 0 && <div style={{position: 'absolute', left: x - 60, width: 120, top: y + BALL + 2, textAlign: 'center', fontSize: 22, fontWeight: 800, textShadow: '0 2px 6px #000'}}>{c.code}</div>}
        </React.Fragment>;
      })}
    </AbsoluteFill>

    <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontWeight: 800, fontSize: 92, lineHeight: 1, letterSpacing: -2}}>
      WHICH COUNTRY<br /><span style={{color: '#ffd23f'}}>ESCAPES FIRST?</span>
    </div>
    <div style={{position: 'absolute', top: 340, width: '100%', textAlign: 'center', fontSize: finalRing ? 52 : 40, fontWeight: 800,
      color: finalRing ? '#ff4d4d' : '#fff', opacity: finalRing ? 0.75 + Math.sin(f / 4) * 0.25 : 0.85}}>
      {slow ? '🎥 SLOW MOTION' : f < 75 ? 'Pick your winner before it ends 👇' : finalRing ? '⚠️ FINAL RING' : `Ring ${Math.min(broken + 1, RINGS.length)} of ${RINGS.length}`}
    </div>

    {toast && <div style={{position: 'absolute', top: 1560, width: '100%', textAlign: 'center', fontSize: 56, fontWeight: 800, opacity: pop(f, toOut(toast.frame, end), 45)}}>
      {countries[toast.by]?.flag} {countries[toast.by]?.name} broke ring {toast.ring + 1}!</div>}
    {near && <div style={{position: 'absolute', top: 1560, width: '100%', textAlign: 'center', fontSize: 56, fontWeight: 800, color: '#ffd23f',
      opacity: pop(f, toOut(near.frame, end)), transform: `scale(${1 + 0.15 * Math.max(0, 1 - (f - toOut(near.frame, end)) / 8)})`}}>
      SO CLOSE 😱 {countries[near.by]?.flag}</div>}

    {/* live scoreboard: rings broken per country, leader in gold */}
    {out < 0 && <div style={{position: 'absolute', top: 1680, left: 30, right: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 14px', fontSize: 30, fontWeight: 800}}>
      {score.map(({c, n}, k) => <span key={c.name} style={{padding: '6px 16px', borderRadius: 40, background: n && k === 0 ? '#ffd23f' : 'rgba(255,255,255,0.12)', color: n && k === 0 ? '#111' : '#fff'}}>
        {c.flag} {c.name} {'●'.repeat(n) || '○'}</span>)}
    </div>}

    {out >= 0 && <>
      <div style={{position: 'absolute', top: 1260, width: '100%', textAlign: 'center', fontWeight: 800, fontSize: 110, letterSpacing: -2, transform: `scale(${win})`, color: '#ffd23f'}}>
        {(W.name ?? '').toUpperCase()} WINS 🏆</div>
      <div style={{position: 'absolute', top: 1450, width: '100%', textAlign: 'center', fontSize: 46, fontWeight: 700, opacity: interpolate(out, [30, 45], [0, 1], cl)}}>
        Did you guess it? 👀<br />Comment your country to join the next race</div>
      {Array.from({length: 70}, (_, j) => { const a = j * 2.39, v = 9 + (j % 7) * 3, t = out;
        return <div key={j} style={{position: 'absolute', left: CX + Math.cos(a) * v * t, top: CY - 40 + Math.sin(a) * v * t + 0.25 * t * t, width: 16, height: 10,
          background: `hsl(${(j * 47) % 360} 90% 60%)`, transform: `rotate(${t * (j % 2 ? 12 : -12)}deg)`, opacity: interpolate(out, [60, 110], [1, 0], cl)}} />; })}
    </>}
  </AbsoluteFill>;
};
