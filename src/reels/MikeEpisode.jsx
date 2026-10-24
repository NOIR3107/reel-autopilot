// Style 4: Mascot Series. Mike the contractor acts out one episode from mike-episodes.json.
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {Phone as PhoneIcon, PhoneDisconnect, UserCircle} from '@phosphor-icons/react';
import {Phone, OldSite, NewSiteMobile} from '../ad/Sites.jsx';
import {Mike} from './MikeCharacter.jsx';
import {useBiz} from '../biz.js';
import EPISODES from './mike-episodes.json';

const FPS = 30;
export const sceneFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
export const episodeFrames = (ep) => sceneFrames(EPISODES[ep].scenes);
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const INK = '#0d1424';
const LIME = '#d9ff3f';
const RED = '#e5352b';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const kf = (f, k, ease = Easing.bezier(0.65, 0, 0.35, 1)) => interpolate(f, k.map((x) => x[0]), k.map((x) => x[1]), {...clamp, easing: ease});

const Status = ({dark, url}) => (
  <div style={{height: 92, paddingTop: 14, boxSizing: 'border-box', background: dark ? 'transparent' : '#f2f3f6', fontFamily: FONT}}>
    <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 30px', fontSize: 14, fontWeight: 650, color: dark ? '#fff' : INK}}><span>9:41</span><span>5G</span></div>
    {url && <div style={{margin: '12px 14px 0', height: 36, borderRadius: 10, background: '#e4e6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#3b4252'}}>{url}</div>}
  </div>
);

const CallScreen = ({title, sub, local, incoming}) => (
  <div style={{width: 390, height: 844, background: 'linear-gradient(180deg, #24324f, #0d1424)', fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <Status dark />
    <div style={{fontSize: 18, opacity: 0.7, marginTop: 60}}>{incoming ? 'Incoming call' : 'Calling...'}</div>
    <UserCircle size={110} weight="fill" color="rgba(255,255,255,.85)" style={{marginTop: 26}} />
    <div style={{fontWeight: 700, fontSize: 30, marginTop: 14}}>{title}</div>
    <div style={{fontSize: 17, opacity: 0.7, marginTop: 6}}>{sub}</div>
    <div style={{marginTop: 'auto', marginBottom: 110, display: 'flex', gap: incoming ? 120 : 0}}>
      <div style={{width: 74, height: 74, borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><PhoneDisconnect size={34} weight="fill" /></div>
      {incoming && <div style={{width: 74, height: 74, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(1 + Math.max(0, Math.sin(local / 3)) * 0.12), boxShadow: '0 0 0 12px rgba(34,197,94,.25)'}}><PhoneIcon size={34} weight="fill" /></div>}
    </div>
  </div>
);

const Screen = ({type, local}) => {
  const biz = useBiz();
  if (type === 'silent') return (
    <div style={{width: 390, height: 844, background: 'linear-gradient(180deg, #3b4a6b, #151c2c)', fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Status dark />
      <div style={{fontWeight: 300, fontSize: 92, marginTop: 40}}>9:41</div>
      <div style={{marginTop: 'auto', marginBottom: 220, padding: '14px 22px', borderRadius: 18, background: 'rgba(255,255,255,.14)', fontSize: 18}}>No new calls</div>
    </div>
  );
  if (type === 'ringing') return <CallScreen incoming title="(555) 018-4471" sub="New customer" local={local} />;
  if (type === 'competitor') return <CallScreen title={biz.rival} sub="from search results" local={local} />;
  if (type === 'social') return (
    <div style={{width: 390, height: 844, background: '#f0f2f5', fontFamily: FONT}}>
      <Status url="social page" />
      <div style={{height: 130, background: 'linear-gradient(120deg, #b8c2d3, #d7dde7)'}} />
      <div style={{padding: '0 18px', marginTop: -40}}>
        <div style={{width: 84, height: 84, borderRadius: '50%', background: '#7a8496', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 36}}>N</div>
        <div style={{fontWeight: 800, fontSize: 22, color: INK, marginTop: 8}}>{biz.fullName}</div>
        <div style={{fontSize: 14, color: '#667085'}}>{biz.category}</div>
        <div style={{display: 'flex', gap: 8, marginTop: 12}}>{['Follow', 'Message'].map((b) => <div key={b} style={{flex: 1, height: 36, borderRadius: 8, background: '#dfe3ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: INK}}>{b}</div>)}</div>
        {[0, 1].map((i) => <div key={i} style={{marginTop: 14, height: 150, borderRadius: 12, background: '#fff', padding: 12, boxSizing: 'border-box'}}><div style={{height: 12, width: '60%', borderRadius: 6, background: '#e3e7ee'}} /><div style={{height: 90, borderRadius: 8, background: '#e9ecf2', marginTop: 12}} /></div>)}
      </div>
    </div>
  );
  if (type === 'loading') return (
    <div style={{width: 390, height: 844, background: '#fff'}}>
      <Status url={biz.domain} />
      <div style={{height: 4, width: `${Math.min(85, local * 0.8)}%`, background: '#9aa3b5'}} />
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 650}}><div style={{width: 44, height: 44, borderRadius: '50%', border: '5px solid #e3e6ee', borderTopColor: '#9aa3b5', rotate: `${local * 14}deg`}} /></div>
    </div>
  );
  if (type === 'new') return <div style={{width: 390, height: 844, background: '#2346d0'}}><Status url={biz.domain} /><NewSiteMobile /></div>;
  // old site, plain / scrolling / zoomed to the tiny footer number
  const z = type === 'footer' ? 3.2 : 1;
  const [fx, fy] = type === 'footer' ? [212, 304] : [195, 376];
  const scroll = type === 'oldScroll' ? Math.sin(local / 9) * 40 + local * 0.6 : 0;
  return (
    <div style={{width: 390, height: 844, background: '#fff', overflow: 'hidden'}}>
      <Status url={biz.domain} />
      <div style={{width: 390, height: 752, overflow: 'hidden', position: 'relative'}}>
        <div style={{position: 'absolute', transformOrigin: '0 0', translate: `${195 - fx * z}px ${376 - fy * z - scroll}px`, scale: String(z)}}>
          <OldSite />
          {type === 'footer' && <div style={{position: 'absolute', left: 186, top: 296, width: 54, height: 17, borderRadius: 6, border: `1.5px solid ${RED}`}} />}
        </div>
      </div>
    </div>
  );
};

const Bubble = ({text, p}) => (
  <div style={{position: 'relative', background: '#fff', borderRadius: 30, padding: '24px 30px', boxShadow: '0 18px 40px rgba(13,20,36,.14)', maxWidth: 520,
    fontFamily: FONT, fontWeight: 700, fontSize: 44, lineHeight: 1.15, letterSpacing: '-0.02em', color: INK, scale: String(0.7 + 0.3 * p), opacity: p, transformOrigin: '70% 100%'}}>
    {text}
    <svg width="44" height="34" viewBox="0 0 44 34" style={{position: 'absolute', bottom: -30, right: 90}}><path d="M0 0 L44 0 L36 34 Z" fill="#fff" /></svg>
  </div>
);

const Stamp = ({text, p}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: '0.04em', color: text === 'MYTH' ? RED : INK, background: text === 'MYTH' ? 'rgba(255,255,255,.85)' : LIME,
    border: `10px solid ${text === 'MYTH' ? RED : INK}`, borderRadius: 24, padding: '4px 36px', rotate: '-10deg', scale: String(2.2 - 1.2 * p), opacity: Math.min(1, p * 3)}}>{text}</div>
);

// scenes: from the script; ep picks a built-in sample when no scenes are given.
export const MikeEpisode = ({ep = 'story', scenes: given, music = true, ctaTitle = ['Be like Mike.', 'Get a site that rings.']}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scenes = given ?? EPISODES[ep].scenes;
  let acc = 0;
  const timed = scenes.map((s) => {
    const start = Math.round(acc * FPS);
    acc += s.sec;
    return {...s, start};
  });
  const i = timed.findLastIndex((s) => frame >= s.start);
  const sc = timed[i];
  const local = frame - sc.start;
  const prev = timed[i - 1];
  const inP = spring({frame: local, fps, config: {damping: 16, stiffness: 160}});

  // Mike and the phone card glide between layouts.
  const hasPhone = (s) => Boolean(s && s.screen && !s.cta);
  const layout = (s) => (s?.cta ? {mx: 820, my: 760, ms: 0.95, px: 290, po: 0} : hasPhone(s) ? {mx: 790, my: 660, ms: 1.25, px: 290, po: 1} : {mx: 540, my: 660, ms: 1.3, px: 290, po: 0});
  const a = layout(prev ?? sc), b = layout(sc);
  const mix = (k) => interpolate(i === 0 ? 1 : inP, [0, 1], [a[k], b[k]]);
  const captionIn = i === 0 ? 1 : kf(local, [[0, 0], [12, 1]], OUT); // the hook is readable on frame 0
  const sayIn = kf(local, [[sc.caption ? 14 : 4, 0], [sc.caption ? 26 : 16, 1]], OUT);
  const stampIn = sc.stamp ? kf(local, [[30, 0], [40, 1]], Easing.in(Easing.cubic)) : 0;

  return (
    <AbsoluteFill style={{overflow: 'hidden', fontFamily: FONT}}>
      {/* set: soft daylight, a distant roofline, the ground */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #dbe8fb 0%, #eef3fb 55%, #f6f8fc 100%)'}} />
      <div style={{position: 'absolute', right: 90, top: 300, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, #fff6d6, rgba(255,246,214,0) 70%)'}} />
      <svg width="1080" height="400" viewBox="0 0 1080 400" style={{position: 'absolute', left: 0, top: 1060}}>
        <path d="M0 260 L120 180 L240 260 L240 400 L0 400 Z M300 240 L460 140 L620 240 L620 400 L300 400 Z M700 270 L820 200 L940 270 L940 400 L700 400 Z" fill="#d3deee" />
      </svg>
      <div style={{position: 'absolute', left: -100, right: -100, top: 1440, height: 600, borderRadius: '50% 50% 0 0 / 60px 60px 0 0', background: '#dfe7f2'}} />

      {/* caption */}
      {sc.caption && !sc.cta && (
        <div style={{position: 'absolute', top: 240, left: 80, right: 80, textAlign: 'center', fontWeight: 800, fontSize: sc.caption.length > 40 ? 58 : 70, lineHeight: 1.06, letterSpacing: '-0.04em', color: INK,
          opacity: captionIn, translate: `0 ${(1 - captionIn) * 24}px`}}>{sc.caption}</div>
      )}

      {/* phone card */}
      <div style={{position: 'absolute', left: mix('px'), top: 1010, translate: '-50% -50%', opacity: mix('po'), scale: String(0.9 + 0.1 * mix('po')), rotate: '-3deg'}}>
        <Phone w={440} glow={sc.screen === 'new' || sc.screen === 'ringing' ? `${LIME}88` : undefined}>
          {hasPhone(sc) ? <Screen type={sc.screen} local={local} /> : prev && hasPhone(prev) ? <Screen type={prev.screen} local={local} /> : <div />}
        </Phone>
        {sc.stamp && <div style={{position: 'absolute', left: '50%', top: '45%', translate: '-50% -50%'}}><Stamp text={sc.stamp} p={stampIn} /></div>}
      </div>

      {/* Mike */}
      <div style={{position: 'absolute', left: mix('mx'), top: mix('my'), translate: '-50% 0', scale: String(mix('ms')), transformOrigin: '50% 100%'}}>
        <Mike mood={sc.cta ? 'happy' : sc.mood} pose={sc.cta ? 'point' : sc.pose} />
      </div>

      {/* speech bubble above Mike */}
      {sc.say && !sc.cta && (
        <div style={{position: 'absolute', right: 60, top: sc.caption ? 400 : 360, display: 'flex', justifyContent: 'flex-end', width: 700}}><Bubble text={sc.say} p={sayIn} /></div>
      )}

      {/* CTA */}
      {sc.cta && (
        <div style={{position: 'absolute', top: 300, left: 70, width: 640, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 26, opacity: captionIn}}>
          <div style={{fontWeight: 800, fontSize: 78, lineHeight: 1.04, letterSpacing: '-0.045em', color: INK}}>{ctaTitle[0]}<br />{ctaTitle[1]}</div>
          <div style={{fontWeight: 700, fontSize: 58, letterSpacing: '-0.03em', color: INK, marginTop: 20}}>Comment</div>
          <div style={{background: INK, color: LIME, fontWeight: 800, fontSize: 110, letterSpacing: '-0.03em', padding: '14px 56px', borderRadius: 999, scale: String(spring({frame: local - 14, fps, config: {damping: 11, stiffness: 150}}))}}>WEBSITE</div>
          <div style={{fontWeight: 600, fontSize: 38, color: '#3b4252', opacity: kf(local, [[30, 0], [44, 1]])}}>Free website check.</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderRadius: 999, border: '1.5px solid rgba(13,20,36,.25)', fontWeight: 600, fontSize: 28, color: INK, opacity: kf(local, [[56, 0], [70, 1]])}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" /></svg>
            Send this to a contractor
          </div>
        </div>
      )}
      {music && <Audio src={staticFile('mike-sound.wav')} />}
    </AbsoluteFill>
  );
};
