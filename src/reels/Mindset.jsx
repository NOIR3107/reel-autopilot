// Mindset reels: hand-drawn stickman scenes on paper with a calm voiceover. Scene lengths come from the voice
// (tools/story_sound.py writes sec per scene). The "boil" filter re-wobbles the lines every 4 frames like hand animation.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/permanent-marker';

const FPS = 30, INK = '#1d1b19', GOLD = '#e9a512', PAPER = '#f6f1e6', GROUND = 1300, MARKER = 'Permanent Marker';
export const mindsetFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ink = (d = 1, w = 7, c = INK) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - d, fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round'});
const rad = (a) => (a * Math.PI) / 180;

// Angles are from straight down; positive swings toward the way the figure faces.
const POSES = {
  stand: {arms: [[12, 6], [-12, -6]], legs: [[8, 2], [-8, -2]]},
  sit: {arms: [[25, 70], [15, 65]], legs: [[85, 0], [80, -4]], lean: -8},
  phone: {arms: [[30, 95], [22, 92]], legs: [[85, 0], [80, -4]], lean: 12, head: 22},
  desk: {arms: [[55, 95], [48, 92]], legs: [[85, 0], [80, -4]], lean: 10},
  lift: {arms: [[155, 178], [-155, -178]], legs: [[16, 6], [-16, -6]]},
  push: {arms: [[78, 82], [70, 78]], legs: [[28, 18], [-38, -22]], lean: 35},
  up: {arms: [[150, 165], [-150, -165]], legs: [[10, 2], [-10, -2]]},
  wave: {arms: [[12, 6], [-140, -175]], legs: [[8, 2], [-8, -2]]},
  carry: {arms: [[150, 178], [140, 170]], legs: [[8, 2], [-8, -2]]},
  ride: {arms: [[60, 40], [50, 30]], legs: [[75, 10], [-75, -10]]},
  cane: {arms: [[35, 40], [-10, -5]], legs: [[8, 2], [-8, -2]], lean: 20},
};

// A stickman. walk/run = stride cycle 0..1 (undefined = still). dir 1 faces right, -1 left.
const Stick = ({x, y, s = 1, pose = 'stand', walk, run, dir = 1, color = INK, rot = 0, glow, d = 1}) => {
  const P = {...POSES[pose]}, cyc = walk ?? run;
  if (cyc != null) {
    const a = Math.sin(cyc * Math.PI * 2) * (run != null ? 42 : 26);
    P.legs = [[a, a - (a < 0 ? 22 : 0)], [-a, -a - (-a < 0 ? 22 : 0)]];
    if (pose === 'stand') P.arms = [[-a * 0.8, -a * 0.8 + 20], [a * 0.8, a * 0.8 + 20]];
    if (run != null) P.lean = 14;
  }
  const lean = P.lean ?? 0, bob = cyc != null ? Math.abs(Math.cos(cyc * Math.PI * 2)) * 6 : 0;
  const hip = [0, -116 - bob], neck = [hip[0] + Math.sin(rad(lean)) * 100, hip[1] - Math.cos(rad(lean)) * 100];
  const seg = (o, [a, b], L = 52) => { const k = [o[0] + Math.sin(rad(a)) * L, o[1] + Math.cos(rad(a)) * L]; return [k, [k[0] + Math.sin(rad(b)) * L, k[1] + Math.cos(rad(b)) * L]]; };
  const limb = (o, ang, i) => { const [k, e] = seg(o, ang, i < 2 ? 46 : 56); return <path key={i} d={`M${o[0]} ${o[1]} L${k[0]} ${k[1]} L${e[0]} ${e[1]}`} {...ink(d, 9, color)} />; };
  const sh = [neck[0] + Math.sin(rad(lean)) * -8, neck[1] + 10], hd = rad(lean + (P.head ?? 0));
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${dir * s} ${s})`} style={glow ? {filter: `drop-shadow(0 0 18px ${color})`} : undefined}>
    {P.arms.map((a, i) => limb(sh, a, i))}
    {P.legs.map((a, i) => limb(hip, a, i + 2))}
    <path d={`M${hip[0]} ${hip[1]} L${neck[0]} ${neck[1]}`} {...ink(d, 10, color)} />
    <circle cx={neck[0] + Math.sin(hd) * 36} cy={neck[1] - Math.cos(hd) * 36} r={30} {...ink(d, 9, color)} />
  </g>;
};

const Ground = ({d, y = GROUND, x0 = 80, x1 = 1000}) => <path d={`M${x0} ${y} Q 540 ${y + 6} ${x1} ${y - 2}`} {...ink(d, 6)} />;
const Label = ({x, y, children, size = 46, c = INK, d = 1}) => <text x={x} y={y} textAnchor="middle" fontFamily={MARKER} fontSize={size} fill={c} opacity={d}>{children}</text>;

function Scene({sc, t, lf}) {
  const d = interpolate(lf, [0, 14], [0, 1], cl), cyc = lf / 22;
  switch (sc.kind) {
    case 'alarm': {
      const sit = interpolate(t, [0.35, 0.55], [0, 1], cl), ring = t < 0.4 ? Math.sin(lf * 2.2) * 6 : 0;
      return <g>
        <rect x={180} y={1150} width={560} height={110} rx={14} {...ink(d)} /><path d="M180 1260 L180 1320 M740 1260 L740 1320" {...ink(d)} />
        <rect x={200} y={1110} width={130} height={50} rx={22} {...ink(d)} />
        <g transform={`translate(${860 + ring} 1170)`}><circle r={62} {...ink(d)} /><Label x={0} y={18} size={44}>5:00</Label>
          {ring ? <path d="M-80 -60 L-100 -80 M80 -60 L100 -80 M0 -80 L0 -105" {...ink(1, 6)} /> : null}</g>
        <path d="M820 1240 L900 1240 L900 1320" {...ink(d, 6)} />
        <Stick x={300 + sit * 60} y={sit ? 1150 : 1135} pose={sit ? 'sit' : 'stand'} rot={(1 - sit) * -90} d={d} />
      </g>;
    }
    case 'alone': {
      const type = Math.sin(lf * 1.3) * 4;
      return <g>
        <rect x={120} y={560} width={220} height={240} {...ink(d)} /><path d="M230 560 L230 800 M120 680 L340 680" {...ink(d, 5)} />
        <path d="M285 610 a35 35 0 1 0 25 55 a28 28 0 1 1 -25 -55" {...ink(d, 5)} />
        <polygon points="760,860 640,1150 900,1150" fill={GOLD} opacity={0.18 * d} />
        <path d="M760 860 L800 800 L720 760 M700 760 L760 740" {...ink(d, 6)} />
        <path d="M480 1150 L960 1150 M520 1150 L520 1300 M920 1150 L920 1300" {...ink(d)} />
        <rect x={600} y={1080} width={130} height={70} {...ink(d, 5)} />
        <path d="M300 1185 L420 1185 L420 1300 M300 1185 L300 1300" {...ink(d, 6)} />
        <g transform={`translate(0 ${type * 0.3})`}><Stick x={370} y={1185} pose="desk" d={d} /></g>
      </g>;
    }
    case 'stairs': {
      const n = 6, sw = 130, sh = 90, x0 = 150, labels = sc.labels ?? [];
      const p = interpolate(t, [0.05, 0.92], [0, n - 0.4], cl), k = Math.floor(p), fr = p - k;
      const hop = Math.sin(Math.min(1, fr * 1.4) * Math.PI) * 30;
      return <g>
        <path d={Array.from({length: n}, (_, i) => `${i ? 'L' : 'M'}${x0 + i * sw} ${GROUND - i * sh} L${x0 + (i + 1) * sw} ${GROUND - i * sh} L${x0 + (i + 1) * sw} ${GROUND - (i + 1) * sh}`).join(' ')} {...ink(d)} />
        {labels.map((l, i) => <Label key={i} x={x0 + (i * (n - 1)) / Math.max(1, labels.length - 1) * sw + sw / 2} y={GROUND - (i * (n - 1)) / Math.max(1, labels.length - 1) * sh + 55} size={34} d={d}>{l}</Label>)}
        <Stick x={x0 + sw * 0.5 + p * sw} y={GROUND - Math.min(k, n - 1) * sh - (fr > 0.5 && k < n - 1 ? sh * Math.min(1, (fr - 0.5) * 3) : 0) - hop} walk={cyc} d={d} />
      </g>;
    }
    case 'future': {
      const walkx = interpolate(t, [0, 0.8], [140, 470], cl);
      return <g>
        <Ground d={d} />
        <Stick x={walkx} y={GROUND} walk={t < 0.8 ? cyc : undefined} d={d} />
        <Stick x={800} y={GROUND} s={1.35} dir={-1} pose={t > 0.75 ? 'wave' : 'stand'} color={GOLD} glow d={interpolate(lf, [8, 30], [0, 1], cl)} />
        <Label x={800} y={GROUND + 80} size={40} c={GOLD} d={d}>{sc.who ?? 'future you'}</Label>
      </g>;
    }
    case 'two': {
      const rep = (Math.sin(lf / 7) + 1) / 2;
      return <g>
        <path d="M540 520 L540 1420" {...ink(d, 5)} strokeDasharray="0.02 0.03" />
        <path d="M70 1190 L420 1190 L420 1300 M70 1190 L70 1300 M70 1190 L70 1080 M60 1140 L110 1140" {...ink(d)} />
        <g><Stick x={190} y={1190} pose="phone" d={d} /><rect x={262} y={1052} width={34} height={56} rx={6} fill="#7ec8ff" opacity={0.85 * d} /></g>
        <Ground d={d} x0={600} x1={1010} />
        <g transform={`translate(0 ${-rep * 40})`}>
          <path d="M650 958 L960 958" {...ink(d, 10)} /><rect x={640} y={925} width={26} height={66} {...ink(d, 6)} /><rect x={944} y={925} width={26} height={66} {...ink(d, 6)} />
        </g>
        <Stick x={805} y={GROUND} pose="lift" d={d} />
        <Label x={260} y={1420} d={d}>{sc.left ?? 'scrolling'}</Label><Label x={805} y={1420} d={d}>{sc.right ?? 'building'}</Label>
      </g>;
    }
    case 'carry': {
      const old = sc.reverse, x = interpolate(t, [0, 1], [180, 700], cl);
      if (old) return <g><Ground d={d} />
        <Stick x={x} y={GROUND} pose="cane" walk={cyc * 0.6} s={0.92} d={d} /><path d={`M${x + 70} ${GROUND - 150} L${x + 95} ${GROUND}`} {...ink(d, 7)} />
        <Stick x={x - 120} y={GROUND} walk={cyc * 0.6} s={1.08} d={d} />
        <path d={`M${x - 90} ${GROUND - 210} Q ${x - 30} ${GROUND - 240} ${x + 10} ${GROUND - 205}`} {...ink(d, 8)} />
        <path d={`M${x - 40} ${GROUND - 330} c -12 -18 -38 -8 -28 12 l 28 26 l 28 -26 c 10 -20 -16 -30 -28 -12`} fill="#e04848" stroke="none" opacity={interpolate(t, [0.5, 0.7], [0, 1], cl)} />
      </g>;
      return <g><Ground d={d} />
        <Stick x={x} y={GROUND} pose="carry" walk={cyc} s={1.15} d={d} />
        <Stick x={x + 6} y={GROUND - 272} pose="ride" s={0.55} d={d} />
      </g>;
    }
    case 'fall': case 'rise': {
      const down = sc.kind === 'fall' ? interpolate(t, [0.35, 0.5], [0, 1], cl) : interpolate(t, [0.25, 0.6], [1, 0], cl);
      const x = sc.kind === 'fall' ? interpolate(t, [0, 0.45], [140, 470], cl) : interpolate(t, [0.6, 1], [470, 760], cl);
      return <g><Ground d={d} />
        <path d={`M420 ${GROUND} q 25 -45 55 0`} {...ink(d)} />
        <Stick x={x + down * 60} y={GROUND - down * 25} run={down < 0.05 && (sc.kind === 'fall' ? t < 0.45 : t > 0.6) ? cyc : undefined} rot={down * 88} d={d} />
        {sc.kind === 'fall' && down > 0.9 && <Label x={560} y={1100} size={40}>ouch.</Label>}
      </g>;
    }
    case 'boulder': {
      const p = interpolate(t, [0, 1], [0, 0.55], cl), hx = 120 + p * 760, hy = 1420 - p * 520;
      return <g>
        <path d="M60 1450 L1020 900" {...ink(d)} />
        <circle cx={hx + 150} cy={hy - 155} r={95} {...ink(d)} transform={`rotate(${p * 400} ${hx + 150} ${hy - 155})`} />
        <path d={`M${hx + 150} ${hy - 230} L${hx + 160} ${hy - 200}`} {...ink(d, 5)} transform={`rotate(${p * 400} ${hx + 150} ${hy - 155})`} />
        <Stick x={hx + 40} y={hy - 10} pose="push" rot={-30} d={d} />
      </g>;
    }
    case 'path': {
      const x = interpolate(t, [0, 0.55], [540, 540], cl), y = interpolate(t, [0, 0.55], [1500, 1180], cl), turn = interpolate(t, [0.6, 1], [0, 1], cl);
      return <g>
        <path d="M480 1560 L500 1150 Q 380 980 140 900 M600 1560 L580 1150 L700 1060 L640 980 L800 900 L760 820 L940 760" {...ink(d)} />
        <Label x={200} y={860} d={d}>{sc.easy ?? 'easy'}</Label><Label x={930} y={720} d={d}>{sc.hard ?? 'hard'}</Label>
        <Stick x={x + turn * 150} y={y - turn * 110} walk={cyc} s={0.8} dir={turn > 0.05 ? 1 : 1} d={d} />
      </g>;
    }
    case 'cta': return <g><Ground d={d} /><Stick x={540} y={GROUND} pose="wave" d={d} /></g>;
    default: return <g><Ground d={d} /><Stick x={540} y={GROUND} pose={sc.pose ?? 'stand'} d={d} /></g>; // 'words'
  }
}

export const Mindset = ({scenes = [], music = true}) => {
  const f = useCurrentFrame();
  let acc = 0, i = 0;
  for (; i < scenes.length - 1 && f >= acc + scenes[i].sec * FPS; i++) acc += scenes[i].sec * FPS;
  const sc = scenes[i] ?? {}, lf = f - acc, len = (sc.sec ?? 3) * FPS, t = lf / len;
  const big = !sc.kind || sc.kind === 'words' || sc.kind === 'cta', text = sc.text ?? sc.vo ?? '';
  const boil = Math.floor(f / 4);
  return <AbsoluteFill style={{background: PAPER}}>
    {music && <Audio src={staticFile('story-sound.wav')} />}
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs><filter id="boil"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={boil % 9} /><feDisplacementMap in="SourceGraphic" scale={5} /></filter></defs>
      <g filter="url(#boil)" opacity={interpolate(lf, [0, 5], [0, 1], cl)} transform="translate(540 1150) scale(1.18) translate(-540 -1150)"><Scene sc={sc} t={t} lf={lf} /></g>
    </svg>
    <div style={{position: 'absolute', left: 70, right: 70, top: big ? 640 : 250, textAlign: 'center', fontFamily: MARKER, color: INK,
      fontSize: big ? 96 : 72, lineHeight: 1.15, opacity: interpolate(lf, [3, 10], [0, 1], cl), transform: `translateY(${interpolate(lf, [3, 12], [14, 0], cl)}px)`}}>
      {text.split('\n').map((l, k) => <div key={k}><span style={{background: `linear-gradient(transparent 62%, ${GOLD}66 62%)`}}>{l}</span></div>)}
    </div>
  </AbsoluteFill>;
};
