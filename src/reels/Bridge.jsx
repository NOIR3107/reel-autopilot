// "The 11'8" bridge": trucks keep hitting a low rail bridge (Durham, NC; almost 200 crashes since cameras went up in 2008,
// raised 8 inches in 2019). Detailed 3D street (bridgeKit.js) with soft shadows, a painted sky and cinematic camera cuts.
// Every truck is a pure function of the frame, so renders are repeatable. Timings match tools/bridge_sound.py.
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {streetKit, bridgeKit, gantryKit, truckKit, TRAILER_FRONT, AXLES, WHEEL_R} from './bridgeKit.js';

const FPS = 30, FONT = '"Bricolage Grotesque Variable", sans-serif';
const DUR = [2.2, 1.7, 1.4, 1.2, 1.0, 0.85, 0.75, 0.65]; // seconds per crash cycle, faster each time
const COUNT = [1, 2, 3, 6, 15, 50, 120, 199]; // sped-up counter
export const CYC = DUR.reduce((a, d, k) => [...a, {s: k ? a[k - 1].s + DUR[k - 1] : 0.8, d, hit: 0}], []).map((c) => ({...c, hit: c.s + 0.7 * c.d}));
export const PASS = {s: CYC[7].s + DUR[7], d: 1.85};
export const bridgeSeconds = () => 16.2;
const WORDS = [[0.4, 'This'], [1.1, 'bridge'], [1.8, 'is'], [2.5, '11 feet 8'], [3.4, 'Trucks'], [4.0, 'keep'], [4.6, 'hitting'], [5.2, 'it'], [6.0, 'Almost'], [6.7, '200'], [7.3, 'times'], [7.9, 'since'], [8.5, '2008'],
  [9.6, 'So'], [10.0, 'they'], [10.4, 'raised'], [10.9, 'it'], [11.3, '8'], [11.7, 'inches'], [12.9, 'Finally'], [13.5, 'trucks'], [14.0, 'fit']];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const CAB = ['#b3261e', '#1f4e8c', '#e9e9e9', '#22262b'], TRL = ['#eceff1', '#d9dde1', '#f4efe3', '#e3e7ea'];
const Z0 = 14, ZHIT = 2.2 - 0.35 - TRAILER_FRONT; // trailer nose meets the crash beam's face

const textTex = (lines, bg, fg, w = 512, h = 256) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([txt, size], k) => { g.font = `900 ${size}px Arial, sans-serif`; g.fillText(txt, w / 2, h / 2 + (k - (lines.length - 1) / 2) * size * 1.05); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const stripeTex = () => {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#f2c230'; g.fillRect(0, 0, 2048, 128); g.fillStyle = '#151515';
  for (let x = -128; x < 2048; x += 128) { g.beginPath(); g.moveTo(x, 128); g.lineTo(x + 64, 128); g.lineTo(x + 128, 0); g.lineTo(x + 64, 0); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

const Merged = ({mesh}) => <primitive object={mesh} castShadow receiveShadow />;
const Part = ({geo, ...rest}) => <mesh geometry={geo} castShadow receiveShadow {...rest}><meshStandardMaterial vertexColors roughness={0.7} metalness={0.05} /></mesh>;

const Truck = ({z, h, hit, since, cab, trl, dist}) => {
  const kit = useMemo(() => truckKit(cab, trl, h), [cab, trl, h]);
  const k = hit ? Math.min(since, 1.4) : 0;
  const rock = hit ? -Math.sin(k * 22) * 0.05 * Math.exp(-k * 3.5) : 0;
  const spin = -dist / WHEEL_R;
  const peel = hit ? 1.05 * (1 - Math.exp(-k * 6)) : 0;
  return (
    <group position={[0, 0, z]}>
      <group rotation={[rock, 0, 0]} position={[0, 0, 0]}>
        <Part geo={kit.cab} />
        <Part geo={kit.trailer} />
        {AXLES.map((az, i) => <Part key={i} geo={kit.axle} position={[0, WHEEL_R, az]} rotation={[spin, 0, 0]} />)}
        {/* front of the roof peels back like a can lid */}
        <group position={[0, h - 0.15, TRAILER_FRONT + 3.2]} rotation={[peel, 0, hit ? k * 0.15 : 0]}>
          <Part geo={kit.roof} />
        </group>
      </group>
    </group>
  );
};

// Hit effects in world space at the beam: sparks, flying metal, dust
const Impact = ({since, y}) => {
  if (since < 0 || since > 1.6) return null;
  const k = since;
  return (
    <group position={[0, y, 2.0]}>
      {Array.from({length: 26}, (_, i) => {
        const a = i * 2.39, sp = 4 + (i % 5) * 1.6, life = 0.35 + (i % 4) * 0.1;
        if (k > life) return null;
        return <mesh key={i} position={[Math.cos(a) * sp * k, Math.abs(Math.sin(a)) * sp * k - 9 * k * k, 1 + Math.sin(i) * sp * k * 0.6]}>
          <boxGeometry args={[0.06, 0.06, 0.25]} /><meshBasicMaterial color={i % 3 ? '#ffd27a' : '#fff4c2'} toneMapped={false} /></mesh>;
      })}
      {Array.from({length: 7}, (_, i) => {
        const a = i * 0.9 - 2.7;
        return <mesh key={`d${i}`} castShadow position={[Math.sin(a) * 3 * k, 0.2 + 5 * k - 9.8 * k * k * 0.8, 1.5 + 4 * k]} rotation={[k * (5 + i), k * 3, k * i]}>
          <boxGeometry args={[0.35 + (i % 3) * 0.15, 0.04, 0.3]} /><meshStandardMaterial color="#cfd4d8" metalness={0.6} roughness={0.35} /></mesh>;
      })}
      {Array.from({length: 6}, (_, i) => (
        <mesh key={`p${i}`} position={[(i - 2.5) * 0.7 * (1 + k), 0.2 + k * 0.8, 1.2 + i % 2]} scale={0.6 + k * 2.2}>
          <sphereGeometry args={[0.6, 12, 10]} /><meshStandardMaterial color="#d8d2c4" transparent opacity={Math.max(0, 0.5 - k * 0.32)} depthWrite={false} /></mesh>
      ))}
    </group>
  );
};

// Shots: [camera position, look-at]; z is the truck front so the chase shot can follow it
const SHOTS = {
  chase: (z) => [[3.2, 6.8, Math.max(z, ZHIT) + 31], [0, 3.0, Math.max(z, ZHIT) - 8]],
  front: () => [[-2.4, 1.5, -15], [0, 3.6, 3]],
  side: () => [[-3.4, 1.4, 13], [0.5, 3.6, 1]],
  high: () => [[5.6, 10.5, 15], [0, 2.4, 0]],
  street: () => [[-3.2, 2.0, 30], [0, 3.6, 0]],
};
const ORDER = ['chase', 'front', 'side', 'high', 'front', 'side', 'chase', 'high'];
const Cam = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.fov = fov; camera.near = 0.1; camera.far = 220; camera.updateProjectionMatrix(); camera.lookAt(...look);
  return null;
};

export const Bridge = ({music = true}) => {
  const f = useCurrentFrame(), t = f / FPS;
  const street = useMemo(() => streetKit(), []), bridge = useMemo(() => bridgeKit(), []), gantry = useMemo(() => gantryKit(), []);
  const tex = useMemo(() => ({low: textTex([["11'8\"", 170]], '#f2c230', '#111'), high: textTex([["12'4\"", 170]], '#f2c230', '#111'),
    gantry: textTex([['OVERHEIGHT', 92], ['MUST TURN', 92]], '#111', '#ffb000', 512, 256), board: textTex([['LOW', 70], ["CLEARANCE 11'8\"", 58]], '#f2c230', '#111', 512, 320), stripes: stripeTex()}), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.82, metalness: 0.04}), []);
  [street, bridge, gantry].forEach((m) => { m.material = mat; m.castShadow = true; m.receiveShadow = true; });

  const raised = t >= PASS.s - 0.4;
  const beamY = raised ? 3.76 : 3.56;
  let cur = CYC.findIndex((c) => t >= c.s && t < c.s + c.d);
  if (t < CYC[0].s) cur = 0;
  let truck = null, shake = 0, flash = 0, hitT = -9, frontZ = Z0, shot;
  if (cur >= 0) {
    const c = CYC[cur], lt = t - c.s, v = (Z0 - ZHIT) / (0.7 * c.d), hit = t >= c.hit;
    frontZ = hit ? ZHIT : Z0 - v * lt;
    truck = <Truck z={frontZ} h={3.95} hit={hit} since={t - c.hit} cab={CAB[cur % 4]} trl={TRL[cur % 4]} dist={Z0 - frontZ} />;
    hitT = c.hit;
    if (hit) { shake = Math.exp(-(t - c.hit) * 7) * 0.35; flash = Math.max(0, 1 - (t - c.hit) * 9); }
    shot = SHOTS[ORDER[cur]](frontZ);
  } else if (t >= PASS.s && t < PASS.s + PASS.d) {
    frontZ = Z0 - 30 * (t - PASS.s) / PASS.d;
    truck = <Truck z={frontZ} h={3.6} hit={false} since={0} cab="#2e7d32" trl="#f1f5ee" dist={Z0 - frontZ} />;
    shot = [[-3.6, 2.0, -12], [0.5, 3.4, 6]];
  }
  const end = t >= 12.5;
  if (!shot) { // end: slow crane up the street toward the raised bridge
    const k = interpolate(t, [PASS.s + PASS.d, 16.2], [0, 1], clamp);
    shot = [[-1.5 + k * 1.5, 3 + k * 6, 30 + k * 6], [0, 3.6 + k, 0]];
  }
  // gentle handheld drift + impact shake
  const [pos, look] = shot;
  const camPos = [pos[0] + Math.sin(t * 0.9) * 0.08 + shake * Math.sin(f * 3.1), pos[1] + Math.cos(t * 1.1) * 0.06 + shake * Math.cos(f * 4.7), pos[2]];
  const beacon = (Math.floor(t * 3) % 2) === 0;
  const crashes = CYC.filter((c) => t >= c.hit).length;
  const count = crashes ? COUNT[crashes - 1] : 0;
  const word = [...WORDS].reverse().find(([w]) => t >= w);
  const wordAge = word ? t - word[0] : 9;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#3f86d6 0%, #6fa9e6 35%, #b9d8f4 62%, #e3eef7 75%)'}}>
      {/* painted clouds behind the 3D scene */}
      {[[120, 140, 1.0], [640, 90, 1.3], [380, 330, 0.8], [880, 300, 1.1], [60, 520, 0.7], [760, 560, 0.9]].map(([x, y, s], i) => (
        <div key={i} style={{position: 'absolute', left: x + Math.sin(t * 0.05 + i) * 20 - 60, top: y, width: 340 * s, height: 120 * s, filter: 'blur(6px)'}}>
          {[[0, 40, 160, 80], [70, 0, 170, 110], [170, 30, 150, 90], [40, 60, 260, 60]].map(([a, b, w, h], j) => (
            <div key={j} style={{position: 'absolute', left: a * s, top: b * s, width: w * s, height: h * s, borderRadius: '50%', background: j === 3 ? '#e8f0f8' : '#ffffff', opacity: 0.92}} />
          ))}
        </div>
      ))}
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: true}}>
        <Cam pos={camPos} look={look} fov={56} />
        <fog attach="fog" args={['#dbe9f5', 45, 150]} />
        <hemisphereLight args={['#d9ecff', '#b8a98c', 1.05]} />
        <directionalLight position={[7, 40, 26]} intensity={2.7} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={45} shadow-camera-bottom={-45} shadow-camera-near={1} shadow-camera-far={120} />
        <Merged mesh={street} />
        <Merged mesh={gantry} />
        <group position={[0, beamY, 0]}>
          <Merged mesh={bridge} />
          <mesh position={[0, 0.45, 2.32]}><planeGeometry args={[15.6, 0.82]} /><meshStandardMaterial map={tex.stripes} roughness={0.6} /></mesh>
          <mesh position={[0, 1.6, 2.6]}><planeGeometry args={[2.4, 1.2]} /><meshStandardMaterial map={raised ? tex.high : tex.low} roughness={0.6} /></mesh>
          <mesh position={[0, 1.6, 2.58]}><boxGeometry args={[2.5, 1.3, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
        </group>
        <mesh position={[0, 4.6, 49.78]}><planeGeometry args={[4.2, 1.05]} /><meshStandardMaterial map={tex.gantry} emissiveMap={tex.gantry} emissive="#ffffff" emissiveIntensity={0.6} /></mesh>
        {[-1.6, 1.6].map((x, i) => (
          <mesh key={i} position={[x, 5.35, 49.75]}><sphereGeometry args={[0.2, 14, 10]} />
            <meshStandardMaterial color="#ffb000" emissive="#ff9a00" emissiveIntensity={(beacon ? i === 0 : i === 1) ? 4 : 0.2} toneMapped={false} /></mesh>
        ))}
        <mesh position={[-4.6, 5.2, 62.07]}><planeGeometry args={[2.5, 1.5]} /><meshStandardMaterial map={tex.board} roughness={0.6} /></mesh>
        {truck}
        <Impact since={t - hitT} y={beamY} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.45}} />
      <div style={{position: 'absolute', left: 44, top: 90, fontFamily: FONT, fontWeight: 900, fontSize: 58, color: '#fff', WebkitTextStroke: '6px #111', paintOrder: 'stroke fill',
        transform: `scale(${crashes && t - hitT < 0.25 ? 1.15 : 1})`, transformOrigin: 'left center'}}>CRASHES: {count}</div>
      {word && !end && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1080, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 112, color: '#fff', WebkitTextStroke: '12px #111', paintOrder: 'stroke fill',
          textShadow: '0 8px 18px #0006', transform: `scale(${interpolate(wordAge, [0, 0.1], [1.25, 1], clamp)})`}}>{word[1]}</div>
      )}
      {end && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1000, textAlign: 'center', fontFamily: FONT, color: '#fff', fontWeight: 900, WebkitTextStroke: '10px #111', paintOrder: 'stroke fill', opacity: interpolate(t, [12.5, 12.9], [0, 1], clamp)}}>
          <div style={{fontSize: 104, lineHeight: 1.05}}>Almost 200 crashes</div>
          <div style={{fontSize: 70, marginTop: 24, color: '#ffd23f'}}>then raised 8 inches</div>
          <div style={{fontSize: 56, marginTop: 40, opacity: interpolate(t, [14.4, 14.8], [0, 1], clamp)}}>Follow for more</div>
        </div>
      )}
      {music && <Audio src={staticFile('bridge-sound.wav')} />}
    </AbsoluteFill>
  );
};
