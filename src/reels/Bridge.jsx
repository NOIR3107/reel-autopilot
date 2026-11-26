// "The 11'8" bridge": trucks keep hitting a low bridge (Durham, NC; almost 200 crashes since cameras went up in 2008, raised 8 inches in 2019).
// Low-poly 3D in plain boxes. Every truck is a pure function of the frame, so renders are repeatable.
import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

const FPS = 30, FONT = '"Bricolage Grotesque Variable", sans-serif';
const DUR = [2.2, 1.7, 1.4, 1.2, 1.0, 0.85, 0.75, 0.65]; // seconds per crash cycle, faster each time
const COUNT = [1, 2, 3, 6, 15, 50, 120, 199]; // sped-up counter
export const CYC = DUR.reduce((a, d, k) => [...a, {s: k ? a[k - 1].s + DUR[k - 1] : 0.8, d, hit: 0}], []).map((c) => ({...c, hit: c.s + 0.7 * c.d}));
export const PASS = {s: CYC[7].s + DUR[7], d: 1.85};
export const bridgeSeconds = () => 16.2;
const WORDS = [[0.4, 'This'], [1.1, 'bridge'], [1.8, 'is'], [2.5, '11 feet 8'], [3.4, 'Trucks'], [4.0, 'keep'], [4.6, 'hitting'], [5.2, 'it'], [6.0, 'Almost'], [6.7, '200'], [7.3, 'times'], [7.9, 'since'], [8.5, '2008'],
  [9.6, 'So'], [10.0, 'they'], [10.4, 'raised'], [10.9, 'it'], [11.3, '8'], [11.7, 'inches'], [12.9, 'Finally'], [13.5, 'trucks'], [14.0, 'fit']];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const B = ({p, s, c, r = [0, 0, 0]}) => <mesh position={p} rotation={r}><boxGeometry args={s} /><meshStandardMaterial color={c} flatShading /></mesh>;

const Truck = ({z, h, hit, since, color}) => {
  // origin = front of the cab on the ground; trailer behind it (+z). After a hit the roof slab flies off and the cab rocks.
  const k = hit ? Math.min(since, 1.2) : 0;
  const rock = hit ? Math.sin(k * 26) * 0.07 * Math.exp(-k * 3) : 0;
  return (
    <group position={[0, 0, z]} rotation={[rock, 0, 0]}>
      <B p={[0, 1.4, 1.1]} s={[2.4, 2.4, 2.2]} c="#f4f4f6" />
      <B p={[0, 2.0, 0.1]} s={[2.2, 1.0, 0.1]} c="#9bd1ff" />
      <B p={[0, 0.5, 0.0]} s={[2.5, 0.8, 0.3]} c="#3a3f47" />
      <B p={[0, 0.35, 5.8]} s={[2.5, 0.5, 9.2]} c="#343a44" />
      <B p={[0, h / 2 + 0.2, 6.0 + (hit ? 0.5 * Math.min(k * 4, 1) : 0)]} s={[2.6, h - 0.45, hit ? 8.6 : 9.0]} c={color} />
      <group position={[0, h - 0.05 + (hit ? Math.max(0, 9 * k - 9 * k * k) : 0), 1.4 + (hit ? -k * 3 : 0)]} rotation={[hit ? -k * 1.4 : 0, 0, hit ? k * 0.9 : 0]}>
        <B p={[0, 0, 1.2]} s={[2.6, 0.35, 3.4]} c={color} />
      </group>
      <B p={[1.32, h * 0.55, 6.0]} s={[0.05, 0.5, 8.6]} c="#d9684a" />
      <B p={[-1.32, h * 0.55, 6.0]} s={[0.05, 0.5, 8.6]} c="#d9684a" />
      <B p={[0, h / 2 + 0.2, 10.55]} s={[2.4, h - 0.7, 0.06]} c="#c8ccd2" />
      {hit && [0, 1, 2, 3, 4].map((j) => <B key={j} p={[(j - 2) * 0.9 * k * 3, h + 0.8 + Math.max(0, (4 + j) * k - 9 * k * k), 1.2 - k * (2 + j)]} s={[0.4, 0.25, 0.5]} c="#9aa0a8" r={[k * 6, k * 4 + j, 0]} />)}
      {[[-1.2, 0.5], [1.2, 0.5], [-1.2, 8.2], [1.2, 8.2], [-1.2, 6.8], [1.2, 6.8]].map(([x, zz], i) => <B key={i} p={[x, 0.45, zz]} s={[0.35, 0.9, 0.9]} c="#15171c" />)}
    </group>
  );
};

const City = ({beamY}) => (
  <>
    <B p={[0, -0.1, 0]} s={[60, 0.2, 120]} c="#cfc9bd" />
    <B p={[0, 0.01, 0]} s={[8, 0.05, 120]} c="#3a3f47" />
    {Array.from({length: 14}, (_, i) => <B key={i} p={[0, 0.06, 24 - i * 5]} s={[0.2, 0.02, 2]} c="#e8e8e8" />)}
    {[-1, 1].map((sd) => Array.from({length: 7}, (_, i) => i < 2 ? null : (
      <group key={`${sd}${i}`} position={[sd * 11, 0, 20 - i * 9]}>
        <B p={[0, 4 + (i % 3), 0]} s={[8, 8 + 2 * (i % 3), 8]} c={['#f2c6a0', '#a8d5e2', '#f7e1a0', '#e8b4bc'][(i + (sd > 0 ? 1 : 0)) % 4]} />
        <B p={[0, 8.4 + 2 * (i % 3), 0]} s={[8.4, 0.8, 8.4]} c="#d9684a" />
        {[1, 2, 3].map((r) => <B key={r} p={[-sd * 4.02, r * 2.2, 0]} s={[0.1, 1, 5]} c="#6fa8c9" />)}
      </group>
    )))}
    {/* bridge: two concrete pillars, a dark beam, hazard stripes */}
    <B p={[-6.2, 3.2, 0]} s={[1.6, 6.4, 2.6]} c="#9a948a" />
    <B p={[6.2, 3.2, 0]} s={[1.6, 6.4, 2.6]} c="#9a948a" />
    <B p={[0, beamY + 0.7, 0]} s={[16, 1.4, 2.6]} c="#2b2f36" />
    <B p={[0, beamY - 0.05, 1.31]} s={[16, 0.5, 0.06]} c="#f2c230" />
    {Array.from({length: 16}, (_, i) => <B key={i} p={[-7.5 + i, beamY - 0.05, 1.35]} s={[0.4, 0.5, 0.05]} c="#1a1a1a" />)}
    <B p={[0, beamY + 3.4, 0]} s={[20, 3.5, 5]} c="#6b7078" />
    <B p={[0, 8.5, -30]} s={[60, 17, 2]} c="#b9d6e8" />
  </>
);

export const Bridge = ({music = true}) => {
  const f = useCurrentFrame(), t = f / FPS;
  const raised = t >= PASS.s - 0.4;
  const beamY = raised ? 3.76 : 3.56;
  const cur = CYC.findIndex((c) => t >= c.s && t < c.s + c.d);
  let truck = null, shake = 0, flash = 0;
  if (cur >= 0) {
    const c = CYC[cur], lt = t - c.s, v = 15.2 / (0.7 * c.d);
    const hit = t >= c.hit;
    truck = <Truck z={hit ? -1.15 : 14 - v * lt} h={3.95} hit={hit} since={t - c.hit} color={['#e9ecef', '#f7e8c4', '#dfe9f3', '#ece3f0'][cur % 4]} />;
    if (hit) { shake = Math.exp(-(t - c.hit) * 9) * 0.5; flash = Math.max(0, 1 - (t - c.hit) * 10); }
  } else if (t >= PASS.s && t < PASS.s + PASS.d) {
    truck = <Truck z={14 - 17 * (t - PASS.s) / PASS.d * 1.9} h={3.6} hit={false} since={0} color="#f1f5ee" />;
  }
  const crashes = CYC.filter((c) => t >= c.hit).length;
  const count = crashes ? COUNT[crashes - 1] : 0;
  const word = [...WORDS].reverse().find(([w]) => t >= w);
  const wordAge = word ? t - word[0] : 9;
  const end = t >= 12.5;
  return (
    <AbsoluteFill style={{background: '#9fd3ff'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 58, position: [8.5 + Math.sin(f / 40) * 0.4 + shake * Math.sin(f * 3), 3.2 + shake * Math.cos(f * 5) * 0.6, 17], near: 0.1, far: 200}}
        onCreated={({camera}) => camera.lookAt(-0.5, 2.6, 1.5)}>
        <color attach="background" args={['#9fd3ff']} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[8, 16, 14]} intensity={2.2} />
        <City beamY={beamY} />
        {truck}
      </ThreeCanvas>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.55}} />
      <div style={{position: 'absolute', left: 50, top: 70, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: '#fff', textShadow: '0 3px 0 #0006', background: '#10182899', padding: '8px 22px', borderRadius: 14}}>CRASHES: {count}</div>
      <div style={{position: 'absolute', right: 50, top: 76, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: '#101828', background: '#f2c230', padding: '6px 20px', borderRadius: 10, border: '5px solid #101828'}}>{raised ? '12\'4"' : '11\'8"'}</div>
      {word && !end && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1030, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 120, color: '#fff', WebkitTextStroke: '10px #101828', paintOrder: 'stroke fill', transform: `scale(${interpolate(wordAge, [0, 0.12], [1.3, 1], clamp)})`}}>{word[1]}</div>
      )}
      {end && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 760, textAlign: 'center', fontFamily: FONT, color: '#fff', fontWeight: 900, WebkitTextStroke: '8px #101828', paintOrder: 'stroke fill', opacity: interpolate(t, [12.5, 12.9], [0, 1], clamp)}}>
          <div style={{fontSize: 110, lineHeight: 1.05}}>Almost 200 crashes</div>
          <div style={{fontSize: 70, marginTop: 24, color: '#ffd23f'}}>then raised 8 inches</div>
          <div style={{fontSize: 56, marginTop: 40, WebkitTextStroke: '6px #101828'}}>Follow for more 🚚</div>
        </div>
      )}
      {music && <Audio src={staticFile('bridge-sound.wav')} />}
    </AbsoluteFill>
  );
};
