// Runs every hour. At today's time slot it renders today's script from queue/ and posts it. At most once a day.
import fs from 'node:fs';
import {ROOT, eastern, slotFor, loadState, loadPosts, write, sh, gitCommit, ig, read} from './lib.mjs';
import {validate} from './validate.mjs';
import {episode} from './island.mjs';

const DRY = process.env.DRY_RUN === '1'; // render only: no git, no Instagram
const FORCE = process.env.FORCE === '1'; // manual "Run workflow" button: ignore the time slot
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const now = eastern();
const state = loadState();
const posts = loadPosts();
state.start ??= now.date;
// Two reels a day: part 1 at the day's slot (queue/DATE.json), part 2 five hours later (queue/DATE-2.json, optional).
const slots = [slotFor(now.date, state)];
slots.push(Math.min(slots[0] + 5, 21));
const doneWith = (n) => { const t = posts.filter((p) => p.date === now.date && (p.part ?? 1) === n);
  return t.some((p) => ['posted', 'skipped'].includes(p.status)) || t.filter((p) => p.status === 'failed').length >= 2; };
const part = DRY ? 1 : !doneWith(1) ? 1 : !doneWith(2) ? 2 : 0;
const slot = slots[(part || 1) - 1];
const day = process.env.DATE || now.date;
const queueFile = `queue/${day}${part === 2 ? '-2' : ''}.json`;

let stop = null;
if (!part) stop = 'both reels done today';
else if (!FORCE && !DRY && now.hour < slot) stop = `not time yet (reel ${part} at ${slot}:00 ET, now ${now.hour}:00 ET)`;
// With no evening script, the evening reel is that day's Neelville episode (written from data/island.json).
const island = part === 2 && !fs.existsSync(queueFile) && fs.existsSync(`${ROOT}data/island.json`);
if (!stop && part === 2 && !fs.existsSync(queueFile) && !island) stop = 'no second reel today';
if (stop) {
  console.log(stop);
  process.exit(0);
}

async function publish(file, fields) {
  const {user_id} = await ig('/me', {params: {fields: 'user_id'}});
  const sha = sh('git', ['rev-parse', 'HEAD']).trim();
  const repo = process.env.GITHUB_REPOSITORY;
  // Instagram fetches the video itself. jsDelivr serves it as video/mp4; GitHub raw is the fallback.
  const urls = [`https://cdn.jsdelivr.net/gh/${repo}@${sha}/${file}`, `https://raw.githubusercontent.com/${repo}/${sha}/${file}`];
  for (const video_url of urls) {
    const {id} = await ig(`/${user_id}/media`, {method: 'POST', params: {video_url, ...fields}});
    let status = 'IN_PROGRESS';
    for (let i = 0; i < 20 && status === 'IN_PROGRESS'; i++) {
      await sleep(30_000);
      status = (await ig(`/${id}`, {params: {fields: 'status_code'}})).status_code;
    }
    console.log(`${video_url} -> ${status}`);
    if (status === 'FINISHED') return (await ig(`/${user_id}/media_publish`, {method: 'POST', params: {creation_id: id}})).id;
  }
  throw new Error('Instagram could not process the video from any link');
}

// Makes the sound for scripts whose timing depends on the script; the others use a fixed track in public/.
function soundtrack(script) {
  if (script.style === 'kinetic') sh('python3', ['tools/kinetic_sound.py', 'public/kinetic-sound.wav', queueFile]);
  if (script.style === 'mike') sh('python3', ['tools/mike_sound.py', queueFile, 'public/mike-sound.wav']);
}

if (island) {
  const {followers_count} = await ig('/me', {params: {fields: 'followers_count'}});
  const {script: ep, next} = episode(read('data/island.json', {}), followers_count);
  write(queueFile, {...ep, date: day, next});
}
const script = read(queueFile, null);
if (script?.hold && !FORCE) { console.log('script on hold (being finished by hand)'); process.exit(0); }
const entry = {date: now.date, part, slot, hour: now.hour, status: script ? 'failed' : 'skipped'};
posts.push(entry);
if (!script) {
  // Logged once as skipped (no hourly retries, no red run); the weekly report shows it.
  console.log(`no script for today: ${queueFile} is missing. The weekly writer may not have run.`);
  if (!DRY) { write('data/posts.json', posts); write('data/state.json', state); gitCommit(`log ${now.date}: skipped`, ['data']); }
  process.exit(0);
}
try {
  const problems = script.style === 'island' ? [] : validate(script); // island episodes are written by code, not by hand
  if (problems.length) throw new Error(`today's script fails the checks:\n- ${problems.join('\n- ')}`);
  Object.assign(entry, {style: script.style, trade: script.trade, topic: script.topic, hook: script.hook, formula: script.hook_formula, caption: script.caption});

  soundtrack(script);
  const tmp = fs.mkdtempSync('/tmp/reel-');
  fs.writeFileSync(`${tmp}/props.json`, JSON.stringify({...script.props, music: true}));
  // Story reels: the voiceover sets each scene's length, so the sound tool writes the props.
  if (['story', 'explainer', 'survival', 'island'].includes(script.style)) sh('python3', ['tools/story_sound.py', queueFile, `${tmp}/props.json`], {stdio: 'inherit'});
  const browser = process.env.BROWSER ? [`--browser-executable=${process.env.BROWSER}`] : [];
  // 'angle' draws 2D cards cleanly; 'swangle' (software 3D) garbles some 2D transforms but is the safe bet for the island.
  const render = (gl) => sh('npx', ['remotion', 'render', 'src/index.jsx', script.style, `${tmp}/raw.mp4`, `--props=${tmp}/props.json`, `--gl=${gl}`, ...browser], {stdio: 'inherit'});
  try { render(script.style === 'island' ? 'swangle' : 'angle'); } catch { console.log('render failed, retrying with software 3D'); render('swangle'); }
  entry.file = `media/${now.date}${part === 2 ? '-2' : ''}.mp4`;
  // The ad is designed at 36s and played 1.2x to land on 30s. Then re-encode to Instagram's spec:
  // standard-range 4:2:0 H.264, AAC 48 kHz, index at the front.
  const speed = script.style === 'ad' ? ['-filter_complex', '[0:v]setpts=PTS/1.2[v];[0:a]atempo=1.2[a]', '-map', '[v]', '-map', '[a]', '-r', '30'] : [];
  sh('ffmpeg', ['-y', '-v', 'error', '-i', `${tmp}/raw.mp4`, ...speed, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', '-movflags', '+faststart', entry.file]);
  entry.seconds = Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', entry.file]).trim());

  if (DRY) entry.status = 'dry-run';
  else {
    gitCommit(`reel ${now.date} #${part}`, [entry.file]);
    entry.media_id = await publish(entry.file, {media_type: 'REELS', caption: script.caption, share_to_feed: 'true', thumb_offset: '500'});
    entry.permalink = (await ig(`/${entry.media_id}`, {params: {fields: 'permalink'}})).permalink;
    entry.status = 'posted';
    if (script.next) write('data/island.json', script.next);
    // The same video as a story keeps the profile active daily. A failed story never fails the day.
    try { entry.story_id = await publish(entry.file, {media_type: 'STORIES'}); }
    catch (e) { entry.story_error = e.message.slice(0, 300); console.log(`story not posted: ${entry.story_error}`); }
  }
  console.log(`${entry.status}: ${script.style} "${script.hook}" ${entry.permalink ?? entry.file}`);
} catch (e) {
  entry.error = String(e.stderr || e.message).slice(-1500); // kept in data/posts.json so failures can be read without GitHub logs
  console.error(entry.error);
  process.exitCode = 1;
} finally {
  if (!DRY) {
    write('data/posts.json', posts);
    write('data/state.json', state);
    gitCommit(`log ${now.date} #${part}: ${entry.status}`, ['data']);
  }
}
