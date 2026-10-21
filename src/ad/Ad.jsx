// Premium before/after ad: a fictional roofer's 2009 website rebuilt as a modern, phone-first site.
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {Phone, Laptop, OldSite, NewSiteMobile, NewSiteDesktop} from './Sites.jsx';
import {BUSINESSES, BizCtx, useBiz} from '../biz.js';

export const AD_FRAMES = 1080; // 36s at 30fps
const LIME = '#d9ff3f';
const RED = '#ff5a4e';
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);

// Keyframed value: k = [[frame, value], ...], eased between keys.
const kf = (frame, k, ease = INOUT) => interpolate(frame, k.map((x) => x[0]), k.map((x) => x[1]), {...clamp, easing: ease});

// ---------- Text ----------
// words: [text, accent?]. Words rise in from a mask at `from`, rise out at `to`.
const Kinetic = ({words, from, to, size = 92, frame, y = 300, color = '#fff', pad = 70}) => {
  if (frame < from - 1 || frame > to + 14) return null;
  return (
    <div style={{position: 'absolute', top: y, left: pad, right: pad, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.26, rowGap: 0}}>
      {words.map(([w, accent], i) => {
        const inP = from < 0 ? 1 : kf(frame, [[from + i * 3, 0], [from + i * 3 + 16, 1]], OUT);
        const outP = kf(frame, [[to + i * 1.5, 0], [to + i * 1.5 + 12, 1]], Easing.in(Easing.cubic));
        return (
          <span key={i} style={{overflow: 'hidden', display: 'inline-block', paddingBottom: size * 0.12, marginBottom: -size * 0.12}}>
            <span style={{display: 'inline-block', translate: `0 ${(1 - inP) * 110 - outP * 110}%`, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.035em', color: accent ? LIME : color}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

const Cross = ({size = 70}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${RED}88`}}>
    <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
  </div>
);
const Check = ({size = 44}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 10 10"><path d="M1.5 5.2 L4 7.6 L8.5 2.6" stroke="#0a0b0d" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

// ---------- Phone screen contents ----------
const StatusBar = ({url, dark}) => (
  <div style={{height: 92, background: dark ? 'var(--main)' : '#f2f2f4', paddingTop: 14, boxSizing: 'border-box', fontFamily: FONT}}>
    <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 30px', fontSize: 14, fontWeight: 600, color: dark ? '#fff' : '#111'}}><span>9:41</span><span>●●● ▮</span></div>
    <div style={{margin: '12px 14px 0', height: 36, borderRadius: 10, background: dark ? 'rgba(255,255,255,.16)' : '#e3e3e8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: dark ? '#e3e9ff' : '#333'}}>
      <svg width="10" height="12" viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="6.5" rx="1.5" fill="currentColor" /><path d="M3 5 V3.5 a2 2 0 0 1 4 0 V5" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
      {url}
    </div>
  </div>
);

// Focus points on the old site (in 390-wide phone pixels, below the status bar) for the zoom-ins.
const FOCUS = {all: [195, 376, 1], text: [189, 185, 2.0], footer: [212, 304, 3.4], form: [140, 251, 3.2]};

const OldScreen = ({frame}) => {
  const z = (i) => kf(frame, [[92, FOCUS.all[i]], [118, FOCUS.text[i]], [150, FOCUS.text[i]], [176, FOCUS.footer[i]], [210, FOCUS.footer[i]], [236, FOCUS.form[i]], [266, FOCUS.form[i]], [296, FOCUS.all[i]]]);
  const [fx, fy, s] = [z(0), z(1), z(2)];
  const loading = frame < 38;
  const ring = (k, a, b) => {
    const o = kf(frame, [[a, 0], [a + 8, 1], [b - 6, 1], [b, 0]]);
    const [x, y, w, h] = k;
    return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 6, border: `${2.2 / s}px solid ${RED}`, boxShadow: `0 0 ${12 / s}px ${RED}`, opacity: o}} />;
  };
  return (
    <div style={{width: 390, height: 844, background: '#fff', position: 'relative', overflow: 'hidden'}}>
      <StatusBar url={useBiz().domain} />
      <div style={{position: 'absolute', top: 92, left: 0, width: 390, height: 752, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 390, height: 844, transformOrigin: '0 0', translate: `${195 - fx * s}px ${376 - fy * s}px`, scale: String(s)}}>
          <OldSite />
          {ring([94, 134, 190, 102], 118, 152)}
          {ring([186, 297, 52, 15], 176, 212)}
          {ring([94, 244, 92, 15], 236, 268)}
        </div>
        {loading && (
          <div style={{position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
            <div style={{width: 46, height: 46, borderRadius: '50%', border: '5px solid #ddd', borderTopColor: '#888', rotate: `${frame * 14}deg`}} />
            <div style={{width: 200, height: 5, borderRadius: 3, background: '#eee'}}><div style={{width: `${8 + frame * 0.6}%`, height: 5, borderRadius: 3, background: '#999'}} /></div>
          </div>
        )}
      </div>
    </div>
  );
};

const NewScreen = ({scroll}) => (
  <div style={{width: 390, height: 844, position: 'relative', overflow: 'hidden', background: 'var(--main)', '--main': useBiz().color.main}}>
    <StatusBar url={useBiz().domain} dark />
    <div style={{position: 'absolute', top: 92, left: 0}}><NewSiteMobile scroll={scroll} /></div>
  </div>
);

// ---------- Scene pieces ----------
const Chip = ({text, frame, at, out, x, y}) => {
  const p = kf(frame, [[at, 0], [at + 18, 1]], OUT);
  const o = kf(frame, [[out, 1], [out + 12, 0]]);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: p * o, translate: `${(1 - p) * -60}px 0`, scale: String(0.9 + 0.1 * p), display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 26px 16px 16px', borderRadius: 999, background: 'rgba(22,24,28,.72)', border: '1.5px solid rgba(255,255,255,.14)', backdropFilter: 'blur(14px)',
      boxShadow: '0 20px 50px rgba(0,0,0,.45)', fontFamily: FONT, fontWeight: 600, fontSize: 30, color: '#fff', whiteSpace: 'nowrap', zIndex: 5}}>
      <Check />{text}
    </div>
  );
};

const Label = ({text, color, style}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: '0.2em', color, ...style}}>{text}</div>
);


// Background: a deep gradient whose light shifts with the story. Warm red while the old site fails, cobalt and lime after the fix.
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/></svg>")`;
const Backdrop = ({frame}) => {
  const warm = kf(frame, [[0, 1], [300, 1], [346, 0]]);
  const blob = (x, y, r, color, a) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, ${color}${Math.round(a * 255).toString(16).padStart(2, '0')}, transparent 70%)`;
  const dx = Math.sin(frame / 80) * 8, dy = Math.cos(frame / 95) * 6;
  return (
    <>
      <AbsoluteFill style={{background: 'linear-gradient(168deg, #0c1436 0%, #08090f 52%, #0c1508 100%)'}} />
      <AbsoluteFill style={{background: [
        blob(18 + dx, 14 + dy, 1100, '#ff5a4e', 0.34 * warm),
        blob(18 + dx, 14 + dy, 1150, '#2346d0', 0.62 * (1 - warm)),
        blob(86 - dx, 84 - dy, 1000, '#d9ff3f', 0.2 * (1 - warm)),
        blob(86 - dx, 84 - dy, 900, '#8a1f1a', 0.32 * warm),
        blob(60 + dy, 48 + dx, 800, '#3a5bf0', 0.16),
      ].join(', ')}} />
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.09, mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.5) 100%)'}} />
    </>
  );
};

// trade: a key of BUSINESSES. hook: optional replacement for the opening line, as Kinetic words.
export const Ad = ({trade = 'roofing', hook, music = true}) => (
  <BizCtx.Provider value={BUSINESSES[trade]}><AdBody hook={hook} music={music} /></BizCtx.Provider>
);

const AdBody = ({hook, music}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Hero phone: carries the old site, gets wiped to the new site, then tours.
  const px = kf(frame, [[0, 540], [372, 540], [404, 690], [536, 690], [575, 650], [600, 330], [660, 330], [700, 780], [810, 780], [850, 780]]);
  const py = kf(frame, [[0, 1170], [90, 1130], [360, 1130], [540, 1150], [600, 1330], [660, 1330], [700, 1150], [810, 1150], [860, 2300]]);
  const pw = kf(frame, [[0, 560], [540, 560], [600, 380], [660, 380], [700, 400]]);
  const ry = kf(frame, [[0, -18], [90, -6], [130, 0], [360, 0], [420, -14], [500, 12], [560, 0], [600, 14], [660, 14], [700, -8], [810, -8]]);
  const rx = kf(frame, [[0, 10], [90, 4], [130, 0], [600, 0], [640, 6], [700, 0]]);
  const impact = spring({frame: frame - 340, fps, config: {damping: 9, stiffness: 180}});
  const bump = frame >= 340 ? 1 + (1 - impact) * 0.05 : 1;
  const wipe = kf(frame, [[300, 0], [340, 100]], Easing.bezier(0.7, 0, 0.2, 1));
  const scroll = kf(frame, [[372, 0], [430, 0], [470, 330], [500, 330], [530, 640], [560, 640], [600, 0]]);
  const shake = frame >= 340 && frame < 352 ? Math.sin(frame * 3.1) * (352 - frame) * 0.8 : 0;

  const heroPhone = (
    <div style={{position: 'absolute', left: px, top: py, translate: '-50% -50%', perspective: 2200, zIndex: 3}}>
      <div style={{transform: `rotateY(${ry}deg) rotateX(${rx}deg) scale(${bump})`, transformStyle: 'preserve-3d'}}>
        <Phone w={pw} glow={frame > 340 ? `${LIME}33` : frame < 300 ? `${RED}26` : undefined}>
          <div style={{position: 'relative', width: 390, height: 844}}>
            {frame < 345 && <OldScreen frame={frame} />}
            {frame >= 298 && (
              <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - wipe}% 0 0)`}}><NewScreen scroll={scroll} /></div>
            )}
            {frame >= 298 && frame < 346 && (
              <div style={{position: 'absolute', top: 0, bottom: 0, left: `${wipe}%`, width: 5, translate: '-50% 0', background: LIME, boxShadow: `0 0 30px 8px ${LIME}aa`}} />
            )}
          </div>
        </Phone>
      </div>
    </div>
  );

  // Laptop (frames 540-700) and the "before" phone for the comparison (660-860).
  const lo = kf(frame, [[548, 0], [585, 1], [650, 1], [680, 0]]);
  const ly = kf(frame, [[548, 1000], [590, 900], [650, 880], [680, 820]], OUT);
  const bx = kf(frame, [[660, -300], [705, 300]], OUT);
  const bo = kf(frame, [[660, 0], [690, 1]]);
  const by = kf(frame, [[810, 1150], [860, 2300]]);
  const flash = kf(frame, [[339, 0], [340, 0.55], [348, 0]]);
  const timer = Math.min(8.4, Math.max(0, (frame / 80) * 8.4));
  const ctaIn = (a) => kf(frame, [[a, 0], [a + 18, 1]], OUT);
  const pill = spring({frame: frame - 870, fps, config: {damping: 11, stiffness: 140}});

  return (
    <AbsoluteFill style={{background: '#07080a', overflow: 'hidden', translate: `${shake}px 0`}}>
      <Backdrop frame={frame} />

      {/* headlines */}
      <Kinetic frame={frame} from={-1} to={86} pad={130} words={hook ?? [['Your'], ['website'], ['is'], ['costing'], ['you'], ['jobs.', 1]]} />
      {[[92, 146, 'Too small to read.'], [150, 206, 'Your number? Buried.'], [210, 266, 'No way to book.']].map(([a, b, t]) => (
        <div key={a}>
          <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: kf(frame, [[a, 0], [a + 8, 1], [b - 4, 1], [b + 4, 0]]), scale: String(kf(frame, [[a, 0.6], [a + 14, 1]], OUT))}}><Cross /></div>
          <Kinetic frame={frame} from={a + 4} to={b - 6} y={350} size={86} words={t.split(' ').map((w) => [w])} />
        </div>
      ))}
      <Kinetic frame={frame} from={272} to={352} y={330} size={104} words={[["Let's"], ['fix', 1], ['that.', 1]]} />
      <Kinetic frame={frame} from={362} to={532} pad={130} words={[['Built'], ['to'], ['make'], ['the'], ['phone'], ['ring.', 1]]} />
      <Kinetic frame={frame} from={548} to={652} words={[['Sharp'], ['on'], ['every', 1], ['screen.', 1]]} y={250} />
      <Kinetic frame={frame} from={664} to={806} y={260} size={84} words={[['Same'], ['business.'], ['Different', 1], ['first', 1], ['impression.', 1]]} />

      {/* load timer during the hook */}
      <div style={{position: 'absolute', left: 620, top: 590, zIndex: 6, opacity: kf(frame, [[4, 0], [12, 1], [84, 1], [92, 0]]), display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderRadius: 999,
        background: 'rgba(20,10,10,.8)', border: `2px solid ${RED}`, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: RED, fontVariantNumeric: 'tabular-nums'}}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5"><circle cx="12" cy="13" r="8" /><path d="M12 9 V13 L15 15 M9 2 H15" strokeLinecap="round" /></svg>
        {timer.toFixed(1)}s
      </div>

      {/* before/after labels during the wipe */}
      <Label text="BEFORE" color={RED} style={{position: 'absolute', left: 640, top: 520, opacity: kf(frame, [[296, 0], [304, 1], [330, 1], [340, 0]])}} />
      <Label text="AFTER" color={LIME} style={{position: 'absolute', left: 300, top: 520, opacity: kf(frame, [[310, 0], [320, 1], [352, 1], [362, 0]])}} />

      {/* laptop */}
      {frame >= 545 && frame < 690 && (
        <div style={{position: 'absolute', left: 560, top: ly, translate: '-50% -50%', opacity: lo, perspective: 2400, zIndex: 2}}>
          <div style={{transform: `rotateY(${kf(frame, [[548, -24], [660, -12]])}deg) rotateX(4deg)`}}><Laptop w={900}><NewSiteDesktop /></Laptop></div>
        </div>
      )}

      {/* the "before" phone for the side-by-side */}
      {frame >= 660 && frame < 870 && (
        <div style={{position: 'absolute', left: bx, top: by, translate: '-50% -50%', opacity: bo, perspective: 2200, zIndex: 3}}>
          <div style={{transform: 'rotateY(8deg)', filter: 'grayscale(.7) brightness(.8)'}}><Phone w={400}><OldScreen frame={60} /></Phone></div>
        </div>
      )}
      {frame >= 690 && frame < 820 && (
        <>
          <Label text="BEFORE" color={RED} style={{position: 'absolute', left: 300, top: 640, translate: '-50% 0', opacity: kf(frame, [[700, 0], [712, 1], [800, 1], [812, 0]])}} />
          <Label text="AFTER" color={LIME} style={{position: 'absolute', left: 780, top: 640, translate: '-50% 0', opacity: kf(frame, [[706, 0], [718, 1], [800, 1], [812, 0]])}} />
          <div style={{position: 'absolute', top: 1640, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 24, color: '#6b6f78', opacity: kf(frame, [[720, 0], [740, 1], [800, 1], [812, 0]])}}>Concept redesign · fictional business</div>
        </>
      )}

      {heroPhone}

      {/* feature chips */}
      <Chip frame={frame} at={392} out={536} x={30} y={820} text="Tap-to-call on every screen" />
      <Chip frame={frame} at={420} out={536} x={30} y={940} text="Fast on any phone" />
      <Chip frame={frame} at={448} out={536} x={30} y={1060} text="Free quote in 3 taps" />
      <Chip frame={frame} at={476} out={536} x={30} y={1180} text="Trust up front" />

      {/* CTA */}
      {frame >= 812 && (
        <div style={{position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, fontFamily: FONT}}>
          <div style={{textAlign: 'center', opacity: ctaIn(818), translate: `0 ${(1 - ctaIn(818)) * 40}px`}}>
            <div style={{fontWeight: 800, fontSize: 88, letterSpacing: '-0.045em', color: '#fff', lineHeight: 1.05}}>Want this for</div>
            <div style={{fontWeight: 800, fontSize: 88, letterSpacing: '-0.045em', color: LIME, lineHeight: 1.05}}>your business?</div>
          </div>
          <div style={{fontWeight: 800, fontSize: 72, letterSpacing: '-0.04em', color: '#fff', marginTop: 40, opacity: ctaIn(858)}}>Comment</div>
          <div style={{position: 'relative', overflow: 'hidden', borderRadius: 999, background: LIME, padding: '22px 70px', scale: String(frame < 870 ? 0 : pill * (1 + Math.sin(frame / 8) * 0.015)),
            boxShadow: `0 0 80px ${LIME}66`, fontWeight: 800, fontSize: 124, letterSpacing: '-0.03em', color: '#0a0b0d'}}>
            WEBSITE
            <div style={{position: 'absolute', top: 0, bottom: 0, width: 120, left: `${((frame - 880) % 90) * 14 - 160}px`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)', rotate: '20deg'}} />
          </div>
          <div style={{fontWeight: 500, fontSize: 38, color: '#a6aab3', textAlign: 'center', width: 760, lineHeight: 1.35, opacity: ctaIn(905)}}>Free website check. I'll show you exactly what to fix.</div>
          <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 30px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,.25)', fontWeight: 600, fontSize: 32, color: '#fff', opacity: ctaIn(950)}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" /></svg>
            Send this to a contractor who needs it
          </div>
        </div>
      )}

      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
      {music && <Audio src={staticFile('ad-sound.wav')} />}
    </AbsoluteFill>
  );
};
