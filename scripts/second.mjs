// Second Instagram account (token IG_TOKEN_2, passed in as IG_TOKEN). Posts the next clip in data/clips-b.json, at most one per day.
// Usage: node scripts/second.mjs check   (prints the account name, posts nothing)
import {ig, read, write, sh, gitCommit, eastern} from './lib.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (process.argv[2] === 'check') {
  const me = await ig('/me', {params: {fields: 'user_id,username,account_type'}});
  console.log(`second account: ${me.username} (${me.account_type})`);
  process.exit(0);
}
const st = read('data/clips-b.json', {next: 0, clips: []}), today = eastern().date;
const clip = st.clips[st.next ?? 0];
if (!clip) { console.log('no clips left for the second account'); process.exit(0); }
if (st.lastDate === today) { console.log('already posted today'); process.exit(0); }
const {user_id} = await ig('/me', {params: {fields: 'user_id'}});
const sha = sh('git', ['rev-parse', 'HEAD']).trim(), repo = process.env.GITHUB_REPOSITORY;
let id;
for (const url of [`https://cdn.jsdelivr.net/gh/${repo}@${sha}/${clip.file}`, `https://raw.githubusercontent.com/${repo}/${sha}/${clip.file}`]) {
  ({id} = await ig(`/${user_id}/media`, {method: 'POST', params: {media_type: 'REELS', video_url: url, caption: clip.caption, share_to_feed: 'true'}}));
  let s = 'IN_PROGRESS';
  for (let i = 0; i < 20 && s === 'IN_PROGRESS'; i++) { await sleep(30_000); s = (await ig(`/${id}`, {params: {fields: 'status_code'}})).status_code; }
  console.log(`${url} -> ${s}`);
  if (s === 'FINISHED') break;
  id = null;
}
if (!id) throw new Error('Instagram could not process the video');
const pub = await ig(`/${user_id}/media_publish`, {method: 'POST', params: {creation_id: id}});
write('data/clips-b.json', {...st, next: st.next + 1, lastDate: today});
gitCommit(`second account: posted ${clip.file}`, ['data']);
console.log(`posted ${pub.id}`);
