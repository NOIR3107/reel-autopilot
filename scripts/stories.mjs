// Posts every image in assets/stories as a story, in file-name order. Runs when that folder changes.
import fs from 'node:fs';
import {ROOT, sh, ig} from './lib.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const {user_id} = await ig('/me', {params: {fields: 'user_id'}});
const sha = sh('git', ['rev-parse', 'HEAD']).trim();
for (const f of fs.readdirSync(ROOT + 'assets/stories').filter((f) => f.endsWith('.jpg')).sort()) {
  const image_url = `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_REPOSITORY}@${sha}/assets/stories/${f}`;
  const {id} = await ig(`/${user_id}/media`, {method: 'POST', params: {media_type: 'STORIES', image_url}});
  let status = 'IN_PROGRESS';
  for (let i = 0; i < 12 && status === 'IN_PROGRESS'; i++) { await sleep(5000); status = (await ig(`/${id}`, {params: {fields: 'status_code'}})).status_code; }
  if (status !== 'FINISHED') throw new Error(`${f}: ${status}`);
  await ig(`/${user_id}/media_publish`, {method: 'POST', params: {creation_id: id}});
  console.log(`story posted: ${f}`);
  await sleep(3000); // keeps them in order
}
