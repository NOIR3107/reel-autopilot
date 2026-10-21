// Style 2: Screen Teardown. A fictional HVAC site, three problems: zoom in, circle it, click, fix it on screen.
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {Check, Cursor} from '@phosphor-icons/react';
import {Phone} from '../ad/Sites.jsx';
import {KestrelSite, DEFAULT_SHOP} from './KestrelSite.jsx';

export const TEARDOWN_FRAMES = 900; // 30s
const FONT = '"Bricolage Grotesque Variable", sans-serif';
const INK = '#0d1424';
const RED = '#e5352b';
const LIME = '#d9ff3f';
const TEAL = '#0e7490';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const kf = (f, k, ease = IO) => interpolate(f, k.map((x) => x[0]), k.map((x) => x[1]), {...clamp, easing: ease});

// Phone geometry: 600px wide frame at top 430. Site px -> screen px.
const PW = 600, PTOP = 430, B = 24, K = (PW - 2 * B) / 390, X0 = 540 - PW / 2 + B, Y0 = PTOP + B + 92 * K;
const TARGET = [540, 820]; // where a zoomed spot lands on screen

const FIX_SPOTS = [
  {start: 90, spot: [195, 266], zoom: 1.9, scroll: 0, ring: [20, 226, 350, 84], click: [195, 266],
    problem: 'The headline says hello. Not what you do.', fixed: 'Say what you fix, and put the number right there.'},
  {start: 300, spot: [264, 640], zoom: 1.8, scroll: 0, ring: [142, 552, 244, 172], click: [356, 582],
    problem: 'This chat pop-up covers half the page.', fixed: 'Move it. Add a call bar that stays put.'},
  {start: 510, spot: [195, 1060], zoom: 1.25, scroll: 700, ring: [7, 770, 366, 600], bracket: '11 fields', click: [80, 744],
    problem: '11 fields just to ask for help.', fixed: 'Ask for 3: name, phone, what is wrong.'},
];
const BA = 720; // before/after
const CTA = 800;

const cam = (Z, sx, sy, scroll) => {
  const px = X0 + sx * K, py = Y0 + (sy - scroll) * K;
  return [Z, TARGET[0] - Z * px, TARGET[1] - Z * py];
};
const ID = [1, 0, 0];

const Ring = ({r, p}) => {
  const [x, y, w, h] = r;
  // a slightly wobbly hand-drawn ellipse
  const pts = Array.from({length: 41}, (_, i) => {
    const a = (i / 40) * Math.PI * 2.08 - 0.3;
    const wob = 1 + Math.sin(i * 1.7) * 0.025;
    return `${x + w / 2 + Math.cos(a) * (w / 2 + 6) * wob},${y + h / 2 + Math.sin(a) * (h / 2 + 6) * wob}`;
  });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 390, height: 2000, overflow: 'visible', pointerEvents: 'none'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={RED} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p} />
    </svg>
  );
};

// A marker bracket down the left of a long block, with a short note.
const Bracket = ({r, p, label}) => {
  const [x, y, , h] = r;
  return (
    <>
      <svg style={{position: 'absolute', left: 0, top: 0, width: 390, height: 2000, overflow: 'visible', pointerEvents: 'none'}}>
        <path d={`M${x + 14} ${y} L${x} ${y} L${x} ${y + h} L${x + 14} ${y + h}`} fill="none" stroke={RED} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p} />
      </svg>
      <div style={{position: 'absolute', left: x + 190, top: y + h / 2 - 30, rotate: '-6deg', background: RED, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 30, padding: '6px 16px', borderRadius: 10,
        opacity: p, scale: String(0.8 + 0.2 * p), boxShadow: '0 8px 20px rgba(229,53,43,.35)'}}>{label}</div>
    </>
  );
};

const Pointer = ({x, y, click}) => (
  <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none'}}>
    {click > 0 && click < 1 && <div style={{position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: '50%', border: `3px solid ${TEAL}`, scale: String(0.4 + click), opacity: 1 - click}} />}
    <div style={{translate: '-4px -2px', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))', scale: String(click > 0 && click < 0.4 ? 0.85 : 1)}}><Cursor size={34} weight="fill" color={INK} /></div>
  </div>
);

// Script props: shop (see DEFAULT_SHOP), hook [plain, red], fixes [{problem, fixed}] for the headline, pop-up and form beats.
const DEFAULT_HOOK = ['This HVAC site loses calls in', '3 places.'];
export const Teardown = ({shop = DEFAULT_SHOP, hook = DEFAULT_HOOK, fixes: copy, music = true}) => {
  const FIXES = copy ? FIX_SPOTS.map((f, i) => ({...f, ...copy[i]})) : FIX_SPOTS;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // camera + scroll
  const keys = [
    [0, ID, 0], [FIXES[0].start, ID, 0],
    ...FIXES.flatMap((f, i) => {
      const c = cam(f.zoom, f.spot[0], f.spot[1], f.scroll);
      const next = FIXES[i + 1]?.start ?? BA;
      return [[f.start + 30, c, f.scroll], [next - 20, c, f.scroll]];
    }),
    [BA + 10, ID, 0], [CTA, ID, 0],
  ];
  const at = (j) => kf(frame, keys.map((k) => [k[0], j < 3 ? k[1][j] : k[2]]));
  const [Z, tx, ty, scroll] = [at(0), at(1), at(2), at(3)];

  // fix progress per problem
  const fix = {
    headline: kf(frame, [[FIXES[0].start + 108, 0], [FIXES[0].start + 140, 1]], OUT),
    popup: kf(frame, [[FIXES[1].start + 108, 0], [FIXES[1].start + 140, 1]], OUT),
    form: kf(frame, [[FIXES[2].start + 108, 0], [FIXES[2].start + 140, 1]], OUT),
  };
  const popIn = spring({frame: frame - 40, fps, config: {damping: 12, stiffness: 140}});
  const cur = FIXES.findLast((f) => frame >= f.start);
  const local = cur ? frame - cur.start : -1;
  const inFix = cur && frame < BA;
  const ring = inFix ? kf(local, [[30, 0], [50, 1]], OUT) * kf(local, [[112, 1], [132, 0]]) : 0;
  const cursorP = inFix ? kf(local, [[66, 0], [98, 1]], OUT) : 0;
  const click = inFix ? kf(local, [[100, 0], [118, 1]], Easing.linear) : 0;
  const cursorOn = inFix && local >= 60 && local < 150;

  // before/after slider
  const slide = kf(frame, [[BA + 10, 1], [BA + 40, 0], [BA + 55, 0], [BA + 75, 0.5]], IO);
  const leave = kf(frame, [[CTA, 0], [CTA + 24, 1]], IO);

  const screen = frame >= BA + 8 && frame < CTA + 30 ? (
    <div style={{position: 'relative', width: 390, height: 752}}>
      <KestrelSite shop={shop} fix={{headline: 1, popup: 1, form: 1}} scroll={scroll} />
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - slide * 100}% 0 0)`}}><KestrelSite shop={shop} fix={{headline: 0, popup: 0, form: 0}} scroll={scroll} /></div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${slide * 100}%`, width: 4, translate: '-50% 0', background: '#fff', boxShadow: '0 0 12px rgba(0,0,0,.35)'}}>
        <div style={{position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, translate: '-50% -50%', borderRadius: '50%', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.3)'}} />
      </div>
    </div>
  ) : (
    <div style={{position: 'relative', width: 390, height: 752}}>
      <KestrelSite shop={shop} fix={fix} scroll={scroll} popIn={popIn} />
      <div style={{position: 'absolute', inset: 0, translate: `0 ${-scroll}px`, pointerEvents: 'none'}}>
        {inFix && (cur.bracket ? <Bracket r={cur.ring} p={ring} label={cur.bracket} /> : <Ring r={cur.ring} p={ring} />)}
        {cursorOn && <Pointer x={interpolate(cursorP, [0, 1], [cur.click[0] + 140, cur.click[0]])} y={interpolate(cursorP, [0, 1], [cur.click[1] + 160, cur.click[1]])} click={click} />}
      </div>
    </div>
  );

  // caption bar
  const capIn = inFix ? kf(local, [[18, 0], [32, 1]], OUT) * kf(local, [[196, 1], [210, 0]]) : 0;
  const isFixed = inFix && local >= 120;
  const n = cur ? FIXES.indexOf(cur) + 1 : 0;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #f1f3f7 0%, #e3e8f0 100%)', overflow: 'hidden', fontFamily: FONT}}>
      {/* headline area */}
      <div style={{position: 'absolute', top: 230, left: 90, right: 90, textAlign: 'center', fontWeight: 800, fontSize: 72, lineHeight: 1.04, letterSpacing: '-0.04em', color: INK,
        opacity: kf(frame, [[FIXES[0].start, 1], [FIXES[0].start + 20, 0], [BA + 5, 0], [BA + 20, 1], [CTA, 1], [CTA + 12, 0]])}}>
        {frame < BA ? <>{hook[0]} <span style={{color: RED}}>{hook[1]}</span></> : <>Same business. <span style={{color: shop.accent}}>3 small fixes.</span></>}
      </div>

      {/* camera */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty + leave * 900}px) scale(${Z})`, opacity: 1 - leave}}>
        <div style={{position: 'absolute', left: 540 - PW / 2, top: PTOP}}>
          <Phone w={PW}>
            <div style={{width: 390, height: 844, background: '#f2f3f6', fontFamily: FONT}}>
              <div style={{height: 92, paddingTop: 14, boxSizing: 'border-box'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 30px', fontSize: 14, fontWeight: 650, color: INK}}><span>9:41</span><span>5G</span></div>
                <div style={{margin: '12px 14px 0', height: 36, borderRadius: 10, background: '#e4e6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#3b4252'}}>{shop.domain}</div>
              </div>
              {screen}
            </div>
          </Phone>
        </div>
      </div>

      {/* before/after labels */}
      {frame >= BA + 15 && frame < CTA && (
        <div style={{position: 'absolute', top: 365, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 380, fontWeight: 800, fontSize: 30, letterSpacing: '0.18em', opacity: kf(frame, [[BA + 15, 0], [BA + 28, 1]])}}>
          <span style={{color: RED}}>BEFORE</span><span style={{color: shop.accent}}>AFTER</span>
        </div>
      )}

      {/* caption bar */}
      {inFix && (
        <div style={{position: 'absolute', left: 70, right: 70, top: 1250, borderRadius: 28, background: '#fff', boxShadow: '0 20px 50px rgba(13,20,36,.18)', padding: '26px 30px',
          display: 'flex', alignItems: 'center', gap: 22, opacity: capIn, translate: `0 ${(1 - capIn) * 30}px`}}>
          <div style={{flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: isFixed ? LIME : RED, color: isFixed ? INK : '#fff', fontWeight: 800, fontSize: 28}}>
            {isFixed ? <><Check size={26} weight="bold" />Fixed</> : `Fix ${n}`}
          </div>
          <div style={{fontWeight: 700, fontSize: 40, lineHeight: 1.15, letterSpacing: '-0.02em', color: INK}}>{isFixed ? cur.fixed : cur.problem}</div>
        </div>
      )}

      {/* CTA */}
      {frame >= CTA && (
        <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: kf(frame, [[CTA + 8, 0], [CTA + 24, 1]])}}>
          <div style={{fontWeight: 800, fontSize: 92, lineHeight: 1.02, letterSpacing: '-0.045em', color: INK, textAlign: 'center'}}>Want yours<br />torn down?</div>
          <div style={{fontWeight: 700, fontSize: 64, letterSpacing: '-0.03em', color: INK, marginTop: 30}}>Comment</div>
          <div style={{background: INK, color: LIME, fontWeight: 800, fontSize: 124, letterSpacing: '-0.03em', padding: '16px 64px', borderRadius: 999, scale: String(spring({frame: frame - CTA - 26, fps, config: {damping: 11, stiffness: 150}}))}}>WEBSITE</div>
          <div style={{fontWeight: 600, fontSize: 42, color: '#3b4252', opacity: kf(frame, [[CTA + 44, 0], [CTA + 58, 1]])}}>Yours could be next. Free.</div>
          <div style={{fontWeight: 500, fontSize: 24, color: '#7a8396', marginTop: 120, opacity: kf(frame, [[CTA + 44, 0], [CTA + 58, 1]])}}>{shop.name} is a fictional business.</div>
        </div>
      )}
      {music && <Audio src={staticFile('teardown-sound.wav')} />}
    </AbsoluteFill>
  );
};
