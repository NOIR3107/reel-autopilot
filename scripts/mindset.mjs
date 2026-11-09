// The morning mindset reel: the next unposted episode from data/mindset.json, read slowly in a calm voice.
export function mindset(state = {}) {
  const ep = state.episodes?.[state.next ?? 0];
  if (!ep) return null; // all used up: the race takes the morning until more are written
  const scenes = ep.scenes.map((s, i) => ({...s, voice: 'am_michael', speed: 0.92, hold: i === ep.scenes.length - 1 ? 1 : 0.6, part: i ? 'drop' : 'hook'}));
  return {
    script: {
      style: 'mindset', topic: `mindset: ${ep.title}`, hook: ep.scenes[0].vo,
      caption: `${ep.title} 🕯️\n\n${ep.scenes.slice(0, -1).map((s) => s.vo).join(' ')}\n\nIf this hit, ${ep.ask}\n\n`
        + 'Daily motivation, discipline, self improvement, stickman animation, mindset.',
      props: {music: 'lofi', scenes},
    },
    next: {...state, next: (state.next ?? 0) + 1},
  };
}
