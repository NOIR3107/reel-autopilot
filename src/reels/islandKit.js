// Detailed geometry for Neelville, built once and shared. Each house, the street network, the shore railing, the plaza
// and the trees are merged into a few meshes with per-vertex colours, so heavy detail stays cheap to render.
// Rule (Neel): everything on the island is extremely detailed: houses, railings, streets, everything.
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const T = new THREE.Object3D();
const part = (g, color, pos = [0, 0, 0], rot = [0, 0, 0], post) => {
  T.position.set(...pos); T.rotation.set(...rot); T.scale.set(1, 1, 1); T.updateMatrix();
  g = g.index ? g.toNonIndexed() : g; g.applyMatrix4(T.matrix); if (post) g.applyMatrix4(post);
  const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv');
  return g;
};
const merge = (ps) => mergeGeometries(ps.filter(Boolean), false);
const box = (w, h, d, c, p, r, post) => part(new THREE.BoxGeometry(w, h, d), c, p, r || undefined, post);
const cyl = (rt, rb, h, c, p, seg = 10, r) => part(new THREE.CylinderGeometry(rt, rb, h, seg), c, p, r);
const ball = (rad, c, p, seg = 8) => part(new THREE.SphereGeometry(rad, seg, Math.max(4, seg - 2)), c, p);
const cone = (rad, h, c, p, seg = 8) => part(new THREE.ConeGeometry(rad, h, seg), c, p);
const darker = (c, k = 0.82) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();

// ---------- houses ----------
const WALLS = ['#f5efe0', '#fde7c7', '#dbeafe', '#fce7f3', '#e7f5d0', '#ede9fe', '#fff1d6'];
const ROOFS = ['#b91c1c', '#1d4ed8', '#b45309', '#15803d', '#7c3aed', '#0e7490', '#c2410c', '#be185d'];
const SHUT = ['#1e3a8a', '#14532d', '#7f1d1d', '#334155', '#0f766e'];
const DOORS = ['#7c2d12', '#991b1b', '#1e3a8a', '#14532d', '#3f3f46'];
export const W = 0.66, D = 0.54, H = 0.42, F = 0.06, RH = 0.24;

// One window on the front face (z = dist): frame, glass, cross bars, sill, shutters, flower box. Then turned to its face.
const windowParts = (x, y, dist, v, phi) => {
  const R = new THREE.Matrix4().makeRotationY(phi), z = dist + 0.006, sh = SHUT[v % SHUT.length];
  return [box(0.14, 0.13, 0.012, '#fafaf9', [x, y, z], 0, R), box(0.112, 0.102, 0.016, '#bfe3f5', [x, y, z + 0.002], 0, R),
    box(0.008, 0.102, 0.02, '#fafaf9', [x, y, z + 0.003], 0, R), box(0.112, 0.008, 0.02, '#fafaf9', [x, y, z + 0.003], 0, R),
    box(0.17, 0.016, 0.035, '#e7e5e4', [x, y - 0.072, z + 0.012], 0, R),
    box(0.04, 0.13, 0.01, sh, [x - 0.095, y, z], 0, R), box(0.04, 0.13, 0.01, sh, [x + 0.095, y, z], 0, R),
    box(0.14, 0.03, 0.035, '#78350f', [x, y - 0.096, z + 0.02], 0, R),
    ...[-0.045, 0, 0.045].map((o, k) => ball(0.014, ['#f472b6', '#facc15', '#f87171'][k], [x + o, y - 0.074, z + 0.02], 6).applyMatrix4(R))];
};

const houseCache = new Map();
export const houseKit = (v, floors = 1) => {
  const ck = v + '-' + floors; if (houseCache.has(ck)) return houseCache.get(ck);
  const HH = H * floors; // wall height; windows repeat on every floor
  const wall = WALLS[v % WALLS.length], roof = ROOFS[(v * 3) % ROOFS.length], door = DOORS[v % DOORS.length];
  const base = merge([
    box(0.74, F, 0.62, '#9ca3af', [0, F / 2, 0]),
    ...[[-0.3, -0.27], [0.3, -0.27], [-0.3, 0.27], [0.3, 0.27]].map(([a, b]) => box(0.05, F + 0.005, 0.05, '#78716c', [a, F / 2, b])),
    box(0.4, 0.03, 0.17, '#d6d3d1', [0, F + 0.015, D / 2 + 0.085]), // porch deck
    box(0.22, 0.04, 0.07, '#a8a29e', [0, 0.02, D / 2 + 0.2]), box(0.22, 0.02, 0.06, '#a8a29e', [0, 0.01, D / 2 + 0.26]),
    ...[0, 1, 2, 3].map((k) => box(0.1, 0.012, 0.06, '#d6d3d1', [k % 2 ? 0.025 : -0.025, 0.006, D / 2 + 0.33 + k * 0.075])),
  ]);
  const gable = new THREE.Shape(); gable.moveTo(-D / 2, 0); gable.lineTo(D / 2, 0); gable.lineTo(0, RH); gable.closePath();
  const walls = merge([
    box(W, HH, D, wall, [0, F + HH / 2, 0]),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.032, HH, 0.032, '#fafaf9', [sx * W / 2, F + HH / 2, sz * D / 2]))),
    box(W + 0.024, 0.03, D + 0.024, '#fafaf9', [0, F + HH - 0.015, 0]), box(W + 0.03, 0.025, D + 0.03, darker(wall, 0.7), [0, F + 0.012, 0]),
    ...Array.from({length: 5 * floors - 1}, (_, k) => box(W + 0.007, 0.006, D + 0.007, darker(wall, 0.9), [0, F + ((k + 1) * H) / 5, 0])),
    ...(floors > 1 ? [box(W + 0.02, 0.025, D + 0.02, '#fafaf9', [0, F + H, 0])] : []),
    part(new THREE.ExtrudeGeometry(gable, {depth: W, bevelEnabled: false}), wall, [-W / 2, F + HH, 0], [0, Math.PI / 2, 0]),
  ]);
  const a = Math.atan(RH / (D / 2)), L = Math.hypot(D / 2, RH) + 0.08, top = F + HH + RH;
  const roofG = merge([
    ...[-1, 1].flatMap((s) => [
      box(W + 0.12, 0.035, L, roof, [0, top - (L / 2) * Math.sin(a) + 0.02, s * (L / 2) * Math.cos(a)], [s * a, 0, 0]),
      ...[1, 2, 3].map((k) => { const t = (L * k) / 4; return box(W + 0.125, 0.01, 0.014, darker(roof, 0.7), [0, top - t * Math.sin(a) + 0.042, s * t * Math.cos(a)], [s * a, 0, 0]); }),
      box(W + 0.12, 0.03, 0.02, '#fafaf9', [0, top - L * Math.sin(a) + 0.02, s * L * Math.cos(a)]), // fascia
    ]),
    box(W + 0.15, 0.04, 0.05, darker(roof, 0.6), [0, top + 0.015, 0]),
    box(0.09, 0.28, 0.09, '#9a3412', [0.18, top - 0.02, -0.1]), box(0.12, 0.025, 0.12, '#57534e', [0.18, top + 0.13, -0.1]),
    ...[[-0.022, 0], [0.022, 0]].map(([o]) => box(0.03, 0.04, 0.03, '#44403c', [0.18 + o, top + 0.16, -0.1])),
  ]);
  const Rb = new THREE.Matrix4().makeRotationY(Math.PI);
  const details = merge([
    ...Array.from({length: floors}, (_, f) => { const y = F + 0.25 + f * H; return [
      ...windowParts(-0.2, y, D / 2, v, 0), ...(f ? windowParts(0, y, D / 2, v, 0) : []), ...windowParts(0.2, y, D / 2, v, 0),
      ...windowParts(-0.18, y, D / 2, v, Math.PI), ...windowParts(0.18, y, D / 2, v, Math.PI),
      ...windowParts(0, y, W / 2, v, Math.PI / 2), ...windowParts(0, y, W / 2, v, -Math.PI / 2)]; }).flat(),
    box(0.15, 0.235, 0.014, '#fafaf9', [0, F + 0.12, D / 2 + 0.006]), box(0.12, 0.205, 0.018, door, [0, F + 0.105, D / 2 + 0.008]),
    box(0.085, 0.07, 0.02, darker(door, 0.75), [0, F + 0.15, D / 2 + 0.01]), box(0.085, 0.07, 0.02, darker(door, 0.75), [0, F + 0.06, D / 2 + 0.01]),
    ball(0.012, '#facc15', [0.04, F + 0.1, D / 2 + 0.022], 6),
    box(0.3, 0.02, 0.2, roof, [0, F + 0.29, D / 2 + 0.095], [0.18, 0, 0]), // porch roof
    ...[-0.14, 0.14].map((x) => box(0.018, 0.27, 0.018, '#fafaf9', [x, F + 0.15, D / 2 + 0.17])),
    ...[-1, 1].flatMap((s) => [box(0.016, 0.016, 0.17, '#fafaf9', [s * 0.19, F + 0.13, D / 2 + 0.085]),
      ...[0, 1, 2, 3].map((k) => box(0.009, 0.1, 0.009, '#fafaf9', [s * 0.19, F + 0.08, D / 2 + 0.015 + k * 0.045]))]),
    ...[-1, 1].map((s) => ball(0.075, '#166534', [s * 0.27, F + 0.04, D / 2 + 0.07], 7)), ball(0.05, '#22c55e', [0.36, 0.05, D / 2 + 0.18], 7),
    // picket fence along the street side with a gate gap, and a mailbox
    ...Array.from({length: 18}, (_, k) => -0.64 + k * 0.075).filter((x) => Math.abs(x) > 0.09).map((x) => box(0.022, 0.12, 0.012, '#fafaf9', [x, 0.06, 0.66])),
    ...[-1, 1].flatMap((s) => [box(0.55, 0.014, 0.01, '#fafaf9', [s * 0.365, 0.05, 0.665]), box(0.55, 0.014, 0.01, '#fafaf9', [s * 0.365, 0.1, 0.665])]),
    box(0.016, 0.13, 0.016, '#57534e', [0.16, 0.065, 0.62]), box(0.05, 0.038, 0.075, '#1d4ed8', [0.16, 0.145, 0.62]), box(0.008, 0.03, 0.02, '#e5322d', [0.19, 0.16, 0.6]),
  ]);
  const kit = {base, walls, roof: roofG, details, Rb};
  houseCache.set(ck, kit);
  return kit;
};

// ---------- streets: asphalt, lane dashes, curbs and sidewalks, crosswalks, lamps, benches, street signs ----------
export const streetKit = (cells, isRoad, P, town, key) => {
  if (houseCache.has('s' + key)) return houseCache.get('s' + key);
  const at = new Map(cells.map((c) => [c.gx + ',' + c.gz, c]));
  const road = (gx, gz) => at.get(gx + ',' + gz)?.road;
  const parts = [], heads = [];
  cells.filter((c) => c.road && c.d < town + 0.9).forEach((c, k) => {
    const {x, z, gx, gz} = c, cross = isRoad(gx, 0) && isRoad(0, gz), alongX = !isRoad(gx, 0);
    parts.push(box(P, 0.03, P, '#3f4450', [x, 0.015, z]));
    if (!cross) {
      const r = alongX ? [0, 0, 0] : [0, Math.PI / 2, 0];
      parts.push(box(0.24, 0.004, 0.035, '#fde047', [x - (alongX ? 0.32 : 0), 0.032, z - (alongX ? 0 : 0.32)], r), box(0.24, 0.004, 0.035, '#fde047', [x + (alongX ? 0.32 : 0), 0.032, z + (alongX ? 0 : 0.32)], r));
      parts.push(box(alongX ? P : 0.025, 0.004, alongX ? 0.025 : P, '#f8fafc', [x + (alongX ? 0 : 0.52), 0.032, z + (alongX ? 0.52 : 0)]), box(alongX ? P : 0.025, 0.004, alongX ? 0.025 : P, '#f8fafc', [x - (alongX ? 0 : 0.52), 0.032, z - (alongX ? 0.52 : 0)]));
    }
    // curb + sidewalk on every edge that touches a lot
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
      if (road(gx + dx, gz + dz) !== false) return;
      const sx = dx ? 0.16 : P, sz = dz ? 0.16 : P, px = x + dx * (P / 2 - 0.08), pz = z + dz * (P / 2 - 0.08);
      parts.push(box(sx, 0.05, sz, '#d4d4d8', [px, 0.04, pz]));
      parts.push(box(dx ? 0.02 : P, 0.055, dz ? 0.02 : P, '#a1a1aa', [x + dx * (P / 2 - 0.165), 0.04, z + dz * (P / 2 - 0.165)]));
      if (!cross && k % 5 === 0) { // bench on the sidewalk
        const bx = px - dx * 0.02, bz = pz - dz * 0.02, r = dx ? [0, Math.PI / 2, 0] : [0, 0, 0];
        parts.push(box(0.22, 0.02, 0.06, '#92400e', [bx, 0.1, bz], r), box(0.22, 0.06, 0.012, '#92400e', [bx + dx * 0.03, 0.14, bz + dz * 0.03], r));
        [-0.09, 0.09].forEach((o) => parts.push(box(0.015, 0.05, 0.05, '#1f2937', [bx + (dx ? 0 : o), 0.075, bz + (dz ? 0 : o)])));
      }
    });
    // crosswalk stripes on the road cells next to a crossing
    if (!cross) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
      const n = at.get(gx + dx + ',' + (gz + dz)); if (!n || !(isRoad(n.gx, 0) && isRoad(0, n.gz))) return;
      for (let o = -0.45; o <= 0.46; o += 0.15) parts.push(box(dx ? 0.18 : 0.08, 0.005, dx ? 0.08 : 0.18, '#f8fafc', [x + dx * (P / 2 - 0.14) + (dx ? 0 : o), 0.033, z + dz * (P / 2 - 0.14) + (dz ? 0 : o)]));
    });
    if (cross) { // lamp post with arm and head, plus a street sign
      const lx = x + 0.58, lz = z + 0.58;
      parts.push(cyl(0.025, 0.035, 0.05, '#111827', [lx, 0.03, lz]), cyl(0.018, 0.024, 0.9, '#1f2937', [lx, 0.47, lz]), box(0.2, 0.018, 0.018, '#1f2937', [lx - 0.09, 0.91, lz]));
      heads.push(box(0.08, 0.035, 0.08, '#fde68a', [lx - 0.18, 0.885, lz]));
      parts.push(cyl(0.012, 0.012, 0.5, '#6b7280', [x - 0.58, 0.25, z - 0.58]), box(0.22, 0.055, 0.008, '#15803d', [x - 0.58, 0.48, z - 0.58]), box(0.008, 0.055, 0.22, '#15803d', [x - 0.58, 0.42, z - 0.58]));
    }
  });
  const kit = {g: merge(parts), heads: heads.length ? merge(heads) : null};
  houseCache.set('s' + key, kit);
  return kit;
};

// ---------- shore: wooden boardwalk with a railing all the way round, plus a little dock ----------
export const shoreKit = (R) => {
  const k0 = 'r' + R.toFixed(2); if (houseCache.has(k0)) return houseCache.get(k0);
  const parts = [], r = R - 0.4, n = Math.ceil((Math.PI * 2 * r) / 0.22);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    parts.push(box(0.2, 0.03, 0.42, i % 2 ? '#b07a43' : '#a16b38', [c * r, 0.02, s * r], [0, -a + Math.PI / 2, 0]));
    if (i % 2 === 0) parts.push(box(0.028, 0.2, 0.028, '#f5f5f4', [c * (r + 0.19), 0.13, s * (r + 0.19)]));
  }
  for (let i = 0; i < n; i += 2) { // top rail and middle rail between posts
    const a = ((i + 1) / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), len = (Math.PI * 2 * (r + 0.19) * 2) / n;
    parts.push(box(len + 0.01, 0.022, 0.03, '#fafaf9', [c * (r + 0.19), 0.235, s * (r + 0.19)], [0, -a + Math.PI / 2 + Math.PI / 2, 0]));
    parts.push(box(len, 0.014, 0.014, '#e7e5e4', [c * (r + 0.19), 0.14, s * (r + 0.19)], [0, -a + Math.PI, 0]));
  }
  // dock pointing out to sea, with posts and a little boat
  const dx = R + 0.9;
  parts.push(box(1.6, 0.04, 0.36, '#a16b38', [dx, 0.04, 0]), ...[0, 1, 2, 3].flatMap((k) => [-1, 1].map((s) => cyl(0.03, 0.03, 0.5, '#78350f', [R + 0.2 + k * 0.45, -0.1, s * 0.17]))));
  parts.push(box(0.5, 0.1, 0.2, '#f8fafc', [dx + 0.2, -0.02, 0.36]), box(0.5, 0.03, 0.21, '#1d4ed8', [dx + 0.2, -0.06, 0.36]), cyl(0.01, 0.01, 0.4, '#d6d3d1', [dx + 0.2, 0.2, 0.36]));
  const kit = merge(parts); houseCache.set(k0, kit); return kit;
};

// ---------- town square: paving pattern, tiered fountain, benches, planters ----------
export const plazaKit = (P) => {
  if (houseCache.has('plaza')) return houseCache.get('plaza');
  const parts = [], S = P * 2, n = 8;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) parts.push(box(S / n - 0.01, 0.04, S / n - 0.01, (i + j) % 2 ? '#e7e5e4' : '#d6d3d1', [-S / 2 + (i + 0.5) * (S / n), 0.02, -S / 2 + (j + 0.5) * (S / n)]));
  parts.push(cyl(0.6, 0.64, 0.14, '#cbd5e1', [0, 0.1, 0], 28), cyl(0.52, 0.52, 0.02, '#38bdf8', [0, 0.17, 0], 28), cyl(0.07, 0.09, 0.34, '#cbd5e1', [0, 0.32, 0], 14),
    cyl(0.26, 0.2, 0.06, '#cbd5e1', [0, 0.5, 0], 20), cyl(0.22, 0.22, 0.015, '#7dd3fc', [0, 0.53, 0], 20), cyl(0.035, 0.05, 0.16, '#cbd5e1', [0, 0.6, 0], 10), ball(0.05, '#e0f2fe', [0, 0.7, 0], 10));
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
    const bx = dx * 0.95, bz = dz * 0.95, r = dx ? [0, Math.PI / 2, 0] : [0, 0, 0];
    parts.push(box(0.34, 0.025, 0.08, '#92400e', [bx, 0.13, bz], r), box(0.34, 0.07, 0.014, '#92400e', [bx + dx * 0.04, 0.18, bz + dz * 0.04], r));
    [-0.13, 0.13].forEach((o) => parts.push(box(0.02, 0.1, 0.07, '#1f2937', [bx + (dx ? 0 : o), 0.07, bz + (dz ? 0 : o)])));
  });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => parts.push(box(0.26, 0.14, 0.26, '#a8a29e', [a * 1.05, 0.11, b * 1.05]), ball(0.12, '#15803d', [a * 1.05, 0.25, b * 1.05], 8), ball(0.04, '#f472b6', [a * 1.05 + 0.06, 0.33, b * 1.05], 6)));
  const kit = merge(parts); houseCache.set('plaza', kit); return kit;
};

// ---------- trees ----------
export const treeKit = (kind) => {
  if (houseCache.has('t' + kind)) return houseCache.get('t' + kind);
  const g = kind ? merge([cyl(0.04, 0.06, 0.34, '#7a5230', [0, 0.17, 0], 7), ball(0.22, '#16a34a', [0, 0.48, 0], 8), ball(0.16, '#22c55e', [0.12, 0.42, 0.06], 7), ball(0.15, '#15803d', [-0.1, 0.56, -0.05], 7)])
    : merge([cyl(0.04, 0.06, 0.24, '#6b4423', [0, 0.12, 0], 7), cone(0.26, 0.36, '#166534', [0, 0.36, 0], 8), cone(0.21, 0.3, '#15803d', [0, 0.54, 0], 8), cone(0.15, 0.24, '#16a34a', [0, 0.7, 0], 8)]);
  houseCache.set('t' + kind, g); return g;
};
