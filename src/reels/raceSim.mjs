// Escape the Ring: balls bounce inside spinning rings, each ring has a gap. The first ball through the gap breaks
// that ring and everyone moves out to the next one. Whoever breaks the last ring wins.
// Pure and seeded: scripts/race.mjs runs it once and stores every frame, so the render never re-simulates.
export const W = 1080, CX = 540, CY = 1010, BALL = 34, FPS = 30;
export const RINGS = [190, 265, 340, 415, 490];
const GAP = 0.25, SPEED = 15, GRAV = 0.42, SUB = 4;

const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const ringAngle = (k, f, seed) => ((seed % 7) + k * 1.9) + (k % 2 ? -1 : 1) * (0.022 + 0.006 * k) * f;
export const GAP_HALF = GAP;
// The last second before the winning escape plays 3x slower, so output frames and sim frames differ after SLOW_AT.
export const SLOW = 3, slowAt = (end) => end - 30;
export const toSim = (f, end) => (f < slowAt(end) ? f : slowAt(end) + (f - slowAt(end)) / SLOW);
export const toOut = (fr, end) => (fr < slowAt(end) ? fr : slowAt(end) + (fr - slowAt(end)) * SLOW);
export const raceLen = (end) => toOut(end, end);

// -> {frames: [[x, y] per ball per frame], breaks: [{frame, ring, by}], bounces: [frame...], winner, end}
export function simulate(n, seed, maxSec = 70) {
  const r = rng(seed), balls = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = 70 + r() * 50, s = r() * Math.PI * 2;
    balls.push({x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, vx: Math.cos(s) * SPEED, vy: Math.sin(s) * SPEED});
  }
  let ring = 0;
  const frames = [], breaks = [], bounces = [], close = [];
  for (let f = 0; f < maxSec * FPS && ring < RINGS.length; f++) {
    for (let s = 0; s < SUB && ring < RINGS.length; s++) {
      for (const b of balls) { b.vy += GRAV / SUB; b.x += b.vx / SUB; b.y += b.vy / SUB; }
      // ball vs ball: equal masses, swap the normal parts of the velocity
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const A = balls[i], B = balls[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < BALL * 2) {
          const nx = dx / d, ny = dy / d, o = (BALL * 2 - d) / 2;
          A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
          const p = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (p < 0) { A.vx += p * nx; A.vy += p * ny; B.vx -= p * nx; B.vy -= p * ny; }
        }
      }
      const R = RINGS[ring], rot = ringAngle(ring, f + s / SUB, seed);
      for (let i = 0; i < n; i++) {
        const b = balls[i], dx = b.x - CX, dy = b.y - CY, d = Math.hypot(dx, dy);
        if (d + BALL < R) continue;
        const inGap = Math.abs(wrap(Math.atan2(dy, dx) - rot)) < GAP - BALL / R;
        if (inGap) { if (d > R) { breaks.push({frame: f, ring, by: i}); ring++; break; } continue; }
        const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
        const miss = Math.abs(wrap(Math.atan2(dy, dx) - rot)) - GAP;
        if (vn > 0 && miss < 0.1 && f - (close.at(-1)?.frame ?? -99) > 60) close.push({frame: f, by: i}); // "so close"
        if (vn > 0) {
          b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny;
          const k = SPEED * (0.92 + r() * 0.16) / Math.hypot(b.vx, b.vy); b.vx *= k; b.vy *= k; // keep them lively
          if (bounces.at(-1) !== f) bounces.push(f);
        }
        b.x = CX + nx * (R - BALL); b.y = CY + ny * (R - BALL);
      }
    }
    frames.push(balls.map((b) => [Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10]));
  }
  const last = breaks.at(-1);
  return {frames, breaks, bounces, close, winner: ring === RINGS.length ? last.by : null, end: frames.length};
}

// Seeds are tried in order until a race lasts a watchable 22-40 seconds.
export function pickRace(n, from = 1) {
  for (let seed = from; seed < from + 500; seed++) {
    const s = simulate(n, seed, 42);
    if (s.winner != null && s.end > 22 * FPS && s.end < 40 * FPS && s.breaks.every((b, k) => b.frame - (k ? s.breaks[k - 1].frame : 0) > 3 * FPS)) return {seed, ...s};
  }
  throw new Error('no watchable race found');
}
