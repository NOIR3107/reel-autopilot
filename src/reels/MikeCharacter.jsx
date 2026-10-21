// Mike, our recurring contractor. Flat illustration, front view, 400 x 760 viewBox (feet at y ~745).
// mood: neutral | happy | worried | shocked | smug | squint.  pose: see POSES.
import {useCurrentFrame} from 'remotion';

const C = {skin: '#e9b48a', skinShade: '#d49b70', beard: '#5a3a22', cap: '#d9ff3f', capShade: '#b5d92a', shirt: '#2f4f86', shirtShade: '#26416f',
  pants: '#1f2a3d', boots: '#4a3222', belt: '#8a5a2b', ink: '#1b1b22'};

const SHOULDER = {L: [150, 318], R: [250, 318]};
// Each arm = [elbow, hand] in viewBox px.
export const POSES = {
  idle: {L: [[128, 420], [124, 515]], R: [[272, 420], [276, 515]]},
  phoneLook: {L: [[128, 420], [124, 515]], R: [[302, 425], [246, 372]], phone: 'R'},
  call: {L: [[128, 420], [124, 515]], R: [[322, 330], [272, 236]], phone: 'R'},
  shrug: {L: [[92, 385], [64, 300]], R: [[308, 385], [336, 300]]},
  fistPump: {L: [[128, 420], [124, 515]], R: [[318, 392], [300, 296]], fist: 'R'},
  facepalm: {L: [[128, 420], [124, 515]], R: [[296, 365], [222, 210]]},
  point: {L: [[128, 420], [124, 515]], R: [[322, 380], [384, 452]]},
  wave: {L: [[128, 420], [124, 515]], R: [[324, 300], [350, 196]]},
};

const Arm = ({side, pose, phone, fist}) => {
  const [s, [e, h]] = [SHOULDER[side], pose];
  return (
    <g>
      <path d={`M${s[0]} ${s[1]} L${e[0]} ${e[1]}`} stroke={C.shirt} strokeWidth="46" strokeLinecap="round" />
      <path d={`M${e[0]} ${e[1]} L${h[0]} ${h[1]}`} stroke={C.skin} strokeWidth="34" strokeLinecap="round" />
      <circle cx={e[0]} cy={e[1]} r="21" fill={C.shirtShade} />
      {phone && (
        <g transform={`translate(${h[0]} ${h[1]}) rotate(${side === 'R' ? -12 : 12})`}>
          <rect x="-20" y="-40" width="40" height="72" rx="8" fill={C.ink} />
          <rect x="-15" y="-34" width="30" height="58" rx="4" fill="#7ab8ff" opacity=".9" />
        </g>
      )}
      {fist
        ? <g><rect x={h[0] - 24} y={h[1] - 22} width="48" height="42" rx="14" fill={C.skin} /><path d={`M${h[0] - 12} ${h[1] - 20} L${h[0] - 12} ${h[1] - 6} M${h[0]} ${h[1] - 20} L${h[0]} ${h[1] - 6} M${h[0] + 12} ${h[1] - 20} L${h[0] + 12} ${h[1] - 6}`} stroke={C.skinShade} strokeWidth="3" strokeLinecap="round" /></g>
        : <circle cx={h[0]} cy={h[1]} r="20" fill={C.skin} />}
    </g>
  );
};

const Face = ({mood, blink}) => {
  const eyeR = mood === 'shocked' ? 8.5 : 6.5;
  const eyes = mood === 'squint' || blink
    ? <><path d="M170 200 L186 200" stroke={C.ink} strokeWidth="5" strokeLinecap="round" /><path d="M214 200 L230 200" stroke={C.ink} strokeWidth="5" strokeLinecap="round" /></>
    : <><circle cx="178" cy="200" r={eyeR} fill={C.ink} /><circle cx="222" cy="200" r={eyeR} fill={C.ink} /></>;
  const brow = {
    neutral: ['M164 183 L190 181', 'M210 181 L236 183'],
    happy: ['M164 180 Q177 172 190 177', 'M210 177 Q223 172 236 180'],
    worried: ['M164 180 L190 175', 'M210 175 L236 180'],
    shocked: ['M164 172 Q177 164 190 170', 'M210 170 Q223 164 236 172'],
    smug: ['M164 183 L190 182', 'M210 176 Q223 168 236 175'],
    squint: ['M164 186 L190 190', 'M210 190 L236 186'],
  }[mood];
  const mouth = {
    neutral: <path d="M188 258 L212 258" stroke="#2a1a10" strokeWidth="5" strokeLinecap="round" />,
    happy: <path d="M180 252 Q200 276 220 252 Z" fill="#2a1a10" />,
    worried: <path d="M186 262 Q200 252 214 262" stroke="#2a1a10" strokeWidth="5" fill="none" strokeLinecap="round" />,
    shocked: <ellipse cx="200" cy="260" rx="10" ry="13" fill="#2a1a10" />,
    smug: <path d="M186 258 Q204 266 218 252" stroke="#2a1a10" strokeWidth="5" fill="none" strokeLinecap="round" />,
    squint: <path d="M188 259 Q200 255 212 259" stroke="#2a1a10" strokeWidth="5" fill="none" strokeLinecap="round" />,
  }[mood];
  return (
    <g>
      {eyes}
      {brow.map((d) => <path key={d} d={d} stroke={C.beard} strokeWidth="7" strokeLinecap="round" fill="none" />)}
      <path d="M194 214 Q200 230 208 226" stroke={C.skinShade} strokeWidth="6" fill="none" strokeLinecap="round" />
      {mouth}
    </g>
  );
};

export const Mike = ({mood = 'neutral', pose = 'idle', size = 1}) => {
  const frame = useCurrentFrame();
  const p = POSES[pose] ?? POSES.idle;
  const blink = frame % 96 > 91;
  const bob = Math.sin(frame / 12) * 4;
  const tilt = {shocked: -3, worried: 4, smug: -5, happy: 2}[mood] ?? 0;
  return (
    <svg width={400 * size} height={760 * size} viewBox="0 0 400 760" style={{overflow: 'visible'}}>
      <ellipse cx="200" cy="748" rx="120" ry="14" fill="rgba(13,20,36,.12)" />
      <g transform={`translate(0 ${bob})`}>
        {/* legs + boots */}
        <rect x="150" y="515" width="46" height="205" rx="18" fill={C.pants} />
        <rect x="204" y="515" width="46" height="205" rx="18" fill={C.pants} />
        <rect x="136" y="698" width="66" height="44" rx="16" fill={C.boots} />
        <rect x="198" y="698" width="66" height="44" rx="16" fill={C.boots} />
        {/* back arm drawn first when it crosses the body */}
        <Arm side="L" pose={p.L} phone={p.phone === 'L'} />
        {/* torso */}
        <path d="M128 335 Q128 298 162 293 L238 293 Q272 298 272 335 L264 532 L136 532 Z" fill={C.shirt} />
        <path d="M200 293 L200 515" stroke={C.shirtShade} strokeWidth="4" />
        <rect x="160" y="340" width="30" height="34" rx="5" fill={C.shirtShade} />
        <path d="M182 293 L200 322 L218 293 Z" fill={C.skin} />
        <rect x="134" y="512" width="132" height="24" rx="6" fill={C.belt} />
        <rect x="190" y="514" width="20" height="20" rx="4" fill="#d4b26a" />
        {/* head */}
        <g transform={`rotate(${tilt} 200 290)`}>
          <rect x="182" y="255" width="36" height="45" fill={C.skinShade} />
          <circle cx="141" cy="208" r="16" fill={C.skinShade} />
          <circle cx="259" cy="208" r="16" fill={C.skinShade} />
          <rect x="141" y="120" width="118" height="158" rx="56" fill={C.skin} />
          <path d="M143 212 Q146 292 200 296 Q254 292 257 212 Q246 244 200 247 Q154 244 143 212 Z" fill={C.beard} />
          <path d="M170 243 Q200 229 230 243 Q200 252 170 243 Z" fill={C.beard} />
          <Face mood={mood} blink={blink} />
          {/* cap */}
          <path d="M136 172 Q138 98 200 95 Q262 98 264 172 Z" fill={C.cap} />
          <path d="M200 96 L200 168 M168 104 Q160 135 160 168 M232 104 Q240 135 240 168" stroke={C.capShade} strokeWidth="4" fill="none" />
          <path d="M126 170 Q200 150 274 170 Q266 190 200 184 Q134 190 126 170 Z" fill={C.capShade} />
          <circle cx="200" cy="97" r="7" fill={C.capShade} />
        </g>
        <Arm side="R" pose={p.R} phone={p.phone === 'R'} fist={p.fist === 'R'} />
      </g>
    </svg>
  );
};
