// "System blueprint": one big diagram of an AI system that builds up piece by piece on grid paper, then holds on the
// full packed diagram so people pause and zoom in. Scene lengths come from the voice (tools/story_sound.py).
import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/archivo';

const FPS = 30, TITLE = 'Bricolage Grotesque Variable', BODY = 'Archivo Variable', NAVY = '#14213d';
export const blueprintFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
// 12 card slots around the hub (card centres), then the app row along the bottom.
const SLOTS = [[180, 560], [540, 560], [900, 560], [180, 770], [900, 770], [180, 980], [900, 980], [180, 1190], [900, 1190], [180, 1400], [540, 1400], [900, 1400]];
const HUB = [540, 980], CW = 300, CH = 168, APPY = 1580, FOCUS = [540, 1060];

const bez = ([x0, y0], [x1, y1]) => `M${x0} ${y0} C${(x0 + x1) / 2} ${y0} ${(x0 + x1) / 2} ${y1} ${x1} ${y1}`;
const onBez = ([x0, y0], [x1, y1], u) => { const m = (x0 + x1) / 2, k = 1 - u;
  return [k ** 3 * x0 + 3 * k * k * u * m + 3 * k * u * u * m + u ** 3 * x1, k ** 3 * y0 + 3 * k * k * u * y0 + 3 * k * u * u * y1 + u ** 3 * y1]; };

export const Blueprint = ({title = '', hub = {}, agents = [], apps = [], cost, keyword = '', scenes = [], music = true}) => {
  const f = useCurrentFrame();
  // which scene we are in, and when each element first appears
  let acc = 0, si = 0;
  const shown = {};
  scenes.forEach((s, i) => { (s.reveal ?? []).forEach((id) => { shown[id] ??= acc; }); if (f >= acc) si = i; acc += s.sec * FPS; });
  const sStart = scenes.slice(0, si).reduce((t, s) => t + s.sec * FPS, 0), sc = scenes[si] ?? {}, lf = f - sStart;
  const ghost = si === 0; // the hook: a faint outline of the full system first
  const appear = (id) => (ghost && !['cost', 'cta'].includes(id) ? 1 : shown[id] == null ? 0 : spring({frame: f - shown[id], fps: FPS, config: {damping: 14}}));
  const pos = Object.fromEntries(agents.map((a, i) => [a.id, SLOTS[i]]));
  const appPos = Object.fromEntries(apps.map((a, i) => [a.id, [90 + (i * 900) / Math.max(1, apps.length - 1), APPY]]));
  const where = (id) => (id === 'hub' ? HUB : pos[id] ?? appPos[id]);

  // camera: lean in on what this scene adds, pull out to the whole diagram for the end
  const camOf = (s) => { const pts = (s?.reveal ?? []).map(where).filter(Boolean);
    if (s?.cam === 'out' || !pts.length) return [...FOCUS, 1];
    return [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length, pts.length > 2 ? 1.12 : 1.32]; };
  const a = camOf(scenes[si - 1] ?? {cam: 'out'}), b = camOf(sc), k = interpolate(lf, [0, 20], [0, 1], cl), e = k * k * (3 - 2 * k);
  const [fx, fy, z] = a.map((v, i) => v + (b[i] - v) * e);
  const cx = Math.max(540 / z, Math.min(1080 - 540 / z, fx)); // never show past the paper's edges

  const card = (ag, i) => { const [x, y] = pos[ag.id], s = appear(ag.id); if (!s) return null;
    return <div key={ag.id} style={{position: 'absolute', left: x - CW / 2, top: y - CH / 2, width: CW, height: CH, transform: `scale(${s})`, background: '#fff',
      border: `3px solid ${ag.color}`, borderRadius: 16, boxShadow: '0 6px 18px rgba(20,33,61,0.12)', padding: '12px 14px', fontFamily: BODY, color: NAVY, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <span style={{background: ag.color, color: '#fff', borderRadius: 8, fontSize: 17, fontWeight: 800, padding: '2px 7px'}}>{String(i + 1).padStart(2, '0')}</span>
        <span style={{fontSize: 26}}>{ag.emoji}</span>
        <span style={{fontSize: 22, fontWeight: 800, lineHeight: 1.05}}>{ag.name}</span>
      </div>
      {(ag.lines ?? []).map((l) => <div key={l} style={{fontSize: 15.5, lineHeight: 1.25, marginTop: 5, color: '#475069'}}>• {l}</div>)}
    </div>; };

  return <AbsoluteFill style={{background: '#f6f8fc', overflow: 'hidden'}}>
    {music && <Audio src={staticFile('story-sound.wav')} />}
    <AbsoluteFill style={{opacity: ghost ? interpolate(lf, [0, 10], [0.5, 0.22], cl) : 1, filter: ghost ? 'grayscale(1)' : undefined, transformOrigin: '0 0', transform: `translate(${540 - cx * z}px, ${FOCUS[1] - fy * z}px) scale(${z})`}}>
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(#dde5f3 1px, transparent 1px), linear-gradient(90deg, #dde5f3 1px, transparent 1px), linear-gradient(#eef2f9 1px, transparent 1px), linear-gradient(90deg, #eef2f9 1px, transparent 1px)',
        backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {agents.map((ag, i) => { const s = appear(ag.id); if (!s) return null; const p = pos[ag.id];
          return <g key={ag.id}>
            <path d={bez(HUB, p)} fill="none" stroke={ag.color} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, s)} opacity={0.85} />
            {s > 0.95 && [0, 0.5].map((o) => { const [dx, dy] = onBez(HUB, p, ((f / 50 + i * 0.17 + o) % 1)); return <circle key={o} cx={dx} cy={dy} r={5} fill={ag.color} />; })}
            {(ag.apps ?? []).map((id) => appPos[id] && appear(id) > 0 && <path key={id} d={`M${p[0]} ${p[1] + CH / 2} L${appPos[id][0]} ${APPY - 40}`} stroke={ag.color} strokeWidth={1.6} strokeDasharray="6 7" opacity={0.45 * s} />)}
          </g>; })}
      </svg>
      {agents.map(card)}
      {appear('hub') > 0 && <div style={{position: 'absolute', left: HUB[0] - 165, top: HUB[1] - 125, width: 330, height: 250, transform: `scale(${appear('hub')})`, background: NAVY, borderRadius: 22,
        boxShadow: '0 0 0 6px #ffd23f55, 0 12px 30px rgba(20,33,61,0.35)', color: '#fff', fontFamily: BODY, padding: 20, boxSizing: 'border-box', textAlign: 'center'}}>
        <div style={{fontSize: 44}}>🧠</div>
        <div style={{fontFamily: TITLE, fontSize: 30, fontWeight: 800, lineHeight: 1.05}}>{hub.name}</div>
        {(hub.lines ?? []).map((l) => <div key={l} style={{fontSize: 16, opacity: 0.8, marginTop: 5}}>{l}</div>)}
      </div>}
      {apps.map((ap) => { const s = appear(ap.id); if (!s) return null; const [x, y] = appPos[ap.id];
        return <div key={ap.id} style={{position: 'absolute', left: x - 50, top: y - 40, width: 100, textAlign: 'center', transform: `scale(${s})`, fontFamily: BODY}}>
          <div style={{width: 76, height: 76, margin: '0 auto', borderRadius: 20, background: '#fff', border: '2px solid #c9d3e6', boxShadow: '0 4px 10px rgba(20,33,61,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>{ap.emoji}</div>
          <div style={{fontSize: 17, fontWeight: 700, color: NAVY, marginTop: 6}}>{ap.label}</div>
        </div>; })}
    </AbsoluteFill>

    {/* title band stays put while the camera moves */}
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 400, background: 'linear-gradient(#f6f8fc 78%, rgba(246,248,252,0))'}} />
    <div style={{position: 'absolute', top: 110, left: 50, right: 50, textAlign: 'center', fontFamily: TITLE, fontWeight: 800, fontSize: 76, lineHeight: 1.02, letterSpacing: -2, color: NAVY}}>
      {title.split(/(\[[^\]]+\])/).map((p, i) => p.startsWith('[') ? <span key={i} style={{background: 'linear-gradient(transparent 58%, #ffd23f 58%)'}}>{p.slice(1, -1)}</span> : p)}
    </div>

    {cost && shown.cost != null && <div style={{position: 'absolute', top: 1680, width: '100%', textAlign: 'center', fontFamily: BODY, opacity: appear('cost'), transform: `scale(${0.8 + 0.2 * appear('cost')})`}}>
      <span style={{display: 'inline-block', background: '#0f9d58', color: '#fff', fontWeight: 800, fontSize: 40, padding: '12px 30px', borderRadius: 50}}>💵 Runs for about ${cost.total} a month*</span>
      <div style={{fontSize: 18, color: '#58627a', marginTop: 10, padding: '0 60px'}}>*{cost.note}</div>
    </div>}
    {shown.cta != null && <div style={{position: 'absolute', top: 1810, width: '100%', textAlign: 'center', fontFamily: TITLE, fontWeight: 800, fontSize: 46, color: NAVY, opacity: appear('cta')}}>
      Comment <span style={{background: NAVY, color: '#ffd23f', padding: '2px 16px', borderRadius: 10}}>{keyword}</span> for the blueprint 👇
    </div>}
    {sc.vo && !(f >= (shown.cost ?? Infinity)) && <div style={{position: 'absolute', bottom: 120, left: 70, right: 70, textAlign: 'center'}}>
      <span style={{background: NAVY, color: '#fff', fontFamily: BODY, fontWeight: 700, fontSize: 38, lineHeight: 1.35, padding: '8px 18px', borderRadius: 12, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
        opacity: interpolate(lf, [0, 6], [0, 1], cl)}}>{sc.vo}</span>
    </div>}
  </AbsoluteFill>;
};
