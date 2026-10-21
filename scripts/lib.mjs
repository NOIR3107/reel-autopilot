import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

export const ROOT = new URL('..', import.meta.url).pathname;
export const SLOTS = [10, 13, 17]; // US Eastern hours tested during rotation
export const read = (f, fallback) => (fs.existsSync(ROOT + f) ? JSON.parse(fs.readFileSync(ROOT + f, 'utf8')) : fallback);
export const write = (f, v) => fs.writeFileSync(ROOT + f, JSON.stringify(v, null, 2) + '\n');
export const loadState = () => read('data/state.json', {start: null, locked_slot: null, locked_on: null, followers: []});
export const loadPosts = () => read('data/posts.json', []);

// Date and hour in US Eastern, whatever timezone the runner is in.
export function eastern(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'})
    .formatToParts(d).map((x) => [x.type, x.value]));
  return {date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour)};
}
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

// Rotate slots until the analyzer locks one; then re-test all three for the last 6 days of every 28.
export function slotFor(date, state) {
  if (state.locked_slot && daysBetween(state.locked_on, date) % 28 < 22) return state.locked_slot;
  return SLOTS[daysBetween(state.start, date) % SLOTS.length];
}

export const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, {cwd: ROOT, encoding: 'utf8', ...opts});
export const py = (tool, args, input) => {
  try {
    return JSON.parse(sh('python3', ['-I', `tools/${tool}`, ...args, '--json'], {input}));
  } catch (e) {
    if (e.stdout) return JSON.parse(e.stdout); // tools exit 1 on a failing verdict but still print JSON
    throw e;
  }
};

export function gitCommit(message, paths) {
  sh('git', ['add', ...paths]);
  if (!sh('git', ['status', '--porcelain', ...paths]).trim()) return sh('git', ['rev-parse', 'HEAD']).trim();
  sh('git', ['commit', '-m', message]);
  sh('git', ['pull', '--rebase', '--quiet']);
  sh('git', ['push', '--quiet']);
  return sh('git', ['rev-parse', 'HEAD']).trim();
}

const IG = 'https://graph.instagram.com/v23.0';
export async function ig(path, {method = 'GET', params = {}} = {}) {
  const url = new URL(path.startsWith('http') ? path : IG + path);
  const body = new URLSearchParams({...params, access_token: process.env.IG_TOKEN});
  const res = method === 'GET' ? await fetch(`${url}${url.search ? '&' : '?'}${body}`) : await fetch(url, {method, body});
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`Instagram ${path}: ${JSON.stringify(json.error ?? json)}`);
  return json;
}
