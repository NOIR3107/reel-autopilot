// Writes each day's Neelville episode from the island's state, so this series needs no weekly writer.
// data/island.json: {day, houses, specials: [{type, day}], requests: [{user, items: ['pool', ...], business, custom: 'gold3', statue: 'FLAG TEXT', say: 'what the voice says they asked for', built?: day}]}
// Neel adds requests (what followers commented: things on their lot, the business they want); up to 3 get built per episode.
import {marbleRace} from '../src/reels/marbleSim.mjs';

export const BUILDS = ['stadium', 'burger', 'icecream', 'skatepark', 'windmill', 'lighthouse', 'factory', 'tower', 'stadium'];
const SURPRISES = ['stadium']; // kept secret until the episode that unlocks it
const NAMES = {themepark: 'mini theme park', burger: 'burger joint', icecream: 'ice cream shop', skatepark: 'skate park', lighthouse: 'lighthouse', windmill: 'windmill', factory: 'robot factory', tower: 'skyscraper', stadium: 'stadium'};
// SEO keywords, not hashtags: Instagram search reads caption words.
const KEYWORDS = '3D animation, robots building a city, satisfying build timelapse, city builder game, a house for every follower.';
const PER_EPISODE = 5; // requests built per episode (each adds ~6s of timelapse)
export const STEP = 20; // every 20 followers past launch unlock the next amenity, in BUILDS order
const spoken = (u) => u.replace(/^@/, '').replace(/[._\d]+/g, ' ').trim() || 'someone';
const list = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
const withA = (t) => (/^[aeiou]/i.test(t) ? 'an ' : 'a ') + t;

export function episode(state, followers) {
  const day = (state.day ?? 0) + 1, old = state.houses ?? 0, pop = Math.max(followers, 0), added = Math.max(0, pop - old);
  const requests = state.requests ?? [];
  const built = requests.filter((r) => r.built), has = new Set(built.map((r) => r.user));
  // No repeats: one lot per follower, so a second request from someone who already has one is skipped.
  // extra: a one-time second lot Neel approved himself (e.g. tanishq's amusement park).
  const fresh = requests.filter((r) => !r.built && (r.extra || (!has.has(r.user) && has.add(r.user)))).slice(0, PER_EPISODE);
  // Upgrade: a one-off rebuild Neel grants on an existing lot ({upgrade: {say, ...changes}}). It keeps its spot.
  const upgrades = built.filter((r) => r.upgrade && !r.upgrade.built);
  const lots = [...built.map((r) => (upgrades.includes(r) ? {...r, ...r.upgrade, fresh: true} : r)), ...fresh.map((r) => ({...r, fresh: true}))];
  // More followers, more amenities: one unlocks for every STEP followers gained since launch (one per episode).
  const base = state.base ?? pop, have = state.specials ?? [];
  const unlocked = Math.min(BUILDS.length, Math.floor(Math.max(0, pop - base) / STEP));
  // The stadium is the 40-follower surprise (it comes out of a gift box); the later 'stadium' in the list is dropped.
  const order = BUILDS.filter((b, i, a) => a.indexOf(b) === i);
  const building = have.length < unlocked ? order[have.length] : null;
  const n = have.length + (building ? 1 : 0), nextAmenity = order[n] ? (SURPRISES.includes(order[n]) ? 'a surprise 🎁' : NAMES[order[n]]) : null, nextAt = base + (n + 1) * STEP;

  const hook = day === 1 ? ['This island is empty. Every person who follows me gets a house on it.', 'empty']
    : fresh.length || upgrades.length ? [`Day ${day}. You told me what you wanted on your lot. The robots built it.`, 'built']
    : added ? [`Day ${day}. ${added} new ${added === 1 ? 'person' : 'people'} moved to Neelville overnight.`, 'new']
    : [`Day ${day} on the island. The robots got creative.`, 'creative'];
  const S = [{vo: hook[0], key: hook[1], shot: day === 1 ? 'top' : 'wide', part: 'hook'}];
  if (day === 1) S.push({vo: 'Little robots build every house. One for each follower.', key: 'robots', shot: 'close'});
  upgrades.forEach((r) => S.push({vo: `${spoken(r.user)} ${r.upgrade.say}`, key: 'Done', shot: 'lot', lot: built.indexOf(r), far: 2.4, part: 'drop', fx: ['win'], hold: 3.5}));
  fresh.forEach((r, k) => {
    const wants = [...(r.items ?? []).map(withA), ...(r.business ? [`their own ${r.business}`] : [])];
    S.push({vo: r.say ? `${spoken(r.user)} asked for ${r.say}. Done.` : wants.length ? `${spoken(r.user)} asked for ${list(wants)}. Done.` : `Welcome to Neelville, ${spoken(r.user)}. This one's yours.`, key: 'Done', shot: 'lot', lot: built.length + k, far: {black10: 1.6, skyscraper: 2.1, techtower: 1.9}[r.custom], part: 'drop', fx: ['win'], hold: 3.5}); // hold: seconds of timelapse after the line
  });
  if (building) S.push(SURPRISES.includes(building)
    ? {vo: `${base + n * STEP} followers! Time for the surprise. It's a stadium! Comment RACE, and you'll race in it next time.`, key: 'stadium', shot: 'build', part: 'drop', fx: ['win'], hold: 2.5}
    : {vo: `${base + n * STEP} followers unlocked ${withA(NAMES[building])}!`, key: NAMES[building].split(' ').pop(), shot: 'build', part: 'drop', fx: ['win']});
  S.push(day === 1
    ? {vo: `I already have ${pop} followers, so today the robots build ${pop} houses.`, key: 'houses', shot: 'houses', part: 'rise'}
    : added ? {vo: `${added} new ${added === 1 ? 'follower' : 'followers'}, so ${added} new ${added === 1 ? 'house' : 'houses'}.`, key: 'houses', shot: 'houses', part: 'rise'}
    : {vo: 'No new followers yesterday. The robots are bored.', key: 'bored', shot: 'close'});
  S.push(nextAmenity ? {vo: nextAmenity.startsWith('a surprise') ? `At ${nextAt} followers, a surprise lands on Neelville.` : `At ${nextAt} followers, Neelville gets ${withA(nextAmenity)}.`, key: String(nextAt), shot: 'top', part: 'drop2'}
    : {vo: `Neelville now has ${pop} ${pop === 1 ? 'home' : 'homes'}.`, key: String(pop), shot: 'top', part: 'drop2'});
  // Stadium marble race: up to 8 people who commented RACE (Neel forwards them into state.racers).
  const stadium = have.some((h) => h.type === 'stadium'), racers = stadium ? (state.racers ?? []).slice(0, 8) : [];
  const race = racers.length >= 2 ? {racers, seed: marbleRace(racers.length, day * 7).seed} : null;
  const winner = race ? racers[marbleRace(racers.length, race.seed).order[0]] : null;
  if (race) S.push({vo: `Race day in the stadium! ${racers.length} marbles, ${racers.length} of you who commented race.`, key: 'Race', shot: 'race', hold: 7},
    {vo: `${spoken(winner)} wins it! Comment race to get in the next one.`, key: 'wins', shot: 'racewin', part: 'drop', fx: ['win']});
  const preview = pop < 100 ? 100 : 300;
  S.push({vo: `At ${preview} followers, Neelville will look like this.`, key: 'this', shot: 'wide', preview});
  S.push({vo: 'This empty plot is waiting for you.', key: 'you', shot: 'empty'});
  S.push({vo: stadium || building === 'stadium' ? 'Follow, then comment what you want on your lot, or comment race to race in the stadium.' : 'Follow, then comment what you want on your lot, and the business you want to own.', key: stadium || building === 'stadium' ? 'race' : 'business', shot: 'wide', part: 'outro', cta: true});

  const done = fresh.map((r) => `@${r.user.replace(/^@/, '')}`);
  const caption = `Comment what you want on your lot 🏡 and the business you want to own 🏪\n\nDay ${day} of Neelville. Every person who follows me gets a house on this island, built by tiny robots. `
    + `${done.length ? `Built today: ${list(done)}'s requests.` : added ? `${added} moved in since yesterday.` : 'Nobody new moved in yesterday.'} Population: ${pop}.${nextAmenity ? (nextAmenity.startsWith('a surprise') ? ` At ${nextAt} followers something big lands on the island 🎁` : ` At ${nextAt} followers the island gets ${withA(nextAmenity)}.`) : ''}\n\n`
    + `Follow, comment your wish, and the robots build it.${stadium || building === 'stadium' ? ' Comment RACE to race in the stadium 🏁' : ''}\n\n${state.note ? state.note + '\n\n' : ''}${state.keywords ?? KEYWORDS}`;
  return {
    script: {style: 'island', topic: `neelville day ${day}`, hook: S[0].vo, caption,
      props: {music: 'lofi', narrator: 'am_adam', day, population: pop, oldHouses: Math.min(old, pop), specials: state.specials ?? [], building, race, lots, nextAt: nextAmenity && nextAt, nextAmenity, scenes: S}},
    next: {...state, racers: (state.racers ?? []).filter((u) => !racers.includes(u)), races: [...(state.races ?? []), ...(race ? [{day, racers, winner}] : [])], note: undefined, keywords: undefined, day, houses: pop, base, specials: [...(state.specials ?? []), ...(building ? [{type: building, day}] : [])],
      requests: requests.map((r) => (fresh.includes(r) ? {...r, built: day} : upgrades.includes(r) ? {...r, ...r.upgrade, upgrade: {...r.upgrade, built: day}} : r))},
  };
}
