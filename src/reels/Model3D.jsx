// 3D prop for explainer reels: a chunky toy-like object (robot, house, phone, star) that pops in, spins and bobs.
// p: {type: 'model3d', model: 'robot'|'house'|'phone'|'star', color, label}
import {ThreeCanvas} from '@remotion/three';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.45 : 1, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
})();

const Mat = ({c, e}) => <meshStandardMaterial color={c} roughness={0.45} metalness={0.1} emissive={e ?? '#000'} emissiveIntensity={e ? 1.4 : 0} />;

const Model = ({model, color, t}) => {
  if (model === 'house') return (
    <group position={[0, -0.3, 0]}>
      <mesh><boxGeometry args={[1.8, 1.3, 1.6]} /><Mat c="#f4f1ea" /></mesh>
      <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.62, 1, 4]} /><Mat c={color} /></mesh>
      <mesh position={[0, -0.3, 0.81]}><boxGeometry args={[0.45, 0.7, 0.05]} /><Mat c="#5b3a22" /></mesh>
      {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, 0.15, 0.81]}><boxGeometry args={[0.38, 0.38, 0.05]} /><Mat c="#ffd23f" e="#ffb000" /></mesh>)}
    </group>);
  if (model === 'phone') return (
    <group rotation={[0.1, 0, 0]}>
      <mesh><boxGeometry args={[1.25, 2.4, 0.16]} /><Mat c="#151515" /></mesh>
      <mesh position={[0, 0, 0.085]}><planeGeometry args={[1.1, 2.2]} /><Mat c={color} e={color} /></mesh>
      {[0.55, 0.15, -0.25].map((y, i) => <mesh key={y} position={[i % 2 ? 0.15 : -0.12, y, 0.09]}><boxGeometry args={[0.7, 0.26, 0.02]} /><Mat c="#fff" /></mesh>)}
    </group>);
  if (model === 'star') return (
    <mesh scale={1.15}><extrudeGeometry args={[starShape, {depth: 0.35, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3}]} /><Mat c={color} e="#7a5200" /></mesh>);
  // robot
  const blink = Math.sin(t / 9) > 0.96 ? 0.15 : 1;
  return (
    <group position={[0, -0.25, 0]}>
      <mesh position={[0, -0.55, 0]}><boxGeometry args={[1.3, 1.1, 0.9]} /><Mat c={color} /></mesh>
      <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.5, 1.05, 1.05]} /><Mat c="#f4f1ea" /></mesh>
      {[-0.35, 0.35].map((x) => <mesh key={x} position={[x, 0.6, 0.53]} scale={[1, blink, 1]}><sphereGeometry args={[0.15, 24, 24]} /><Mat c="#39d0ff" e="#39d0ff" /></mesh>)}
      <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.04, 0.04, 0.4]} /><Mat c="#333" /></mesh>
      <mesh position={[0, 1.5, 0]}><sphereGeometry args={[0.12, 20, 20]} /><Mat c="#ff3b30" e="#ff3b30" /></mesh>
      {[-0.92, 0.92].map((x, i) => <mesh key={x} position={[x, -0.45, 0]} rotation={[0, 0, (i ? -1 : 1) * (0.3 + 0.25 * Math.sin(t / 5))]}><boxGeometry args={[0.28, 0.9, 0.28]} /><Mat c={color} /></mesh>)}
    </group>);
};

export const Model3D = ({p, local}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const s = spring({frame: local, fps, config: {damping: 10, stiffness: 120}});
  return (
    <div style={{position: 'relative', width: 860, height: 700}}>
      <ThreeCanvas width={860} height={700} camera={{position: [0, 0.4, 5.2], fov: 45}} gl={{antialias: true}}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-4, 1, 2]} intensity={25} color="#ff5a52" />
        <group scale={s * 1.25} position={[0, 0.15 + Math.sin(frame / 12) * 0.12, 0]} rotation={[0.12, (local / fps) * 1.1 - 0.6, 0]}>
          <Model model={p.model ?? 'robot'} color={p.color ?? '#e5322d'} t={frame} />
        </group>
      </ThreeCanvas>
      {p.label && <div style={{position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontFamily: '"Bricolage Grotesque Variable", sans-serif', fontWeight: 800, fontSize: 52,
        color: '#151515', opacity: local > 12 ? 1 : 0}}><span style={{background: '#fff', border: '4px solid #151515', borderRadius: 18, padding: '6px 26px', boxShadow: '8px 8px 0 #151515'}}>{p.label}</span></div>}
    </div>
  );
};
