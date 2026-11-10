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
const House = ({x, z, i, rise = 1, build = null, rot = 0, floors = 1}) => {
  const kit = houseKit(i % 14, floors), b = build ?? 1;
  const slab = ramp(b, 0, 0.15), frame = ramp(b, 0.15, 0.4), walls = ramp(b, 0.4, 0.65), top = ramp(b, 0.65, 0.82), fin = ramp(b, 0.82, 0.95);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} scale={[1, Math.max(0.001, rise), 1]}>
      <KitMesh g={kit.base} scale={[slab || 0.001, 1, slab || 0.001]} />
      {build != null && frame > 0 && walls < 1 && [[-0.31, -0.25], [0.31, -0.25], [-0.31, 0.25], [0.31, 0.25], [0, 0.25], [0, -0.25], [-0.15, 0.25], [0.15, -0.25]].map(([a, c], k) => (
        <mesh key={k} position={[a, 0.06 + 0.21 * frame, c]} scale={[1, frame, 1]}><boxGeometry args={[0.035, 0.42, 0.035]} /><meshStandardMaterial color="#b7791f" /></mesh>))}
      {build != null && frame > 0.6 && walls < 1 && <mesh position={[0, 0.48, 0]}><boxGeometry args={[0.66, 0.03, 0.03]} /><meshStandardMaterial color="#b7791f" /></mesh>}
      {walls > 0 && <KitMesh g={kit.walls} scale={[1, walls, 1]} />}
      {top > 0 && <KitMesh g={kit.roof} position={[0, (1 - top) * 0.8, 0]} />}{/* roof geometry already sits on the top floor */}
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
export const SURPRISES = ['themepark']; // the vote prizes reveal through the box via the `surprise` prop
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
    stadium: <>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[1.9, 0.04, 1.4]} />{M('#94a3b8')}</mesh>
      <mesh position={[0, 0.045, 0]}><boxGeometry args={[1.1, 0.01, 0.66]} />{M('#22c55e')}</mesh>
      {Array.from({length: 6}, (_, k) => <mesh key={k} position={[-0.46 + k * 0.184, 0.047, 0]}><boxGeometry args={[0.09, 0.012, 0.66]} />{M('#16a34a')}</mesh>)}
      <mesh position={[0, 0.053, 0]}><boxGeometry args={[0.008, 0.004, 0.66]} />{M('#fff')}</mesh>
      <mesh position={[0, 0.053, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.1, 0.11, 24]} />{M('#fff')}</mesh>
      {[-1, 1].map((sd) => <group key={sd} position={[sd * 0.53, 0.05, 0]}>
        <mesh position={[0, 0.05, -0.08]}><boxGeometry args={[0.01, 0.1, 0.01]} />{M('#fff')}</mesh><mesh position={[0, 0.05, 0.08]}><boxGeometry args={[0.01, 0.1, 0.01]} />{M('#fff')}</mesh>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.01, 0.01, 0.17]} />{M('#fff')}</mesh></group>)}
      {[[0, -0.48, 1.3, 0], [0, 0.48, 1.3, Math.PI], [-0.72, 0, 0.75, Math.PI / 2], [0.72, 0, 0.75, -Math.PI / 2]].map(([x, z, w, r], k) => <group key={k} position={[x, 0, z]} rotation={[0, r, 0]}>
        {[0, 1, 2, 3].map((j) => <mesh key={j} position={[0, 0.06 + j * 0.07, -0.05 - j * 0.07]}><boxGeometry args={[w, 0.07, 0.08]} />{M(['#e5322d', '#2f7cf6', '#facc15', '#e5322d'][(j + k) % 4])}</mesh>)}
        {Array.from({length: 18}, (_, j) => <mesh key={'f' + j} position={[-w / 2 + 0.05 + (j * (w - 0.1)) / 17, 0.13 + (j % 3) * 0.07, -0.07 - (j % 3) * 0.07]}><boxGeometry args={[0.02, 0.03, 0.02]} />{M(COLORS[(j + k) % COLORS.length])}</mesh>)}</group>)}
      {[[-0.85, -0.6], [0.85, -0.6], [-0.85, 0.6], [0.85, 0.6]].map(([x, z]) => <group key={x + ' ' + z} position={[x, 0, z]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.015, 0.02, 1]} />{M('#64748b')}</mesh>
        <mesh position={[0, 1.02, 0]} rotation={[0, Math.atan2(-x, -z), 0.4]}><boxGeometry args={[0.16, 0.1, 0.03]} />{M('#fff', '#fff7cc')}</mesh></group>)}
      <mesh position={[0, 0.55, -0.62]}><boxGeometry args={[0.5, 0.2, 0.04]} />{M('#111827')}</mesh>
      <mesh position={[0, 0.55, -0.598]}><boxGeometry args={[0.42, 0.13, 0.005]} />{M('#22d3ee', '#22d3ee')}</mesh></>,
    robothq: <>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[1.8, 0.04, 1.4]} />{M('#475569')}</mesh>
      <mesh position={[-0.25, 0.04, 0]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.02, 32]} />{M('#334155')}</mesh>
      <mesh position={[-0.25, 0.05, 0]} scale={[1, 0.62, 1]}><sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />{M('#e2e8f0')}</mesh>
      {Array.from({length: 8}, (_, k) => <mesh key={k} position={[-0.25 + Math.cos(k * 0.785) * 0.42, 0.18, Math.sin(k * 0.785) * 0.42]} rotation={[0, -k * 0.785, 0]}><boxGeometry args={[0.02, 0.1, 0.12]} />{M('#22d3ee', '#22d3ee')}</mesh>)}
      <mesh position={[-0.25, 0.08, 0.5]}><boxGeometry args={[0.3, 0.16, 0.04]} />{M('#0f172a')}</mesh>
      <mesh position={[-0.25, 0.35, 0]}><cylinderGeometry args={[0.02, 0.02, 0.12]} />{M('#94a3b8')}</mesh>
      <group position={[-0.25, 0.44, 0]} rotation={[0.6, t / 30, 0]}><mesh><sphereGeometry args={[0.12, 16, 8, 0, Math.PI * 2, 0, 1.1]} /><meshStandardMaterial color="#cbd5e1" side={2} /></mesh></group>
      {[0, 1, 2, 3].map((k) => <group key={k} position={[0.42, 0, -0.45 + k * 0.3]}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.2, 0.22, 0.16]} />{M('#1e293b')}</mesh>
        <mesh position={[0, 0.12, 0.081]}><boxGeometry args={[0.16, 0.18, 0.005]} />{M('#38bdf8', '#38bdf8')}</mesh>
        <mesh position={[0, 0.1, 0.09]}><boxGeometry args={[0.07, 0.08, 0.05]} />{M(COLORS[k])}</mesh>
        <mesh position={[0, 0.16, 0.09]}><boxGeometry args={[0.05, 0.04, 0.045]} />{M(COLORS[k + 2])}</mesh>
        <mesh position={[0.08, 0.24, 0.085]}><boxGeometry args={[0.02, 0.02, 0.005]} />{M(k === Math.floor(t / 20) % 4 ? '#facc15' : '#4ade80', '#4ade80')}</mesh></group>)}
      <mesh position={[0.25, 0.045, 0.55]}><cylinderGeometry args={[0.18, 0.18, 0.01, 24]} />{M('#facc15')}</mesh>
      <mesh position={[0.25, 0.051, 0.55]}><cylinderGeometry args={[0.14, 0.14, 0.01, 24]} />{M('#111827')}</mesh>
      <mesh position={[0.25, 0.058, 0.55]}><boxGeometry args={[0.14, 0.004, 0.025]} />{M('#facc15')}</mesh>
      {[-0.05, 0.05].map((x) => <mesh key={x} position={[0.25 + x, 0.058, 0.55]}><boxGeometry args={[0.025, 0.004, 0.12]} />{M('#facc15')}</mesh>)}
      <group position={[0.25, 0.2 + Math.abs(Math.sin(t / 25)) * 0.35, 0.55]}><mesh><boxGeometry args={[0.1, 0.1, 0.08]} />{M('#f97316')}</mesh>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.07, 0.06, 0.06]} />{M('#fbbf24')}</mesh>
        <mesh position={[0, -0.07, 0]}><coneGeometry args={[0.03, 0.06, 8]} />{M('#fde047', '#f97316')}</mesh></group></>,
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
  // Face the camera in world space, so signs inside rotated lots aren't mirrored.
  return <mesh onBeforeRender={function (r, s, cam) { this.parent.getWorldQuaternion(this.quaternion); this.quaternion.invert().multiply(cam.quaternion); this.updateMatrixWorld(); }} position={[0, y, 0]}><planeGeometry args={[w, w / 4]} /><meshBasicMaterial map={tex} side={2} /></mesh>;
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
ITEMS.waterpark = <group>
  <mesh position={[0, 0.02, 0]}><boxGeometry args={[1.2, 0.04, 0.5]} /><meshStandardMaterial color="#e0f2fe" /></mesh>
  <mesh position={[0.15, 0.045, 0]}><boxGeometry args={[0.7, 0.02, 0.4]} /><meshStandardMaterial color="#0ea5e9" /></mesh>
  <mesh position={[-0.42, 0.25, -0.1]}><boxGeometry args={[0.18, 0.5, 0.18]} /><meshStandardMaterial color="#f97316" /></mesh>
  <mesh position={[-0.42, 0.52, -0.1]}><coneGeometry args={[0.15, 0.1, 4]} /><meshStandardMaterial color="#facc15" /></mesh>
  {Array.from({length: 7}, (_, k) => <mesh key={k} position={[-0.38 + k * 0.08, 0.46 - k * 0.065, 0.05 + Math.sin(k * 0.9) * 0.08]} rotation={[0, 0, -0.7]}><cylinderGeometry args={[0.04, 0.04, 0.12, 10, 1, true]} /><meshStandardMaterial color="#e5322d" side={2} /></mesh>)}
  {Array.from({length: 6}, (_, k) => <mesh key={'b' + k} position={[-0.38 + k * 0.1, 0.4 - k * 0.07, -0.16 - Math.sin(k) * 0.05]} rotation={[0, 0, -0.65]}><cylinderGeometry args={[0.035, 0.035, 0.12, 10, 1, true]} /><meshStandardMaterial color="#22c55e" side={2} /></mesh>)}
  <mesh position={[0.42, 0.1, 0.12]}><cylinderGeometry args={[0.01, 0.01, 0.18]} /><meshStandardMaterial color="#e5e7eb" /></mesh><mesh position={[0.42, 0.2, 0.12]}><sphereGeometry args={[0.06, 10, 8]} /><meshStandardMaterial color="#facc15" /></mesh>
  {[0.3, 0.5].map((x) => <mesh key={x} position={[x, 0.07, -0.14]}><torusGeometry args={[0.04, 0.015, 8, 16]} /><meshStandardMaterial color={x > 0.4 ? '#ec4899' : '#a3e635'} /></mesh>)}
</group>;
const ROOF_ITEMS = ['barcelona'], BACK_ITEMS = ['waterpark'];
const itemKey = (t) => ['mexflag', 'waterpark', 'pickup', 'wallst', ...ROOF_ITEMS, ...Object.keys(ITEMS)].find((k) => String(t).toLowerCase().includes(k));
const Shop = ({name, i, t = 0}) => {
  const M = (c) => <meshStandardMaterial color={c} />, stripe = COLORS[(i + 3) % COLORS.length], taco = /taco/i.test(name), bag = /bag/i.test(name), parts = /part/i.test(name);
  return (
    <group>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.7, 0.4, 0.4]} />{M('#fff7ed')}</mesh>
      <mesh position={[0, 0.41, 0.03]}><boxGeometry args={[0.74, 0.03, 0.46]} />{M('#a16207')}</mesh>
      {[-0.33, 0.33].map((x) => <mesh key={x} position={[x, 0.55, 0.2]}><boxGeometry args={[0.03, 0.3, 0.03]} />{M('#78350f')}</mesh>)}
      {Array.from({length: 8}, (_, k) => <mesh key={k} position={[-0.315 + k * 0.09, 0.71, 0.13]} rotation={[0.45, 0, 0]}><boxGeometry args={[0.09, 0.025, 0.3]} />{M(k % 2 ? '#fafaf9' : (taco ? '#16a34a' : bag ? '#1c1917' : parts ? '#475569' : stripe))}</mesh>)}
      <mesh position={[-0.12, 0.27, 0.21]}><boxGeometry args={[0.22, 0.16, 0.01]} />{M('#1c1917')}</mesh>
      {[0.2, 0.25, 0.3].map((y) => <mesh key={y} position={[-0.12, y, 0.216]}><boxGeometry args={[0.16, 0.012, 0.005]} />{M('#fde68a')}</mesh>)}
      {[-0.2, 0.05, 0.28].map((x) => <group key={x} position={[x, 0, 0.36]}><mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.012, 0.012, 0.16]} />{M('#1f2937')}</mesh><mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />{M('#e5322d')}</mesh></group>)}
      {/bag/i.test(name) && [-0.2, 0, 0.2].map((x, k) => <group key={x} position={[x + 0.05, 0.44, 0.12]}>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.1, 0.08, 0.04]} />{M(['#be185d', '#1c1917', '#d4a017'][k])}</mesh>
        <mesh position={[0, 0.11, 0]}><torusGeometry args={[0.03, 0.006, 6, 12, Math.PI]} />{M('#d4a017')}</mesh></group>)}
      {parts && <group position={[0, 0.42, 0.12]}>
        {[[-0.22, 0.045, '#94a3b8'], [-0.08, 0.035, '#f59e0b'], [0.2, 0.05, '#64748b']].map(([x, r, c], k) => <mesh key={k} position={[x, r + 0.01, 0]} rotation={[Math.PI / 2, 0, t / (9 + k * 3)]}>
          <torusGeometry args={[r, r * 0.38, 6, 10]} />{M(c)}</mesh>)}
        {[0.02, 0.06, 0.1].map((x) => <mesh key={x} position={[x, 0.03, 0.05]}><cylinderGeometry args={[0.008, 0.008, 0.05, 6]} />{M('#cbd5e1')}</mesh>)}
        <group position={[0.06, 0.02, -0.05]} rotation={[0, 0, Math.sin(t / 20) * 0.3]}>
          <mesh position={[0, 0.07, 0]}><boxGeometry args={[0.03, 0.14, 0.03]} />{M('#f97316')}</mesh>
          <mesh position={[0.04, 0.15, 0]} rotation={[0, 0, -0.9]}><boxGeometry args={[0.025, 0.1, 0.025]} />{M('#f97316')}</mesh>
          <mesh position={[0.08, 0.18, 0]}><boxGeometry args={[0.04, 0.02, 0.03]} />{M('#1f2937')}</mesh></group></group>}
      {taco && <group position={[0, 1.02, 0]} rotation={[0, t / 14, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.14, 24, 1, true, 0, Math.PI]} /><meshStandardMaterial color="#f59e0b" side={2} /></mesh>
        <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.19, 0.19, 0.12, 20, 1, true, 0.2, Math.PI - 0.4]} /><meshStandardMaterial color="#22c55e" side={2} /></mesh>
        {[-0.08, 0, 0.08].map((x) => <mesh key={x} position={[0.02, 0.15, x]}><sphereGeometry args={[0.035, 8, 6]} />{M('#dc2626')}</mesh>)}
        <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.012, 0.012, 0.22]} />{M('#94a3b8')}</mesh></group>}
      <Sign text={taco ? 'TACOS 🌮' : bag ? 'LUXURY BAGS 👜' : parts ? 'ROBOT PARTS ⚙️' : name} y={taco ? 0.95 : 0.9} bg="#151515" fg="#ffd23f" w={0.95} />
    </group>
  );
};
// A statue of the lot's owner on a plinth, raising a flag with their words on it (text only, no logos).
const FLAG_ART = {
  ph: (g) => { g.fillStyle = '#0038a8'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#ce1126'; g.fillRect(0, 128, 512, 128);
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, 0); g.lineTo(222, 128); g.lineTo(0, 256); g.closePath(); g.fill();
    g.fillStyle = '#fcd116'; g.beginPath(); g.arc(74, 128, 26, 0, 6.29); g.fill();
    for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; g.save(); g.translate(74, 128); g.rotate(a); g.fillRect(30, -4, 26, 8); g.restore(); }
    [[22, 30], [22, 226], [176, 128]].forEach(([x, y]) => { g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 14, a = (k * Math.PI) / 5 - Math.PI / 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }); },
  mx: (g) => { ['#006847', '#ffffff', '#ce1126'].forEach((c, k) => { g.fillStyle = c; g.fillRect(k * 171, 0, 171, 256); });
    g.fillStyle = '#7c4a1e'; g.beginPath(); g.ellipse(256, 124, 34, 40, 0, 0, 6.29); g.fill(); g.fillStyle = '#4d7c0f'; g.beginPath(); g.ellipse(256, 168, 44, 10, 0, 0, Math.PI); g.fill(); },
};
const flagTex = (text) => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  if (FLAG_ART[text]) { FLAG_ART[text](g); return new THREE.CanvasTexture(c); }
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#d4a017'; g.fillRect(0, 0, 512, 22); g.fillRect(0, 234, 512, 22);
  g.fillStyle = '#4c1d95'; g.font = 'bold 74px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = String(text).split(' '); if (w.length > 1) { g.fillText(w.slice(0, Math.ceil(w.length / 2)).join(' '), 256, 92, 480); g.fillText(w.slice(Math.ceil(w.length / 2)).join(' '), 256, 170, 480); } else g.fillText(text, 256, 128, 480);
  return new THREE.CanvasTexture(c); };
// Painted statue of a footballer on a plinth. look: 'cr2008' (gelled spiky hair, red #7 shirt, white shorts, black
// socks, the "SIUU" celebration pose) or 'madrid' (all-white kit with gold trim, raising a flag). Club colours only,
// never crests or sponsor logos.
const numTex = (n, bg, fg, stripe) => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128); if (stripe) { g.fillStyle = stripe; for (let x = 16; x < 128; x += 32) g.fillRect(x, 0, 16, 128); } g.fillStyle = fg; g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, 64, 70); return new THREE.CanvasTexture(c); };
const LOOKS = {
  cr2008: {skin: '#c68e5f', hair: '#1c1410', shirt: '#d1001f', trim: '#ffffff', shorts: '#ffffff', socks: '#111111', boots: '#f8fafc', number: '7', pose: 'siu'},
  madrid: {skin: '#d9a477', hair: '#2b1d14', shirt: '#ffffff', trim: '#d4a017', shorts: '#ffffff', socks: '#ffffff', boots: '#111111', number: '', pose: 'flag'},
  // basketball legend: purple and gold #24 jersey, shaved head, flag raised
  hoops24: {skin: '#7a4a2c', hair: null, shirt: '#552583', trim: '#fdb927', shorts: '#552583', socks: '#ffffff', boots: '#111111', number: '24', pose: 'flag', tall: 1.12, sleeveless: true},
  // light blue and white stripes #10, beard, pointing both hands to the sky
  albi10: {skin: '#e0b48c', hair: '#5b3a1e', shirt: '#ffffff', stripe: '#75aadb', trim: '#111111', shorts: '#111111', socks: '#ffffff', boots: '#111111', number: '10', pose: 'sky', beard: true, short: 0.94},
};
const Statue = ({flag, look = 'madrid', t}) => {
  const L = LOOKS[look] ?? LOOKS.madrid, siu = L.pose === 'siu', sky = L.pose === 'sky';
  const tex = useMemo(() => flagTex(flag ?? ''), [flag]), num = useMemo(() => L.number && numTex(L.number, L.shirt, L.trim, L.stripe), [look]);
  const body = useMemo(() => L.stripe && numTex('', L.shirt, L.trim, L.stripe), [look]);
  const M = (c) => <meshStandardMaterial color={c} roughness={0.55} />;
  const limb = (len, w, c, pos, rot) => <mesh position={pos} rotation={rot}><boxGeometry args={[w, len, w]} />{M(c)}</mesh>;
  const legA = siu ? 0.28 : 0.06, armA = siu ? 0.75 : 0.15; // SIUU: legs wide, arms down and out, chest up
  return (
    <group scale={[1.35, 1.35 * (L.tall ?? L.short ?? 1), 1.35]}>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.3, 0.08, 0.3]} /><meshStandardMaterial color="#a8a29e" /></mesh>
      <mesh position={[0, 0.11, 0]}><boxGeometry args={[0.24, 0.06, 0.24]} /><meshStandardMaterial color="#e7e5e4" /></mesh>
      <mesh position={[0, 0.06, 0.151]}><boxGeometry args={[0.16, 0.03, 0.005]} /><meshStandardMaterial color="#d4a017" /></mesh>
      <group position={[0, 0.14, 0]}>
        {[-1, 1].map((sd) => <group key={sd} position={[sd * 0.035, 0.17, 0]} rotation={[0, 0, sd * legA]}>
          {limb(0.08, 0.045, L.skin, [0, -0.05, 0])}{limb(0.06, 0.047, L.socks, [0, -0.11, 0])}{limb(0.025, 0.05, L.boots, [0, -0.15, 0.012])}</group>)}
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.12, 0.07, 0.07]} />{M(L.shorts)}</mesh>
        <group position={[0, 0.31, 0]} rotation={[siu ? -0.25 : 0, 0, 0]}>
          <mesh><boxGeometry args={[0.13, 0.16, 0.075]} />{body ? <meshStandardMaterial map={body} roughness={0.55} /> : M(L.shirt)}</mesh>
          <mesh position={[0, 0.075, 0]}><boxGeometry args={[0.135, 0.015, 0.08]} />{M(L.trim)}</mesh>
          {num && <mesh position={[0, 0.005, -0.039]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.08, 0.08]} /><meshBasicMaterial map={num} /></mesh>}
          {num && <mesh position={[0.035, 0.03, 0.039]}><planeGeometry args={[0.03, 0.03]} /><meshBasicMaterial map={num} /></mesh>}
          {[-1, 1].map((sd) => { const up = !siu && !sky && sd > 0; return <group key={sd} position={[sd * 0.075, 0.06, 0]} rotation={[0, 0, up ? 2.6 : sky ? sd * 2.75 : sd * armA]}>
            {limb(0.06, 0.042, L.sleeveless ? L.skin : L.shirt, [0, -0.03, 0])}{limb(0.09, 0.036, L.skin, [0, -0.1, 0])}
            {sky && <mesh position={[0, -0.165, 0]}><boxGeometry args={[0.012, 0.04, 0.012]} />{M(L.skin)}</mesh>}
            {up && <><mesh position={[0, -0.16, 0]} rotation={[0, 0, -2.6]}><cylinderGeometry args={[0.006, 0.006, 0.42]} />{M('#d6d3d1')}</mesh>
              <mesh position={[-0.12, -0.3, 0]} rotation={[0, Math.sin(t / 10) * 0.2, -2.6 + Math.PI]}><planeGeometry args={[0.24, 0.12]} /><meshBasicMaterial map={tex} side={2} /></mesh></>}</group>; })}
          <group position={[0, 0.13, 0]} rotation={[siu ? -0.25 : 0, 0, 0]}>
            <mesh position={[0, -0.03, 0]}><cylinderGeometry args={[0.022, 0.026, 0.03]} />{M(L.skin)}</mesh>
            <mesh scale={[1, 1.15, 1]}><sphereGeometry args={[0.048, 14, 12]} />{M(L.skin)}</mesh>
            {L.beard && <mesh position={[0, -0.025, 0.012]} scale={[1, 0.7, 1]}><sphereGeometry args={[0.045, 12, 8, 0, 6.29, 1.5, 1.6]} />{M(L.hair)}</mesh>}
            {!L.hair ? null : siu ? Array.from({length: 7}, (_, k) => <mesh key={k} position={[-0.03 + k * 0.01, 0.05, -0.008 + (k % 2) * 0.008]} rotation={[-0.5, 0, (k - 3) * 0.12]}><coneGeometry args={[0.014, 0.05, 5]} />{M(L.hair)}</mesh>)
              : <mesh position={[0, 0.022, -0.006]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.05, 12, 8, 0, 6.29, 0, 1.7]} />{M(L.hair)}</mesh>}
            {siu && <mesh position={[0, 0.032, 0]} scale={[1.02, 0.45, 1.05]}><sphereGeometry args={[0.049, 12, 8, 0, 6.29, 0, 1.6]} />{M(L.hair)}</mesh>}
            {[-0.017, 0.017].map((x) => <mesh key={x} position={[x, 0.004, 0.045]}><sphereGeometry args={[0.006, 6, 6]} />{M('#1c1410')}</mesh>)}
            {siu && <mesh position={[0, -0.022, 0.044]}><boxGeometry args={[0.02, 0.012, 0.004]} />{M('#7f1d1d')}</mesh>}
          </group>
        </group>
      </group>
    </group>
  );
};

// A 3-floor gold building: fine dining restaurant, a home, and a little resort with a rooftop pool and palm trees.
// `build` plays it floor by floor for the timelapse.
const GoldTower = ({build = 1, t = 0}) => {
  const G = '#f2c230', L = '#fde68a', T = '#b8860b', fl = [ramp(build, 0, 0.28), ramp(build, 0.28, 0.52), ramp(build, 0.52, 0.76)], top = ramp(build, 0.76, 0.95);
  const M = (c, e, o) => <meshStandardMaterial color={c} metalness={c === G || c === T ? 0.2 : 0} roughness={0.35} emissive={e ?? '#000'} emissiveIntensity={e ? 0.7 : 0} transparent={o != null} opacity={o ?? 1} />;
  const H = 0.36, W = 0.66, D = 0.58, Z = D / 2;
  const band = (y) => <mesh position={[0, y, 0]}><boxGeometry args={[W + 0.05, 0.03, D + 0.05]} />{M(T)}</mesh>;
  return (
    <group>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.78, 0.06, 0.7]} />{M('#57534e')}</mesh>
      {/* ground floor: fine dining, tall arched windows, revolving door, red carpet, awning, outdoor tables, sign */}
      {fl[0] > 0 && <group position={[0, 0.06, 0]} scale={[1, fl[0], 1]}>
        <mesh position={[0, H / 2, 0]}><boxGeometry args={[W, H, D]} />{M(G)}</mesh>
        {[-0.24, -0.12, 0.12, 0.24].map((x) => <group key={x}><mesh position={[x, 0.17, Z + 0.006]}><boxGeometry args={[0.08, 0.22, 0.01]} />{M('#fde68a', '#f59e0b')}</mesh>
          <mesh position={[x, 0.29, Z + 0.006]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.012, 12, 1, false, 0, Math.PI]} />{M('#fde68a', '#f59e0b')}</mesh></group>)}
        <mesh position={[0, 0.13, Z + 0.01]}><boxGeometry args={[0.12, 0.24, 0.012]} />{M('#1c1917')}</mesh><mesh position={[0, 0.13, Z + 0.016]}><boxGeometry args={[0.005, 0.22, 0.005]} />{M(T)}</mesh>
        <mesh position={[0, 0.004, Z + 0.18]}><boxGeometry args={[0.14, 0.008, 0.36]} />{M('#b91c1c')}</mesh>
        <mesh position={[0, 0.3, Z + 0.09]} rotation={[0.35, 0, 0]}><boxGeometry args={[0.22, 0.02, 0.2]} />{M('#7f1d1d')}</mesh>
        {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.15, Z + 0.17]}><cylinderGeometry args={[0.008, 0.008, 0.3]} />{M(T)}</mesh>)}
        {[-0.27, 0.27].map((x) => <group key={x} position={[x, 0, Z + 0.2]}><mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.055, 0.055, 0.008, 14]} />{M('#fafaf9')}</mesh>
          <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.006, 0.006, 0.06]} />{M('#1f2937')}</mesh>{[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.07, 0.03, 0]}><boxGeometry args={[0.03, 0.06, 0.03]} />{M('#7f1d1d')}</mesh>)}
          <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.004, 0.004, 0.22]} />{M('#d6d3d1')}</mesh><mesh position={[0, 0.27, 0]}><coneGeometry args={[0.09, 0.05, 8]} />{M('#fafaf9')}</mesh></group>)}
        {[-0.3, 0.3].map((x) => <group key={'p' + x} position={[x, 0, Z + 0.02]}><mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.03, 0.025, 0.08, 10]} />{M('#1c1917')}</mesh><mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.045, 8, 6]} />{M('#15803d')}</mesh></group>)}
      </group>}
      {fl[0] >= 1 && band(0.06 + H)}
      {fl[0] >= 1 && <group position={[0, 0.06 + H * 0.82, Z + 0.03]}><Sign text="FINE DINING" y={0} bg="#1c1917" fg="#f2c230" w={0.62} /></group>}
      {/* first floor: the home, shuttered windows, flower boxes, a wide balcony with railing */}
      {fl[1] > 0 && <group position={[0, 0.06 + H, 0]} scale={[1, fl[1], 1]}>
        <mesh position={[0, H / 2, 0]}><boxGeometry args={[W - 0.02, H, D - 0.02]} />{M(L)}</mesh>
        {[-0.22, 0, 0.22].map((x) => <group key={x}><mesh position={[x, 0.19, Z - 0.004]}><boxGeometry args={[0.1, 0.13, 0.012]} />{M('#bfe3f5')}</mesh>
          {[-1, 1].map((sd) => <mesh key={sd} position={[x + sd * 0.068, 0.19, Z - 0.002]}><boxGeometry args={[0.03, 0.13, 0.008]} />{M('#1e3a8a')}</mesh>)}
          <mesh position={[x, 0.11, Z + 0.01]}><boxGeometry args={[0.11, 0.02, 0.025]} />{M('#78350f')}</mesh>
          {[-0.03, 0, 0.03].map((o, k) => <mesh key={o} position={[x + o, 0.125, Z + 0.012]}><sphereGeometry args={[0.01, 6, 6]} />{M(['#f472b6', '#facc15', '#f87171'][k])}</mesh>)}</group>)}
        <mesh position={[0, 0.03, Z + 0.06]}><boxGeometry args={[W, 0.02, 0.12]} />{M('#fafaf9')}</mesh>
        {Array.from({length: 13}, (_, k) => <mesh key={k} position={[-0.31 + k * 0.052, 0.075, Z + 0.115]}><boxGeometry args={[0.008, 0.08, 0.008]} />{M(T)}</mesh>)}
        <mesh position={[0, 0.115, Z + 0.115]}><boxGeometry args={[W, 0.012, 0.012]} />{M(T)}</mesh>
      </group>}
      {fl[1] >= 1 && band(0.06 + 2 * H)}
      {/* second floor: the resort lobby, a wall of glass with gold fins and warm light inside */}
      {fl[2] > 0 && <group position={[0, 0.06 + 2 * H, 0]} scale={[1, fl[2], 1]}>
        <mesh position={[0, H / 2, 0]}><boxGeometry args={[W - 0.06, H, D - 0.06]} />{M('#fef3c7', '#fbbf24')}</mesh>
        <mesh position={[0, H / 2, 0]}><boxGeometry args={[W - 0.02, H - 0.02, D - 0.02]} />{M('#7dd3fc', null, 0.45)}</mesh>
        {Array.from({length: 7}, (_, k) => <mesh key={k} position={[-0.3 + k * 0.1, H / 2, Z - 0.005]}><boxGeometry args={[0.012, H, 0.02]} />{M(T)}</mesh>)}
        {Array.from({length: 5}, (_, k) => <mesh key={'s' + k} position={[W / 2 - 0.005, H / 2, -0.24 + k * 0.12]}><boxGeometry args={[0.02, H, 0.012]} />{M(T)}</mesh>)}
      </group>}
      {/* rooftop resort: infinity pool with glass edge, hot tub, cabana, loungers, umbrellas, palms, string lights */}
      {top > 0 && <group position={[0, 0.06 + 3 * H, 0]} scale={top}>
        <mesh position={[0, 0.015, 0]}><boxGeometry args={[W + 0.04, 0.03, D + 0.04]} />{M('#d6b37a')}</mesh>
        <mesh position={[-0.06, 0.04, 0.05]}><boxGeometry args={[0.44, 0.03, 0.3]} />{M('#0ea5e9')}</mesh>
        <mesh position={[-0.06, 0.06, 0.2]}><boxGeometry args={[0.46, 0.06, 0.008]} />{M('#bae6fd', null, 0.5)}</mesh>
        <mesh position={[0.24, 0.04, -0.18]}><cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />{M('#e7e5e4')}</mesh><mesh position={[0.24, 0.066, -0.18]}><cylinderGeometry args={[0.058, 0.058, 0.004, 16]} />{M('#67e8f9')}</mesh>
        <group position={[-0.22, 0.03, -0.2]}>{[[-0.07, -0.05], [0.07, -0.05], [-0.07, 0.05], [0.07, 0.05]].map(([x, z]) => <mesh key={x + ' ' + z} position={[x, 0.08, z]}><cylinderGeometry args={[0.005, 0.005, 0.16]} />{M('#fafaf9')}</mesh>)}
          <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.17, 0.015, 0.13]} />{M('#fafaf9')}</mesh><mesh position={[0, 0.02, 0]}><boxGeometry args={[0.13, 0.03, 0.09]} />{M('#f5f5f4')}</mesh></group>
        {[-0.16, 0, 0.16].map((x) => <mesh key={x} position={[x, 0.045, 0.27]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.07, 0.012, 0.12]} />{M('#fafaf9')}</mesh>)}
        {[-0.08, 0.08].map((x) => <group key={'u' + x} position={[x, 0.03, 0.27]}><mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.004, 0.004, 0.16]} />{M('#d6d3d1')}</mesh><mesh position={[0, 0.17, 0]}><coneGeometry args={[0.08, 0.04, 8]} />{M('#f472b6')}</mesh></group>)}
        {[[0.27, 0.2], [0.27, 0.02], [-0.3, 0.24]].map(([x, z], k) => <group key={k} position={[x, 0.03, z]}><mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.03, 0.025, 0.06, 8]} />{M('#a16207')}</mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.08]}><cylinderGeometry args={[0.01, 0.015, 0.26]} />{M('#92400e')}</mesh>
          {Array.from({length: 6}, (_, j) => <mesh key={j} position={[Math.cos(j * 1.05) * 0.075, 0.32, Math.sin(j * 1.05) * 0.075]} rotation={[Math.sin(j * 1.05) * 0.7, 0, -Math.cos(j * 1.05) * 0.7]}><boxGeometry args={[0.15, 0.008, 0.04]} />{M('#16a34a')}</mesh>)}</group>)}
        {Array.from({length: 12}, (_, k) => <mesh key={'l' + k} position={[-0.32 + k * 0.058, 0.2 - Math.sin((k / 11) * Math.PI) * 0.04, -0.3]}><sphereGeometry args={[0.012, 6, 6]} />{M('#fde68a', '#facc15')}</mesh>)}
      </group>}
    </group>
  );
};

const MexFlag = () => { const tex = useMemo(() => flagTex('mx'), []); const t = useCurrentFrame();
  return <group><mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.012, 0.016, 1.2]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
    <mesh position={[0.23, 1.02, 0]} rotation={[0, Math.sin(t / 9) * 0.25, Math.sin(t / 7) * 0.03]}><planeGeometry args={[0.44, 0.25]} /><meshBasicMaterial map={tex} side={2} /></mesh>
    <mesh position={[0, 1.21, 0]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#d4a017" /></mesh></group>; };
ITEMS.mexflag = <MexFlag />;
// Lowered ("slammed") 90s-style pickup: boxy two-tone body, square headlights, chrome grille and bumpers, tyres
// tucked into the fenders. Generic truck, no maker's badge.
ITEMS.pickup = <group rotation={[0, Math.PI / 2, 0]} position={[0.05, 0, 0.1]}>
  <mesh position={[0, 0.07, 0]}><boxGeometry args={[0.58, 0.07, 0.22]} /><meshStandardMaterial color="#0f766e" metalness={0.3} roughness={0.3} /></mesh>
  <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.59, 0.02, 0.225]} /><meshStandardMaterial color="#f8fafc" /></mesh>
  <mesh position={[-0.04, 0.15, 0]}><boxGeometry args={[0.2, 0.1, 0.21]} /><meshStandardMaterial color="#0f766e" metalness={0.3} roughness={0.3} /></mesh>
  <mesh position={[0.065, 0.155, 0]}><boxGeometry args={[0.01, 0.075, 0.18]} /><meshStandardMaterial color="#1e293b" /></mesh>
  {[-1, 1].map((sd) => <mesh key={sd} position={[-0.04, 0.155, sd * 0.106]}><boxGeometry args={[0.15, 0.065, 0.004]} /><meshStandardMaterial color="#1e293b" /></mesh>)}
  <mesh position={[-0.2, 0.11, 0]}><boxGeometry args={[0.18, 0.012, 0.2]} /><meshStandardMaterial color="#111827" /></mesh>
  <mesh position={[0.29, 0.07, 0]}><boxGeometry args={[0.01, 0.045, 0.16]} /><meshStandardMaterial color="#e5e7eb" metalness={0.8} roughness={0.2} /></mesh>
  {[-1, 1].map((sd) => <mesh key={'h' + sd} position={[0.292, 0.075, sd * 0.085]}><boxGeometry args={[0.006, 0.03, 0.035]} /><meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={0.6} /></mesh>)}
  {[-1, 1].map((sd) => <mesh key={'b' + sd} position={[sd * 0.3, 0.035, 0]}><boxGeometry args={[0.02, 0.025, 0.22]} /><meshStandardMaterial color="#e5e7eb" metalness={0.8} roughness={0.2} /></mesh>)}
  {[[0.18, 1], [0.18, -1], [-0.18, 1], [-0.18, -1]].map(([x, sd]) => <group key={x + ' ' + sd} position={[x, 0.032, sd * 0.1]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.034, 0.034, 0.03, 16]} /><meshStandardMaterial color="#111" /></mesh>
    <mesh position={[0, 0, sd * 0.016]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.004, 12]} /><meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} /></mesh></group>)}
</group>;
// Street name sign on a post
ITEMS.wallst = <group position={[0, 0, 0]}><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.012, 0.012, 0.5]} /><meshStandardMaterial color="#6b7280" /></mesh><Sign text="WALL ST" y={0.55} bg="#15803d" fg="#ffffff" w={0.6} /></group>;

// An all-black tower, `floors` high, with lit windows, balconies and gold trim; a rainbow basketball court on the roof.
// A giant black glass skyscraper: podium with a glass lobby, a shaft with vertical fins and lit floor bands,
// two setbacks, a crown, and an antenna with a blinking red light. Built bottom to top in the timelapse.
// Generic sports car: low wedge body, cabin glass, spoiler, wheels. No maker's badges.
const SportsCar = ({color = '#e5322d', x = 0, z = 0, r = 0}) => (
  <group position={[x, 0, z]} rotation={[0, r, 0]}>
    <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.3, 0.045, 0.14]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.25} /></mesh>
    <mesh position={[0.11, 0.06, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.1, 0.03, 0.135]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.25} /></mesh>
    <mesh position={[-0.02, 0.085, 0]}><boxGeometry args={[0.13, 0.035, 0.11]} /><meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.1} /></mesh>
    <mesh position={[-0.14, 0.095, 0]}><boxGeometry args={[0.03, 0.008, 0.14]} /><meshStandardMaterial color="#111" /></mesh>
    {[[0.09, 1], [0.09, -1], [-0.09, 1], [-0.09, -1]].map(([a, sd]) => <mesh key={a + ' ' + sd} position={[a, 0.025, sd * 0.07]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.02, 14]} /><meshStandardMaterial color="#111" /></mesh>)}
    {[-1, 1].map((sd) => <mesh key={'l' + sd} position={[0.151, 0.055, sd * 0.045]}><boxGeometry args={[0.004, 0.012, 0.03]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.6} /></mesh>)}
  </group>
);

// Mechanic shop: two roll-up doors (one open, a car up on the lift inside), sign, tyre stacks, oil drums, tool chest.
const Mechanic = ({build = 1}) => { const g = ramp(build, 0, 0.7), fin = ramp(build, 0.7, 0.95), M = (c, e) => <meshStandardMaterial color={c} emissive={e ?? '#000'} emissiveIntensity={e ? 0.6 : 0} />;
  return <group>
    <mesh position={[0, 0.02, 0.1]}><boxGeometry args={[0.8, 0.04, 0.8]} />{M('#9ca3af')}</mesh>
    {g > 0 && <group scale={[1, g, 1]}>
      <mesh position={[0, 0.24, -0.08]}><boxGeometry args={[0.74, 0.44, 0.46]} />{M('#e5e7eb')}</mesh>
      <mesh position={[0, 0.47, -0.08]}><boxGeometry args={[0.78, 0.03, 0.5]} />{M('#1e3a8a')}</mesh>
      <mesh position={[0.18, 0.19, 0.152]}><boxGeometry args={[0.28, 0.3, 0.01]} />{M('#1f2937')}</mesh>
      {Array.from({length: 8}, (_, k) => <mesh key={k} position={[-0.18, 0.06 + k * 0.038, 0.153]}><boxGeometry args={[0.28, 0.03, 0.012]} />{M('#d1d5db')}</mesh>)}
      <mesh position={[0.18, 0.19, 0.1]}><boxGeometry args={[0.26, 0.28, 0.1]} />{M('#111827', '#1e293b')}</mesh>
    </group>}
    {fin > 0 && <group scale={fin}>
      <mesh position={[0.18, 0.12, 0.05]}><boxGeometry args={[0.24, 0.015, 0.06]} />{M('#eab308')}</mesh>
      {[-0.1, 0.1].map((x) => <mesh key={x} position={[0.18 + x, 0.07, 0.05]}><boxGeometry args={[0.02, 0.1, 0.02]} />{M('#eab308')}</mesh>)}
      <group position={[0.18, 0.13, 0.05]} scale={0.8}><SportsCar color="#2563eb" r={0} /></group>
      <Sign text="MECHANIC 🔧" y={0.62} bg="#1e3a8a" fg="#facc15" w={0.75} />
      {[[-0.36, 0.3], [-0.3, 0.38]].map(([x, z], k) => <group key={k} position={[x, 0, z]}>{[0, 1, 2].map((j) => <mesh key={j} position={[0, 0.02 + j * 0.035, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.045, 0.018, 8, 16]} />{M('#111')}</mesh>)}</group>)}
      {[0.36, 0.3].map((x, k) => <mesh key={x} position={[x, 0.05, 0.36 - k * 0.07]}><cylinderGeometry args={[0.03, 0.03, 0.1, 12]} />{M(k ? '#dc2626' : '#2563eb')}</mesh>)}
      <mesh position={[-0.2, 0.08, 0.2]}><boxGeometry args={[0.12, 0.16, 0.07]} />{M('#dc2626')}</mesh>
      {[0.05, 0.1].map((y) => <mesh key={y} position={[-0.2, y, 0.236]}><boxGeometry args={[0.1, 0.006, 0.004]} />{M('#9ca3af')}</mesh>)}
    </group>}
  </group>; };

// Modern warehouse: long dark-metal shed with ribbed walls, a glass corner showroom, roof lights, a loading door, sports cars out front.
const Warehouse = ({build = 1}) => { const g = ramp(build, 0, 0.7), fin = ramp(build, 0.7, 0.95), M = (c, e, o) => <meshStandardMaterial color={c} metalness={0.3} roughness={0.4} emissive={e ?? '#000'} emissiveIntensity={e ? 0.7 : 0} transparent={o != null} opacity={o ?? 1} />;
  return <group>
    <mesh position={[0, 0.02, 0.05]}><boxGeometry args={[0.92, 0.04, 0.9]} />{M('#4b5563')}</mesh>
    {g > 0 && <group scale={[1, g, 1]}>
      <mesh position={[-0.08, 0.2, -0.15]}><boxGeometry args={[0.7, 0.36, 0.44]} />{M('#27272a')}</mesh>
      {Array.from({length: 14}, (_, k) => <mesh key={k} position={[-0.42 + k * 0.05, 0.2, 0.072]}><boxGeometry args={[0.012, 0.36, 0.006]} />{M('#3f3f46')}</mesh>)}
      <mesh position={[0.3, 0.19, 0.0]}><boxGeometry args={[0.24, 0.34, 0.3]} />{M('#fef3c7', '#f59e0b')}</mesh>
      <mesh position={[0.3, 0.19, 0.0]}><boxGeometry args={[0.26, 0.36, 0.32]} />{M('#93c5fd', null, 0.4)}</mesh>
      <mesh position={[-0.2, 0.13, 0.075]}><boxGeometry args={[0.2, 0.22, 0.01]} />{M('#52525b')}</mesh>
      {Array.from({length: 6}, (_, k) => <mesh key={'d' + k} position={[-0.2, 0.04 + k * 0.035, 0.08]}><boxGeometry args={[0.2, 0.008, 0.006]} />{M('#71717a')}</mesh>)}
      {[-0.3, -0.08, 0.14].map((x) => <mesh key={x} position={[x, 0.39, -0.15]}><boxGeometry args={[0.12, 0.03, 0.3]} />{M('#bfdbfe', '#60a5fa')}</mesh>)}
      <mesh position={[-0.08, 0.38, -0.15]}><boxGeometry args={[0.72, 0.012, 0.46]} />{M('#18181b')}</mesh>
    </group>}
    {fin > 0 && <group scale={fin}>
      <SportsCar color="#e5322d" x={-0.25} z={0.3} r={0.3} /><SportsCar color="#facc15" x={0.05} z={0.34} r={0.1} /><SportsCar color="#111827" x={0.32} z={0.3} r={-0.2} />
      <Sign text="GARAGE 01" y={0.6} bg="#0a0a0a" fg="#e5e7eb" w={0.6} />
    </group>}
  </group>; };

// Tech-corporation tower: dark glass, red light strips up the corners, a crown, a big vertical name sign (plain lettering).
const vSignTex = (text) => { const c = document.createElement('canvas'); c.width = 128; c.height = 640; const g = c.getContext('2d');
  g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, 128, 640); g.fillStyle = '#ef4444'; g.font = 'bold 84px sans-serif'; g.textAlign = 'center';
  String(text).toUpperCase().split('').forEach((ch, k, a) => g.fillText(ch, 64, 90 + k * (520 / Math.max(1, a.length - 1)) - (a.length > 7 ? 10 : 0)));
  return new THREE.CanvasTexture(c); };
const TechTower = ({build = 1, name = '', t = 0}) => { const g = ramp(build, 0, 0.88), top = ramp(build, 0.88, 1), H = 2.6 * g;
  const tex = useMemo(() => vSignTex(name), [name]);
  return <group>
    <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.8, 0.06, 0.72]} /><meshStandardMaterial color="#27272a" /></mesh>
    {H > 0.01 && <group>
      <mesh position={[0, 0.06 + H / 2, 0]}><boxGeometry args={[0.56, H, 0.5]} /><meshStandardMaterial color="#111827" metalness={0.6} roughness={0.15} /></mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <mesh key={a + ' ' + b} position={[a * 0.285, 0.06 + H / 2, b * 0.255]}><boxGeometry args={[0.02, H, 0.02]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} /></mesh>)}
      {Array.from({length: Math.floor(H / 0.13)}, (_, j) => <mesh key={j} position={[0, 0.12 + j * 0.13, 0]}><boxGeometry args={[0.565, 0.012, 0.505]} /><meshStandardMaterial color="#334155" emissive={j % 4 ? '#0ea5e9' : '#f43f5e'} emissiveIntensity={0.3} /></mesh>)}
      {g > 0.6 && <mesh position={[0, 0.06 + H * 0.55, 0.252]}><planeGeometry args={[0.16, Math.min(1.4, H * 0.8)]} /><meshBasicMaterial map={tex} /></mesh>}
    </group>}
    {top > 0 && <group position={[0, 0.06 + 2.6, 0]} scale={top}>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.44, 0.16, 0.38]} /><meshStandardMaterial color="#0a0a0a" metalness={0.6} roughness={0.2} /></mesh>
      <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.24, 0.16, 4]} /><meshStandardMaterial color="#111827" metalness={0.6} roughness={0.2} /></mesh>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.006, 0.01, 0.3]} /><meshStandardMaterial color="#a1a1aa" /></mesh>
      <mesh position={[0, 0.56, 0]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={Math.sin(t / 6) > 0 ? 2 : 0.2} /></mesh>
    </group>}
  </group>; };

const RobotRepair = ({build = 1, t = 0}) => { const g = ramp(build, 0, 0.7), fin = ramp(build, 0.7, 0.95), M = (c, e, x) => <meshStandardMaterial color={c} emissive={e ?? '#000'} emissiveIntensity={x ?? (e ? 0.8 : 0)} />;
  const spark = Math.sin(t * 1.7) > 0.2;
  return <group>
    <mesh position={[0, 0.02, 0.05]}><boxGeometry args={[0.84, 0.04, 0.84]} />{M('#94a3b8')}</mesh>
    {Array.from({length: 4}, (_, k) => <mesh key={k} position={[-0.3 + k * 0.2, 0.042, 0.35]}><boxGeometry args={[0.1, 0.004, 0.04]} />{M('#facc15')}</mesh>)}
    {g > 0 && <group scale={[1, g, 1]}>
      <mesh position={[0, 0.25, -0.3]}><boxGeometry args={[0.8, 0.46, 0.06]} />{M('#e2e8f0')}</mesh>
      {[-0.37, 0.37].map((x) => <mesh key={x} position={[x, 0.25, -0.08]}><boxGeometry args={[0.06, 0.46, 0.5]} />{M('#e2e8f0')}</mesh>)}
      <mesh position={[0, 0.5, -0.08]}><boxGeometry args={[0.86, 0.04, 0.56]} />{M('#0f766e')}</mesh>
      {Array.from({length: 7}, (_, k) => <mesh key={k} position={[-0.36 + k * 0.12, 0.515, 0.2]}><boxGeometry args={[0.1, 0.02, 0.06]} />{M(k % 2 ? '#fafaf9' : '#0f766e')}</mesh>)}
      <mesh position={[-0.2, 0.3, -0.265]}><boxGeometry args={[0.3, 0.2, 0.01]} />{M('#334155')}</mesh>
      {[-0.3, -0.24, -0.18, -0.12].map((x, k) => <mesh key={x} position={[x, 0.3 + (k % 2) * 0.03, -0.255]}><boxGeometry args={[0.015, 0.1, 0.012]} />{M(['#ef4444', '#facc15', '#3b82f6', '#a3a3a3'][k])}</mesh>)}
    </group>}
    {fin > 0 && <group scale={fin}>
      <mesh position={[0.05, 0.08, -0.05]}><boxGeometry args={[0.3, 0.08, 0.22]} />{M('#475569')}</mesh>
      <group position={[0.05, 0.12, -0.05]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.14, 0.14, 0.11]} />{M('#f59e0b')}</mesh>
        <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.1, 0.08, 0.09]} />{M('#fbbf24')}</mesh>
        {[-0.025, 0.025].map((x) => <mesh key={x} position={[x, 0.23, 0.046]}><boxGeometry args={[0.018, 0.018, 0.005]} />{M('#22d3ee', '#22d3ee', 1.2)}</mesh>)}
        <mesh position={[-0.1, 0.1, 0]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.03, 0.1, 0.03]} />{M('#f59e0b')}</mesh>
        <mesh position={[0.11, 0.07, 0.02]}><boxGeometry args={[0.03, 0.03, 0.03]} />{M('#64748b')}</mesh>
      </group>
      <mesh position={[0.24, 0.2, 0.05]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.012, 0.012, 0.18]} />{M('#1f2937')}</mesh>
      {spark && [0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[0.17 + Math.cos(k * 1.3 + t) * 0.04, 0.2 + Math.sin(k * 2.1) * 0.04, 0.05 + Math.sin(k + t) * 0.03]}>
        <boxGeometry args={[0.012, 0.012, 0.012]} />{M('#fde047', '#fde047', 2)}</mesh>)}
      <group position={[-0.3, 0, 0.25]}><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.08, 0.2, 0.06]} />{M('#1e293b')}</mesh>
        <mesh position={[0, 0.17, 0.031]}><boxGeometry args={[0.04, 0.03, 0.004]} />{M('#4ade80', '#4ade80', 1)}</mesh></group>
      {[[0.3, 0.3], [0.33, 0.22]].map(([x, z], k) => <mesh key={k} position={[x, 0.04, z]}><boxGeometry args={[0.07, 0.07, 0.07]} />{M(k ? '#a16207' : '#78350f')}</mesh>)}
      <Sign text="ROBOT REPAIR 🤖" y={0.75} bg="#0f766e" fg="#fff" w={0.8} />
    </group>}
  </group>; };

// A follower's own amusement park: roller coaster with a moving train, drop tower, bumper cars, entrance gate.
const FunPark = ({build = 1, t = 0, name = 'FUN LAND'}) => { const g = ramp(build, 0, 0.6), fin = ramp(build, 0.6, 0.95), M = (c, e) => <meshStandardMaterial color={c} emissive={e ?? '#000'} emissiveIntensity={e ? 0.9 : 0} />;
  const curve = useMemo(() => new THREE.CatmullRomCurve3([[-0.32, 0.12, -0.3], [-0.05, 0.62, -0.32], [0.18, 0.2, -0.3], [0.34, 0.42, -0.05], [0.3, 0.14, 0.18], [0.05, 0.36, 0.1], [-0.2, 0.15, 0.05], [-0.36, 0.3, -0.12]].map((p) => new THREE.Vector3(...p)), true), []);
  const pillars = useMemo(() => Array.from({length: 14}, (_, k) => curve.getPointAt(k / 14)), [curve]);
  const car = (o) => { const u = ((t / 160 + o) % 1 + 1) % 1, p = curve.getPointAt(u), q = curve.getPointAt((u + 0.01) % 1);
    return <mesh key={o} position={p.toArray()} rotation={[0, Math.atan2(q.x - p.x, q.z - p.z), 0]}><boxGeometry args={[0.05, 0.035, 0.07]} />{M(['#ef4444', '#facc15', '#3b82f6'][Math.round(o * 30) % 3])}</mesh>; };
  const drop = 0.18 + Math.abs(Math.sin(t / 30)) * 0.5;
  return <group>
    <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.9, 0.04, 0.9]} />{M('#86efac')}</mesh>
    <mesh position={[0, 0.042, 0.3]}><boxGeometry args={[0.16, 0.004, 0.32]} />{M('#d6d3d1')}</mesh>
    {g > 0 && <group scale={[1, g, 1]}>
      <mesh><tubeGeometry args={[curve, 160, 0.012, 6, true]} />{M('#e11d48')}</mesh>
      {pillars.map((p, k) => <mesh key={k} position={[p.x, p.y / 2, p.z]}><cylinderGeometry args={[0.006, 0.006, p.y]} />{M('#f8fafc')}</mesh>)}
      <mesh position={[0.3, 0.42, 0.32]}><cylinderGeometry args={[0.025, 0.03, 0.84, 10]} />{M('#7c3aed')}</mesh>
      <mesh position={[0.3, 0.86, 0.32]}><coneGeometry args={[0.05, 0.08, 10]} />{M('#facc15')}</mesh>
    </group>}
    {fin > 0 && <group scale={fin}>
      {[0, 0.02, 0.04].map(car)}
      <mesh position={[0.3, drop, 0.32]}><torusGeometry args={[0.055, 0.018, 6, 16]} />{M('#22d3ee')}</mesh>
      <mesh position={[-0.22, 0.05, 0.25]}><boxGeometry args={[0.32, 0.02, 0.26]} />{M('#334155')}</mesh>
      {[0, 1, 2, 3].map((k) => { const a = t / 25 + k * 1.6; return <mesh key={k} position={[-0.22 + Math.cos(a) * 0.1, 0.075, 0.25 + Math.sin(a * 1.3) * 0.08]}><boxGeometry args={[0.05, 0.03, 0.04]} />{M(['#f97316', '#22c55e', '#ec4899', '#3b82f6'][k])}</mesh>; })}
      {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.15, 0.44]}><boxGeometry args={[0.03, 0.26, 0.03]} />{M('#f472b6')}</mesh>)}
      <mesh position={[0, 0.29, 0.44]}><boxGeometry args={[0.26, 0.04, 0.03]} />{M('#f472b6')}</mesh>
      {Array.from({length: 6}, (_, k) => <mesh key={k} position={[-0.1 + k * 0.04, 0.315, 0.44]}><sphereGeometry args={[0.01, 6, 6]} />{M('#fde047', Math.sin(t / 4 + k) > 0 ? '#fde047' : undefined)}</mesh>)}
      <Sign text={name} y={1.05} bg="#e11d48" fg="#fff" w={0.95} />
    </group>}
  </group>; };

const Skyscraper = ({build = 1, t = 0}) => {
  const g = ramp(build, 0, 0.9), top = ramp(build, 0.9, 1);
  const M = (c, e, x) => <meshStandardMaterial color={c} metalness={0.5} roughness={0.15} emissive={e ?? '#000'} emissiveIntensity={x ?? (e ? 0.8 : 0)} />;
  const parts = [[0.68, 0.5, 0.6, 1.6], [0.56, 0.42, 1.6, 2.4], [0.44, 0.34, 2.4, 2.95]]; // width, depth, from, to
  return (
    <group>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.78, 0.06, 0.7]} />{M('#3f3f46')}</mesh>
      <mesh position={[0, 0.06 + 0.12 * Math.min(1, g * 8), 0]} scale={[1, Math.min(1, g * 8) || 0.001, 1]}><boxGeometry args={[0.74, 0.24, 0.66]} />{M('#111111')}</mesh>
      {g > 0.12 && <mesh position={[0, 0.17, 0.335]}><boxGeometry args={[0.5, 0.18, 0.01]} />{M('#fef3c7', '#fbbf24', 0.6)}</mesh>}
      {parts.map(([w, d, a, b], k) => { const h = 0.3 + b - a, from = 0.3 + a - 0.6 + (k ? 0 : 0), f = Math.max(0, Math.min(1, (g * 2.95 - (a - 0.3)) / (b - a)));
        if (f <= 0) return null; const y0 = k ? 0.3 + a - 0.6 + 0.3 : 0.3, H = (k ? b - a : b - 0.3) * f;
        return <group key={k} position={[0, y0, 0]}>
          <mesh position={[0, H / 2, 0]}><boxGeometry args={[w, H, d]} />{M('#0a0a0a')}</mesh>
          {Array.from({length: Math.floor(H / 0.1)}, (_, j) => <mesh key={j} position={[0, 0.05 + j * 0.1, 0]}><boxGeometry args={[w + 0.004, 0.02, d + 0.004]} />{M('#1e293b', (j + k) % 3 ? '#38bdf8' : '#fbbf24', 0.35)}</mesh>)}
          {Array.from({length: 7}, (_, j) => <mesh key={'f' + j} position={[-w / 2 + (j + 0.5) * (w / 7), H / 2, d / 2 + 0.006]}><boxGeometry args={[0.01, H, 0.012]} />{M('#52525b')}</mesh>)}
          {Array.from({length: 5}, (_, j) => <mesh key={'s' + j} position={[w / 2 + 0.006, H / 2, -d / 2 + (j + 0.5) * (d / 5)]}><boxGeometry args={[0.012, H, 0.01]} />{M('#52525b')}</mesh>)}
          {f >= 1 && <mesh position={[0, H + 0.012, 0]}><boxGeometry args={[w + 0.03, 0.025, d + 0.03]} />{M('#27272a')}</mesh>}
        </group>; })}
      {top > 0 && <group position={[0, 2.95, 0]} scale={top}>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.3, 0.12, 0.24]} />{M('#18181b')}</mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.008, 0.014, 0.4]} />{M('#a1a1aa')}</mesh>
        <mesh position={[0, 0.51, 0]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={Math.sin(t / 6) > 0 ? 2 : 0.2} /></mesh>
      </group>}
    </group>
  );
};

const BlackTower = ({build = 1, floors = 10}) => {
  const H = 0.19, W = 0.6, D = 0.54, n = Math.round(ramp(build, 0, 0.85) * floors), top = ramp(build, 0.85, 0.97);
  const M = (c, e) => <meshStandardMaterial color={c} roughness={0.3} emissive={e ?? '#000'} emissiveIntensity={e ? 0.8 : 0} />;
  const RAIN = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'];
  return (
    <group>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.72, 0.06, 0.66]} />{M('#27272a')}</mesh>
      {Array.from({length: n}, (_, f) => <group key={f} position={[0, 0.06 + f * H, 0]}>
        <mesh position={[0, H / 2, 0]}><boxGeometry args={[W, H, D]} />{M('#0a0a0a')}</mesh>
        <mesh position={[0, H - 0.008, 0]}><boxGeometry args={[W + 0.02, 0.016, D + 0.02]} />{M('#d4a017')}</mesh>
        {[-0.2, -0.07, 0.07, 0.2].map((x, k) => <mesh key={x} position={[x, H / 2, D / 2 + 0.004]}><boxGeometry args={[0.09, 0.11, 0.008]} />{M((f + k) % 3 ? '#fde68a' : '#1e293b', (f + k) % 3 ? '#f59e0b' : null)}</mesh>)}
        {[-0.15, 0.15].map((z, k) => <mesh key={z} position={[W / 2 + 0.004, H / 2, z]}><boxGeometry args={[0.008, 0.11, 0.12]} />{M((f + k) % 2 ? '#fde68a' : '#1e293b', (f + k) % 2 ? '#f59e0b' : null)}</mesh>)}
        {f % 2 === 1 && <><mesh position={[0, 0.012, D / 2 + 0.05]}><boxGeometry args={[W - 0.06, 0.014, 0.1]} />{M('#18181b')}</mesh>
          <mesh position={[0, 0.06, D / 2 + 0.098]}><boxGeometry args={[W - 0.06, 0.07, 0.006]} /><meshStandardMaterial color="#94a3b8" transparent opacity={0.45} /></mesh></>}
      </group>)}
      {n === floors && n > 0 && <mesh position={[0, 0.06 + floors * H + 0.01, 0]}><boxGeometry args={[W + 0.04, 0.02, D + 0.04]} />{M('#d4a017')}</mesh>}
      {top > 0 && <group position={[0, 0.08 + floors * H, 0]} scale={top}>
        {RAIN.map((c, k) => <mesh key={c} position={[-W / 2 + (k + 0.5) * (W / 6), 0.008, 0]}><boxGeometry args={[W / 6, 0.012, D]} />{M(c)}</mesh>)}
        <mesh position={[0, 0.016, 0]}><boxGeometry args={[0.006, 0.004, D]} />{M('#ffffff')}</mesh>
        <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.07, 0.08, 24]} /><meshBasicMaterial color="#ffffff" /></mesh>
        {[-1, 1].map((sd) => <group key={sd} position={[sd * (W / 2 - 0.04), 0, 0]}>
          <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.008, 0.008, 0.26]} />{M('#d4d4d8')}</mesh>
          <mesh position={[-sd * 0.02, 0.26, 0]}><boxGeometry args={[0.006, 0.09, 0.13]} />{M('#ffffff')}</mesh>
          <mesh position={[-sd * 0.05, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.028, 0.004, 6, 16]} />{M('#f97316')}</mesh></group>)}
        <mesh position={[0.08, 0.035, 0.1]}><sphereGeometry args={[0.022, 10, 10]} />{M('#ea580c')}</mesh>
        {Array.from({length: 16}, (_, k) => { const x = -W / 2 + (k % 8) * (W / 7), z = k < 8 ? D / 2 : -D / 2; return <mesh key={'f' + k} position={[x, 0.09, z]}><boxGeometry args={[0.008, 0.18, 0.008]} />{M('#52525b')}</mesh>; })}
        {[-1, 1].map((sd) => <mesh key={'n' + sd} position={[0, 0.09, sd * D / 2]}><boxGeometry args={[W, 0.17, 0.003]} /><meshStandardMaterial color="#a1a1aa" transparent opacity={0.25} /></mesh>)}
      </group>}
    </group>
  );
};

// One person's lot: their house with their name, what they asked for, and their business.
const YARD = [[0.5, 0.25], [-0.5, 0.25], [0.5, -0.42], [-0.5, -0.42]];
const Lot = ({lot, i, x, z, rot, rise, t, sign = true}) => {
  const s = rise >= 0.95 ? 1 : 0.001; // items, sign and shop appear at the end of the timelapse
  return (
    <group position={[x, 0, z]}>
      {sign && rise > 0.97 && <Sign text={'@' + lot.user} y={({gold3: 1.95, black10: 2.55, skyscraper: 3.7, small: 1.0, techtower: 3.4, mechanic: 0.95, warehouse: 0.95, robotrepair: 1.0, funpark: 1.35}[lot.custom] ?? 1.25) * (lot.tall ?? 1)} />}
      <group rotation={[0, rot, 0]}>
      {lot.custom === 'gold3' ? <GoldTower build={rise} t={t} /> : lot.custom === 'black10' ? <BlackTower build={rise} /> : lot.custom === 'skyscraper' ? <group scale={[1, lot.tall ?? 1, 1]}><Skyscraper build={rise} t={t} /></group> : lot.custom === 'robotrepair' ? <RobotRepair build={rise} t={t} /> : lot.custom === 'funpark' ? <FunPark build={rise} t={t} name={lot.name} /> : lot.custom === 'mechanic' ? <Mechanic build={rise} /> : lot.custom === 'warehouse' ? <Warehouse build={rise} /> : lot.custom === 'techtower' ? <TechTower build={rise} name={lot.name} t={t} /> : lot.custom === 'small' ? <group scale={0.74}><House x={0} z={0.15} i={i + 5} build={rise} /></group> : <House x={0} z={0} i={i + 5} build={rise} floors={lot.custom === 'twostory' ? 2 : 1} />}
      {lot.statue && <group position={[-0.34, 0, 0.5]} scale={[1, rise >= 0.95 ? 1 : 0.001, 1]}><Statue flag={lot.statue.flag ?? lot.statue} look={lot.statue.look} t={t} />{sign && lot.statue.plaque && <Sign text={lot.statue.plaque} y={1.05} bg="#7f1d1d" fg="#ffd23f" w={0.95} />}</group>}
      <group scale={[s, s, s]}>
        {(lot.items ?? []).slice(0, 4).map((t, k) => { const key = itemKey(t);
          const y = YARD[(k + (lot.business ? 1 : 0)) % 4]; // the front yard spot goes to the business
          return <group key={k} position={ROOF_ITEMS.includes(key) ? [0, 0, 0] : BACK_ITEMS.includes(key) ? [0, 0, -0.62] : [y[0], 0, y[1]]}>{key ? ITEMS[key] : <><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.02, 0.4]} /><meshStandardMaterial color="#7a5230" /></mesh><Sign text={t} y={0.5} w={0.9} /></>}</group>; })}
        {lot.business && <group position={[0.62, 0, 0.32]} rotation={[0, -0.5, 0]} scale={0.8}><Shop name={lot.business} i={i} t={t} /></group>}
      </group>
      </group>
    </group>
  );
};

// Moves the camera every frame; each shot is a slow, simple move.
const Cam = ({shot, local, len, R, focus, far = 1}) => {
  const camera = useThree((st) => st.camera);
  const k = local / Math.max(1, len);
  let p, look = [0, 0, 0];
  if (shot === 'close' || shot === 'build' || shot === 'lot' || shot === 'empty') { const a = (shot === 'lot' && focus[2] != null ? Math.atan2(Math.cos(focus[2]), Math.sin(focus[2])) - 0.35 : 0.8) + k * 0.6, d = (shot === 'build' ? 4.2 : shot === 'lot' ? 5.2 : 3) * far; look = [focus[0], 0.5 * far * far, focus[1]]; p = [focus[0] + Math.cos(a) * d, (shot === 'lot' ? 3.4 : shot === 'build' ? 3.6 : 2.2) * far - k * 0.4, focus[1] + Math.sin(a) * d]; }
  else if (shot === 'top') p = [0.01, R * 4.6 - k * R * 0.6, 0.01]; // portrait frame is narrow: pull back so the whole island fits
  else { const a = 0.6 + k * 0.5 + (shot === 'houses' ? 1.2 : 0), d = R * (shot === 'vote' ? 3.6 : 3.1) - k * R * 0.3; p = [Math.cos(a) * d, R * 2.1, Math.sin(a) * d]; }
  camera.position.set(...p);
  camera.lookAt(...look);
  return null;
};

export const Island = ({scenes, day = 1, population = 0, oldHouses = 0, specials = [], building = null, box = false, surprise = false, vote = null, lots = [], nextAt = null, nextAmenity = null, music = true}) => {
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
    const fresh = building && k === allSpecials.length - 1, gift = fresh && (surprise || SURPRISES.includes(type));
    const at = bs ? bs.start + (gift ? 48 : 6) : 0; // a surprise rises out of the gift box after it bursts
    const rise = fresh ? (bs ? interpolate(frame, [at, at + 34], [0, 1], cl) : 1) : 1;
    return <group key={k}><Special type={type} x={x} z={z} rise={rise} t={frame} />{gift && bs && frame >= bs.start && <GiftBox x={x} z={z} k={frame - bs.start} />}</group>; });
  // the vote episode: the box lands and keeps rumbling, still shut
  if (box && bs && frame >= bs.start) { const [x, z] = specialPos(allSpecials.length), k = frame - bs.start; spec.push(<GiftBox key="box" x={x} z={z} k={k < 14 ? k : 14 + ((k - 14) % 22)} />); }
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
    return <Lot key={k} lot={lot} i={k} x={x} z={z} rot={a} t={frame} sign={sc.shot === 'lot' ? sc.lot === k : !['build', 'vote'].includes(sc.shot)} rise={lot.fresh ? (ls ? interpolate(frame, [ls.start + 4, ls.start + ls.len - 24], [0, 1], cl) : 0) : 1} />; });
  const lastEmpty = plan.empty[0];
  const focus = sc.shot === 'lot' ? ownerAt(sc.lot ?? 0) : sc.shot === 'build' && (box || allSpecials.length) ? specialPos(box ? allSpecials.length : allSpecials.length - 1) : sc.shot === 'empty' ? [lastEmpty.x, lastEmpty.z] : spiral ? housePos(spiral - 1) : [0, 0];
  const building_lot = sc.shot === 'lot' && lots[sc.lot]?.fresh;
  const robots = Array.from({length: 6}, (_, k) => { if (building_lot && local > sc.len - 28) return null; // robots leave for the finished reveal
    if (building_lot) { const [x, z] = ownerAt(sc.lot), a = k * 1.05 + frame / 18; return <Robot key={k} i={k} t={frame * 3} size={0.7} x={x + Math.cos(a) * 0.5} z={z + Math.sin(a) * 0.5} />; }
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
        <Cam shot={sc.shot ?? 'wide'} local={local} len={sc.len} R={R} focus={focus} far={sc.far ?? 1} />
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
