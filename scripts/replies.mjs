// Runs every hour: anyone who comments a reel's keyword (the "comment WORD" in its caption) within 7 days gets that
// keyword's DM from data/dms.json, plus a short public reply. Needs instagram_business_manage_comments and _messages.
import {eastern, daysBetween, loadPosts, read, write, gitCommit, ig} from './lib.mjs';

const PUBLIC = 'Sent you a DM 👊';
export const keywordOf = (caption) => caption?.match(/\bcomment ([A-Z]{3,10})\b/i)?.[1].toUpperCase();
export const wantsCheck = (text, kw = 'WEBSITE') => new RegExp(`\\b${kw}\\b`, 'i').test(text ?? '');

async function main() {
  const today = eastern().date;
  const done = read('data/replied.json', {}); // comment id -> {status, tries}
  const {user_id} = await ig('/me', {params: {fields: 'user_id'}});
  const recent = loadPosts().filter((p) => p.status === 'posted' && daysBetween(p.date, today) <= 7);
  const DMS = read('data/dms.json', {});
  let changed = false;
  for (const p of recent) {
    const kw = keywordOf(p.caption), DM = DMS[kw];
    if (!DM) continue; // no keyword, or a vote (A or B): nothing to send
    let data;
    try { ({data} = await ig(`/${p.media_id}/comments`, {params: {fields: 'id,text,username', limit: '100'}})); }
    catch (e) { console.log(`skipping ${p.date} (${p.permalink}): ${e.message.slice(0, 160)}`); continue; } // e.g. a deleted reel
    console.log(`${p.date}: keyword ${kw}, ${data.length} comments, ${data.filter((c) => wantsCheck(c.text, kw)).length} matching`);
    for (const c of data.filter((c) => wantsCheck(c.text, kw))) {
      const rec = done[c.id] ?? {tries: 0};
      if (rec.status === 'sent' || rec.tries >= 3) continue;
      changed = true;
      rec.tries++;
      try {
        await ig(`/${user_id}/messages`, {method: 'POST', params: {recipient: JSON.stringify({comment_id: c.id}), message: JSON.stringify({text: DM})}});
        await ig(`/${c.id}/replies`, {method: 'POST', params: {message: PUBLIC}}).catch(() => {}); // the DM is what matters
        Object.assign(rec, {status: 'sent', user: c.username, date: today});
        console.log(`DM sent to @${c.username}`);
      } catch (e) {
        Object.assign(rec, {status: 'failed', user: c.username, error: e.message.slice(0, 200)});
        console.log(`could not DM @${c.username}: ${rec.error}`);
      }
      done[c.id] = rec;
    }
  }
  if (changed) {
    write('data/replied.json', done);
    if (process.env.GITHUB_ACTIONS) gitCommit(`replies ${today}`, ['data/replied.json']);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
