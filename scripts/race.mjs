// Writes the morning "Escape the Ring" race from data/race.json: 8 countries, follower requests first.
import {pickRace} from '../src/reels/raceSim.mjs';

// Flag emoji and a colour from each flag. Names only: no crests, no logos.
export const COUNTRIES = [
  ['USA', 'US', '#3c3b6e'], ['India', 'IN', '#ff9933'], ['Brazil', 'BR', '#009c3b'], ['Mexico', 'MX', '#006847'], ['UK', 'GB', '#c8102e'],
  ['Canada', 'CA', '#d80621'], ['Germany', 'DE', '#ffce00'], ['France', 'FR', '#0055a4'], ['Japan', 'JP', '#bc002d'], ['Argentina', 'AR', '#74acdf'],
  ['Italy', 'IT', '#009246'], ['Spain', 'ES', '#aa151b'], ['Philippines', 'PH', '#0038a8'], ['Nigeria', 'NG', '#008751'], ['South Korea', 'KR', '#cd2e3a'],
  ['Portugal', 'PT', '#006600'], ['Australia', 'AU', '#012169'], ['Turkey', 'TR', '#e30a17'], ['Egypt', 'EG', '#ce1126'], ['Pakistan', 'PK', '#01411c'],
  ['Indonesia', 'ID', '#ff0000'], ['Netherlands', 'NL', '#ae1c28'], ['Colombia', 'CO', '#fcd116'], ['Morocco', 'MA', '#c1272d'], ['Saudi Arabia', 'SA', '#006c35'],
  ['Poland', 'PL', '#dc143c'], ['Sweden', 'SE', '#006aa7'], ['Ireland', 'IE', '#169b62'], ['Greece', 'GR', '#0d5eaf'], ['Jamaica', 'JM', '#009b3a'],
  ['South Africa', 'ZA', '#007a4d'], ['Vietnam', 'VN', '#da251d'], ['Nepal', 'NP', '#dc143c'], ['Bangladesh', 'BD', '#006a4e'], ['Ukraine', 'UA', '#0057b7'],
  ['Chile', 'CL', '#d52b1e'], ['Peru', 'PE', '#d91023'], ['Kenya', 'KE', '#006600'], ['Norway', 'NO', '#ba0c2f'], ['New Zealand', 'NZ', '#00247d'],
].map(([name, iso, color]) => ({name, code: iso, color, flag: String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)))}));
export const PER_RACE = 8;

const find = (q) => COUNTRIES.find((c) => [c.name, c.code].some((v) => v.toLowerCase() === String(q).trim().toLowerCase()));

export function race(state = {}) {
  const n = (state.race ?? 0) + 1, requests = state.requests ?? [];
  const picked = [];
  for (const r of requests) { const c = find(r.country); if (c && !picked.includes(c) && picked.length < PER_RACE) picked.push(c); }
  for (let k = 0; picked.length < PER_RACE; k++) { const c = COUNTRIES[((n - 1) * 5 + k) % COUNTRIES.length]; if (!picked.includes(c)) picked.push(c); }
  // shuffle by race number so the requested ones don't always start in the same spots
  const order = picked.map((c, i) => [((i + 1) * 2654435761 * n) % 1000, c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const sim = pickRace(PER_RACE, (state.seed ?? 0) + 1), W = order[sim.winner];
  const asked = requests.filter((r) => order.some((c) => c === find(r.country))).map((r) => r.user).filter(Boolean);
  return {
    script: {
      style: 'race', topic: `ring race ${n}`, hook: 'Which country escapes first?',
      caption: `Which country escapes the ring first? 🌍 Pick yours before it ends 👀\n\n`
        + `Race #${n}: ${order.map((c) => c.flag).join(' ')}${asked.length ? `\nRequested by ${asked.map((u) => '@' + u).join(', ')}.` : ''}\n\n`
        + `Comment your country and it races next.\n\nBall race, escape the ring, satisfying physics simulation, country battle, which country wins.`,
      props: {countries: order, seed: sim.seed, frames: sim.frames, breaks: sim.breaks, bounces: sim.bounces, close: sim.close, winner: sim.winner, end: sim.end},
    },
    next: {...state, race: n, seed: sim.seed, wins: {...state.wins, [W.name]: (state.wins?.[W.name] ?? 0) + 1},
      requests: requests.filter((r) => !order.includes(find(r.country)))},
  };
}
