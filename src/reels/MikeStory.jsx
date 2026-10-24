// Story cut of a Mike episode, styled after the drama reels that do well: punch-in camera on every cut,
// one bold word at a time in the middle of the screen, a warm cinematic grade. Scenes use `vo` (the line
// shown word by word) instead of `caption`; `key` marks the word painted yellow.
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BUSINESSES, BizCtx} from '../biz.js';
import {MikeEpisode, sceneFrames} from './MikeEpisode.jsx';

const FPS = 30;
const FONT = '"Bricolage Grotesque Variable", sans-serif';
export {sceneFrames};

export const MikeStory = ({scenes, trade = 'roofing', ctaTitle = ['Does your site', 'look closed?'], music = true}) => {
  const frame = useCurrentFrame();
  let acc = 0;
  const timed = scenes.map((s) => {
    const start = Math.round(acc * FPS);
    acc += s.sec;
    return {...s, start, len: Math.round(s.sec * FPS)};
  });
  const sc = timed[timed.findLastIndex((s) => frame >= s.start)];
  const local = frame - sc.start;

  // Camera: each cut starts slightly zoomed and pushes in; odd scenes drift left, even right.
  const i = timed.indexOf(sc);
  const zoom = sc.cta ? 1 : interpolate(local, [0, sc.len], [1.06, 1.16]);
  const dx = sc.cta ? 0 : interpolate(local, [0, sc.len], [0, i % 2 ? -18 : 18]);
  const flash = sc.cta || i === 0 ? 0 : interpolate(local, [0, 4], [0.5, 0], {extrapolateRight: 'clamp'});
  // fx: 'shake' (bad news), 'hail' (storm streaks), 'glow' (the win)
  const fx = sc.fx ?? [];
  const shake = fx.includes('shake') ? interpolate(local, [0, 14], [22, 0], {extrapolateRight: 'clamp'}) : fx.includes('closed') ? interpolate(local, [12, 26], [26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const sx = shake * Math.sin(local * 2.7), sy = shake * Math.cos(local * 3.3);

  // Words: the vo line is spread evenly over the scene; each word pops in.
  const words = (sc.vo ?? '').split(' ').filter(Boolean);
  const per = words.length ? Math.max(6, Math.floor((sc.len - 6) / words.length)) : 1;
  const wi = Math.min(words.length - 1, Math.floor(local / per));
  const w = words[wi];
  const wl = local - wi * per;
  const pop = interpolate(wl, [0, 3, 6], [0.6, 1.12, 1], {extrapolateRight: 'clamp'});
  const isKey = w && sc.key && w.replace(/[^\w']/g, '').toLowerCase() === sc.key.toLowerCase();

  return (
    <BizCtx.Provider value={BUSINESSES[trade] ?? BUSINESSES.roofing}>
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {music && <Audio src={staticFile('story-sound.wav')} />}
      <AbsoluteFill style={{transform: `scale(${zoom}) translate(${dx + sx}px, ${sy}px)`, filter: 'saturate(1.25) contrast(1.08)'}}>
        <MikeEpisode scenes={scenes.map(({vo, key, fx, voice, ...s}) => s)} music={false} ctaTitle={ctaTitle} />
      </AbsoluteFill>
      {/* warm grade + vignette */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,140,60,.10), rgba(40,20,80,.18))', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'radial-gradient(75% 60% at 50% 45%, transparent 55%, rgba(0,0,0,.55))'}} />
      {fx.includes('hail') && (
        <AbsoluteFill style={{background: 'rgba(20,30,60,.35)'}}>
          {Array.from({length: 70}, (_, k) => {
            const x = (k * 157) % 1180 - 50, sp = 38 + (k % 5) * 9, y = ((local * sp + k * 263) % 2100) - 150;
            return <div key={k} style={{position: 'absolute', left: x - y * 0.18, top: y, width: 4, height: 70 + (k % 3) * 30, borderRadius: 4, background: 'rgba(220,235,255,.55)', rotate: '10deg'}} />;
          })}
        </AbsoluteFill>
      )}
      {fx.includes('glow') && <AbsoluteFill style={{background: 'radial-gradient(60% 40% at 40% 55%, rgba(217,255,63,.35), transparent 70%)', mixBlendMode: 'screen'}} />}
      <AbsoluteFill style={{background: fx.includes('glow') ? '#d9ff3f' : '#fff', opacity: flash}} />
      {fx.includes('closed') && (() => {
        const slam = interpolate(local, [8, 13, 17], [2.6, 0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <div style={{position: 'absolute', left: 120, top: 560, padding: '10px 44px', border: '16px solid #ff2d3d', borderRadius: 30, color: '#ff2d3d', fontFamily: FONT,
          fontWeight: 800, fontSize: 190, letterSpacing: '0.02em', rotate: '-14deg', opacity: local < 8 ? 0 : 1, transform: `scale(${slam})`, background: 'rgba(255,255,255,.12)',
          boxShadow: '0 0 60px rgba(255,45,61,.5)'}}>CLOSED</div>;
      })()}
      {w && !sc.cta && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 132,
          letterSpacing: '-0.03em', textTransform: 'uppercase', color: isKey ? '#ffd23f' : '#fff', transform: `scale(${pop})`,
          WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.5)'}}>{w}</div>
      )}
    </AbsoluteFill>
    </BizCtx.Provider>
  );
};
