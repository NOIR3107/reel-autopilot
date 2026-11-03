// Writes each day's Neelville episode from the island's state, so this series needs no weekly writer.
// data/island.json: {day, houses, specials: [{type, day}], requests: [{user, items: ['pool', ...], business, built?: day}]}
// Neel adds requests (what followers commented: things on their lot, the business they want); up to 3 get built per episode.
export const BUILDS = ['burger', 'icecream', 'skatepark', 'windmill', 'lighthouse', 'factory', 'tower', 'stadium'];
const NAMES = {burger: 'burger joint', icecream: 'ice cream shop', skatepark: 'skate park', lighthouse: 'lighthouse', windmill: 'windmill', factory: 'robot factory', tower: 'skyscraper', stadium: 'stadium'};
const HASHTAGS = '#3danimation #buildinpublic #robots #followtrain #satisfying';
const PER_EPISODE = 3;
export const STEP = 20; // every 20 followers past launch unlock the next amenity, in BUILDS order
const spoken = (u) => u.replace(/^@/, '').replace(/[._\d]+/g, ' ').trim() || 'someone';
const list = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
const withA = (t) => (/^[aeiou]/i.test(t) ? 'an ' : 'a ') + t;

export function episode(state, followers) {
  const day = (state.day ?? 0) + 1, old = state.houses ?? 0, pop = Math.max(followers, 0), added = Math.max(0, pop - old);
  const requests = state.requests ?? [];
  const built = requests.filter((r) => r.built), fresh = requests.filter((r) => !r.built).slice(0, PER_EPISODE);
  const lots = [...built, ...fresh.map((r) => ({...r, fresh: true}))];
  // More followers, more amenities: one unlocks for every STEP followers gained since launch (one per episode).
  const base = state.base ?? pop, have = state.specials ?? [];
  const unlocked = Math.min(BUILDS.length, Math.floor(Math.max(0, pop - base) / STEP));
  const building = have.length < unlocked ? BUILDS[have.length] : null;
  const n = have.length + (building ? 1 : 0), nextAmenity = BUILDS[n] ? NAMES[BUILDS[n]] : null, nextAt = base + (n + 1) * STEP;

  const hook = day === 1 ? ['This island is empty. Every person who follows me gets a house on it.', 'empty']
    : fresh.length ? [`Day ${day}. You told me what you wanted on your lot. The robots built it.`, 'built']
    : added ? [`Day ${day}. ${added} new ${added === 1 ? 'person' : 'people'} moved to Neelville overnight.`, 'new']
    : [`Day ${day} on the island. The robots got creative.`, 'creative'];
  const S = [{vo: hook[0], key: hook[1], shot: day === 1 ? 'top' : 'wide', part: 'hook'}];
  if (day === 1) S.push({vo: 'Little robots build every house. One for each follower.', key: 'robots', shot: 'close'});
  fresh.forEach((r, k) => {
    const wants = [...(r.items ?? []).map(withA), ...(r.business ? [`their own ${r.business}`] : [])];
    S.push({vo: `${spoken(r.user)} asked for ${list(wants)}. Done.`, key: 'Done', shot: 'lot', lot: built.length + k, part: k ? 'drop' : 'drop', fx: ['win']});
  });
  if (building) S.push({vo: `${base + n * STEP} followers unlocked ${withA(NAMES[building])}!`, key: NAMES[building].split(' ').pop(), shot: 'build', part: 'drop', fx: ['win']});
  S.push(day === 1
    ? {vo: `I already have ${pop} followers, so today the robots build ${pop} houses.`, key: 'houses', shot: 'houses', part: 'rise'}
    : added ? {vo: `${added} new ${added === 1 ? 'follower' : 'followers'}, so ${added} new ${added === 1 ? 'house' : 'houses'}.`, key: 'houses', shot: 'houses', part: 'rise'}
    : {vo: 'No new followers yesterday. The robots are bored.', key: 'bored', shot: 'close'});
  S.push(nextAmenity ? {vo: `At ${nextAt} followers, Neelville gets ${withA(nextAmenity)}.`, key: String(nextAt), shot: 'top', part: 'drop2'}
    : {vo: `Neelville now has ${pop} ${pop === 1 ? 'home' : 'homes'}.`, key: String(pop), shot: 'top', part: 'drop2'});
  const preview = pop < 100 ? 100 : 300;
  S.push({vo: `At ${preview} followers, Neelville will look like this.`, key: 'this', shot: 'wide', preview});
  S.push({vo: 'This empty plot is waiting for you.', key: 'you', shot: 'empty'});
  S.push({vo: 'Follow, then comment what you want on your lot, and the business you want to own.', key: 'business', shot: 'wide', part: 'outro', cta: true});

  const done = fresh.map((r) => `@${r.user.replace(/^@/, '')}`);
  const caption = `Comment what you want on your lot 🏡 and the business you want to own 🏪\n\nDay ${day} of Neelville. Every person who follows me gets a house on this island, built by tiny robots. `
    + `${done.length ? `Built today: ${list(done)}'s requests.` : added ? `${added} moved in since yesterday.` : 'Nobody new moved in yesterday.'} Population: ${pop}.${nextAmenity ? ` At ${nextAt} followers the island gets ${withA(nextAmenity)}.` : ''}\n\n`
    + `Follow, comment your wish, and the robots build it.\n\n${HASHTAGS}`;
  return {
    script: {style: 'island', topic: `neelville day ${day}`, hook: S[0].vo, caption,
      props: {music: 'lofi', narrator: 'am_adam', day, population: pop, oldHouses: Math.min(old, pop), specials: state.specials ?? [], building, lots, nextAt: nextAmenity && nextAt, nextAmenity, scenes: S}},
    next: {...state, day, houses: pop, base, specials: [...(state.specials ?? []), ...(building ? [{type: building, day}] : [])],
      requests: requests.map((r) => (fresh.includes(r) ? {...r, built: day} : r))},
  };
}
