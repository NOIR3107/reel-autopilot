// Neelville: an island where little robots build a house for every follower. One episode a day.
// Props: {day, population, oldHouses, specials: [{type}], building (type rising this episode, or null), lots, nextAt, nextAmenity,
//         scenes: [{sec, vo, key, shot: wide|houses|close|build|top|lot|empty, cta}]}
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import {houseKit, streetKit, shoreKit, plazaKit, treeKit} from './islandKit.js';

const KitMesh = ({g, ...p}) => <mesh geometry={g} {...p}><meshStandardMaterial vertexColors roughness={0.85} /></mesh>;

const FONT = '"Bricolage Grotesque Variable", sans-serif';
const FPS = 30;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const islandFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
const MAX_HOUSES = 300; // shortcut: houses past 300 aren't drawn (software 3D on GitHub's servers gets slow); move to instanced meshes before then

// Town plan: a grid where every third row and column is a road, so lots come in 2x2 blocks. Lots are used in order of
// distance from the town square (the four centre lots), so the town grows outward ring by ring.
const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const P = 1.4; // one grid cell
const isRoad = (gx, gz) => ((gx % 3) + 3) % 3 === 2 || ((gz % 3) + 3) % 3 === 2;
const CELLS = [];
for (let gx = -16; gx <= 16; gx++) for (let gz = -16; gz <= 16; gz++) CELLS.push({gx, gz, x: (gx + 0.5) * P, z: (gz + 0.5) * P, d: Math.hypot((gx + 0.5) * P, (gz + 0.5) * P), road: isRoad(gx, gz)});
const LOTS = CELLS.filter((c) => !c.road).sort((a, b) => a.d - b.d || a.gx - b.gx || a.gz - b.gz);
// lot roles: 0-3 square, then amenities on every 6th lot, owners' lots and houses in between
export const faceRoad = (c) => (((c.gz % 3) + 3) % 3 === 1 ? 0 : Math.PI); // front door toward the road beside the lot
const PLAZA = 4, amenityRank = (k) => PLAZA + 2 + k * 6;
const layout = (houses, owners, amenities) => {
  const taken = new Set(Array.from({length: amenities}, (_, k) => amenityRank(k)));
  const free = []; for (let r = PLAZA; free.length < houses + 8; r++) if (!taken.has(r)) free.push(r);
  return {owner: (k) => LOTS[free[k]], house: (k) => LOTS[free[owners + k]], empty: free.slice(houses, houses + 8).map((r) => LOTS[r]), amenity: (k) => LOTS[amenityRank(k)]};
};
const COLORS = ['#e5322d', '#2f7cf6', '#f59e0b', '#16a34a', '#9333ea', '#0ea5e9', '#f97316', '#db2777'];

const ramp = (b, a, z) => Math.min(1, Math.max(0, (b - a) / (z - a)));
// A detailed house from islandKit. `build` (0 to 1) plays the construction in stages (foundation, frame, walls, roof,
// windows and fence) for the timelapse; without it the house just rises with `rise`.
const House = ({x, z, i, rise = 1, build = null, rot = 0}) => {
  const kit = houseKit(i % 14), b = build ?? 1;
  const slab = ramp(b, 0, 0.15), frame = ramp(b, 0.15, 0.4), walls = ramp(b, 0.4, 0.65), top = ramp(b, 0.65, 0.82), fin = ramp(b, 0.82, 0.95);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} scale={[1, Math.max(0.001, rise), 1]}>
      <KitMesh g={kit.base} scale={[slab || 0.001, 1, slab || 0.001]} />
      {build != null && frame > 0 && walls < 1 && [[-0.31, -0.25], [0.31, -0.25], [-0.31, 0.25], [0.31, 0.25], [0, 0.25], [0, -0.25], [-0.15, 0.25], [0.15, -0.25]].map(([a, c], k) => (
        <mesh key={k} position={[a, 0.06 + 0.21 * frame, c]} scale={[1, frame, 1]}><boxGeometry args={[0.035, 0.42, 0.035]} /><meshStandardMaterial color="#b7791f" /></mesh>))}
      {build != null && frame > 0.6 && walls < 1 && <mesh position={[0, 0.48, 0]}><boxGeometry args={[0.66, 0.03, 0.03]} /><meshStandardMaterial color="#b7791f" /></mesh>}
      {walls > 0 && <KitMesh g={kit.walls} scale={[1, walls, 1]} />}
      {top > 0 && <KitMesh g={kit.roof} position={[0, (1 - top) * 0.8, 0]} />}
      {fin > 0 && <KitMesh g={kit.details} scale={[1, fin, 1]} />}
    </group>
  );
};
const Tree = ({x, z, s}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.05, 0.07, 0.3]} /><meshStandardMaterial color="#7a5230" /></mesh>
    <mesh position={[0, 0.48, 0]}><coneGeometry args={[0.24, 0.6, 7]} /><meshStandardMaterial color="#2f8f46" /></mesh>
  </group>
);
const Robot = ({x, z, t, i, size = 2}) => (
  <group position={[x, 0.05 + Math.abs(Math.sin(t / 4 + i)) * 0.12, z]} rotation={[0, t / 20 + i, 0]} scale={size}>
    <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.22, 0.22, 0.2]} /><meshStandardMaterial color="#e5322d" /></mesh>
    <mesh position={[0, 0.36, 0]}><boxGeometry args={[0.24, 0.17, 0.2]} /><meshStandardMaterial color="#f4f1ea" /></mesh>
    {[-0.06, 0.06].map((e) => <mesh key={e} position={[e, 0.37, 0.105]}><sphereGeometry args={[0.03, 10, 10]} /><meshStandardMaterial color="#39d0ff" emissive="#39d0ff" emissiveIntensity={1.5} /></mesh>)}
  </group>
);
const GiftBox = ({x, z, k}) => { // k: frames since the reveal scene started
  const drop = Math.min(1, k / 14), shake = k > 14 && k < 38 ? Math.sin(k * 2.2) * 0.06 : 0, open = Math.max(0, (k - 38) / 10);
  if (k > 60) return null;
  return (
    <group position={[x + shake, 3 * (1 - drop) * (1 - drop), z]}>
      {open < 1 && <group scale={1 - open * 0.9}>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#e5322d" /></mesh>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.82, 0.82, 0.14]} /><meshStandardMaterial color="#facc15" /></mesh>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.14, 0.82, 0.82]} /><meshStandardMaterial color="#facc15" /></mesh></group>}
      <group position={[open * 0.8, 0.85 + open * 1.4, 0]} rotation={[0, 0, -open * 1.2]}>
        <mesh><boxGeometry args={[0.88, 0.14, 0.88]} /><meshStandardMaterial color="#e5322d" /></mesh>
        {[-0.12, 0.12].map((a) => <mesh key={a} position={[a, 0.12, 0]} rotation={[0, 0, a * 5]}><torusGeometry args={[0.1, 0.03, 8, 16]} /><meshStandardMaterial color="#facc15" /></mesh>)}</group>
      {open > 0 && Array.from({length: 40}, (_, c) => { const a = rand(c) * 6.28, v = 0.6 + rand(c + 9) * 1.2, tt = Math.min(open, 2.2);
        return <mesh key={c} position={[Math.cos(a) * v * tt, 0.8 + tt * (1.6 - tt * 0.55) * (0.6 + rand(c + 3)), Math.sin(a) * v * tt]} rotation={[c, c * 2, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.01]} /><meshStandardMaterial color={COLORS[c % COLORS.length]} /></mesh>; })}
    </group>
  );
};
export const SURPRISES = ['themepark'];
const Special = ({type, x, z, rise = 1, t}) => {
  const s = Math.max(0.001, rise);
  const M = (c, e) => <meshStandardMaterial color={c} emissive={e ?? '#000'} emissiveIntensity={e ? 1 : 0} />;
  const parts = {
    themepark: <group scale={1.15}>
      <mesh position={[0, 0.015, 0]}><cylinderGeometry args={[0.72, 0.72, 0.03, 32]} />{M('#e7e5e4')}</mesh>
      {/* Ferris wheel: A-frame legs, rim, spokes, gondolas that stay upright */}
      <group position={[-0.25, 0, -0.15]}>
        {[-1, 1].flatMap((sd) => [-1, 1].map((f) => <mesh key={sd + ' ' + f} position={[sd * 0.13, 0.32, f * 0.07]} rotation={[f * 0.2, 0, sd * -0.35]}><boxGeometry args={[0.025, 0.68, 0.025]} />{M('#94a3b8')}</mesh>))}
        <group position={[0, 0.62, 0]} rotation={[0, 0, t / 40]}>
          <mesh><torusGeometry args={[0.42, 0.015, 8, 40]} />{M('#e5322d')}</mesh>
          <mesh position={[0, 0, 0.05]}><torusGeometry args={[0.42, 0.012, 8, 40]} />{M('#e5322d')}</mesh>
          {Array.from({length: 8}, (_, k) => <mesh key={k} rotation={[0, 0, (k * Math.PI) / 4]}><boxGeometry args={[0.84, 0.01, 0.01]} />{M('#fafaf9')}</mesh>)}
          {Array.from({length: 8}, (_, k) => { const a = (k * Math.PI) / 4; return <group key={k} position={[Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0.025]} rotation={[0, 0, -t / 40]}>
            <mesh position={[0, -0.05, 0]}><boxGeometry args={[0.08, 0.07, 0.07]} />{M(['#2f7cf6', '#facc15', '#16a34a', '#ec4899'][k % 4])}</mesh>
            <mesh position={[0, -0.005, 0]}><boxGeometry args={[0.09, 0.012, 0.08]} />{M('#fafaf9')}</mesh></group>; })}
          <mesh><cylinderGeometry args={[0.03, 0.03, 0.1, 10]} />{M('#fde68a', '#facc15')}</mesh>
        </group>
      </group>
      {/* Carousel: base, poles, horses going round and bobbing, striped canopy, top flag */}
      <group position={[0.32, 0, 0.2]} rotation={[0, t / 25, 0]}>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.28, 0.3, 0.06, 24]} />{M('#fafaf9')}</mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.3, 10]} />{M('#facc15')}</mesh>
        {Array.from({length: 6}, (_, k) => { const a = (k * Math.PI) / 3; return <group key={k} position={[Math.cos(a) * 0.21, 0, Math.sin(a) * 0.21]}>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.006, 0.006, 0.3]} />{M('#d4a017')}</mesh>
          <mesh position={[0, 0.14 + Math.sin(t / 6 + k) * 0.03, 0]} rotation={[0, -a, 0]}><boxGeometry args={[0.03, 0.05, 0.09]} />{M(['#fafaf9', '#a16207', '#f472b6'][k % 3])}</mesh></group>; })}
        {Array.from({length: 12}, (_, k) => <mesh key={k} position={[0, 0.39, 0]} rotation={[0, (k * Math.PI) / 6, 0]}><coneGeometry args={[0.33, 0.16, 3, 1, false, 0, Math.PI / 6]} />{M(k % 2 ? '#e5322d' : '#fafaf9')}</mesh>)}
        <mesh position={[0, 0.52, 0]}><cylinderGeometry args={[0.005, 0.005, 0.12]} />{M('#94a3b8')}</mesh><mesh position={[0.03, 0.56, 0]}><boxGeometry args={[0.06, 0.035, 0.004]} />{M('#2f7cf6')}</mesh>
      </group>
      {/* ticket booth, string lights, fence */}
      <group position={[0.42, 0, -0.38]}><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.16, 0.2, 0.14]} />{M('#2f7cf6')}</mesh><mesh position={[0, 0.22, 0]}><coneGeometry args={[0.13, 0.08, 4]} />{M('#facc15')}</mesh></group>
      {Array.from({length: 14}, (_, k) => { const a = (k / 14) * Math.PI * 2; return <mesh key={k} position={[Math.cos(a) * 0.7, 0.07, Math.sin(a) * 0.7]}><boxGeometry args={[0.02, 0.12, 0.02]} />{M('#fafaf9')}</mesh>; })}
      {Array.from({length: 14}, (_, k) => { const a = (k / 14) * Math.PI * 2; return <mesh key={'l' + k} position={[Math.cos(a) * 0.7, 0.15, Math.sin(a) * 0.7]}><sphereGeometry args={[0.018, 6, 6]} />{M(['#facc15', '#f472b6', '#38bdf8'][k % 3], ['#facc15', '#f472b6', '#38bdf8'][k % 3])}</mesh>; })}
    </group>,
    burger: <><mesh position={[0, 0.3, 0]}><boxGeometry args={[1, 0.6, 0.8]} />{M('#fff7ed')}</mesh>
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.02, 0.12, 0.82]} />{M('#e5322d')}</mesh>
      <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5]} />{M('#94a3b8')}</mesh>
      <group position={[0, 1.25, 0]} rotation={[0, t / 15, 0.15]}>
        <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.32, 20, 12, 0, 6.29, 0, 1.6]} />{M('#d97706')}</mesh>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.34, 0.34, 0.04, 20]} />{M('#22c55e')}</mesh>
        <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.33, 0.33, 0.1, 20]} />{M('#78350f')}</mesh>
        <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.35, 0.35, 0.03, 20]} />{M('#facc15')}</mesh>
        <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.31, 0.29, 0.1, 20]} />{M('#d97706')}</mesh></group></>,
    icecream: <><mesh position={[0, 0.25, 0]}><boxGeometry args={[0.8, 0.5, 0.7]} />{M('#fbcfe8')}</mesh>
      <group position={[0, 0.95, 0]} rotation={[0, t / 15, 0]}><mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.22, 0.6, 16]} />{M('#d6a35c')}</mesh>
        <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.24, 16, 16]} />{M('#f9a8d4')}</mesh><mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.18, 16, 16]} />{M('#fef3c7')}</mesh>
        <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.06, 10, 10]} />{M('#e5322d')}</mesh></group></>,
    skatepark: <><mesh position={[0, 0.03, 0]}><boxGeometry args={[1.2, 0.06, 1.2]} />{M('#cbd5e1')}</mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.42, 0.2, 0]} rotation={[0, 0, sd * 0.6]}><boxGeometry args={[0.45, 0.06, 1]} />{M('#94a3b8')}</mesh>)}
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.3, 0.14, 0.5]} />{M('#64748b')}</mesh></>,
    lighthouse: <><mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.22, 0.32, 1.8, 16]} /><meshStandardMaterial color="#f4f1ea" /></mesh>
      {[0.4, 1.1].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.3, 0.31, 0.25, 16]} /><meshStandardMaterial color="#e5322d" /></mesh>)}
      <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#ffd23f" emissive="#ffb000" emissiveIntensity={2} /></mesh></>,
    windmill: <><mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.2, 0.35, 1.4, 8]} /><meshStandardMaterial color="#e8dcc4" /></mesh>
      <group position={[0, 1.3, 0.28]} rotation={[0, 0, t / 12]}>{[0, 1, 2, 3].map((k) => <mesh key={k} rotation={[0, 0, (k * Math.PI) / 2]} position={[0, 0, 0]}><boxGeometry args={[0.08, 1.4, 0.03]} /><meshStandardMaterial color="#7a5230" /></mesh>)}</group></>,
    factory: <><mesh position={[0, 0.35, 0]}><boxGeometry args={[1.2, 0.7, 0.8]} /><meshStandardMaterial color="#64748b" /></mesh>
      <mesh position={[0.4, 0.95, 0]}><cylinderGeometry args={[0.1, 0.12, 0.7]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 0.72, 0.41]}><boxGeometry args={[0.5, 0.15, 0.02]} /><meshStandardMaterial color="#e5322d" emissive="#e5322d" emissiveIntensity={1} /></mesh></>,
    fountain: <><mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.6, 0.65, 0.16, 24]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.5, 0.5, 0.04, 24]} /><meshStandardMaterial color="#38bdf8" /></mesh>
      <mesh position={[0, 0.4 + Math.sin(t / 5) * 0.05, 0]}><sphereGeometry args={[0.14, 16, 16]} /><meshStandardMaterial color="#7dd3fc" /></mesh></>,
    tower: <><mesh position={[0, 1.1, 0]}><boxGeometry args={[0.6, 2.2, 0.6]} /><meshStandardMaterial color="#1f2a44" /></mesh>
      {[0.5, 1, 1.5, 2].map((y) => <mesh key={y} position={[0, y, 0.31]}><boxGeometry args={[0.45, 0.12, 0.01]} /><meshStandardMaterial color="#ffd23f" emissive="#ffb000" emissiveIntensity={1} /></mesh>)}</>,
    stadium: <><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.9, 1, 0.4, 32, 1, true]} /><meshStandardMaterial color="#e5322d" side={2} /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.85, 32]} /><meshStandardMaterial color="#4ade80" /></mesh></>,
  };
  return <group position={[x, 0, z]} scale={[1, s, 1]}>{parts[type] ?? parts.tower}</group>;
};

// Text signs: drawn on a 2D canvas, used as a texture, turned to face the camera.
const signTex = (text, bg, fg) => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 512, 128); g.fillStyle = fg;
  g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 68, 490);
  return new THREE.CanvasTexture(c);
};
const Sign = ({text, y = 1.1, bg = '#ffffff', fg = '#151515', w = 1.3}) => {
  const tex = useMemo(() => signTex(text, bg, fg), [text, bg, fg]);
  const q = useThree((st) => st.camera).quaternion.clone();
  return <mesh position={[0, y, 0]} quaternion={q}><planeGeometry args={[w, w / 4]} /><meshBasicMaterial map={tex} side={2} /></mesh>;
};
// Things people ask for on their lot; anything else gets a labelled sign.
const ITEMS = {
  pool: <><mesh position={[0, 0.05, 0]}><boxGeometry args={[0.7, 0.1, 0.45]} /><meshStandardMaterial color="#f4f1ea" /></mesh><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.6, 0.02, 0.35]} /><meshStandardMaterial color="#38bdf8" /></mesh></>,
  garden: <>{[[-0.2, 0], [0, 0.15], [0.2, 0], [0, -0.15], [0.1, 0.05]].map(([x, z], k) => <mesh key={k} position={[x, 0.08, z]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color={['#f472b6', '#facc15', '#a78bfa', '#fb7185', '#f97316'][k]} /></mesh>)}</>,
  car: <><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.55, 0.14, 0.28]} /><meshStandardMaterial color="#e5322d" /></mesh><mesh position={[-0.03, 0.22, 0]}><boxGeometry args={[0.3, 0.12, 0.26]} /><meshStandardMaterial color="#cbd5e1" /></mesh></>,
  tree: <Tree x={0} z={0} s={1.3} />,
  cat: <group scale={2.2}><mesh position={[0, 0.07, 0]}><boxGeometry args={[0.2, 0.1, 0.09]} /><meshStandardMaterial color="#f97316" /></mesh><mesh position={[0.12, 0.15, 0]}><boxGeometry args={[0.09, 0.09, 0.09]} /><meshStandardMaterial color="#f97316" /></mesh>
    {[-0.025, 0.025].map((e) => <mesh key={e} position={[0.13, 0.21, e]}><coneGeometry args={[0.02, 0.05, 4]} /><meshStandardMaterial color="#f97316" /></mesh>)}<mesh position={[-0.13, 0.13, 0]} rotation={[0, 0, 0.8]}><cylinderGeometry args={[0.012, 0.012, 0.16]} /><meshStandardMaterial color="#f97316" /></mesh></group>,
  flag: <><mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.015, 0.015, 0.9]} /><meshStandardMaterial color="#888" /></mesh><mesh position={[0.15, 0.78, 0]}><boxGeometry args={[0.3, 0.18, 0.01]} /><meshStandardMaterial color="#e5322d" /></mesh></>,
};
// Barcelona-colours banner on a little roof pole (club colours only, no crest)
ITEMS.barcelona = <group position={[0.1, 0.72, 0.02]}><mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.01, 0.01, 0.34]} /><meshStandardMaterial color="#d6d3d1" /></mesh>
  {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[0.03 + k * 0.032, 0.25, 0]}><boxGeometry args={[0.032, 0.14, 0.008]} /><meshStandardMaterial color={k % 2 ? '#a50044' : '#004d98'} /></mesh>)}
  <mesh position={[0.11, 0.33, 0]}><boxGeometry args={[0.16, 0.02, 0.009]} /><meshStandardMaterial color="#edbb00" /></mesh></group>;
const ROOF_ITEMS = ['barcelona'];
const itemKey = (t) => [...ROOF_ITEMS, ...Object.keys(ITEMS)].find((k) => String(t).toLowerCase().includes(k));
const Shop = ({name, i, t = 0}) => {
  const M = (c) => <meshStandardMaterial color={c} />, stripe = COLORS[(i + 3) % COLORS.length], taco = /taco/i.test(name);
  return (
    <group>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.7, 0.4, 0.4]} />{M('#fff7ed')}</mesh>
      <mesh position={[0, 0.41, 0.03]}><boxGeometry args={[0.74, 0.03, 0.46]} />{M('#a16207')}</mesh>
      {[-0.33, 0.33].map((x) => <mesh key={x} position={[x, 0.55, 0.2]}><boxGeometry args={[0.03, 0.3, 0.03]} />{M('#78350f')}</mesh>)}
      {Array.from({length: 8}, (_, k) => <mesh key={k} position={[-0.315 + k * 0.09, 0.71, 0.13]} rotation={[0.45, 0, 0]}><boxGeometry args={[0.09, 0.025, 0.3]} />{M(k % 2 ? '#fafaf9' : (taco ? '#16a34a' : stripe))}</mesh>)}
      <mesh position={[-0.12, 0.27, 0.21]}><boxGeometry args={[0.22, 0.16, 0.01]} />{M('#1c1917')}</mesh>
      {[0.2, 0.25, 0.3].map((y) => <mesh key={y} position={[-0.12, y, 0.216]}><boxGeometry args={[0.16, 0.012, 0.005]} />{M('#fde68a')}</mesh>)}
      {[-0.2, 0.05, 0.28].map((x) => <group key={x} position={[x, 0, 0.36]}><mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.012, 0.012, 0.16]} />{M('#1f2937')}</mesh><mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />{M('#e5322d')}</mesh></group>)}
      {taco && <group position={[0, 1.02, 0]} rotation={[0, t / 14, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.14, 24, 1, true, 0, Math.PI]} /><meshStandardMaterial color="#f59e0b" side={2} /></mesh>
        <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.19, 0.19, 0.12, 20, 1, true, 0.2, Math.PI - 0.4]} /><meshStandardMaterial color="#22c55e" side={2} /></mesh>
        {[-0.08, 0, 0.08].map((x) => <mesh key={x} position={[0.02, 0.15, x]}><sphereGeometry args={[0.035, 8, 6]} />{M('#dc2626')}</mesh>)}
        <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.012, 0.012, 0.22]} />{M('#94a3b8')}</mesh></group>}
      <Sign text={taco ? 'TACOS 🌮' : name} y={taco ? 0.95 : 0.9} bg="#151515" fg="#ffd23f" w={0.95} />
    </group>
  );
};
// One person's lot: their house with their name, what they asked for, and their business.
const YARD = [[0.5, 0.25], [-0.5, 0.25], [0.5, -0.42], [-0.5, -0.42]];
const Lot = ({lot, i, x, z, rot, rise, t}) => {
  const s = rise >= 0.95 ? 1 : 0.001; // items, sign and shop appear at the end of the timelapse
  return (
    <group position={[x, 0, z]}>
      {rise > 0.97 && <Sign text={'@' + lot.user} y={1.25} />}
      <group rotation={[0, rot, 0]}>
      <House x={0} z={0} i={i + 5} build={rise} />
      <group scale={[s, s, s]}>
        {(lot.items ?? []).slice(0, 4).map((t, k) => { const key = itemKey(t);
          const y = YARD[(k + (lot.business ? 1 : 0)) % 4]; // the front yard spot goes to the business
          return <group key={k} position={ROOF_ITEMS.includes(key) ? [0, 0, 0] : [y[0], 0, y[1]]}>{key ? ITEMS[key] : <><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.02, 0.4]} /><meshStandardMaterial color="#7a5230" /></mesh><Sign text={t} y={0.5} w={0.9} /></>}</group>; })}
        {lot.business && <group position={[0.62, 0, 0.32]} rotation={[0, -0.5, 0]} scale={0.8}><Shop name={lot.business} i={i} t={t} /></group>}
      </group>
      </group>
    </group>
  );
};

// Moves the camera every frame; each shot is a slow, simple move.
const Cam = ({shot, local, len, R, focus}) => {
  const camera = useThree((st) => st.camera);
  const k = local / Math.max(1, len);
  let p, look = [0, 0, 0];
  if (shot === 'close' || shot === 'build' || shot === 'lot' || shot === 'empty') { const a = 0.8 + k * 0.6, d = shot === 'build' ? 4.2 : shot === 'lot' ? 5.2 : 3; look = [focus[0], 0.5, focus[1]]; p = [focus[0] + Math.cos(a) * d, (shot === 'lot' ? 3.4 : 2.2) - k * 0.4, focus[1] + Math.sin(a) * d]; }
  else if (shot === 'top') p = [0.01, R * 4.6 - k * R * 0.6, 0.01]; // portrait frame is narrow: pull back so the whole island fits
  else { const a = 0.6 + k * 0.5 + (shot === 'houses' ? 1.2 : 0), d = R * (shot === 'vote' ? 3.6 : 3.1) - k * R * 0.3; p = [Math.cos(a) * d, R * 2.1, Math.sin(a) * d]; }
  camera.position.set(...p);
  camera.lookAt(...look);
  return null;
};

export const Island = ({scenes, day = 1, population = 0, oldHouses = 0, specials = [], building = null, vote = null, lots = [], nextAt = null, nextAmenity = null, music = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let acc = 0;
  const timed = scenes.map((s) => { const start = Math.round(acc * FPS); acc += s.sec; return {...s, start, len: Math.round(s.sec * FPS)}; });
  const i = timed.findLastIndex((s) => frame >= s.start);
  const sc = timed[i], local = frame - sc.start;
  const dusk = !!sc.preview; // preview scenes show the future town at dusk, lamps on
  const shown = Math.min(sc.preview ?? population, MAX_HOUSES);
  const allSpecials = [...specials.map((s) => s.type), ...(building ? [building] : [])];
  const spiral = Math.max(0, shown - lots.length); // people with their own lot count toward the population too
  const plan = layout(spiral + lots.length, lots.length, allSpecials.length);
  const R = Math.max(...plan.empty.map((c) => c.d), LOTS[PLAZA + 8].d) + 2.2; // the island ends a little past the last empty plot
  const housePos = (k) => { const c = plan.house(k); return [c.x, c.z]; };
  const ownerAt = (k) => { const c = plan.owner(k); return [c.x, c.z, faceRoad(c)]; };
  const specialPos = (k) => { const c = plan.amenity(k); return [c.x, c.z]; };
  // New houses rise during the first 'houses' scene; the new special rises during the 'build' scene.
  const hs = timed.find((s) => s.shot === 'houses'), bs = timed.find((s) => s.shot === 'build');
  const riseAt = (start, len, k, n) => interpolate(frame, [start + (k / Math.max(1, n)) * len * 0.7, start + (k / Math.max(1, n)) * len * 0.7 + 8], [0, 1], cl);
  const nNew = Math.max(0, shown - oldHouses);
  const houses = Array.from({length: spiral}, (_, k) => {
    const c = plan.house(k), [x, z] = [c.x, c.z];
    const rise = dusk || k < oldHouses ? 1 : hs ? riseAt(hs.start, hs.len, k - oldHouses, nNew) : 1;
    return <House key={k} x={x} z={z} i={k} rise={rise} rot={faceRoad(c)} />;
  });
  const spec = allSpecials.map((type, k) => { const [x, z] = specialPos(k);
    const fresh = building && k === allSpecials.length - 1, surprise = fresh && SURPRISES.includes(type);
    const at = bs ? bs.start + (surprise ? 48 : 6) : 0; // a surprise rises out of the gift box after it bursts
    const rise = fresh ? (bs ? interpolate(frame, [at, at + 34], [0, 1], cl) : 1) : 1;
    return <group key={k}><Special type={type} x={x} z={z} rise={rise} t={frame} />{surprise && bs && frame >= bs.start && <GiftBox x={x} z={z} k={frame - bs.start} />}</group>; });
  const town = R - 2.2; // trees ring the town, between the last plots and the beach
  const trees = Array.from({length: 56}, (_, k) => { const a = rand(k + 7) * 6.28, r = town + 0.45 + rand(k + 3) * 0.95;
    return <KitMesh key={k} g={treeKit(k % 2)} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={0.75 + rand(k) * 0.6} rotation={[0, rand(k + 1) * 6, 0]} />; });
  // Streets: asphalt, lane lines, curbs, sidewalks, crosswalks, benches, lamps (glowing heads) and street signs
  const sk = streetKit(CELLS, isRoad, P, town, Math.round(town * 10));
  const roads = <group><KitMesh g={sk.g} />{sk.heads && <mesh geometry={sk.heads}><meshStandardMaterial vertexColors emissive="#facc15" emissiveIntensity={dusk ? 2 : 0.6} /></mesh>}</group>;
  // Town square: paved, with the town sign
  const plaza = <group><KitMesh g={plazaKit(P)} /><Sign text="NEELVILLE" y={1.15} bg="#1f2a44" fg="#ffd23f" w={1.6} /></group>;
  // Empty plots for the next followers: roped-off squares, the nearest one with a sign
  const empties = plan.empty.map((c, k) => <group key={k} position={[c.x, 0, c.z]}>
    <mesh position={[0, 0.006, 0]}><boxGeometry args={[1.12, 0.012, 1.12]} /><meshStandardMaterial color="#a3825a" /></mesh>
    {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([a, b]) => <mesh key={a + ' ' + b} position={[a, 0.12, b]}><boxGeometry args={[0.04, 0.24, 0.04]} /><meshStandardMaterial color="#d6d3d1" /></mesh>)}
    {[[0, -0.55, 1.1, 0.02], [0, 0.55, 1.1, 0.02], [-0.55, 0, 0.02, 1.1], [0.55, 0, 0.02, 1.1]].map(([a, b, w, d]) => <mesh key={a + ' ' + b + 'r'} position={[a, 0.2, b]}><boxGeometry args={[w, 0.02, d]} /><meshStandardMaterial color="#dc2626" /></mesh>)}
    {k === 0 && <Sign text="YOUR HOUSE HERE" y={0.55} bg="#c2853f" fg="#1c1917" w={1.3} />}</group>);
  const owned = lots.map((lot, k) => { const [x, z, a] = ownerAt(k), ls = timed.find((t) => t.shot === 'lot' && t.lot === k);
    return <Lot key={k} lot={lot} i={k} x={x} z={z} rot={a} t={frame} rise={lot.fresh ? (ls ? interpolate(frame, [ls.start + 4, ls.start + ls.len - 24], [0, 1], cl) : 0) : 1} />; });
  const lastEmpty = plan.empty[0];
  const focus = sc.shot === 'lot' ? ownerAt(sc.lot ?? 0) : sc.shot === 'build' && allSpecials.length ? specialPos(allSpecials.length - 1) : sc.shot === 'empty' ? [lastEmpty.x, lastEmpty.z] : spiral ? housePos(spiral - 1) : [0, 0];
  const building_lot = sc.shot === 'lot' && lots[sc.lot]?.fresh;
  const robots = Array.from({length: 6}, (_, k) => { if (building_lot) { const [x, z] = ownerAt(sc.lot), a = k * 1.05 + frame / 18; return <Robot key={k} i={k} t={frame * 3} size={0.7} x={x + Math.cos(a) * 0.5} z={z + Math.sin(a) * 0.5} />; }
    const c = spiral ? plan.house(Math.max(0, spiral - 1 - k * 2)) : plan.empty[k]; return <Robot key={k} i={k} t={frame} x={c.x + 0.5} z={c.z + 0.45} />; });

  // HUD: day tag and population, which counts up while the new houses rise
  const popNow = dusk ? sc.preview : hs ? Math.round(interpolate(frame, [hs.start, hs.start + hs.len * 0.8], [Math.min(oldHouses, population), population], cl)) : population;
  const words = String(sc.vo ?? '').split(' ').filter(Boolean);
  const per = Math.max(4, (sc.len - 6) / Math.max(1, words.length));
  const wi = Math.min(words.length - 1, Math.floor(local / per));
  const group = words.slice(Math.floor(wi / 3) * 3, Math.floor(wi / 3) * 3 + 3);
  const keyOf = (w) => sc.key && w.replace(/[^\w']/g, '').toLowerCase() === String(sc.key).toLowerCase();
  const pop = spring({frame: local, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{background: dusk ? 'linear-gradient(#1e1b4b, #f59e0b)' : 'linear-gradient(#8fd3ff, #d8f0ff)'}}>
      {music && <Audio src={staticFile('story-sound.wav')} />}
      <ThreeCanvas width={1080} height={1920} camera={{fov: 45, position: [10, 10, 10]}}>
        <ambientLight intensity={dusk ? 0.65 : 1.1} color={dusk ? '#c7b8ff' : '#ffffff'} />
        <directionalLight position={building_lot ? [Math.cos(local / 12) * 12, 10, Math.sin(local / 12) * 12] : [8, 14, 6]} intensity={dusk ? 0.9 : 2.4} color={dusk ? '#ffb070' : '#ffffff'} />
        <Cam shot={sc.shot ?? 'wide'} local={local} len={sc.len} R={R} focus={focus} />
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R * 6, 64]} /><meshStandardMaterial color="#2f8fd8" /></mesh>
        <mesh position={[0, -0.16, 0]}><cylinderGeometry args={[R + 0.5, R + 0.9, 0.3, 64]} /><meshStandardMaterial color="#f2d79b" /></mesh>
        <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[R, R + 0.3, 0.06, 64]} /><meshStandardMaterial color="#6cc24a" /></mesh>
        {plaza}{roads}{trees}{houses}{spec}{owned}{empties}{robots}<KitMesh g={shoreKit(R)} />
      </ThreeCanvas>
      <div style={{position: 'absolute', left: 50, top: 190, fontFamily: FONT, fontWeight: 800}}>
        <div style={{display: 'inline-block', background: '#ffd23f', color: '#151515', fontSize: 52, padding: '4px 22px', borderRadius: 10}}>DAY {day}</div>
        <div style={{marginTop: 14, background: 'rgba(21,21,21,.85)', color: '#fff', fontSize: 64, padding: '8px 30px', borderRadius: 60, display: 'inline-block', clear: 'both'}}>🏝 Neelville · {popNow}</div>
        {dusk && <div style={{marginTop: 12, color: '#151515', background: '#ffd23f', fontSize: 38, padding: '6px 22px', borderRadius: 12, display: 'table'}}>PREVIEW · {sc.preview} residents</div>}
        {nextAt && !dusk && <div style={{marginTop: 12, color: '#151515', background: 'rgba(255,255,255,.88)', fontSize: 36, padding: '6px 22px', borderRadius: 30, display: 'table'}}>Next: {nextAmenity} at {nextAt}</div>}
      </div>
      {building_lot && <div style={{position: 'absolute', right: 50, top: 190, fontFamily: FONT, fontWeight: 800, textAlign: 'right'}}>
        <div style={{background: '#e5322d', color: '#fff', fontSize: 40, padding: '6px 20px', borderRadius: 10, display: 'inline-block'}}>⏩ TIMELAPSE</div>
        <div style={{marginTop: 10, color: '#fff', fontSize: 56, WebkitTextStroke: '8px #151515', paintOrder: 'stroke fill'}}>
          {(() => { const m = Math.round(interpolate(local, [0, sc.len], [6 * 60, 18 * 60], cl)); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; })()}</div></div>}
      {sc.shot === 'vote' && vote && local > 8 && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 760, display: 'flex', gap: 30, fontFamily: FONT, fontWeight: 800}}>
          {[['A', vote.a, '#e5322d'], ['B', vote.b, '#2f7cf6']].map(([l, t, c], k) => (
            <div key={l} style={{flex: 1, background: '#fff', border: `8px solid ${c}`, borderRadius: 36, padding: '30px 20px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.3)',
              transform: `scale(${spring({frame: local - 8 - k * 6, fps, config: {damping: 11}})})`}}>
              <div style={{fontSize: 110, color: c, lineHeight: 1}}>{l}</div><div style={{fontSize: 52, color: '#151515', textTransform: 'capitalize'}}>{t}</div></div>))}
        </div>)}
      {sc.cta && <div style={{position: 'absolute', left: 60, right: 60, top: 820, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 84, color: '#fff', lineHeight: 1.05,
        WebkitTextStroke: '12px #151515', paintOrder: 'stroke fill', transform: `scale(${pop})`}}>Follow + comment<br />your dream lot 🏡🏪</div>}
      {!sc.cta && group.length > 0 && <div style={{position: 'absolute', left: 40, right: 40, top: 1320, textAlign: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 92,
        color: '#fff', WebkitTextStroke: '12px #151515', paintOrder: 'stroke fill', lineHeight: 1.05}}>
        {group.map((w, k) => <span key={k} style={{color: keyOf(w) ? '#ffd23f' : '#fff'}}>{w} </span>)}</div>}
    </AbsoluteFill>
  );
};
