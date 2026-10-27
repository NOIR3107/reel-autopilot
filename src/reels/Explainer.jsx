// Explainer reels (series 1 skills, series 3 tips): paper background, small "// 03 — label" eyebrow, big headline with
// one red *accent*, an illustrated prop that animates in every scene, a talking host in the corner, word-chip captions,
// and a comment-keyword ending with a DM landing. Scenes: {sec, vo, eyebrow, title, bg: paper|dark|red, prop: {type, ...}}.
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {Person} from './Person.jsx';

const FPS = 30;
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';
const RED = '#e5322d', INK = '#151515', PAPER = '#efebe3';
export const explainerFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/></svg>")`;

const Card = ({children, style}) => <div style={{background: '#fff', border: `4px solid ${INK}`, borderRadius: 26, boxShadow: `10px 10px 0 ${INK}`, ...style}}>{children}</div>;
const useIn = (local, d = 0) => { const {fps} = useVideoConfig(); return spring({frame: local - d, fps, config: {damping: 12, stiffness: 140}}); };

const Accent = ({text, dark}) => <>{String(text ?? '').split(/(\*[^*]+\*)/).map((p, i) => p.startsWith('*')
  ? <span key={i} style={{color: RED, fontStyle: 'italic', fontWeight: 700}}>{p.slice(1, -1)}</span> : <span key={i} style={{color: dark ? '#f4f1ea' : INK}}>{p}</span>)}</>;

// ---- props ----
const Profile = ({p, local}) => {
  const n = Math.round(interpolate(local, [6, 40], [p.from ?? 0, p.to ?? 1000], {...cl, easing: (t) => 1 - Math.pow(1 - t, 3)}));
  return (
    <Card style={{width: 760, padding: 34, transform: `scale(${useIn(local)})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
        <div style={{width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(${RED}, #f59e0b, ${RED})`, padding: 7}}><div style={{width: '100%', height: '100%', borderRadius: '50%', background: '#d6cfc2'}} /></div>
        <div style={{fontFamily: FONT}}>
          <div style={{fontWeight: 800, fontSize: 44}}>{p.handle ?? 'neel.tripathi_'}</div>
          <div style={{display: 'flex', gap: 34, marginTop: 14}}>{[['posts', p.posts ?? 12], ['followers', n.toLocaleString()], ['following', 154]].map(([k, v]) => (
            <div key={k} style={{textAlign: 'center', padding: k === 'followers' ? '6px 16px' : 0, border: k === 'followers' ? `4px solid ${RED}` : 0, borderRadius: 40}}>
              <div style={{fontWeight: 800, fontSize: 40}}>{v}</div><div style={{fontSize: 24, color: '#666'}}>{k}</div></div>))}</div>
        </div>
      </div>
    </Card>
  );
};

const Terminal = ({p, local}) => {
  const cmd = p.cmd ?? '/build-reel';
  const typed = cmd.slice(0, Math.max(0, Math.floor((local - 6) / 2)));
  const outStart = 8 + cmd.length * 2;
  return (
    <div style={{width: 860, borderRadius: 22, background: '#16161a', boxShadow: `10px 10px 0 ${INK}`, border: `4px solid ${INK}`, overflow: 'hidden', transform: `scale(${useIn(local)})`, fontFamily: MONO}}>
      <div style={{display: 'flex', gap: 10, padding: '16px 20px', background: '#232329'}}>{['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />)}
        <div style={{marginLeft: 16, color: '#9aa0aa', fontSize: 22}}>{p.title ?? 'claude — ~/reel-autopilot'}</div></div>
      <div style={{padding: '26px 30px', fontSize: 30, lineHeight: 1.55, color: '#e9e9ee', minHeight: 300}}>
        <div><span style={{color: RED}}>{'> '}</span>{typed}<span style={{opacity: local % 20 < 10 ? 1 : 0}}>▌</span></div>
        {(p.out ?? []).map((l, i) => <div key={i} style={{opacity: local > outStart + i * 8 ? 1 : 0, color: l.startsWith('✓') ? '#7ee787' : '#b8bdc8'}}>{l}</div>)}
      </div>
    </div>
  );
};

const Files = ({p, local}) => {
  const names = p.names ?? ['SKILL.md', 'hooks.md', 'render.js', 'voice.py', 'post.mjs', 'rules.md'];
  const n = Math.round(interpolate(local, [10, 40], [0, p.count ?? names.length], cl));
  return (
    <div style={{position: 'relative', width: 820, height: 640}}>
      {names.map((f, i) => { const s = useIn(local, 3 + i * 4); const a = (i * 47) % 360; const r = 230 + (i % 2) * 40;
        return <Card key={f} style={{position: 'absolute', left: 310 + Math.cos(a) * r * s - 60, top: 300 + Math.sin(a) * r * 0.75 * s - 20, padding: '12px 22px', fontFamily: MONO, fontSize: 28, rotate: `${(i % 3 - 1) * 6}deg`, opacity: s}}>{f}</Card>; })}
      <Card style={{position: 'absolute', left: 230, top: 250, width: 360, padding: '24px 0', textAlign: 'center', background: '#4f8df5', color: '#fff', transform: `scale(${useIn(local, 8)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 1}}>{n}</div><div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40}}>{p.label ?? 'FILES'}</div></Card>
    </div>
  );
};

const Chart = ({p, local}) => {
  const k = interpolate(local, [4, 34], [0, 1], cl);
  const pts = Array.from({length: 40}, (_, i) => [i * 18, 300 - Math.pow(i / 39, 3) * 260]);
  const d = pts.slice(0, Math.max(2, Math.round(k * 40))).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return (
    <Card style={{width: 820, padding: 34, transform: `scale(${useIn(local)})`}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 38, marginBottom: 14}}>{p.label ?? 'reach'}</div>
      <svg width="740" height="320" viewBox="-10 -10 730 330"><path d={d} stroke={RED} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M0 300 L710 300" stroke="#bbb" strokeWidth="3" />{k > 0.95 && <circle cx="702" cy="40" r="16" fill={RED} />}</svg>
      {p.tag && <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: RED, textAlign: 'right'}}>{p.tag}</div>}
    </Card>
  );
};

const Checklist = ({p, local}) => (
  <Card style={{width: 820, padding: '30px 40px', transform: `scale(${useIn(local)})`}}>
    {(p.items ?? []).map((t, i) => { const on = local > 10 + i * 12;
      return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 24, padding: '16px 0', borderBottom: i < p.items.length - 1 ? '3px dashed #ddd' : 0, fontFamily: FONT, fontWeight: 700, fontSize: 42}}>
        <div style={{flex: 'none', width: 56, height: 56, borderRadius: 14, border: `4px solid ${INK}`, background: on ? RED : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 40, transform: `scale(${on ? 1 : 0.9})`}}>{on ? '✓' : ''}</div>
        <div style={{opacity: on ? 1 : 0.35}}>{t}</div></div>; })}
  </Card>
);

const Box = ({p, local}) => (
  <div style={{transform: `scale(${useIn(local)}) rotate(-4deg)`}}>
    <Card style={{width: 640, padding: 0, overflow: 'hidden'}}>
      <div style={{background: RED, color: '#fff', padding: '14px 24px', fontFamily: MONO, fontSize: 26}}>{p.tag ?? 'free · open source'}</div>
      <div style={{padding: '40px 36px', fontFamily: FONT}}><div style={{fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', lineHeight: 0.95}}>{p.name ?? 'REEL KIT'}</div>
        <div style={{fontSize: 34, marginTop: 14, color: '#555'}}>{p.sub ?? ''}</div></div>
    </Card>
  </div>
);

const Stamp = ({p, local}) => {
  const s = interpolate(local, [10, 15, 19], [2.4, 0.92, 1], cl);
  return (
    <div style={{position: 'relative', width: 860, height: 520, display: 'grid', placeItems: 'center'}}>
      <Card style={{padding: '40px 50px', fontFamily: FONT, fontWeight: 800, fontSize: 64, textAlign: 'center', lineHeight: 1.05, transform: `scale(${useIn(local)})`}}>{p.text}</Card>
      <div style={{position: 'absolute', right: 30, bottom: 30, padding: '8px 30px', border: `10px solid ${p.ok ? '#16a34a' : RED}`, color: p.ok ? '#16a34a' : RED, borderRadius: 18,
        fontFamily: FONT, fontWeight: 800, fontSize: 90, rotate: '-12deg', opacity: local < 10 ? 0 : 1, transform: `scale(${s})`}}>{p.stamp ?? 'BUSTED'}</div>
    </div>
  );
};

const Big = ({p, local}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: p.size ?? 220, letterSpacing: '-0.05em', lineHeight: 0.9, textAlign: 'center', transform: `scale(${useIn(local)})`}}>
    <Accent text={p.text} /></div>
);

const Comments = ({p, local}) => {
  const kw = p.keyword ?? 'SKILL';
  const users = ['j***e', 'm***x', 's***a', 'r***k', 'you'];
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'center'}}>
      <div style={{background: RED, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 130, padding: '6px 60px 16px', borderRadius: 40, border: `5px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}`, transform: `scale(${useIn(local)}) rotate(-3deg)`}}>{kw}</div>
      <Card style={{width: 820, padding: '20px 30px'}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 32, textAlign: 'center', marginBottom: 8}}>Comments</div>
        {users.map((u, i) => <div key={u} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '10px 0', opacity: local > 8 + i * 7 ? 1 : 0, fontFamily: FONT}}>
          <div style={{width: 50, height: 50, borderRadius: 25, background: ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', RED][i]}} />
          <div><div style={{fontSize: 24, color: '#777'}}>{u} · {i === 4 ? 'just now' : `${i + 1}m`}</div><div style={{fontWeight: 800, fontSize: 34}}>{kw}</div></div>
          <div style={{marginLeft: 'auto', fontSize: 30, color: i === 4 ? RED : '#bbb'}}>♥</div></div>)}
      </Card>
      <Card style={{width: 820, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 20, opacity: local > 48 ? 1 : 0, transform: `translateY(${interpolate(local, [48, 58], [60, 0], cl)}px)`}}>
        <div style={{width: 70, height: 70, borderRadius: 18, background: RED}} />
        <div style={{fontFamily: FONT}}><div style={{fontWeight: 800, fontSize: 34}}>{p.dm ?? 'Here’s the repo 👇'}</div><div style={{fontSize: 26, color: '#16a34a', fontWeight: 700}}>✓ Delivered</div></div>
      </Card>
    </div>
  );
};


// A real page as a screenshot: url bar, heading, text lines. One line gets a red box, then a red stamp slams on.
const Shot = ({p, local}) => {
  const hl = p.hl ?? 0;
  const box = interpolate(local, [10, 18], [0, 1], cl);
  const slam = interpolate(local, [22, 27, 31], [2.4, 0.92, 1], cl);
  return (
    <div style={{position: 'relative', transform: `scale(${useIn(local)}) rotate(${p.tilt ?? -1.5}deg)`}}>
      <div style={{width: 900, background: p.dark ? '#0d1117' : '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.25)', border: '2px solid rgba(0,0,0,.12)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: p.dark ? '#161b22' : '#f1f1f1'}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
          <div style={{marginLeft: 12, flex: 1, padding: '6px 16px', borderRadius: 10, background: p.dark ? '#0d1117' : '#fff', fontFamily: MONO, fontSize: 22, color: '#888'}}>{p.url}</div></div>
        <div style={{padding: '26px 34px 30px', fontFamily: p.mono ? MONO : FONT, color: p.dark ? '#e6edf3' : '#1f2328'}}>
          {p.heading && <div style={{fontWeight: 800, fontSize: 44, marginBottom: 14, fontFamily: FONT}}>{p.heading}</div>}
          {(p.lines ?? []).map((l, k) => (
            <div key={k} style={{position: 'relative', fontSize: p.size ?? 30, lineHeight: 1.45, padding: '4px 10px', color: k === hl ? (p.dark ? '#fff' : '#000') : (p.dark ? '#9aa4af' : '#59636e'), fontWeight: k === hl ? 700 : 400}}>
              {l}
              {k === hl && <div style={{position: 'absolute', inset: -2, border: `5px solid ${RED}`, borderRadius: 8, clipPath: `inset(0 ${100 - box * 100}% 0 0)`}} />}
            </div>))}
        </div>
      </div>
      {p.stamp && <div style={{position: 'absolute', right: -20, bottom: -40, padding: '6px 26px', border: `9px solid ${RED}`, color: RED, background: 'rgba(255,255,255,.85)', borderRadius: 14,
        fontFamily: FONT, fontWeight: 800, fontSize: 62, rotate: '-8deg', opacity: local < 22 ? 0 : 1, transform: `scale(${slam})`, whiteSpace: 'nowrap'}}>{p.stamp}</div>}
    </div>
  );
};

const PROPS = {shot: Shot, profile: Profile, terminal: Terminal, files: Files, chart: Chart, checklist: Checklist, box: Box, stamp: Stamp, big: Big, comments: Comments};

export const Explainer = ({scenes, mouth = [], host = 'host', series = '', look = 'a', music = true}) => {
  const frame = useCurrentFrame();
  let acc = 0;
  const timed = scenes.map((s) => { const start = Math.round(acc * FPS); acc += s.sec; return {...s, start, len: Math.round(s.sec * FPS)}; });
  const i = timed.findLastIndex((s) => frame >= s.start);
  const sc = timed[i];
  const local = frame - sc.start;
  const bg = sc.bg ?? 'paper';
  const dark = bg !== 'paper';
  const Prop = PROPS[sc.prop?.type] ?? null;
  const talk = mouth[i]?.[local] ?? 0;

  // caption chips: 2-3 words at a time, evenly over the line
  const words = String(sc.vo ?? '').split(' ').filter(Boolean);
  const groups = []; for (let k = 0; k < words.length; k += 3) groups.push(words.slice(k, k + 3));
  const gi = Math.min(groups.length - 1, Math.floor(local / Math.max(1, (sc.len - 4) / Math.max(1, groups.length))));
  const enter = interpolate(local, [0, 6], [40, 0], cl);

  if (look === 'b') {
    // Caption-on-top look: the spoken line builds word by word at the top, the prop sits in the middle, the host is a big bust at the bottom.
    const shown = Math.min(words.length, Math.floor(local / Math.max(3, (sc.len - 6) / Math.max(1, words.length))) + 1);
    const keyOf = (w) => sc.key && w.replace(/[^\w']/g, '').toLowerCase() === String(sc.key).toLowerCase();
    return (
      <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
        {music && <Audio src={staticFile('story-sound.wav')} />}
        <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.14, mixBlendMode: 'multiply'}} />
        <div style={{position: 'absolute', right: 60, top: 170, fontFamily: MONO, fontSize: 24, color: RED}}>{series}</div>
        <div style={{position: 'absolute', left: 60, right: 60, top: 220, fontFamily: FONT, fontWeight: 700, fontSize: 80, lineHeight: 1.05, letterSpacing: '-0.035em', color: INK}}>
          {words.slice(0, shown).map((w, k) => <span key={k} style={keyOf(w) ? {color: RED, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400} : {}}>{w} </span>)}</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${sc.prop?.scale ?? 1})`}}>{Prop && <Prop p={sc.prop} local={local} />}</div>
        <div style={{position: 'absolute', left: 540 - 400 * 1.45 / 2, top: 1200, transform: `translateY(${interpolate(frame, [0, 10], [300, 0], cl)}px)`}}>
          <Person who={host} mood={sc.mood ?? 'happy'} pose={sc.pose ?? 'explain'} prevPose={timed[i - 1]?.pose ?? 'idle'} local={local} talk={talk} size={1.45} /></div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{background: bg === 'red' ? RED : dark ? '#141414' : PAPER, overflow: 'hidden'}}>
      {music && <Audio src={staticFile('story-sound.wav')} />}
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: dark ? 0.08 : 0.16, mixBlendMode: dark ? 'screen' : 'multiply'}} />
      {!dark && <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: 0.18}}>
        <path d="M80 1350 q60 -60 120 0 t120 0" stroke={INK} strokeWidth="5" fill="none" /><circle cx="960" cy="520" r="40" stroke={RED} strokeWidth="5" fill="none" />
        <path d="M900 1500 l40 -40 l40 40" stroke={INK} strokeWidth="5" fill="none" /><path d="M120 470 l30 30 m0 -30 l-30 30" stroke={RED} strokeWidth="6" /></svg>}
      <div style={{position: 'absolute', left: 70, right: 70, top: 200, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26, color: dark ? '#aaa' : '#777'}}>
        <span>{`// ${String(i + 1).padStart(2, '0')} — ${sc.eyebrow ?? ''}`}</span><span style={{color: RED}}>{series}</span></div>
      <div style={{position: 'absolute', left: 70, right: 70, top: 250, fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 0.98, letterSpacing: '-0.045em', transform: `translateY(${enter}px)`, opacity: interpolate(local, [0, 5], [0, 1], cl)}}>
        <Accent text={sc.title} dark={dark} /></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 480, height: 820, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${sc.prop?.scale ?? 1.22}) rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`}}>{Prop && <Prop p={sc.prop} local={local} />}</div>
      <div style={{position: 'absolute', right: -90, bottom: 60, transform: `translateY(${interpolate(frame, [0, 10], [300, 0], cl)}px)`}}>
        <Person who={host} mood={sc.mood ?? 'happy'} pose={sc.pose ?? 'explain'} prevPose={timed[i - 1]?.pose ?? 'idle'} local={local} talk={talk} size={0.95} /></div>
      {groups[gi] && <div style={{position: 'absolute', left: 60, right: 330, bottom: 330, display: 'flex', flexWrap: 'wrap', gap: 12}}>
        {groups[gi].map((w, k) => <div key={k} style={{background: dark ? '#f4f1ea' : INK, color: dark ? INK : '#f4f1ea', fontFamily: FONT, fontWeight: 800, fontSize: 64, padding: '6px 20px 12px', borderRadius: 10,
          transform: `scale(${interpolate(local % 999, [0, 3], [0.8, 1], cl)})`, rotate: `${(k % 2 ? 1 : -1) * 1.5}deg`}}>{w}</div>)}</div>}
    </AbsoluteFill>
  );
};
