// Story reels with a cast, sets, camera moves and lip-flap from the voiceover.
// Each scene: {sec, vo, key, layout, who, cast, speaker, mood, pose, screen, set, cam, fx, beat, say}.
// layout: phone (person + phone) | duo (two people talk) | closeup (one face, big) | screen (the phone fills the shot) | split (old vs new site)
// set: day | night | storm | office | kitchen.  cam: push | pull | whip | dutch | still.
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {BUSINESSES, BizCtx} from '../biz.js';
import {Phone} from '../ad/Sites.jsx';
import {Screen} from './MikeEpisode.jsx';
import {Person} from './Person.jsx';

const FPS = 30;
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const LIME = '#d9ff3f', INK = '#0d1424';
export const storyFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);

const SETS = {
  day: {sky: 'linear-gradient(180deg,#9cc3f5 0%,#d6e6fb 60%,#eef3fb 100%)', far: '#b9cbe6', ground: '#cfe0c3', sun: '#fff3c4'},
  night: {sky: 'linear-gradient(180deg,#0b1430 0%,#1c2b57 60%,#2b3c6e 100%)', far: '#18234a', ground: '#1b2a3f', sun: '#e8ecff'},
  storm: {sky: 'linear-gradient(180deg,#38424f 0%,#5b6675 60%,#727d8b 100%)', far: '#4a5462', ground: '#56635a', sun: null},
  office: {sky: 'linear-gradient(180deg,#f3e9dc 0%,#efe2d0 70%,#cdb79a 70.2%,#bfa585 100%)', far: null, ground: null, sun: null},
  kitchen: {sky: 'linear-gradient(180deg,#e6f0ee 0%,#dbe9e5 64%,#f4f1ea 64.2%,#e5ded2 100%)', far: null, ground: null, sun: null},
};

const Set = ({name, frame}) => {
  const s = SETS[name] ?? SETS.day;
  return (
    <AbsoluteFill style={{background: s.sky}}>
      {s.sun && <div style={{position: 'absolute', right: 110, top: 260, width: name === 'night' ? 140 : 240, height: name === 'night' ? 140 : 240, borderRadius: '50%', background: `radial-gradient(circle, ${s.sun}, transparent 70%)`}} />}
      {name === 'night' && Array.from({length: 40}, (_, i) => <div key={i} style={{position: 'absolute', left: (i * 211) % 1080, top: (i * 97) % 900, width: 4, height: 4, borderRadius: 2, background: '#fff', opacity: 0.3 + 0.5 * Math.abs(Math.sin(frame / 20 + i))}} />)}
      {s.far && <svg width="1080" height="420" viewBox="0 0 1080 420" style={{position: 'absolute', left: 0, top: 1040}}>
        <path d="M0 280 L130 190 L260 280 L260 420 L0 420 Z M320 250 L480 150 L640 250 L640 420 L320 420 Z M700 285 L830 205 L960 285 L960 420 L700 420 Z" fill={s.far} />
        {name === 'night' && [[60, 320], [400, 300], [520, 300], [760, 330]].map(([x, y]) => <rect key={x} x={x} y={y} width="44" height="40" fill="#ffd36b" opacity=".8" />)}</svg>}
      {s.ground && <div style={{position: 'absolute', left: -100, right: -100, top: 1440, height: 600, borderRadius: '50% 50% 0 0 / 60px 60px 0 0', background: s.ground}} />}
      {name === 'office' && <><div style={{position: 'absolute', left: 90, top: 380, width: 300, height: 220, background: '#cfe3f7', border: '14px solid #fff', borderRadius: 6}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 1300, height: 40, background: '#8a6b4a'}} /></>}
      {name === 'kitchen' && <><div style={{position: 'absolute', left: 80, right: 80, top: 360, height: 240, background: '#fff', borderRadius: 10, boxShadow: '0 4px 0 #d9d2c4'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 1210, height: 50, background: '#cbbfa9'}} /></>}
    </AbsoluteFill>
  );
};

const Search = ({biz, local}) => (
  <div style={{width: 390, height: 844, background: '#fff', fontFamily: 'Arial, sans-serif', padding: '58px 16px 0', boxSizing: 'border-box'}}>
    <div style={{height: 44, borderRadius: 22, border: '1px solid #dfe1e5', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 16, color: '#202124'}}>
      {`${biz.category.toLowerCase()} near me`.slice(0, Math.max(1, Math.floor(local / 1.5)))}</div>
    {[[biz.rival, '4.8', true], [biz.fullName, '4.9', false], ['Another listing', '4.1', false]].map(([n, r, hot], i) => (
      <div key={i} style={{marginTop: 18, padding: 14, borderRadius: 12, background: hot ? '#eef6ff' : '#f8f9fa', opacity: local > 20 + i * 6 ? 1 : 0}}>
        <div style={{fontSize: 18, color: '#1a0dab', fontWeight: 700}}>{n}</div>
        <div style={{fontSize: 14, color: '#5f6368', marginTop: 4}}>{'★'.repeat(5)} {r} · Open now</div>
        <div style={{display: 'flex', gap: 8, marginTop: 10}}>{(hot ? ['Call', 'Website', 'Directions'] : ['Directions']).map((b) => <div key={b} style={{padding: '6px 12px', borderRadius: 14, border: '1px solid #dadce0', fontSize: 13, color: '#1a73e8'}}>{b}</div>)}</div>
      </div>))}
  </div>
);

const Shot = ({type, local, biz}) => (type === 'search' ? <Search biz={biz} local={local} /> : <Screen type={type} local={local} />);

export const StoryReel = ({scenes, trade = 'roofing', lead = 'mike', mouth = [], ctaTitle = ['Does your site', 'look closed?'], music = true}) => {
  const frame = useCurrentFrame();
  const biz = BUSINESSES[trade] ?? BUSINESSES.roofing;
  let acc = 0;
  const timed = scenes.map((s) => { const start = Math.round(acc * FPS); acc += s.sec; return {...s, start, len: Math.round(s.sec * FPS)}; });
  const i = timed.findLastIndex((s) => frame >= s.start);
  const sc = timed[i], prev = timed[i - 1];
  const local = frame - sc.start;
  const talkLevel = mouth[i]?.[local] ?? 0;
  const fx = sc.fx ?? [];

  // camera
  const cam = sc.cta ? 'still' : sc.cam ?? ['push', 'pull', 'whip', 'push', 'dutch'][i % 5];
  const tP = Math.min(1, local / Math.max(1, sc.len));
  let zoom = 1, dx = 0, rot = 0;
  if (cam === 'push') zoom = 1.04 + tP * 0.14;
  if (cam === 'pull') zoom = 1.22 - tP * 0.14;
  if (cam === 'whip') { dx = interpolate(local, [0, 7], [-900, 0], {extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 4)}); zoom = 1.08; }
  if (cam === 'dutch') { rot = -4; zoom = 1.1 + tP * 0.06; }
  const shake = fx.includes('shake') ? interpolate(local, [0, 14], [24, 0], {extrapolateRight: 'clamp'}) : fx.includes('closed') ? interpolate(local, [12, 26], [26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const sx = shake * Math.sin(local * 2.7), sy = shake * Math.cos(local * 3.3);
  const flash = sc.cta || i === 0 ? 0 : interpolate(local, [0, 4], [0.45, 0], {extrapolateRight: 'clamp'});

  // words
  const words = (sc.vo ?? '').split(' ').filter(Boolean);
  const per = words.length ? Math.max(5, Math.floor((sc.len - 4) / words.length)) : 1;
  const wi = Math.min(words.length - 1, Math.floor(local / per));
  const w = words[wi], wl = local - wi * per;
  const pop = interpolate(wl, [0, 3, 6], [0.6, 1.12, 1], {extrapolateRight: 'clamp'});
  const isKey = w && sc.key && w.replace(/[^\w']/g, '').toLowerCase() === sc.key.toLowerCase();

  const who = sc.who ?? lead;
  const samePerson = prev && (prev.who ?? lead) === who && prev.layout === sc.layout;
  const person = (p, extra = {}) => <Person who={p} mood={sc.mood} pose={sc.pose} prevPose={samePerson ? prev.pose : sc.pose} local={local} {...extra} />;
  const phone = (w, style) => (
    <div style={{position: 'absolute', ...style}}>
      <Phone w={w} glow={['new', 'ringing'].includes(sc.screen) ? `${LIME}88` : undefined}><Shot type={sc.screen ?? 'old'} local={local} biz={biz} /></Phone>
    </div>
  );

  let body = null;
  const L = sc.layout ?? 'phone';
  if (sc.cta) {
    body = (
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 300, fontFamily: FONT}}>
        <div style={{fontWeight: 800, fontSize: 92, lineHeight: 1.02, letterSpacing: '-0.045em', color: '#fff', textAlign: 'center', textShadow: '0 6px 30px rgba(0,0,0,.4)'}}>{ctaTitle[0]}<br /><span style={{color: LIME}}>{ctaTitle[1]}</span></div>
        <div style={{marginTop: 60, fontWeight: 800, fontSize: 56, color: '#fff'}}>Comment</div>
        <div style={{marginTop: 14, background: LIME, color: INK, fontWeight: 800, fontSize: 130, padding: '10px 64px 22px', borderRadius: 999, letterSpacing: '-0.05em',
          transform: `scale(${interpolate(local, [4, 10, 14], [0, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`, boxShadow: `0 0 120px ${LIME}88`}}>WEBSITE</div>
        <div style={{position: 'absolute', bottom: 260, display: 'flex', gap: 30}}>{[lead, 'sarah', 'dan'].filter((v, k, a) => a.indexOf(v) === k).slice(0, 2).map((p, k) => <Person key={p} who={p} mood="happy" pose={k ? 'wave' : 'celebrate'} prevPose={k ? 'idle' : 'idle'} local={local} size={0.62} />)}</div>
      </AbsoluteFill>
    );
  } else if (L === 'duo') {
    const [a, b] = sc.cast ?? [lead, 'sarah'];
    const sp = sc.speaker ?? b;
    body = <>
      <div style={{position: 'absolute', left: 20, top: 640}}><Person who={a} mood={sp === a ? sc.mood : 'neutral'} pose={sp === a ? sc.pose : 'idle'} prevPose="idle" local={local} talk={sp === a ? talkLevel : 0} size={1.15} /></div>
      <div style={{position: 'absolute', left: 600, top: 640}}><Person who={b} mood={sp === b ? sc.mood : 'neutral'} pose={sp === b ? sc.pose : 'idle'} prevPose="idle" local={local} talk={sp === b ? talkLevel : 0} size={1.15} flip /></div>
    </>;
  } else if (L === 'closeup') {
    body = <div style={{position: 'absolute', left: 540 - 400 * 1.6, top: 140}}>{person(who, {talk: sc.speaker === who ? talkLevel : 0, size: 3.2})}</div>;
  } else if (L === 'screen') {
    body = phone(620, {left: 230, top: 260, rotate: '-3deg'});
  } else if (L === 'split') {
    body = <>
      {[['old', 'BEFORE', '#ff5a4e', 60, -4], ['new', 'AFTER', LIME, 560, 4]].map(([scr, lab, col, x, r]) => (
        <div key={lab} style={{position: 'absolute', left: x, top: 330, rotate: `${r}deg`}}>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 52, color: col, textAlign: 'center', marginBottom: 20, letterSpacing: '0.08em'}}>{lab}</div>
          <Phone w={460} glow={scr === 'new' ? `${LIME}88` : undefined}><Shot type={scr} local={local} biz={biz} /></Phone>
        </div>))}
    </>;
  } else {
    body = <>
      {phone(440, {left: 70, top: 420})}
      <div style={{position: 'absolute', left: 560, top: 620}}>{person(who, {talk: sc.speaker === who ? talkLevel : 0, size: 1.2})}</div>
    </>;
  }

  return (
    <BizCtx.Provider value={biz}>
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        {music && <Audio src={staticFile('story-sound.wav')} />}
        <AbsoluteFill style={{transform: `translate(${dx + sx}px, ${sy}px) scale(${zoom}) rotate(${rot}deg)`, filter: 'saturate(1.2) contrast(1.06)'}}>
          <Set name={sc.cta ? 'night' : sc.set ?? 'day'} frame={frame} />
          {body}
          {sc.say && !sc.cta && <div style={{position: 'absolute', left: 120, right: 120, top: 300, padding: '26px 34px', borderRadius: 34, background: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 46, color: INK, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.25)', transform: `scale(${interpolate(local, [0, 6], [0.6, 1], {extrapolateRight: 'clamp'})})`}}>{sc.say}</div>}
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(75% 60% at 50% 45%, transparent 55%, rgba(0,0,0,.5))'}} />
        {fx.includes('hail') && <AbsoluteFill style={{background: 'rgba(20,30,60,.3)'}}>{Array.from({length: 70}, (_, k) => {
          const x = (k * 157) % 1180 - 50, sp = 38 + (k % 5) * 9, y = ((local * sp + k * 263) % 2100) - 150;
          return <div key={k} style={{position: 'absolute', left: x - y * 0.18, top: y, width: 4, height: 70 + (k % 3) * 30, borderRadius: 4, background: 'rgba(220,235,255,.55)', rotate: '10deg'}} />;
        })}</AbsoluteFill>}
        {fx.includes('glow') && <AbsoluteFill style={{background: `radial-gradient(60% 40% at 45% 50%, ${LIME}55, transparent 70%)`, mixBlendMode: 'screen'}} />}
        <AbsoluteFill style={{background: fx.includes('glow') ? LIME : '#fff', opacity: flash}} />
        {fx.includes('closed') && <div style={{position: 'absolute', left: 120, top: 560, padding: '10px 44px', border: '16px solid #ff2d3d', borderRadius: 30, color: '#ff2d3d', fontFamily: FONT, fontWeight: 800, fontSize: 190, rotate: '-14deg', opacity: local < 8 ? 0 : 1, transform: `scale(${interpolate(local, [8, 13, 17], [2.6, 0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`, background: 'rgba(255,255,255,.12)', boxShadow: '0 0 60px rgba(255,45,61,.5)'}}>CLOSED</div>}
        {w && !sc.cta && <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 128, letterSpacing: '-0.03em', textTransform: 'uppercase', color: isKey ? '#ffd23f' : '#fff', transform: `scale(${pop})`, WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.5)'}}>{w}</div>}
      </AbsoluteFill>
    </BizCtx.Provider>
  );
};
