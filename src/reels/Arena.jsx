// "Last country standing": flags drift inside a ring, a red hunter on the rim picks them off, India is the one it can't hit.
// Deterministic from the frame number (no physics), so every render is identical.
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';

const FPS = 30, CX = 540, CY = 1000, R = 400;
const FLAGS = ['🇺🇸', '🇬🇧', '🇨🇦', '🇧🇷', '🇯🇵', '🇩🇪', '🇫🇷', '🇦🇺', '🇲🇽', '🇰🇷', '🇮🇹', '🇮🇳'];
const WIN = 11; // India
const ORDER = [3, 0, 7, 5, 9, 1, 4, 8, 2, 10, 6]; // who goes out, in order
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
// shot times (s): slow at first, faster and faster
export const SHOTS = ORDER.reduce((a, _, k) => [...a, k ? a[k - 1] + Math.max(0.65, 1.7 - 0.11 * k) : 2.6], []);
export const FINAL = SHOTS[SHOTS.length - 1] + 2.0; // three missed shots at India start here
export const arenaSeconds = () => FINAL + 5.2;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const pos = (i, t) => {
  const th = rnd(i, 1) * 6.283 + (rnd(i, 2) - 0.5) * 1.1 * t;
  const rr = R * 0.78 * (0.25 + 0.75 * Math.abs(Math.sin(rnd(i, 3) * 6 + t * (0.25 + rnd(i, 4) * 0.45))));
  return [CX + Math.cos(th) * rr, CY + Math.sin(th) * rr];
};

export const Arena = ({music = true}) => {
  const f = useCurrentFrame(), t = f / FPS;
  const gone = (k) => t >= SHOTS[k] + 0.18;
  const alive = FLAGS.map((_, i) => { const k = ORDER.indexOf(i); return k < 0 || !gone(k); });
  const left = alive.filter(Boolean).length;
  // hunter: rim angle follows the next target, arriving 0.35s before the shot
  const next = SHOTS.findIndex((s) => t < s + 0.18);
  const tgtK = next < 0 ? -1 : next;
  const targetI = tgtK >= 0 ? ORDER[tgtK] : WIN;
  const tt = tgtK >= 0 ? SHOTS[tgtK] : t;
  const [tx, ty] = pos(targetI, tgtK >= 0 ? tt : t);
  const aim = Math.atan2(ty - CY, tx - CX) + (tgtK < 0 ? Math.sin(t * 9) * 0.5 : 0);
  const hx = CX + Math.cos(aim) * (R + 6), hy = CY + Math.sin(aim) * (R + 6);
  const firing = tgtK >= 0 && t > tt - 0.05 && t < tt + 0.22;
  const final = t >= FINAL;
  const missK = final ? Math.floor((t - FINAL) / 0.55) : -1;
  const missing = final && t < FINAL + 1.7 && ((t - FINAL) % 0.55) < 0.18;
  const done = t >= FINAL + 2.0, end = t - (FINAL + 2.0);
  const [ix, iy] = pos(WIN, t);
  const shake = firing ? (Math.random() * 0 + Math.sin(f * 40) * 6) : 0;

  const beam = (x2, y2, hit) => Array.from({length: 13}, (_, j) => {
    const a = Math.atan2(y2 - hy, x2 - hx) + (j - 6) * 0.012;
    const len = Math.hypot(x2 - hx, y2 - hy) * (hit ? 1 : 0.8);
    return <line key={j} x1={hx} y1={hy} x2={hx + Math.cos(a) * len} y2={hy + Math.sin(a) * len} stroke={j % 2 ? '#ff8a00' : '#ffd23f'} strokeWidth={2.2} opacity={0.9 - Math.abs(j - 6) * 0.08} />;
  });

  return (
    <AbsoluteFill style={{background: '#050507', fontFamily: 'Helvetica, Arial, sans-serif', transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: 92, letterSpacing: '-0.03em', lineHeight: 1.05}}>
        {done ? <>THE LAST ONE<br />STANDING</> : <>LAST COUNTRY<br />STANDING WINS</>}
      </div>
      <div style={{position: 'absolute', top: 410, width: '100%', textAlign: 'center', color: '#ff3b30', fontWeight: 900, fontSize: 64, letterSpacing: '0.06em'}}>LEFT: {done ? 1 : left}</div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#fff" strokeWidth={4} opacity={0.9} />
        {firing && beam(...pos(targetI, t), true)}
        {missing && beam(ix + Math.cos(t * 50) * 160, iy + 170, false)}
        <circle cx={hx} cy={hy} r={26} fill={done ? '#444' : '#ff2d2d'} stroke="#ff9a9a" strokeWidth={3} />
      </svg>
      {FLAGS.map((fl, i) => {
        const k = ORDER.indexOf(i);
        const die = k >= 0 ? t - (SHOTS[k] + 0.18) : -1;
        if (die > 0.45) return null;
        const [x, y] = pos(i, t);
        const s = die > 0 ? 1 + die * 2.4 : 1, o = die > 0 ? 1 - die / 0.45 : 1;
        const win = i === WIN && done;
        return (
          <div key={i} style={{position: 'absolute', left: x - 44, top: y - 44, width: 88, height: 88, borderRadius: 44, background: '#fff', border: `5px solid ${win ? '#ffd23f' : '#ff9a3c'}`, boxShadow: win ? '0 0 50px #ffd23f' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, transform: `scale(${s * (win ? 1.5 : 1)})`, opacity: o}}>{fl}</div>
        );
      })}
      {done && (
        <div style={{position: 'absolute', top: 1500, width: '100%', textAlign: 'center', color: '#ffd23f', fontWeight: 900, fontSize: 110, opacity: interpolate(end, [0, 0.4], [0, 1], clamp), transform: `scale(${interpolate(end, [0, 0.4], [1.4, 1], clamp)})`}}>INDIA WINS 🇮🇳</div>
      )}
      <div style={{position: 'absolute', bottom: 120, width: '100%', textAlign: 'center', color: '#fff', opacity: 0.8, fontWeight: 700, fontSize: 44}}>Follow for more 🌍</div>
      {music && <Audio src={staticFile('arena-sound.wav')} />}
    </AbsoluteFill>
  );
};
