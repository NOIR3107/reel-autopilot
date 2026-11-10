// Stadium marble race: who leads when is precomputed here (pure, seeded), so the episode script can name the winner
// and Island.jsx can draw the same race. Progress p goes 0 -> 1 along TRACK (points relative to the stadium).
export const RACE_FRAMES = 300; // the race runs over its scene, scaled to fit
export const FIN = RACE_FRAMES - 45; // the winner crosses the line here
export const TRACK = [[-1.6, 2.4, -1.45], [0.6, 2.1, -1.65], [1.65, 1.8, -0.95], [0.4, 1.5, -0.5], [-1.45, 1.22, -0.6], [-1.75, 0.95, 0.45],
  [-0.6, 0.66, 0.95], [0.95, 0.4, 0.62], [0.55, 0.13, 0.0], [-0.55, 0.09, 0.0]];

const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

function run(n, seed) {
  const r = rng(seed), C = [];
  for (let i = 0; i < n; i++) {
    const [w1, w2, f1, f2] = [0.02 + r() * 0.03, 0.05 + r() * 0.05, r() * 6.3, r() * 6.3], c = [0];
    for (let f = 1; f <= RACE_FRAMES; f++) c.push(c[f - 1] + 1 + 0.38 * Math.sin(f * w1 + f1) + 0.2 * Math.sin(f * w2 + f2));
    C.push(c);
  }
  const top = Math.max(...C.map((c) => c[FIN]));
  const p = C.map((c) => c.map((v) => Math.min(1, v / top)));
  const order = [...Array(n).keys()].sort((a, b) => p[b][FIN] - p[a][FIN]);
  const leader = (f) => order.reduce((best, i) => (p[i][f] > p[best][f] ? i : best), order[0]);
  let changes = 0; for (let f = 30; f <= FIN; f += 10) if (leader(f) !== leader(f - 10)) changes++;
  return {p, order, changes, gap: p[order[0]][FIN] - p[order[1]][FIN]};
}

// A seed near `from` that gives at least 3 lead changes and a close finish.
export function marbleRace(n, from = 1) {
  for (let s = from; s < from + 400; s++) { const x = run(n, s); if (x.changes >= 3 && x.gap < 0.03) return {seed: s, ...x}; }
  return {seed: from, ...run(n, from)};
}
