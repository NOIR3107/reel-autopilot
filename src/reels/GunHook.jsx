// Opening hook in the style of the viral "bullet in a round tube" reel: a blue grid studio, a man fires a pistol into a
// metal tube that loops all the way round and comes back to him. Captions in teal boxes. 3D via @remotion/three.
// Pure function of the frame. Caption/VO timing lives in HOOK_LINES so the audio tool can share it.
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/800.css';

const FPS = 30, clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const HOOK_SECONDS = 8.4;
export const HOOK_LINES = [[0.15, 'When you fire a bullet'], [1.9, 'into a round tube'], [2.9, 'it comes back'], [3.8, "But it's not actually the bullet"], [5.5, 'that hurts you'], [6.6, 'What actually hurts']];
export const SHOT_AT = 0.45, ENTER_AT = 2.5, LOOP_END = 7.8;

const MUZZLE = new THREE.Vector3(0.98, 1.46, 0.22);
// A clean circle like the original: a short straight from the tube mouth, a true circle (centre C, radius R) turning left,
// then a gentle bend that brings the open end back round to face the shooter's chest.
const R = 2.6, C = [2.2, 1.46, 0.22 - 2.6];
const PATH = new THREE.CatmullRomCurve3([
  [1.45, 1.46, 0.22], [1.85, 1.46, 0.22],
  ...Array.from({length: 49}, (_, i) => { const a = (i / 48) * Math.PI * 1.5; return [C[0] + R * Math.sin(a), 1.46, C[2] + R * Math.cos(a)]; }),
  [-0.3, 1.44, -1.5], [0.15, 1.4, -0.85], [0.7, 1.36, -0.4], [0.8, 1.34, -0.08], [0.3, 1.33, 0.0],
].map((p) => new THREE.Vector3(...p)), false, 'centripetal');

const gridTex = (bg, line, n, lw) => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 512, 512); g.strokeStyle = line; g.lineWidth = lw;
  for (let i = 0; i <= n; i++) { const p = (i * 512) / n; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 512); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(512, p); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

const M = ({c, r = 0.6, m = 0, ...p}) => <meshStandardMaterial color={c} roughness={r} metalness={m} {...p} />;
const Cap = ({a, b, r, c}) => { // capsule between two points
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), mid = A.clone().add(B).multiplyScalar(0.5), d = B.clone().sub(A);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={mid} quaternion={q} castShadow><capsuleGeometry args={[r, d.length(), 6, 14]} /><M c={c} /></mesh>;
};

const Gun = () => (
  <group position={[0.78, 1.43, 0.22]}>
    <mesh castShadow position={[0.08, 0.06, 0]}><boxGeometry args={[0.32, 0.07, 0.05]} /><M c="#2b2f34" r={0.35} m={0.3} /></mesh>
    <mesh castShadow position={[0.06, 0.015, 0]}><boxGeometry args={[0.26, 0.04, 0.045]} /><M c="#34383e" r={0.4} m={0.3} /></mesh>
    <mesh castShadow position={[-0.03, -0.06, 0]} rotation={[0, 0, -0.25]}><boxGeometry args={[0.07, 0.15, 0.05]} /><M c="#1b1d20" r={0.7} /></mesh>
    <mesh position={[0.04, -0.025, 0]}><torusGeometry args={[0.03, 0.007, 6, 12, Math.PI]} /><M c="#16181b" /></mesh>
    {Array.from({length: 6}, (_, i) => <mesh key={i} position={[0.03 + i * 0.018, 0.08, 0]}><boxGeometry args={[0.006, 0.02, 0.052]} /><M c="#0d0e10" /></mesh>)}
  </group>
);

const Man = ({aim}) => { // aim: 1 = arm straight out with the gun, 0 = arm down
  const sh = [0, 1.43, 0.2], hand = aim > 0.5 ? [0.72, 1.43, 0.22] : [0.05, 0.85, 0.28];
  const elbow = aim > 0.5 ? [0.36, 1.43, 0.22] : [0.03, 1.13, 0.27];
  return (
    <group>
      <Cap a={[0, 0.06, 0.1]} b={[0, 0.85, 0.1]} r={0.075} c="#b79a6e" /><Cap a={[0, 0.06, -0.1]} b={[0, 0.85, -0.1]} r={0.075} c="#b79a6e" />
      {[0.1, -0.1].map((z) => <mesh key={z} castShadow position={[0.05, 0.05, z]}><boxGeometry args={[0.26, 0.09, 0.1]} /><M c="#6b4426" /></mesh>)}
      <mesh castShadow position={[0, 1.15, 0]}><capsuleGeometry args={[0.17, 0.42, 8, 18]} /><M c="#8cc3e6" r={0.8} /></mesh>
      <mesh castShadow position={[0, 0.8, 0]}><cylinderGeometry args={[0.175, 0.15, 0.26, 18]} /><M c="#b79a6e" /></mesh>
      <mesh castShadow position={[0, 0.93, 0]}><cylinderGeometry args={[0.18, 0.18, 0.05, 18]} /><M c="#5a3b22" /></mesh>
      <Cap a={[0, 1.5, 0]} b={[0, 1.58, 0]} r={0.05} c="#e0ac85" />
      <mesh castShadow position={[0, 1.7, 0]} scale={[1, 1.12, 0.95]}><sphereGeometry args={[0.11, 24, 18]} /><M c="#e6b38e" r={0.55} /></mesh>
      <mesh castShadow position={[-0.015, 1.76, 0]} scale={[1.02, 0.7, 0.98]}><sphereGeometry args={[0.113, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#3b2a1e" r={0.9} /></mesh>
      <mesh position={[0.105, 1.71, 0.04]}><sphereGeometry args={[0.012, 8, 6]} /><M c="#1a1a1a" /></mesh>
      <mesh position={[0.105, 1.71, -0.04]}><sphereGeometry args={[0.012, 8, 6]} /><M c="#1a1a1a" /></mesh>
      <Cap a={sh} b={elbow} r={0.06} c="#8cc3e6" /><Cap a={elbow} b={hand} r={0.05} c="#e0ac85" />
      <Cap a={[0, 1.43, -0.2]} b={[0.02, 1.13, -0.27]} r={0.06} c="#8cc3e6" /><Cap a={[0.02, 1.13, -0.27]} b={[0.05, 0.85, -0.28]} r={0.05} c="#e0ac85" />
      {aim > 0.5 && <Gun />}
    </group>
  );
};

const Cam = ({pos, look, fov, up = [0, 1, 0]}) => {
  const {camera} = useThree();
  camera.up.set(...up); camera.position.set(...pos); camera.fov = fov; camera.near = 0.02; camera.updateProjectionMatrix(); camera.lookAt(...look);
  return null;
};

const shotFor = (t) => {
  const k = (a, b) => interpolate(t, [a, b], [0, 1], clamp);
  if (t < 1.1) return {pos: [0.3 + k(0, 1.1) * 0.15, 1.62, 1.75], look: [1.0, 1.45, 0.2], fov: 42};
  if (t < 2.0) return {pos: [0.75, 1.56, 1.0], look: [1.5, 1.46, 0.22], fov: 40};
  if (t < 2.9) return {pos: [2.7 - k(2, 2.9) * 0.2, 1.62, 1.35], look: [1.45, 1.46, 0.22], fov: 42};
  if (t < 3.8) return {pos: [0.4, 1.78, 1.35], look: [0.85, 1.48, 0.22], fov: 40};
  if (t < 4.6) return {pos: [4.9, 1.75, -0.2 - k(3.8, 4.6) * 0.4], look: [3.7, 1.5, -2.2], fov: 45};
  if (t < 6.5) { const a = k(4.6, 6.5) * 0.35; return {pos: [2.1, 14 - a * 2, -2.4], look: [2.1, 0, -2.4], fov: 44, up: [Math.cos(a * 0.4), 0, -Math.sin(a * 0.4)]}; }
  return {pos: [2.3 - k(6.5, 8.4) * 0.3, 1.55, -1.3 + k(6.5, 8.4) * 0.2], look: [0.25, 1.4, 0], fov: 40};
};

export const GunHook = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const tex = useMemo(() => {
    const floor = gridTex('#3f8fd0', '#e8f3ff', 2, 6); floor.repeat.set(30, 30);
    const wall = gridTex('#0b2340', '#2f6fae', 8, 2); wall.repeat.set(24, 6);
    return {floor, wall};
  }, []);
  const tube = useMemo(() => new THREE.TubeGeometry(PATH, 600, 0.075, 20, false), []);
  const shot = shotFor(t);
  // bullet: flies from the muzzle to the tube mouth (slow motion), then runs the loop
  let bullet = null, u = -1;
  if (t >= SHOT_AT && t < ENTER_AT) bullet = MUZZLE.clone().lerp(PATH.getPointAt(0), interpolate(t, [SHOT_AT, ENTER_AT], [0, 1.04], clamp));
  if (t >= ENTER_AT) { u = interpolate(t, [ENTER_AT, LOOP_END], [0, 0.97], {...clamp, easing: (x) => x * (2 - x * 0.6) / 1.4}); }
  const glow = u >= 0 ? PATH.getPointAt(Math.min(u, 1)) : null;
  const flash = interpolate(t, [SHOT_AT, SHOT_AT + 0.06, SHOT_AT + 0.2], [0, 1, 0], clamp);
  const recoil = flash * 0.05;
  const shell = t > SHOT_AT ? Math.min(t - SHOT_AT, 3.2) : -1;
  const line = [...HOOK_LINES].reverse().find(([s]) => t >= s);
  return (
    <AbsoluteFill style={{background: '#0b2340'}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: true}}>
        <Cam {...shot} />
        <fog attach="fog" args={['#16406b', 14, 40]} />
        <hemisphereLight args={['#cfe6ff', '#2c5f8f', 1.25]} />
        <directionalLight position={[4, 9, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial map={tex.floor} roughness={0.35} metalness={0.05} /></mesh>
        <mesh position={[0, 6, 0]}><cylinderGeometry args={[22, 22, 30, 64, 1, true]} /><meshStandardMaterial map={tex.wall} side={THREE.BackSide} emissive="#0b2340" emissiveIntensity={0.4} /></mesh>
        <group position={[-recoil, 0, 0]}><Man aim={t < 6.5 ? 1 : 0} /></group>
        {/* the looping tube, its open rims, and its shadow */}
        <mesh geometry={tube} castShadow receiveShadow><meshStandardMaterial color="#c3c9cf" roughness={0.32} metalness={0.35} side={THREE.DoubleSide} /></mesh>
        {[0, 1].map((e) => { const p = PATH.getPointAt(e), d = PATH.getTangentAt(e); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
          return <group key={e}><mesh position={p} quaternion={q}><torusGeometry args={[0.068, 0.012, 10, 28]} /><M c="#c9ced3" r={0.25} m={0.9} /></mesh>
            <mesh position={p.clone().addScaledVector(d, e ? -0.02 : 0.02)} quaternion={q}><circleGeometry args={[0.064, 24]} /><meshBasicMaterial color="#1b1d20" side={THREE.DoubleSide} /></mesh></group>; })}
        {bullet && <group position={bullet} rotation={[0, 0, -Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.018, 0.018, 0.04, 14]} /><M c="#b86b2e" r={0.3} m={0.8} /></mesh>
          <mesh position={[0, 0.03, 0]}><sphereGeometry args={[0.018, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#c27838" r={0.3} m={0.8} /></mesh>
        </group>}
        {glow && t > 4.6 && t < 6.5 && <mesh position={glow}><sphereGeometry args={[0.16, 16, 12]} /><meshBasicMaterial color="#ff5a2a" transparent opacity={0.85} toneMapped={false} /></mesh>}
        {glow && t > 4.6 && t < 6.5 && <pointLight position={glow} color="#ff6a30" intensity={3} distance={2} />}
        {flash > 0 && <group position={[MUZZLE.x + 0.04, MUZZLE.y + 0.04, MUZZLE.z]}>
          <mesh scale={[1.6 * flash, flash, flash]}><sphereGeometry args={[0.07, 12, 8]} /><meshBasicMaterial color="#ffd27a" transparent opacity={flash} toneMapped={false} /></mesh>
          <pointLight color="#ffb347" intensity={8 * flash} distance={3} /></group>}
        {shell >= 0 && shell < 3.2 && <mesh position={[0.83 - shell * 0.25, 1.52 + Math.max(-1.5, shell * 1.6 - 4.9 * shell * shell), 0.22 + shell * 0.5]} rotation={[shell * 14, shell * 9, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.035, 10]} /><M c="#d4a53c" r={0.25} m={0.9} /></mesh>}
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.18}} />
      {line && (
        <div style={{position: 'absolute', top: 1240, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: '#1d7fa0e6', color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 50, padding: '10px 22px', borderRadius: 4,
            transform: `scale(${interpolate(t - line[0], [0, 0.08], [0.92, 1], clamp)})`}}>{line[1]}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
