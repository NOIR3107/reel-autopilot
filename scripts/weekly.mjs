// Runs every Saturday: renew the Instagram key, pull stats, summarize what works, report, tidy up.
// The Sunday Claude session reads data/insights.json to plan next week and update rules.md.
import fs from 'node:fs';
import {ROOT, SLOTS, eastern, daysBetween, loadState, loadPosts, write, sh, gitCommit, ig} from './lib.mjs';

const MIN_REELS = 10; // no learning before this many reels have stats
const METRICS = ['views', 'reach', 'likes', 'comments', 'shares', 'saved', 'ig_reels_avg_watch_time'];

// Percentile rank of each value within the list, 0 (worst) to 1 (best).
export const ranks = (xs) => xs.map((x) => (xs.length < 2 ? 0.5 : xs.filter((y) => y < x).length / (xs.length - 1)));

export function score(posts) {
  const eng = posts.map((p) => (3 * p.stats.shares + 2 * p.stats.saved + 2 * p.stats.comments + p.stats.likes) / Math.max(p.stats.reach, 1));
  const watch = posts.map((p) => (p.stats.ig_reels_avg_watch_time ?? 0) / 1000 / (p.seconds || 25));
  const [re, rw] = [ranks(eng), ranks(watch)];
  posts.forEach((p, i) => (p.score = Math.round((re[i] + rw[i]) * 50)));
}

// Average score per group (style, trade, hook formula, slot), best first. Groups with one reel are listed but flagged.
export function groupMeans(posts, key) {
  const groups = {};
  for (const p of posts) (groups[p[key]] ??= []).push(p.score);
  return Object.entries(groups).map(([k, s]) => ({[key]: k, score: Math.round(s.reduce((a, b) => a + b, 0) / s.length), reels: s.length}))
    .sort((a, b) => b.score - a.score);
}

export function bestSlot(posts) {
  const r = ranks(posts.map((p) => p.stats.reach));
  const by = SLOTS.map((s) => {
    const xs = posts.map((p, i) => (p.slot === s ? r[i] : null)).filter((x) => x !== null);
    return [s, xs.length >= 2 ? xs.reduce((a, b) => a + b, 0) / xs.length : -1];
  }).sort((a, b) => b[1] - a[1]);
  return by[0][1] < 0 ? null : by[0][0];
}

async function stats(id) {
  let res;
  try { res = await ig(`/${id}/insights`, {params: {metric: METRICS.join(',')}}); }
  catch { res = await ig(`/${id}/insights`, {params: {metric: METRICS.filter((m) => m !== 'views').join(',')}}); }
  return Object.fromEntries(res.data.map((m) => [m.name, m.values?.[0]?.value ?? m.total_value?.value ?? 0]));
}

async function main() {
  const today = eastern().date;
  const state = loadState();
  const posts = loadPosts();
  const changes = [];

  // 1. Renew the Instagram key (it dies after 60 days without this) and save it back as a repo secret.
  try {
    const fresh = await ig('https://graph.instagram.com/refresh_access_token', {params: {grant_type: 'ig_refresh_token'}});
    sh('gh', ['secret', 'set', 'IG_TOKEN'], {input: fresh.access_token, env: {...process.env, GH_TOKEN: process.env.GH_PAT}});
  } catch (e) {
    changes.push(`⚠️ Could not renew the Instagram key (${e.message.slice(0, 200)}). It expires 60 days after it was last renewed. Fix this before then.`);
  }

  // 2. Stats for every reel that has been live 2+ days, within the last 60 days.
  const live = posts.filter((p) => p.status === 'posted' && daysBetween(p.date, today) >= 2 && daysBetween(p.date, today) <= 60);
  for (const p of live) p.stats = await stats(p.media_id);
  const {followers_count} = await ig('/me', {params: {fields: 'followers_count'}});
  const prev = state.followers.at(-1)?.count;
  state.followers.push({date: today, count: followers_count});

  // 3. Summarize, once there is enough data.
  if (live.length >= MIN_REELS) {
    score(live);
    const pick = (p) => ({date: p.date, style: p.style, trade: p.trade, hook: p.hook, score: p.score, stats: p.stats});
    const sorted = [...live].sort((a, b) => b.score - a.score);
    write('data/insights.json', {updated: today, reels: live.length, by_style: groupMeans(live, 'style'), by_trade: groupMeans(live, 'trade'),
      by_formula: groupMeans(live, 'formula'), by_slot: groupMeans(live, 'slot'), best: sorted.slice(0, 3).map(pick), worst: sorted.slice(-3).map(pick)});
    const due = state.locked_slot ? daysBetween(state.locked_on, today) >= 28 : daysBetween(state.start, today) >= 14;
    const slot = due && bestSlot(live.filter((p) => daysBetween(p.date, today) <= 28));
    if (slot) {
      changes.push(`posting time locked to ${slot}:00 US Eastern${state.locked_slot && state.locked_slot !== slot ? ` (was ${state.locked_slot}:00)` : ''}`);
      Object.assign(state, {locked_slot: slot, locked_on: today});
    }
  }

  // 4. Keep the repo small: drop videos older than 30 days (Instagram has its own copy).
  for (const f of fs.readdirSync(ROOT + 'media').filter((f) => f.endsWith('.mp4') && daysBetween(f.slice(0, 10), today) > 30)) sh('git', ['rm', '-q', `media/${f}`]);

  // 5. Report, as a GitHub issue assigned to the owner so GitHub emails it.
  const week = posts.filter((p) => daysBetween(p.date, today) < 7 && daysBetween(p.date, today) >= 0);
  const count = (s) => week.filter((p) => p.status === s).length;
  const sorted = [...live].filter((p) => p.score !== undefined).sort((a, b) => b.score - a.score);
  const row = (p) => `| ${p.date} | ${p.style} | ${p.trade} | ${p.hook} | ${p.stats.views ?? '-'} | ${p.stats.reach} | ${p.stats.shares} | ${p.stats.saved} | ${p.stats.comments} | ${p.score} | [open](${p.permalink}) |`;
  const head = '| date | style | trade | hook | views | reach | shares | saves | comments | score | |\n|---|---|---|---|---|---|---|---|---|---|---|';
  const body = [
    `**Followers:** ${followers_count}${prev !== undefined ? ` (${followers_count - prev >= 0 ? '+' : ''}${followers_count - prev} this week)` : ''}`,
    `**This week:** ${count('posted')} posted, ${count('failed')} failed, ${count('skipped')} skipped (no script).`,
    live.length < MIN_REELS
      ? `Learning starts once ${MIN_REELS} reels have been live 2+ days. So far: ${live.length}.\n\n${changes.map((c) => `- ${c}`).join('\n')}`
      : `### Best 3\n${head}\n${sorted.slice(0, 3).map(row).join('\n')}\n\n### Worst 3\n${head}\n${sorted.slice(-3).map(row).join('\n')}\n\n### What changed\n${changes.map((c) => `- ${c}`).join('\n') || '- nothing'}\n\nSunday's writer reads these numbers to plan next week.`,
    `\nComments on reels this week: ${week.filter((p) => p.stats).reduce((a, p) => a + p.stats.comments, 0)}. Reply to anyone who commented WEBSITE.`,
  ].join('\n\n');
  if (process.env.GITHUB_REPOSITORY_OWNER) sh('gh', ['issue', 'create', '--title', `Weekly reel report ${today}`, '--body', body, '--assignee', process.env.GITHUB_REPOSITORY_OWNER]);
  else console.log(body);

  write('data/posts.json', posts);
  write('data/state.json', state);
  if (process.env.GITHUB_ACTIONS) gitCommit(`weekly report ${today}`, ['data', 'media']);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
