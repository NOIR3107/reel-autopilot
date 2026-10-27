// Survival choice series: a game-style status bar on top (hour, supplies, outside), muted flat scenes,
// big centered captions with one accent word, and a two-button choice at the end.
// Scene: {sec, vo, key, hud: {hour, water, power, outside}, shot: person|object|title|choice, who, mood, pose, object, set, fx}
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {Person} from './Person.jsx';
import {Set} from './StoryReel.jsx';

const FPS = 30;
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const COND = '"Arial Narrow", "Roboto Condensed", Arial, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const AMBER = '#f5b82e', RED = '#ff4b3e';
export const survivalFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/></svg>")`;

const Hud = ({hud, prevHud, local}) => {
  const cells = [['HOUR', hud.hour], ['WATER', hud.water], ['POWER', hud.power], ['OUTSIDE', hud.outside]];
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: 150, display: 'flex', gap: 10, fontFamily: COND}}>
      {cells.map(([k, v], i) => {
        const changed = prevHud && prevHud[k.toLowerCase()] !== v;
        const flash = changed ? interpolate(local, [0, 10, 24], [1, 1, 0], cl) : 0;
        const danger = /DANGER|UNKNOWN|DARK|0%|EMPTY/.test(String(v));
        return (
          <div key={k} style={{flex: 1, padding: '8px 10px', borderRadius: 10, background: `rgba(10,10,12,${0.72 + flash * 0.2})`, border: `2px solid ${flash ? AMBER : 'rgba(255,255,255,.12)'}`}}>
            <div style={{fontSize: 20, letterSpacing: '0.12em', color: 'rgba(255,255,255,.6)', fontWeight: 700}}>{k}</div>
            <div style={{fontSize: 40, fontWeight: 800, color: danger ? RED : '#fff', letterSpacing: '0.02em', lineHeight: 1.05}}>{v}</div>
          </div>);
      })}
    </div>
  );
};

// Objects: drawn flat, filling the frame like a close-up.
const Obj = ({type, local, talk}) => {
  const k = Math.min(1, local / 10);
  if (type === 'window') return (
    <svg viewBox="0 0 800 900" width="900"><rect x="40" y="40" width="720" height="820" rx="20" fill="#3b3a36" />
      <rect x="80" y="80" width="640" height="740" fill="#10131c" />
      {[[100, 560, 120, 260], [240, 470, 110, 350], [370, 520, 140, 300], [530, 430, 120, 390], [660, 600, 60, 220]].map(([x, y, w, h], i) =>
        <g key={i}><rect x={x} y={y} width={w} height={h} fill="#1b1f2b" />{Array.from({length: 8}, (_, j) => <rect key={j} x={x + 14 + (j % 3) * 32} y={y + 20 + Math.floor(j / 3) * 50} width="18" height="26" fill={local < 12 ? '#f5c86a' : '#22262f'} />)}</g>)}
      <path d="M400 80 L400 820 M80 450 L720 450" stroke="#3b3a36" strokeWidth="18" /></svg>);
  if (type === 'radio') return (
    <svg viewBox="0 0 800 640" width="880"><rect x="60" y="120" width="680" height="440" rx="40" fill="#d2552d" /><rect x="60" y="120" width="680" height="60" rx="30" fill="#b8461f" />
      <circle cx="250" cy="360" r="140" fill="#2a2a2a" />{Array.from({length: 49}, (_, i) => <circle key={i} cx={170 + (i % 7) * 27} cy={280 + Math.floor(i / 7) * 27} r="7" fill="#111" />)}
      <rect x="430" y="240" width="250" height="90" rx="10" fill="#f4e7c8" /><path d={`M${450 + ((local * 3) % 210)} 245 L${450 + ((local * 3) % 210)} 325`} stroke="#d2552d" strokeWidth="5" />
      <circle cx="555" cy="440" r="56" fill="#1f1f1f" /><path d="M300 120 L230 20" stroke="#555" strokeWidth="10" />
      {talk > 0.1 && [80, 120, 160].map((r) => <circle key={r} cx="250" cy="360" r={140 + r * talk} fill="none" stroke="#f5b82e" strokeWidth="5" opacity={0.6 - r / 400} />)}</svg>);
  if (type === 'door') return (
    <svg viewBox="0 0 800 1000" width="760"><rect x="120" y="40" width="560" height="940" fill="#6b4a32" /><rect x="160" y="80" width="480" height="420" fill="#5d3f2a" /><rect x="160" y="540" width="480" height="400" fill="#5d3f2a" />
      <rect x="520" y="470" width="90" height="150" rx="16" fill="#b9b2a5" /><rect x="545" y="530" width="40" height="18" rx="6" fill="#4a453d" transform={`rotate(${local > 40 ? 0 : 90} 565 539)`} />
      <circle cx="400" cy="300" r="26" fill="#2a2a2a" stroke="#999" strokeWidth="6" /></svg>);
  if (type === 'phone') {
    const pct = 31;
    return (
      <svg viewBox="0 0 500 900" width="520"><rect x="40" y="20" width="420" height="860" rx="60" fill="#111" /><rect x="62" y="44" width="376" height="812" rx="44" fill="#1d2230" />
        <text x="250" y="260" textAnchor="middle" fill="#fff" fontSize="96" fontFamily="Arial" fontWeight="700">9:14</text>
        <text x="250" y="320" textAnchor="middle" fill="#ff6b5b" fontSize="34" fontFamily="Arial">No Service</text>
        <rect x="150" y="430" width="200" height="90" rx="14" fill="none" stroke="#fff" strokeWidth="8" /><rect x="350" y="458" width="14" height="34" rx="4" fill="#fff" />
        <rect x="162" y="442" width={176 * pct / 100 * k} height="66" rx="8" fill="#ff4b3e" />
        <text x="250" y="590" textAnchor="middle" fill="#fff" fontSize="48" fontFamily="Arial" fontWeight="700">{pct}%</text></svg>);
  }
  if (type === 'text') {
    const buzz = local < 18 ? Math.sin(local * 2.4) * 10 : 0;
    const msg = "Don't open the door. It's not me.";
    const typed = msg.slice(0, Math.max(0, Math.floor((local - 22) / 1.4)));
    return (
      <svg viewBox="0 0 500 900" width="560" style={{transform: `translateX(${buzz}px) rotate(${buzz / 4}deg)`}}><rect x="40" y="20" width="420" height="860" rx="60" fill="#111" /><rect x="62" y="44" width="376" height="812" rx="44" fill="#0f141f" />
        <text x="250" y="150" textAnchor="middle" fill="#9aa4b4" fontSize="28" fontFamily="Arial">2:07 AM</text>
        <circle cx="250" cy="230" r="44" fill="#3b4b66" /><text x="250" y="243" textAnchor="middle" fill="#fff" fontSize="36" fontFamily="Arial" fontWeight="700">S</text>
        <text x="250" y="320" textAnchor="middle" fill="#fff" fontSize="36" fontFamily="Arial" fontWeight="700">Sam</text>
        {local > 16 && <><rect x="86" y="380" width="330" height={typed.length > 18 ? 150 : 96} rx="30" fill="#2b3446" />
          <text x="112" y="440" fill="#fff" fontSize="34" fontFamily="Arial">{typed.slice(0, 20)}</text>
          <text x="112" y="486" fill="#fff" fontSize="34" fontFamily="Arial">{typed.slice(21)}</text></>}
        {local > 16 && <text x="250" y="600" textAnchor="middle" fill="#ff4b3e" fontSize="26" fontFamily="Arial">Sam is not at your door</text>}
      </svg>);
  }
  if (type === 'water') return (
    <svg viewBox="0 0 700 800" width="760">{[0, 1, 2].map((j) => <g key={j} transform={`translate(${60 + j * 200} 120)`}>
      <rect x="0" y="80" width="170" height="520" rx="30" fill="rgba(200,230,255,.25)" stroke="#cfe6ff" strokeWidth="6" /><rect x="50" y="20" width="70" height="70" rx="10" fill="#3b82f6" />
      {j === 0 && <rect x="8" y={600 - 500 * (1 - k * 0.35)} width="154" height={500 * (1 - k * 0.35) - 8} rx="24" fill="#60a5fa" opacity=".8" />}</g>)}</svg>);
  return null;
};

export const Survival = ({scenes, mouth = [], part = 'PART 1 · LIGHTS OUT', music = true}) => {
  const frame = useCurrentFrame();
  let acc = 0;
  const timed = scenes.map((s) => { const start = Math.round(acc * FPS); acc += s.sec; return {...s, start, len: Math.round(s.sec * FPS)}; });
  const i = timed.findLastIndex((s) => frame >= s.start);
  const sc = timed[i], prev = timed[i - 1];
  const local = frame - sc.start;
  const talk = mouth[i]?.[local] ?? 0;
  const shot = sc.shot ?? 'person';
  const fx = sc.fx ?? [];
  const shake = fx.includes('knock') ? [0.15, 0.45, 0.75, 1.6, 1.9, 2.2].reduce((a, t) => a + Math.max(0, 14 - Math.abs(local - t * FPS) * 3), 0) : fx.includes('shake') ? interpolate(local, [0, 14], [20, 0], cl) : 0;
  const sx = shake * Math.sin(local * 3.1), sy = shake * Math.cos(local * 2.3);
  const zoom = 1.04 + Math.min(1, local / Math.max(1, sc.len)) * 0.08;
  const dim = fx.includes('dark') ? 0.55 : 0;

  // captions: 2-3 words centered, accent word in amber
  const words = String(sc.vo ?? '').split(' ').filter(Boolean);
  const groups = []; for (let g = 0; g < words.length; g += 3) groups.push(words.slice(g, g + 3));
  const gi = Math.min(groups.length - 1, Math.floor(local / Math.max(1, (sc.len - 3) / Math.max(1, groups.length))));
  const isKey = (w) => sc.key && w.replace(/[^\w']/g, '').toLowerCase() === String(sc.key).toLowerCase();
  const hud = sc.hud ?? prev?.hud ?? {hour: '00/72', water: '3L', power: 'OFF', outside: 'UNKNOWN'};

  let body = null;
  if (shot === 'title') body = <AbsoluteFill style={{background: '#0a0a0b', alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
    <div style={{fontSize: 46, letterSpacing: '0.3em', color: AMBER, fontWeight: 700, opacity: interpolate(local, [0, 8], [0, 1], cl)}}>{sc.over ?? 'PART 1'}</div>
    <div style={{fontSize: 150, fontWeight: 800, color: '#f1f1f1', letterSpacing: '-0.02em', marginTop: 10, transform: `scale(${interpolate(local, [0, sc.len], [1.08, 1], cl)})`}}>{sc.title ?? 'LIGHTS OUT'}</div></AbsoluteFill>;
  else if (shot === 'object') body = <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: 120}}><Obj type={sc.object} local={local} talk={talk} /></AbsoluteFill>;
  else if (shot === 'choice') {
    const [A, B] = sc.options ?? ['OPEN', 'STAY SILENT'];
    body = <AbsoluteFill style={{alignItems: 'center', fontFamily: FONT, paddingTop: 420}}>
      <div style={{fontSize: 74, fontWeight: 800, color: '#fff', textAlign: 'center', padding: '0 80px', lineHeight: 1.05}}>{sc.question}</div>
      <div style={{display: 'flex', gap: 30, marginTop: 80}}>{[[A, sc.subs?.[0], RED], [B, sc.subs?.[1], AMBER]].map(([t, sub, col], j) => (
        <div key={j} style={{width: 470, padding: '40px 20px', borderRadius: 30, background: 'rgba(12,12,14,.85)', border: `5px solid ${col}`, textAlign: 'center',
          transform: `translateY(${interpolate(local, [4 + j * 5, 14 + j * 5], [500, 0], cl)}px)`, boxShadow: `0 0 70px ${col}44`}}>
          <div style={{fontSize: 30, fontWeight: 800, color: col, letterSpacing: '0.2em'}}>{j ? 'B' : 'A'}</div>
          <div style={{fontSize: 74, fontWeight: 800, color: '#fff', lineHeight: 1, marginTop: 8}}>{t}</div>
          {sub && <div style={{fontSize: 30, color: 'rgba(255,255,255,.7)', marginTop: 12}}>{sub}</div>}</div>))}</div>
      <div style={{marginTop: 70, fontSize: 56, fontWeight: 800, color: '#fff'}}>Comment <span style={{color: RED}}>A</span> or <span style={{color: AMBER}}>B</span></div>
      <div style={{marginTop: 14, fontSize: 38, color: 'rgba(255,255,255,.75)'}}>Most votes decides Part 2. Follow so you don’t miss it.</div>
    </AbsoluteFill>;
  } else body = <div style={{position: 'absolute', left: 540 - 400 * (sc.size ?? 1.6) / 2, top: sc.size > 2 ? 280 : 560}}>
    <Person who={sc.who ?? 'leo'} mood={sc.mood} pose={sc.pose} prevPose={prev?.who === sc.who ? prev.pose : sc.pose} local={local} talk={sc.speaker === sc.who ? talk : 0} size={sc.size ?? 1.6} /></div>;

  return (
    <AbsoluteFill style={{background: '#0a0a0b', overflow: 'hidden'}}>
      {music && <Audio src={staticFile('story-sound.wav')} />}
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${shot === 'title' || shot === 'choice' ? 1 : zoom})`, filter: 'saturate(.75) contrast(1.05) sepia(.18)'}}>
        {shot !== 'title' && (sc.set === 'room'
          ? <AbsoluteFill style={{background: 'linear-gradient(180deg,#2a2622 0%,#221f1c 62%,#17140f 62.2%,#120f0c 100%)'}}>
              <div style={{position: 'absolute', left: 90, top: 420, width: 260, height: 340, background: '#0e1220', border: '16px solid #3a332b'}} />
              <div style={{position: 'absolute', right: 120, top: 380, width: 120, height: 520, background: '#2f2a24'}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: `radial-gradient(40% 30% at 30% 55%, rgba(255,190,90,${0.18 + 0.04 * Math.sin(frame / 3)}), transparent 70%)`}} /></AbsoluteFill>
          : <Set name={sc.set ?? 'night'} frame={frame} />)}
        {shot === 'choice' && <AbsoluteFill style={{background: 'rgba(0,0,0,.6)'}} />}
        {body}
      </AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} />
      <AbsoluteFill style={{background: 'radial-gradient(80% 60% at 50% 50%, transparent 50%, rgba(0,0,0,.6))'}} />
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: 'overlay'}} />
      <Hud hud={hud} prevHud={prev?.hud} local={local} />
      <div style={{position: 'absolute', left: 30, top: 262, padding: '6px 16px', borderRadius: 8, background: RED, color: '#fff', fontFamily: COND, fontWeight: 800, fontSize: 26, letterSpacing: '0.08em'}}>{part}</div>
      {groups[gi] && !['choice', 'title'].includes(shot) && <div style={{position: 'absolute', left: 40, right: 40, top: sc.object === 'text' ? 1560 : 1180, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 92, textTransform: 'uppercase', letterSpacing: '-0.01em',
        color: '#fff', textShadow: '0 6px 0 rgba(0,0,0,.55), 0 0 30px rgba(0,0,0,.6)'}}>
        {groups[gi].map((w, k2) => <span key={k2} style={{color: isKey(w) ? AMBER : '#fff'}}>{w} </span>)}</div>}
    </AbsoluteFill>
  );
};
