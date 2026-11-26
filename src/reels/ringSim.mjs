// "Last country standing" ring: flag balls bounce inside a circle. Every wall bounce ties a new line from the ball to that
// point. Touching a rival's line cuts it. A ball with no lines left is out. Pure and seeded, so every render is identical.
export const FPS = 30, CX = 540, CY = 930, R = 440, BR = 34;
export const TEAMS = [
  {id: 'us', name: 'USA', color: '#ff2d4a'},
  {id: 'cn', name: 'CHINA', color: '#ffd400'},
  {id: 'in', name: 'INDIA', color: '#ff8a1c'},
  {id: 'br', name: 'BRAZIL', color: '#2ee86b'},
  {id: 'jp', name: 'JAPAN', color: '#ff7ad9'},
  {id: 'de', name: 'GERMANY', color: '#4db2ff'},
];
export const WIN = 2; // India
const START = 40, MAXF = 44 * FPS, SUB = 4;

const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
  // lines all meet at their owner, so only a touch away from the owner counts as a cut
  return u * Math.sqrt(L) < BR * 2.6 ? 1e9 : Math.hypot(px - ax - u * dx, py - ay - u * dy);
};

export function simulate(seed) {
  const r = rng(seed), n = TEAMS.length;
  const balls = TEAMS.map((_, i) => {
    const a = (i / n) * 6.283 + r() * 0.4, d = R * (0.35 + r() * 0.3), va = r() * 6.283;
    const arc = r() * 6.283;
    return {x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, vx: Math.cos(va), vy: Math.sin(va), alive: true,
      lines: Array.from({length: START}, (_, k) => arc + k * 0.03)};
  });
  const frames = [], events = [];
  let end = -1;
  for (let f = 0; f < MAXF; f++) {
    const speed = (13 + f / FPS * 0.15) / SUB;
    for (let s = 0; s < SUB; s++) {
      for (const b of balls) if (b.alive) { b.x += b.vx * speed; b.y += b.vy * speed; }
      // wall bounces add a line
      balls.forEach((b, i) => {
        if (!b.alive) return;
        const dx = b.x - CX, dy = b.y - CY, d = Math.hypot(dx, dy);
        if (d > R - BR) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot > 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
          b.x = CX + nx * (R - BR); b.y = CY + ny * (R - BR);
          b.lines.push(Math.atan2(ny, nx));
          events.push({t: (f + s / SUB) / FPS, type: 'bounce', i});
        }
      });
      // ball-ball elastic bounce
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = balls[i], b = balls[j];
        if (!a.alive || !b.alive) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < BR * 2 && d > 0) {
          const nx = dx / d, ny = dy / d, rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel > 0) { a.vx -= rel * nx; a.vy -= rel * ny; b.vx += rel * nx; b.vy += rel * ny; events.push({t: (f + s / SUB) / FPS, type: 'clash', i}); }
          const push = (BR * 2 - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        }
      }
      // cut rival lines the ball touches
      if (f > FPS * 1.2) balls.forEach((b, i) => {
        if (!b.alive) return;
        balls.forEach((o, j) => {
          if (j === i || !o.alive) return;
          const before = o.lines.length;
          o.lines = o.lines.filter((ang) => segDist(b.x, b.y, o.x, o.y, CX + Math.cos(ang) * R, CY + Math.sin(ang) * R) > BR * 0.7);
          if (o.lines.length < before) events.push({t: (f + s / SUB) / FPS, type: 'cut', i: j, by: i, k: before - o.lines.length});
          if (!o.lines.length) { o.alive = false; events.push({t: (f + s / SUB) / FPS, type: 'out', i: j, by: i}); }
        });
      });
    }
    frames.push(balls.map((b) => ({x: b.x, y: b.y, alive: b.alive, lines: b.alive ? b.lines.slice() : []})));
    if (end < 0 && balls.filter((b) => b.alive).length === 1) end = f;
    if (end >= 0 && f >= end + 4 * FPS) break;
  }
  const winner = balls.findIndex((b) => b.alive);
  return {frames, events, end, winner: balls.filter((b) => b.alive).length === 1 ? winner : -1};
}

// The seed is picked once (scripts below) so India wins in a watchable time; keep it fixed here.
export const SEED = 2029;
