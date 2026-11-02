// Writes each day's Neelville episode from the island's state, so this series needs no weekly writer.
// data/island.json: {day, houses, specials: [{type, day}], requests: [{user, items: ['pool', ...], business, built?: day}]}
// Neel adds requests (what followers commented: things on their lot, the business they want); up to 3 get built per episode.
export const BUILDS = ['lighthouse', 'windmill', 'factory', 'fountain', 'tower', 'stadium'];
const NAMES = {lighthouse: 'lighthouse', windmill: 'windmill', factory: 'robot factory', fountain: 'fountain', tower: 'skyscraper', stadium: 'stadium'};
const HASHTAGS = '#3danimation #buildinpublic #robots #followtrain #satisfying';
const PER_EPISODE = 3;
const spoken = (u) => u.replace(/^@/, '').replace(/[._\d]+/g, ' ').trim() || 'someone';
const list = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
const withA = (t) => (/^[aeiou]/i.test(t) ? 'an ' : 'a ') + t;

export function episode(state, followers) {
  const day = (state.day ?? 0) + 1, old = state.houses ?? 0, pop = Math.max(followers, 0), added = Math.max(0, pop - old);
  const requests = state.requests ?? [];
  const built = requests.filter((r) => r.built), fresh = requests.filter((r) => !r.built).slice(0, PER_EPISODE);
  const lots = [...built, ...fresh.map((r) => ({...r, fresh: true}))];
  // With nobody's request to build, the robots add a landmark so every episode shows something new.
  const used = new Set((state.specials ?? []).map((s) => s.type));
  const building = fresh.length ? null : BUILDS.find((b) => !used.has(b)) ?? null;

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
  if (building) S.push({vo: `The robots added ${withA(NAMES[building])}.`, key: NAMES[building].split(' ').pop(), shot: 'build', part: 'drop', fx: ['win']});
  S.push(day === 1
    ? {vo: `I already have ${pop} followers, so today the robots build ${pop} houses.`, key: 'houses', shot: 'houses', part: 'rise'}
    : added ? {vo: `${added} new ${added === 1 ? 'follower' : 'followers'}, so ${added} new ${added === 1 ? 'house' : 'houses'}.`, key: 'houses', shot: 'houses', part: 'rise'}
    : {vo: 'No new followers yesterday. The robots are bored.', key: 'bored', shot: 'close'});
  S.push({vo: `Neelville now has ${pop} ${pop === 1 ? 'home' : 'homes'}.`, key: String(pop), shot: 'top', part: 'drop2'});
  S.push({vo: 'Follow, then comment what you want on your lot, and the business you want to own.', key: 'business', shot: 'wide', part: 'outro', cta: true});

  const done = fresh.map((r) => `@${r.user.replace(/^@/, '')}`);
  const caption = `Comment what you want on your lot 🏡 and the business you want to own 🏪\n\nDay ${day} of Neelville. Every person who follows me gets a house on this island, built by tiny robots. `
    + `${done.length ? `Built today: ${list(done)}'s requests.` : added ? `${added} moved in since yesterday.` : 'Nobody new moved in yesterday.'} Population: ${pop}.\n\n`
    + `Follow, comment your wish, and the robots build it.\n\n${HASHTAGS}`;
  return {
    script: {style: 'island', topic: `neelville day ${day}`, hook: S[0].vo, caption,
      props: {music: 'lofi', narrator: 'am_adam', day, population: pop, oldHouses: Math.min(old, pop), specials: state.specials ?? [], building, lots, scenes: S}},
    next: {...state, day, houses: pop, specials: [...(state.specials ?? []), ...(building ? [{type: building, day}] : [])],
      requests: requests.map((r) => (fresh.includes(r) ? {...r, built: day} : r))},
  };
}
