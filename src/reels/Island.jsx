// Neelville: an island where little robots build a house for every follower. One episode a day.
// Props: {day, population, oldHouses, specials: [{type}], building (type rising this episode, or null), vote: {a, b},
//         scenes: [{sec, vo, key, shot: wide|houses|close|build|top|vote, cta}]}
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

const FONT = '"Bricolage Grotesque Variable", sans-serif';
const FPS = 30;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const islandFrames = (scenes) => Math.round(scenes.reduce((t, s) => t + s.sec, 0) * FPS);
const MAX_HOUSES = 300; // shortcut: houses past 300 aren't drawn (software 3D on GitHub's servers gets slow); move to instanced meshes before then

// Deterministic layout: houses on a golden-angle spiral, special buildings on a ring near the shore.
const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const radiusFor = (n) => 4 + Math.sqrt(n) * 0.75;
const housePos = (i) => { const a = i * 2.39996, r = 1.6 + Math.sqrt(i + 1) * 0.72; return [Math.cos(a) * r, Math.sin(a) * r]; };
const specialPos = (i, R) => { const a = i * 1.1 + 0.6; return [Math.cos(a) * (R - 1.6), Math.sin(a) * (R - 1.6)]; };
const COLORS = ['#e5322d', '#2f7cf6', '#f59e0b', '#16a34a', '#9333ea', '#0ea5e9', '#f97316', '#db2777'];

const House = ({x, z, i, rise = 1}) => (
  <group position={[x, 0, z]} rotation={[0, rand(i) * 6.28, 0]} scale={[1, Math.max(0.001, rise), 1]}>
    <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.5, 0.44, 0.5]} /><meshStandardMaterial color="#f4f1ea" /></mesh>
    <mesh position={[0, 0.58, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.42, 0.32, 4]} /><meshStandardMaterial color={COLORS[i % COLORS.length]} /></mesh>
  </group>
);
const Tree = ({x, z, s}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.05, 0.07, 0.3]} /><meshStandardMaterial color="#7a5230" /></mesh>
    <mesh position={[0, 0.48, 0]}><coneGeometry args={[0.24, 0.6, 7]} /><meshStandardMaterial color="#2f8f46" /></mesh>
  </group>
);
const Robot = ({x, z, t, i}) => (
  <group position={[x, 0.05 + Math.abs(Math.sin(t / 4 + i)) * 0.12, z]} rotation={[0, t / 20 + i, 0]} scale={2}>
    <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.22, 0.22, 0.2]} /><meshStandardMaterial color="#e5322d" /></mesh>
    <mesh position={[0, 0.36, 0]}><boxGeometry args={[0.24, 0.17, 0.2]} /><meshStandardMaterial color="#f4f1ea" /></mesh>
    {[-0.06, 0.06].map((e) => <mesh key={e} position={[e, 0.37, 0.105]}><sphereGeometry args={[0.03, 10, 10]} /><meshStandardMaterial color="#39d0ff" emissive="#39d0ff" emissiveIntensity={1.5} /></mesh>)}
  </group>
);
const Special = ({type, x, z, rise = 1, t}) => {
  const s = Math.max(0.001, rise);
  const parts = {
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

// Moves the camera every frame; each shot is a slow, simple move.
const Cam = ({shot, local, len, R, focus}) => {
  const camera = useThree((st) => st.camera);
  const k = local / Math.max(1, len);
  let p, look = [0, 0, 0];
  if (shot === 'close' || shot === 'build') { const a = 0.8 + k * 0.6, d = shot === 'build' ? 4.2 : 3; look = [focus[0], 0.5, focus[1]]; p = [focus[0] + Math.cos(a) * d, 2.2 - k * 0.4, focus[1] + Math.sin(a) * d]; }
  else if (shot === 'top') p = [0.01, R * 4.6 - k * R * 0.6, 0.01]; // portrait frame is narrow: pull back so the whole island fits
  else { const a = 0.6 + k * 0.5 + (shot === 'houses' ? 1.2 : 0), d = R * (shot === 'vote' ? 3.6 : 3.1) - k * R * 0.3; p = [Math.cos(a) * d, R * 2.1, Math.sin(a) * d]; }
  camera.position.set(...p);
  camera.lookAt(...look);
  return null;
};

export const Island = ({scenes, day = 1, population = 0, oldHouses = 0, specials = [], building = null, vote = null, music = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let acc = 0;
  const timed = scenes.map((s) => { const start = Math.round(acc * FPS); acc += s.sec; return {...s, start, len: Math.round(s.sec * FPS)}; });
  const i = timed.findLastIndex((s) => frame >= s.start);
  const sc = timed[i], local = frame - sc.start;
  const shown = Math.min(population, MAX_HOUSES), R = radiusFor(Math.max(shown, 20));
  // New houses rise during the first 'houses' scene; the new special rises during the 'build' scene.
  const hs = timed.find((s) => s.shot === 'houses'), bs = timed.find((s) => s.shot === 'build');
  const riseAt = (start, len, k, n) => interpolate(frame, [start + (k / Math.max(1, n)) * len * 0.7, start + (k / Math.max(1, n)) * len * 0.7 + 8], [0, 1], cl);
  const nNew = Math.max(0, shown - oldHouses);
  const houses = Array.from({length: shown}, (_, k) => {
    const [x, z] = housePos(k);
    const rise = k < oldHouses ? 1 : hs ? riseAt(hs.start, hs.len, k - oldHouses, nNew) : 1;
    return <House key={k} x={x} z={z} i={k} rise={rise} />;
  });
  const allSpecials = [...specials.map((s) => s.type), ...(building ? [building] : [])];
  const spec = allSpecials.map((type, k) => { const [x, z] = specialPos(k, R);
    const rise = building && k === allSpecials.length - 1 ? (bs ? interpolate(frame, [bs.start + 6, bs.start + 40], [0, 1], cl) : 1) : 1;
    return <Special key={k} type={type} x={x} z={z} rise={rise} t={frame} />; });
  const trees = Array.from({length: 40}, (_, k) => { const a = rand(k + 7) * 6.28, r = R * (0.75 + rand(k + 3) * 0.2); return <Tree key={k} x={Math.cos(a) * r} z={Math.sin(a) * r} s={0.7 + rand(k) * 0.6} />; });
  const focus = sc.shot === 'build' && allSpecials.length ? specialPos(allSpecials.length - 1, R) : housePos(Math.max(0, shown - 1));
  const robots = Array.from({length: 6}, (_, k) => { const [x, z] = housePos(Math.max(0, shown - 1 - k * 3)); return <Robot key={k} i={k} t={frame} x={x + 0.45} z={z + 0.3} />; });

  // HUD: day tag and population, which counts up while the new houses rise
  const popNow = hs ? Math.round(interpolate(frame, [hs.start, hs.start + hs.len * 0.8], [Math.min(oldHouses, population), population], cl)) : population;
  const words = String(sc.vo ?? '').split(' ').filter(Boolean);
  const per = Math.max(4, (sc.len - 6) / Math.max(1, words.length));
  const wi = Math.min(words.length - 1, Math.floor(local / per));
  const group = words.slice(Math.floor(wi / 3) * 3, Math.floor(wi / 3) * 3 + 3);
  const keyOf = (w) => sc.key && w.replace(/[^\w']/g, '').toLowerCase() === String(sc.key).toLowerCase();
  const pop = spring({frame: local, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#8fd3ff, #d8f0ff)'}}>
      {music && <Audio src={staticFile('story-sound.wav')} />}
      <ThreeCanvas width={1080} height={1920} camera={{fov: 45, position: [10, 10, 10]}}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[8, 14, 6]} intensity={2.4} />
        <Cam shot={sc.shot ?? 'wide'} local={local} len={sc.len} R={R} focus={focus} />
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R * 6, 64]} /><meshStandardMaterial color="#2f8fd8" /></mesh>
        <mesh position={[0, -0.16, 0]}><cylinderGeometry args={[R + 0.5, R + 0.9, 0.3, 64]} /><meshStandardMaterial color="#f2d79b" /></mesh>
        <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[R, R + 0.3, 0.06, 64]} /><meshStandardMaterial color="#6cc24a" /></mesh>
        {trees}{houses}{spec}{robots}
      </ThreeCanvas>
      <div style={{position: 'absolute', left: 50, top: 190, fontFamily: FONT, fontWeight: 800}}>
        <div style={{display: 'inline-block', background: '#ffd23f', color: '#151515', fontSize: 52, padding: '4px 22px', borderRadius: 10}}>DAY {day}</div>
        <div style={{marginTop: 14, background: 'rgba(21,21,21,.85)', color: '#fff', fontSize: 64, padding: '8px 30px', borderRadius: 60, display: 'inline-block', clear: 'both'}}>🏝 Neelville · {popNow}</div>
      </div>
      {sc.shot === 'vote' && vote && local > 8 && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 760, display: 'flex', gap: 30, fontFamily: FONT, fontWeight: 800}}>
          {[['A', vote.a, '#e5322d'], ['B', vote.b, '#2f7cf6']].map(([l, t, c], k) => (
            <div key={l} style={{flex: 1, background: '#fff', border: `8px solid ${c}`, borderRadius: 36, padding: '30px 20px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.3)',
              transform: `scale(${spring({frame: local - 8 - k * 6, fps, config: {damping: 11}})})`}}>
              <div style={{fontSize: 110, color: c, lineHeight: 1}}>{l}</div><div style={{fontSize: 52, color: '#151515', textTransform: 'capitalize'}}>{t}</div></div>))}
        </div>)}
      {sc.cta && <div style={{position: 'absolute', left: 60, right: 60, top: 820, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 84, color: '#fff', lineHeight: 1.05,
        WebkitTextStroke: '12px #151515', paintOrder: 'stroke fill', transform: `scale(${pop})`}}>Follow = a house<br />in Neelville 🏠</div>}
      {!sc.cta && group.length > 0 && <div style={{position: 'absolute', left: 40, right: 40, top: 1320, textAlign: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 92,
        color: '#fff', WebkitTextStroke: '12px #151515', paintOrder: 'stroke fill', lineHeight: 1.05}}>
        {group.map((w, k) => <span key={k} style={{color: keyOf(w) ? '#ffd23f' : '#fff'}}>{w} </span>)}</div>}
    </AbsoluteFill>
  );
};
