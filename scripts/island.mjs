// Writes each day's Neelville episode from the island's state, so this series needs no weekly writer.
// State lives in data/island.json: {day, houses, specials: [{type, day}], vote: {a, b}, votes: {a, b} (counted comments, or empty)}.
export const BUILDS = ['lighthouse', 'windmill', 'factory', 'fountain', 'tower', 'stadium'];
const NAMES = {lighthouse: 'lighthouse', windmill: 'windmill', factory: 'robot factory', fountain: 'fountain', tower: 'skyscraper', stadium: 'stadium'};
const HASHTAGS = '#3danimation #buildinpublic #robots #followtrain #satisfying';

export function episode(state, followers) {
  const day = (state.day ?? 0) + 1, old = state.houses ?? 0, pop = Math.max(followers, 0), added = Math.max(0, pop - old);
  const v = state.vote, counted = v && state.votes && state.votes.a + state.votes.b > 0;
  const building = v ? (counted && state.votes.b > state.votes.a ? v.b : v.a) : null;
  const used = new Set([...(state.specials ?? []).map((s) => s.type), building]);
  const left = BUILDS.filter((b) => !used.has(b)), pool = left.length >= 2 ? left : BUILDS.filter((b) => b !== building);
  const vote = {a: pool[day % pool.length], b: pool[(day + 1) % pool.length]};
  const hooks = day === 1
    ? [`This island is empty. Every person who follows me gets a house on it.`, 'empty']
    : added ? [[`Day ${day}. ${added} new ${added === 1 ? 'person' : 'people'} moved to Neelville overnight.`, 'new'], [`The robots worked all night. This is Neelville on day ${day}.`, 'robots'],
       [`If you followed me yesterday, your house is on this island.`, 'house']][day % 3]
      : [`Day ${day} on the island. Nobody new moved in, so the robots got creative.`, 'creative'];
  const S = [{vo: hooks[0], key: hooks[1], shot: day === 1 ? 'top' : 'wide', part: 'hook'}];
  if (day === 1) S.push({vo: 'Little robots build every house. One for each follower.', key: 'robots', shot: 'close'});
  if (building) S.push({vo: counted ? `You voted for a ${NAMES[building]}. The robots built it.` : `Yesterday's build: a ${NAMES[building]}.`, key: NAMES[building].split(' ').pop(), shot: 'build', part: 'drop', fx: ['win']});
  S.push(day === 1
    ? {vo: `I already have ${pop} followers, so today the robots build ${pop} houses.`, key: 'houses', shot: 'houses', part: 'rise'}
    : added
    ? {vo: `${added} new ${added === 1 ? 'follower' : 'followers'}, so ${added} new ${added === 1 ? 'house' : 'houses'}.`, key: 'houses', shot: 'houses', part: 'rise'}
    : {vo: 'No new followers yesterday. The robots are bored.', key: 'bored', shot: 'close'});
  S.push({vo: `Neelville now has ${pop} ${pop === 1 ? 'home' : 'homes'}.`, key: String(pop), shot: 'top', part: 'drop2'});
  S.push({vo: `What should the robots build next? Comment A for a ${NAMES[vote.a]}, or B for a ${NAMES[vote.b]}.`, key: 'next', shot: 'vote', part: 'break'});
  S.push({vo: 'Follow, and tomorrow the robots build your house.', key: 'house', shot: 'wide', part: 'outro', cta: true});
  const caption = `Comment A or B: what do the robots build next? 🏝\n\nDay ${day} of Neelville. Every person who follows me gets a house on this island, built by tiny robots. `
    + `${added ? `${added} moved in since yesterday.` : 'Nobody new moved in yesterday.'} Population: ${pop}.\n\nFollow and your house goes up tomorrow.\n\n${HASHTAGS}`;
  return {
    script: {style: 'island', topic: `neelville day ${day}`, hook: S[0].vo, caption,
      props: {music: 'lofi', narrator: 'am_adam', day, population: pop, oldHouses: Math.min(old, pop), specials: state.specials ?? [], building, vote: {a: NAMES[vote.a], b: NAMES[vote.b]}, scenes: S}},
    next: {day, houses: pop, specials: [...(state.specials ?? []), ...(building ? [{type: building, day}] : [])], vote, votes: {}},
  };
}
