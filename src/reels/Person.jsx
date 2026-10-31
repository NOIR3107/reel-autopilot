// A cast of flat characters built from one rig (400 x 760 viewBox, feet at y ~745). Every look lives in CAST.
// Animation: arms ease between poses, talking moves the mouth (from the voiceover level), the head nods and
// the free hand gestures while talking, plus breathing, blinking and a bounce when a pose changes.
import {useCurrentFrame} from 'remotion';

export const CAST = {
  mike:  {skin: '#e9b48a', hair: 'short', hairC: '#5a3a22', beard: 'full', hat: 'hard', hatC: '#d9ff3f', shirt: '#2f4f86', pants: '#1f2a3d'},
  dan:   {skin: '#8d5a3b', hair: 'short', hairC: '#1d140f', beard: 'stubble', hat: 'cap', hatC: '#1d6fd1', shirt: '#e7edf5', pants: '#2b3445'},
  rob:   {skin: '#f1c7a2', hair: 'bald', hairC: '#7a6a5c', beard: 'full', beardC: '#8f8478', hat: 'none', glasses: true, shirt: '#0e7490', pants: '#283142'},
  tony:  {skin: '#d9a37c', hair: 'short', hairC: '#20160f', beard: 'mustache', hat: 'hard', hatC: '#f97316', shirt: '#3f3f46', pants: '#1c1f26'},
  luis:  {skin: '#b97a52', hair: 'curly', hairC: '#1f1510', beard: 'stubble', hat: 'cap', hatC: '#15803d', shirt: '#f1e7d0', pants: '#4b3b2a'},
  sarah: {skin: '#f2c9a8', hair: 'pony', hairC: '#b3651f', beard: 'none', hat: 'none', shirt: '#db2777', pants: '#334155', female: true},
  maya:  {skin: '#7a4a32', hair: 'bun', hairC: '#140d0a', beard: 'none', hat: 'none', shirt: '#7c3aed', pants: '#1e293b', female: true, glasses: true},
  karen: {skin: '#efc3a0', hair: 'long', hairC: '#e5c07b', beard: 'none', hat: 'none', shirt: '#0f766e', pants: '#3f3f46', female: true},
  leo:   {skin: '#e8c3a0', hair: 'short', hairC: '#3a2a1c', beard: 'none', hat: 'beanie', hatC: '#c2410c', shirt: '#7c5e2e', pants: '#2b2b30', vest: true},
  kai:   {skin: '#c98d62', hair: 'curly', hairC: '#1a120c', beard: 'stubble', hat: 'none', shirt: '#b91c1c', pants: '#1f2937', bag: true},
  ava:   {skin: '#f0c4a0', hair: 'pony', hairC: '#2b1a10', beard: 'none', hat: 'none', shirt: '#475569', pants: '#1e293b', female: true, bag: true},
  zed:   {skin: '#8fa58a', hair: 'short', hairC: '#2f3a2c', beard: 'none', hat: 'none', shirt: '#5b4636', pants: '#2d2a26', zombie: true},
  zoe:   {skin: '#9db49a', hair: 'long', hairC: '#3b3226', beard: 'none', hat: 'none', shirt: '#6b4f5a', pants: '#2d2a26', zombie: true, female: true},
  neel:  {skin: '#f0c8a5', hair: 'neel', hairC: '#121014', beard: 'none', hat: 'none', glasses: true, shirt: '#f5c9d2', pants: '#f3f2ee', shoes: '#e9e6df', collar: true, faceW: 128, watch: 'R', thread: 'L'},
  vince: {skin: '#e0ac86', hair: 'slick', hairC: '#111', beard: 'none', hat: 'none', shades: true, shirt: '#111827', pants: '#111827'},
};
CAST.host = CAST.neel; // every reel's presenter is Neel

const SHOULDER = {L: [150, 318], R: [250, 318]};
export const POSES = {
  idle: {L: [[128, 420], [124, 515]], R: [[272, 420], [276, 515]]},
  phoneLook: {L: [[128, 420], [124, 515]], R: [[302, 425], [246, 372]], phone: 'R'},
  call: {L: [[128, 420], [124, 515]], R: [[322, 330], [272, 236]], phone: 'R'},
  shrug: {L: [[92, 385], [64, 300]], R: [[308, 385], [336, 300]]},
  fistPump: {L: [[128, 420], [124, 515]], R: [[318, 392], [300, 296]], fist: 'R'},
  facepalm: {L: [[128, 420], [124, 515]], R: [[296, 365], [222, 210]]},
  point: {L: [[128, 420], [124, 515]], R: [[322, 380], [384, 452]]},
  wave: {L: [[128, 420], [124, 515]], R: [[324, 300], [350, 196]]},
  armsCrossed: {L: [[150, 430], [262, 410]], R: [[250, 430], [140, 410]]},
  explain: {L: [[96, 420], [70, 360]], R: [[304, 420], [330, 360]]},
  headHands: {L: [[100, 300], [150, 170]], R: [[300, 300], [250, 170]]},
  celebrate: {L: [[90, 250], [70, 140]], R: [[310, 250], [330, 140]]},
  zombie: {L: [[150, 360], [150, 300]], R: [[250, 360], [250, 300]]},
  run: {L: [[110, 390], [150, 450]], R: [[300, 360], [330, 290]]},
  hold: {L: [[150, 420], [200, 400]], R: [[250, 420], [200, 400]]},
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerpArm = (a, b, t) => a.map((pt, i) => pt.map((v, j) => lerp(v, b[i][j], t)));
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

const Arm = ({side, pose, phone, fist, c, wob}) => {
  const s = SHOULDER[side];
  const [e, h] = pose.map(([x, y]) => [x + wob[0], y + wob[1]]);
  const skin = c.skin;
  return (
    <g>
      <path d={`M${s[0]} ${s[1]} L${e[0]} ${e[1]}`} stroke={c.shirt} strokeWidth="46" strokeLinecap="round" />
      <path d={`M${e[0]} ${e[1]} L${h[0]} ${h[1]}`} stroke={skin} strokeWidth="34" strokeLinecap="round" />
      <circle cx={e[0]} cy={e[1]} r="21" fill={c.shirt} style={{filter: 'brightness(.85)'}} />
      {[[c.watch, '#c9ced6', 0.66, 0.8], [c.thread, '#d4232e', 0.74, 0.79]].filter(([sd]) => sd === side).map(([, col, a, b]) => (
        <path key={col} d={`M${e[0] + (h[0] - e[0]) * a} ${e[1] + (h[1] - e[1]) * a} L${e[0] + (h[0] - e[0]) * b} ${e[1] + (h[1] - e[1]) * b}`} stroke={col} strokeWidth="38" strokeLinecap="butt" />))}
      {phone && (
        <g transform={`translate(${h[0]} ${h[1]}) rotate(${side === 'R' ? -12 : 12})`}>
          <rect x="-20" y="-40" width="40" height="72" rx="8" fill="#1b1b22" />
          <rect x="-15" y="-34" width="30" height="58" rx="4" fill="#7ab8ff" opacity=".9" />
        </g>
      )}
      {fist ? <rect x={h[0] - 24} y={h[1] - 22} width="48" height="42" rx="14" fill={skin} /> : <circle cx={h[0]} cy={h[1]} r="20" fill={skin} />}
    </g>
  );
};

const Face = ({mood, blink, talk, c}) => {
  const ink = '#1b1b22', lip = '#2a1a10';
  const eyeR = mood === 'shocked' ? 9 : 6.5;
  const eyes = mood === 'squint' || blink
    ? <><path d="M170 200 L186 200" stroke={ink} strokeWidth="5" strokeLinecap="round" /><path d="M214 200 L230 200" stroke={ink} strokeWidth="5" strokeLinecap="round" /></>
    : <><circle cx="178" cy="200" r={eyeR} fill={ink} /><circle cx="222" cy="200" r={eyeR} fill={ink} /><circle cx="180" cy="197" r="2" fill="#fff" /><circle cx="224" cy="197" r="2" fill="#fff" /></>;
  const lift = talk * 6; // brows rise a little on loud syllables
  const brow = {
    neutral: ['M164 183 L190 181', 'M210 181 L236 183'], happy: ['M164 180 Q177 172 190 177', 'M210 177 Q223 172 236 180'],
    worried: ['M164 180 L190 175', 'M210 175 L236 180'], shocked: ['M164 170 Q177 160 190 168', 'M210 168 Q223 160 236 170'],
    smug: ['M164 183 L190 182', 'M210 176 Q223 168 236 175'], squint: ['M164 186 L190 190', 'M210 190 L236 186'], angry: ['M164 176 L190 186', 'M210 186 L236 176'],
  }[mood] ?? ['M164 183 L190 181', 'M210 181 L236 183'];
  const open = Math.max(talk, mood === 'shocked' ? 0.6 : 0, c.zombie ? 0.5 : 0);
  const mouth = open > 0.08
    ? <ellipse cx="200" cy="260" rx={10 + open * 6} ry={3 + open * 13} fill={lip} />
    : {
        happy: <path d="M180 252 Q200 276 220 252 Z" fill={lip} />,
        worried: <path d="M186 262 Q200 252 214 262" stroke={lip} strokeWidth="5" fill="none" strokeLinecap="round" />,
        smug: <path d="M186 258 Q204 266 218 252" stroke={lip} strokeWidth="5" fill="none" strokeLinecap="round" />,
        angry: <path d="M186 262 Q200 254 214 262" stroke={lip} strokeWidth="6" fill="none" strokeLinecap="round" />,
      }[mood] ?? <path d="M188 258 L212 258" stroke={lip} strokeWidth="5" strokeLinecap="round" />;
  return (
    <g>
      {c.zombie ? <><circle cx="178" cy="200" r="8" fill="#ff3b30" /><circle cx="222" cy="200" r="8" fill="#ff3b30" /><circle cx="178" cy="200" r="16" fill="#ff3b30" opacity=".25" /><circle cx="222" cy="200" r="16" fill="#ff3b30" opacity=".25" /></> : c.shades ? <path d="M160 190 L240 190 L236 212 Q222 218 206 210 L194 210 Q178 218 164 212 Z" fill="#0b0b0f" /> : eyes}
      {c.glasses && <g stroke="#2b2b33" strokeWidth="4" fill="none"><circle cx="178" cy="200" r="17" /><circle cx="222" cy="200" r="17" /><path d="M195 200 L205 200" /></g>}
      <g transform={`translate(0 ${-lift})`}>{brow.map((d) => <path key={d} d={d} stroke={c.female ? c.hairC : c.beardC ?? c.hairC} strokeWidth="7" strokeLinecap="round" fill="none" />)}</g>
      <path d="M194 214 Q200 230 208 226" stroke="rgba(0,0,0,.18)" strokeWidth="6" fill="none" strokeLinecap="round" />
      {c.female && <><circle cx="164" cy="238" r="10" fill="#ff8a8a" opacity=".35" /><circle cx="236" cy="238" r="10" fill="#ff8a8a" opacity=".35" /></>}
      {mouth}
    </g>
  );
};

const Hair = ({c, back}) => {
  const h = c.hairC;
  if (back) {
    if (c.hair === 'long') return <path d="M132 170 Q130 330 150 360 L250 360 Q270 330 268 170 Z" fill={h} />;
    if (c.hair === 'pony') return <path d="M250 150 Q300 180 286 290 Q276 320 262 300 Q276 230 246 180 Z" fill={h} />;
    if (c.hair === 'bun') return <circle cx="200" cy="96" r="30" fill={h} />;
    return null;
  }
  if (c.hair === 'bald' || c.hat !== 'none') return null;
  if (c.hair === 'curly') return <g fill={h}>{[150, 172, 194, 216, 238, 252, 140].map((x, i) => <circle key={i} cx={x} cy={i === 6 ? 160 : 128 + (i % 2) * 8} r="24" />)}</g>;
  if (c.hair === 'neel') return (  // thick short hair: tall textured top swept up and to one side, short sides
    <g fill={h}><path d="M136 186 Q128 120 160 98 Q178 76 214 78 Q256 80 268 120 Q274 150 264 186 Q258 156 244 146 Q230 136 208 134 Q176 136 158 150 Q144 164 136 186 Z" />
      <path d="M150 120 Q166 66 214 68 Q250 70 262 98 Q240 84 214 90 Q186 96 168 116 Z" />
      <path d="M176 88 Q200 70 236 78" stroke="#3a3540" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M160 112 Q182 90 214 86 M214 98 Q236 92 256 104" stroke="#2a2630" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="137" y="164" width="11" height="42" rx="5" /><rect x="252" y="164" width="11" height="42" rx="5" /></g>);
  if (c.hair === 'slick') return <path d="M140 170 Q138 110 200 108 Q258 110 262 150 Q230 128 170 140 Q150 150 140 170 Z" fill={h} />;
  return <path d="M140 172 Q138 110 200 108 Q262 110 260 172 Q250 140 200 136 Q150 140 140 172 Z" fill={h} />;
};

const Hat = ({c}) => {
  if (c.hat === 'hard') return (
    <g><path d="M136 172 Q138 98 200 95 Q262 98 264 172 Z" fill={c.hatC} />
      <path d="M200 96 L200 168 M168 104 Q160 135 160 168 M232 104 Q240 135 240 168" stroke="rgba(0,0,0,.15)" strokeWidth="4" fill="none" />
      <path d="M126 170 Q200 150 274 170 Q266 190 200 184 Q134 190 126 170 Z" fill={c.hatC} style={{filter: 'brightness(.85)'}} /></g>);
  if (c.hat === 'beanie') return (
    <g><path d="M140 176 Q138 96 200 94 Q262 96 260 176 Z" fill={c.hatC} />
      <rect x="134" y="160" width="132" height="30" rx="12" fill={c.hatC} style={{filter: 'brightness(.82)'}} />
      {[150, 170, 190, 210, 230, 250].map((x) => <path key={x} d={`M${x} 164 L${x} 186`} stroke="rgba(0,0,0,.18)" strokeWidth="4" />)}</g>);
  if (c.hat === 'cap') return (
    <g><path d="M138 168 Q140 104 200 102 Q260 104 262 168 Z" fill={c.hatC} />
      <path d="M200 160 Q262 150 300 172 Q262 182 200 174 Z" fill={c.hatC} style={{filter: 'brightness(.8)'}} /></g>);
  return null;
};

// talk: 0..1 mouth level this frame. enter: 0..1 slide-in. prevPose eases into pose over the first 8 frames of a scene.
export const Person = ({who = 'mike', mood = 'neutral', pose = 'idle', prevPose, local = 99, talk = 0, size = 1, flip = false}) => {
  const frame = useCurrentFrame();
  const c = CAST[who] ?? CAST.mike;
  const to = POSES[pose] ?? POSES.idle, from = POSES[prevPose] ?? to;
  const k = ease(local / 8);
  const p = {...to, L: lerpArm(from.L, to.L, k), R: lerpArm(from.R, to.R, k)};
  const blink = (frame + who.length * 13) % 96 > 91;
  const breathe = Math.sin(frame / 14) * 3;
  const pop = pose !== prevPose ? Math.sin(Math.min(1, local / 8) * Math.PI) * 10 : 0; // little hop on a new pose
  const nod = talk * 4 * Math.sin(frame / 2.2);
  const wob = talk > 0.1 ? [Math.sin(frame / 3) * 10 * talk, Math.cos(frame / 4) * 8 * talk] : [0, 0];
  const sway = c.zombie ? Math.sin(frame / 9 + who.length) * 7 : 0;
  const tilt = sway + ({shocked: -4, worried: 4, smug: -6, happy: 3, angry: 2}[mood] ?? 0) + nod;
  const freeArm = p.phone === 'R' || p.fist === 'R' ? 'L' : 'R';
  return (
    <svg width={400 * size} height={760 * size} viewBox="0 0 400 760" style={{overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined}}>
      <ellipse cx="200" cy="748" rx="120" ry="14" fill="rgba(13,20,36,.14)" />
      <g transform={`translate(0 ${breathe - pop})`}>
        <rect x="150" y="515" width="46" height="205" rx="18" fill={c.pants} />
        <rect x="204" y="515" width="46" height="205" rx="18" fill={c.pants} />
        <rect x="136" y="698" width="66" height="44" rx="16" fill={c.shoes ?? '#3a2a1e'} />
        <rect x="198" y="698" width="66" height="44" rx="16" fill={c.shoes ?? '#3a2a1e'} />
        {c.pants === '#f3f2ee' && <path d="M173 530 L173 700 M227 530 L227 700" stroke="rgba(0,0,0,.08)" strokeWidth="4" />}
        <Arm side="L" pose={p.L} phone={p.phone === 'L'} c={c} wob={freeArm === 'L' ? wob : [0, 0]} />
        <path d={c.female ? 'M136 335 Q136 298 166 293 L234 293 Q264 298 264 335 L270 532 L130 532 Z' : 'M128 335 Q128 298 162 293 L238 293 Q272 298 272 335 L264 532 L136 532 Z'} fill={c.shirt} />
        <path d="M182 293 L200 322 L218 293 Z" fill={c.skin} />
        {c.collar && <><path d="M162 290 L199 322 L178 338 L156 300 Z M238 290 L201 322 L222 338 L244 300 Z" fill={c.shirt} stroke="rgba(0,0,0,.12)" strokeWidth="3" />
          <path d="M200 326 L200 512" stroke="rgba(0,0,0,.1)" strokeWidth="3" />{[360, 410, 460].map((y) => <circle key={y} cx="200" cy={y} r="4" fill="rgba(0,0,0,.15)" />)}</>}
        {c.zombie && <path d="M140 470 L160 500 L175 470 L195 505 L215 468 L235 502 L255 470 L262 532 L136 532 Z" fill={c.skin} opacity=".9" />}
        {c.zombie && <path d="M175 360 Q190 380 182 410 M228 340 Q214 372 232 396" stroke="#7f1d1d" strokeWidth="6" fill="none" opacity=".7" />}
        {c.vest && <><path d="M134 330 L176 296 L184 532 L136 532 Z M266 330 L224 296 L216 532 L264 532 Z" fill="#d9a43a" /><path d="M140 380 L180 380 M140 430 L182 430 M260 380 L220 380 M260 430 L218 430" stroke="#a87a24" strokeWidth="5" /></>}
        {c.bag && <path d="M150 300 L250 470" stroke="#3f2a1d" strokeWidth="14" strokeLinecap="round" />}
        <rect x="134" y="512" width="132" height="24" rx="6" fill="rgba(0,0,0,.35)" />
        <g transform={`rotate(${tilt} 200 290)`}>
          <Hair c={c} back />
          <rect x="182" y="255" width="36" height="45" fill={c.skin} style={{filter: 'brightness(.88)'}} />
          <circle cx="141" cy="208" r="16" fill={c.skin} style={{filter: 'brightness(.9)'}} />
          <circle cx="259" cy="208" r="16" fill={c.skin} style={{filter: 'brightness(.9)'}} />
          <rect x={200 - (c.faceW ?? 118) / 2} y="120" width={c.faceW ?? 118} height="158" rx="58" fill={c.skin} />
          {c.beard === 'full' && <path d="M143 212 Q146 292 200 296 Q254 292 257 212 Q246 244 200 247 Q154 244 143 212 Z" fill={c.beardC ?? c.hairC} />}
          {c.beard === 'stubble' && <path d="M146 222 Q150 288 200 292 Q250 288 254 222 Q244 250 200 252 Q156 250 146 222 Z" fill={c.hairC} opacity=".35" />}
          {(c.beard === 'full' || c.beard === 'mustache') && <path d="M170 243 Q200 229 230 243 Q200 252 170 243 Z" fill={c.beardC ?? c.hairC} />}
          <Face mood={mood} blink={blink} talk={talk} c={c} />
          <Hair c={c} />
          <Hat c={c} />
        </g>
        <Arm side="R" pose={p.R} phone={p.phone === 'R'} fist={p.fist === 'R'} c={c} wob={freeArm === 'R' ? wob : [0, 0]} />
      </g>
    </svg>
  );
};
