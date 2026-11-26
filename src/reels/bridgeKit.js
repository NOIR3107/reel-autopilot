// Detailed geometry for the 11'8" bridge reel: a European-style street (shopfronts, awnings, shuttered windows, balconies,
// hip roofs, lamps, curbs), the rail bridge with its steel crash beam, the warning gantry, and an American semi truck.
// Everything static is merged into a few vertex-coloured meshes (same helpers as Neelville) so detail stays cheap.
import * as THREE from 'three';
import {part, merge, box, cyl} from './islandKit.js';

const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const pick = (arr, i, k) => arr[Math.floor(rnd(i, k) * arr.length) % arr.length];
const roofCone = (depth, w, h, c, p) => {
  const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4);
  g.scale(depth / Math.SQRT2 * 1.04, h, w / Math.SQRT2 * 1.04); g.translate(...p);
  return part(g, c);
};

const WALLS = ['#efe3c8', '#f0c9c0', '#f3f1ea', '#f2cfa5', '#f4e2a1', '#c9dbe6', '#e9d3e8', '#f6ddc4'];
const SHUT = ['#2f6b4f', '#7a4a2a', '#3d5a80', '#5b6b3a', '#8a3b2e'];
const AWN = [['#c0392b', '#f5f0e6'], ['#1f6f8b', '#f5f0e6'], ['#2f7d4f', '#f5f0e6'], ['#d68910', '#3b2f2f']];
const ROOF = ['#d0703f', '#c8643a', '#b85c38', '#d98049'];
export const FACADE = 7.5, ROAD = 4, FLOOR = 3.2;

// One building on side sd (-1 left, +1 right). Facade on x = sd*FACADE, facing the road; it spans z0..z0+w.
const building = (sd, z0, w, i) => {
  const out = [], nF = 3 + (rnd(i, 1) > 0.55 ? 1 : 0), H = nF * FLOOR + 0.6, dep = 10, wall = pick(WALLS, i, 2);
  const xf = sd * FACADE, zc = z0 + w / 2, o = (d) => xf - sd * d; // o(d): d units in front of the facade
  out.push(box(dep, H, w - 0.05, wall, [sd * (FACADE + dep / 2), H / 2, zc]));
  out.push(box(0.12, 0.9, w, '#b8ad9a', [o(0.06), 0.45, zc])); // stone plinth
  // ground floor shop: sign band, glass, frame, door, striped awning
  const shopW = w - 1.4, aw = pick(AWN, i, 3);
  out.push(box(0.1, 0.55, shopW + 0.4, aw[0], [o(0.05), 3.0, zc]));
  out.push(box(0.05, 1.9, shopW, '#3d5566', [o(0.02), 1.65, zc]));
  for (const dz of [-shopW / 2, -shopW / 6, shopW / 6, shopW / 2]) out.push(box(0.1, 1.95, 0.1, '#2b2b2b', [o(0.05), 1.65, zc + dz]));
  out.push(box(0.1, 0.1, shopW, '#2b2b2b', [o(0.05), 2.6, zc]), box(0.12, 0.12, shopW, '#2b2b2b', [o(0.06), 0.7, zc]));
  out.push(box(0.08, 2.3, 1.1, '#5a3a24', [o(0.03), 1.15, zc + shopW / 2 - 0.9]));
  const n = Math.max(4, Math.round(shopW / 0.55));
  for (let k = 0; k < n; k++) out.push(box(1.7, 0.06, shopW / n, aw[k % 2], [o(0.8), 2.62, z0 + 0.7 + (k + 0.5) * shopW / n], [0, 0, sd * 0.33]));
  out.push(box(0.12, 0.25, shopW, aw[0], [o(1.6), 2.28, zc]));
  // upper floors: cornice bands, windows with frames, glass, mullions, sills, shutters; a balcony on some
  const nW = Math.max(2, Math.floor(w / 2.5)), shut = pick(SHUT, i, 4), balc = rnd(i, 5) > 0.45;
  for (let fl = 1; fl < nF; fl++) {
    const y0 = fl * FLOOR + 0.3;
    out.push(box(0.22, 0.16, w, '#e8e2d4', [o(0.11), y0 - 0.15, zc]));
    for (let k = 0; k < nW; k++) {
      const z = z0 + (k + 0.5) * w / nW, y = y0 + 1.45, door = balc && fl === 1 && k % 2 === 0, hh = door ? 2.3 : 1.5, yy = door ? y0 + 1.15 : y;
      out.push(box(0.05, hh, 0.95, '#6f8fa6', [o(0.01), yy, z]));
      out.push(box(0.09, hh + 0.14, 0.08, '#f7f5ef', [o(0.05), yy, z - 0.51]), box(0.09, hh + 0.14, 0.08, '#f7f5ef', [o(0.05), yy, z + 0.51]));
      out.push(box(0.09, 0.08, 1.1, '#f7f5ef', [o(0.05), yy + hh / 2 + 0.03, z]), box(0.07, hh, 0.05, '#f7f5ef', [o(0.04), yy, z]), box(0.07, 0.05, 0.95, '#f7f5ef', [o(0.04), yy + hh * 0.15, z]));
      out.push(box(0.1, 0.18, 1.3, '#e8e2d4', [o(0.05), yy + hh / 2 + 0.2, z])); // lintel
      out.push(box(0.06, hh + 0.05, 0.46, shut, [o(0.03), yy, z - 0.78]), box(0.06, hh + 0.05, 0.46, shut, [o(0.03), yy, z + 0.78]));
      for (const dz of [-0.78, 0.78]) for (let s = 0; s < 5; s++) out.push(box(0.07, 0.03, 0.42, new THREE.Color(shut).multiplyScalar(0.75), [o(0.065), yy - hh / 2 + 0.2 + s * (hh - 0.3) / 4, z + dz]));
      if (door) {
        out.push(box(0.9, 0.12, 1.6, '#d9d2c3', [o(0.45), y0 + 0.02, z]));
        out.push(box(0.06, 0.06, 1.6, '#2a2a2a', [o(0.87), y0 + 0.95, z]), box(0.8, 0.06, 0.06, '#2a2a2a', [o(0.47), y0 + 0.95, z - 0.78]), box(0.8, 0.06, 0.06, '#2a2a2a', [o(0.47), y0 + 0.95, z + 0.78]));
        for (let b = 0; b < 9; b++) out.push(box(0.035, 0.85, 0.035, '#2a2a2a', [o(0.87), y0 + 0.5, z - 0.72 + b * 0.18]));
      } else {
        out.push(box(0.28, 0.08, 1.25, '#e8e2d4', [o(0.14), yy - hh / 2 - 0.06, z])); // sill
        if (rnd(i * 7 + k, fl) > 0.6) out.push(box(0.22, 0.2, 0.9, '#7a4a2a', [o(0.14), yy - hh / 2 + 0.07, z]), box(0.24, 0.12, 0.85, '#4f8f3a', [o(0.15), yy - hh / 2 + 0.22, z]));
      }
    }
  }
  // top cornice, hip roof, chimney, gutter
  out.push(box(0.5, 0.35, w + 0.2, '#e8e2d4', [o(0.2), H - 0.15, zc]), box(0.3, 0.12, w + 0.3, '#8a8a8a', [o(0.45), H + 0.02, zc]));
  out.push(roofCone(dep + 0.8, w + 0.4, 2.6 + rnd(i, 6), pick(ROOF, i, 7), [sd * (FACADE + dep / 2), H + 1.3 + rnd(i, 6) / 2, zc]));
  out.push(box(0.7, 1.6, 0.7, '#a45a3a', [sd * (FACADE + 6), H + 1.6, zc + (rnd(i, 8) - 0.5) * w * 0.5]), box(0.85, 0.15, 0.85, '#8a8a8a', [sd * (FACADE + 6), H + 2.45, zc + (rnd(i, 8) - 0.5) * w * 0.5]));
  out.push(box(0.1, H, 0.1, '#9a9a9a', [o(0.08), H / 2, z0 + 0.1])); // downpipe
  return out;
};

let streetCache;
export const streetKit = () => {
  if (streetCache) return streetCache;
  const p = [];
  // asphalt with patches, lane dashes, edge lines, manholes, a few cracks
  p.push(box(ROAD * 2, 0.1, 200, '#5a5d63', [0, -0.05, -30]));
  for (let k = 0; k < 14; k++) p.push(box(1.5 + rnd(k, 1) * 2, 0.005, 1 + rnd(k, 2) * 3, rnd(k, 3) > 0.5 ? '#4e5157' : '#63666c', [(rnd(k, 4) - 0.5) * 6, 0.002, 60 - k * 9]));
  for (let k = 0; k < 40; k++) p.push(box(0.16, 0.012, 2.4, '#f2f2f0', [0, 0.005, 70 - k * 5]));
  for (const x of [-ROAD + 0.35, ROAD - 0.35]) p.push(box(0.14, 0.012, 200, '#f2f2f0', [x, 0.005, -30]));
  for (let k = 0; k < 6; k++) p.push(cyl(0.38, 0.38, 0.02, '#2a2c30', [(k % 2 ? 1.8 : -1.8), 0.008, 50 - k * 14], 14));
  for (let k = 0; k < 10; k++) p.push(box(0.03, 0.006, 1.2 + rnd(k, 9), '#25272b', [(rnd(k, 10) - 0.5) * 6, 0.006, 40 - k * 7], [0, rnd(k, 11) * 2, 0]));
  for (const sd of [-1, 1]) {
    p.push(box(0.25, 0.18, 200, '#c9c6bf', [sd * (ROAD + 0.12), 0.09, -30])); // curb
    p.push(box(FACADE - ROAD - 0.25, 0.16, 200, '#d8d4cb', [sd * (ROAD + 0.25 + (FACADE - ROAD - 0.25) / 2), 0.08, -30]));
    for (let k = 0; k < 100; k++) p.push(box(FACADE - ROAD - 0.25, 0.01, 0.04, '#b9b5ac', [sd * (ROAD + 0.25 + (FACADE - ROAD - 0.25) / 2), 0.165, 70 - k * 2]));
    // street lamps and bollards
    for (let k = 0; k < 9; k++) {
      const z = 60 - k * 13 + (sd > 0 ? 6 : 0), x = sd * (ROAD + 0.7);
      p.push(cyl(0.09, 0.13, 5.2, '#2d3436', [x, 2.6, z], 8), cyl(0.2, 0.2, 0.4, '#2d3436', [x, 0.2, z], 8));
      p.push(box(1.1, 0.08, 0.08, '#2d3436', [x - sd * 0.5, 5.1, z]), box(0.5, 0.18, 0.3, '#2d3436', [x - sd * 1.0, 5.0, z]), box(0.4, 0.05, 0.22, '#fff6d8', [x - sd * 1.0, 4.9, z]));
      p.push(cyl(0.08, 0.08, 0.8, '#4a4f55', [sd * (ROAD + 0.45), 0.55, z + 4], 8));
    }
    // continuous rows of buildings, both directions from the bridge
    let z = -95, i = sd > 0 ? 100 : 0;
    while (z < 75) { const w = 7 + Math.floor(rnd(i, 12) * 3); p.push(...building(sd, z, w, i)); z += w; i++; }
  }
  // the far end of the street: a cross row of buildings closing the vista
  streetCache = new THREE.Mesh(merge(p));
  return streetCache;
};

// Bridge, built with the beam's underside at y = 0 (the group is lifted to the clearance height).
let bridgeCache;
export const bridgeKit = () => {
  if (bridgeCache) return bridgeCache;
  const p = [];
  // steel crash beam ("the can opener") in front, z = 2.2
  p.push(box(15.6, 0.9, 0.22, '#30343a', [0, 0.45, 2.2]), box(15.6, 0.08, 0.7, '#30343a', [0, 0.02, 2.2]), box(15.6, 0.08, 0.7, '#30343a', [0, 0.88, 2.2]));
  for (const x of [-7.2, 7.2]) p.push(box(0.5, 6, 0.5, '#2f3338', [x, -2.1, 2.2]), box(0.9, 0.12, 0.9, '#2f3338', [x, -5.05, 2.2]));
  // railway girder bridge at z = 0
  p.push(box(19, 1.5, 2.4, '#3b4047', [0, 1.05, 0]), box(19, 0.12, 2.8, '#2c3036', [0, 0.3, 0]), box(19, 0.12, 2.8, '#2c3036', [0, 1.8, 0]));
  for (let k = 0; k < 24; k++) for (const z of [-1.25, 1.25]) p.push(box(0.12, 1.5, 0.1, '#2c3036', [-9.2 + k * 0.8, 1.05, z]));
  for (let k = 0; k < 40; k++) for (const z of [-1.3, 1.3]) p.push(cyl(0.03, 0.03, 0.04, '#5a5f66', [-9.5 + k * 0.48, 1.6, z], 6, [Math.PI / 2, 0, 0]));
  for (let k = 0; k < 32; k++) p.push(box(0.25, 0.14, 2.6, '#5a4632', [-9.3 + k * 0.6, 1.93, 0]));
  for (const z of [-0.5, 0.5]) p.push(box(19, 0.12, 0.08, '#8d9299', [0, 2.06, z]));
  for (let k = 0; k < 20; k++) for (const z of [-1.35, 1.35]) p.push(box(0.05, 0.9, 0.05, '#2c3036', [-9.4 + k, 2.35, z]));
  for (const z of [-1.35, 1.35]) p.push(box(19, 0.07, 0.07, '#2c3036', [0, 2.8, z]));
  // concrete abutments into the buildings
  for (const x of [-8.6, 8.6]) p.push(box(2.6, 8, 3.4, '#a7a196', [x, -2.5, 0]), box(2.8, 0.3, 3.6, '#bdb7ab', [x, 1.55, 0]));
  bridgeCache = new THREE.Mesh(merge(p));
  return bridgeCache;
};

// Warning gantry over the road at z = 24: striped posts, a cross beam, sign box and two beacons (beacons drawn in the component).
let gantryCache;
export const gantryKit = () => {
  if (gantryCache) return gantryCache;
  const p = [];
  for (const x of [-4.9, 4.9]) {
    for (let k = 0; k < 18; k++) p.push(cyl(0.16, 0.16, 0.3, k % 2 ? '#1c1c1c' : '#f2c230', [x, 0.15 + k * 0.3, 50], 10));
    p.push(cyl(0.3, 0.3, 0.25, '#7b7b7b', [x, 0.12, 50], 10));
  }
  p.push(box(10.2, 0.3, 0.3, '#6c727a', [0, 5.45, 50]), box(10.2, 0.08, 0.08, '#6c727a', [0, 5.05, 50]));
  for (let k = 0; k < 10; k++) p.push(box(0.06, 0.4, 0.06, '#6c727a', [-4.5 + k, 5.25, 50], [0, 0, k % 2 ? 0.6 : -0.6]));
  p.push(box(4.4, 1.2, 0.2, '#1b1b1b', [0, 4.6, 49.9]));
  // a tall yellow warning board on the sidewalk further back
  p.push(cyl(0.1, 0.1, 5.5, '#7b7b7b', [-5.4, 2.75, 62], 8), box(2.6, 1.6, 0.12, '#f2c230', [-4.6, 5.2, 62]));
  gantryCache = new THREE.Mesh(merge(p));
  return gantryCache;
};

// Semi truck, front bumper at z = 0, trailer behind (+z). Returned in parts so the component can animate them.
const truckCache = new Map();
export const TRAILER_FRONT = 5.7, TRAILER_LEN = 13, WHEEL_R = 0.52, AXLES = [1.3, 6.0, 7.3, 16.6, 17.9];
export const truckKit = (cabColor, trailerColor, h) => {
  const key = cabColor + trailerColor + h;
  if (truckCache.has(key)) return truckCache.get(key);
  const c = cabColor, chrome = '#d7dce1', glass = '#1d2a33', dark = '#202326';
  const cab = [
    box(1.1, 0.3, 18, dark, [0, 0.95, 9]),
    box(2.5, 0.4, 0.25, chrome, [0, 0.8, 0.12]),
    box(1.35, 1.35, 0.12, chrome, [0, 1.75, 0.3]),
    ...Array.from({length: 10}, (_, k) => box(1.2, 0.05, 0.14, dark, [0, 1.2 + k * 0.115, 0.32])),
    box(1.55, 1.05, 2.1, c, [0, 1.9, 1.35]), box(1.4, 0.08, 1.9, c, [0, 2.45, 1.4]),
    ...[-1, 1].flatMap((s) => [box(0.55, 0.55, 1.7, c, [s * 1.05, 1.3, 1.2]), box(0.38, 0.22, 0.08, '#fff6d6', [s * 0.98, 1.55, 0.36]), box(0.4, 0.1, 0.06, '#ffae35', [s * 1.05, 1.82, 0.36]),
      box(0.08, 1.0, 0.5, c, [s * 1.2, 2.2, 2.6]), cyl(0.36, 0.36, 1.3, chrome, [s * 1.15, 0.95, 3.4], 14, [Math.PI / 2, 0, 0]),
      box(0.4, 0.06, 0.7, '#4a4f55', [s * 1.15, 0.45, 3.4]),
      cyl(0.09, 0.09, 3.1, chrome, [s * 1.32, 2.7, 4.1], 10), cyl(0.12, 0.12, 0.25, chrome, [s * 1.32, 4.3, 4.1], 10),
      box(0.05, 0.6, 0.85, glass, [s * 1.22, 3.05, 3.0]), box(0.08, 0.05, 0.4, dark, [s * 1.35, 3.0, 2.3]), box(0.06, 0.5, 0.22, dark, [s * 1.55, 2.95, 2.3])]),
    box(2.4, 1.65, 1.75, c, [0, 2.55, 3.05]), box(2.2, 0.75, 0.08, glass, [0, 3.0, 2.15], [-0.18, 0, 0]),
    box(2.4, 2.55, 1.7, c, [0, 2.3, 4.75]), box(2.3, 0.55, 1.6, c, [0, 3.65, 4.6], [0.25, 0, 0]),
    box(2.45, 0.12, 3.4, new THREE.Color(c).multiplyScalar(0.7), [0, 1.62, 3.9]),
    box(1.3, 0.12, 1.3, '#3b3f45', [0, 1.15, 6.3]),
  ];
  const tr = [
    box(2.6, h - 1.45, TRAILER_LEN, trailerColor, [0, 1.05 + (h - 1.45) / 2, TRAILER_FRONT + TRAILER_LEN / 2]),
    box(2.64, 0.12, TRAILER_LEN, '#9aa0a6', [0, h - 0.06, TRAILER_FRONT + TRAILER_LEN / 2]),
    box(2.64, 0.18, TRAILER_LEN, '#9aa0a6', [0, 1.1, TRAILER_FRONT + TRAILER_LEN / 2]),
    ...[-1, 1].flatMap((s) => [
      ...Array.from({length: 22}, (_, k) => box(0.05, h - 1.5, 0.07, new THREE.Color(trailerColor).multiplyScalar(0.82), [s * 1.32, 1.05 + (h - 1.45) / 2, TRAILER_FRONT + 0.3 + k * 0.59])),
      box(0.04, 0.45, TRAILER_LEN - 0.4, '#c0392b', [s * 1.34, 1.05 + (h - 1.45) * 0.62, TRAILER_FRONT + TRAILER_LEN / 2]),
      box(0.3, 0.9, 0.12, '#7b7b7b', [s * 0.9, 0.55, 9.5]), box(0.5, 0.06, 0.4, '#5a5f66', [s * 0.9, 0.08, 9.5]),
      box(0.25, 0.12, 0.06, '#d01f1f', [s * 1.0, 1.3, TRAILER_FRONT + TRAILER_LEN + 0.03]),
    ]),
    box(0.04, h - 1.6, 0.04, '#6b7178', [0, 1.05 + (h - 1.45) / 2, TRAILER_FRONT + TRAILER_LEN + 0.03]),
    box(2.4, 0.25, 0.6, '#2f3338', [0, 0.85, 17.25]),
    box(2.6, 0.12, 0.08, '#d01f1f', [0, 0.75, TRAILER_FRONT + TRAILER_LEN + 0.2]),
  ];
  // one axle: dual tyres with rims and hubs on both sides
  const ax = [-1, 1].flatMap((s) => [
    cyl(WHEEL_R, WHEEL_R, 0.62, '#151618', [s * 1.0, 0, 0], 18, [0, 0, Math.PI / 2]),
    cyl(0.32, 0.32, 0.64, '#b9bec4', [s * 1.0, 0, 0], 14, [0, 0, Math.PI / 2]),
    cyl(0.12, 0.12, 0.7, '#6f757c', [s * 1.0, 0, 0], 8, [0, 0, Math.PI / 2]),
    ...Array.from({length: 6}, (_, k) => box(0.66, 0.06, 0.06, '#7a8088', [s * 1.0, Math.cos(k) * 0.22, Math.sin(k) * 0.22])),
  ]);
  const roof = [box(2.62, 0.3, 3.2, trailerColor, [0, 0, -1.6]), box(2.66, 0.1, 3.2, '#9aa0a6', [0, 0.18, -1.6])];
  const kit = {cab: merge(cab), trailer: merge(tr), axle: merge(ax), roof: merge(roof)};
  truckCache.set(key, kit);
  return kit;
};
