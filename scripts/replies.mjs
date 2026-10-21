// Runs every hour: anyone who comments WEBSITE on a reel from the last 7 days gets a DM and a short public reply.
// Needs the token permissions instagram_business_manage_comments and instagram_business_manage_messages.
import {eastern, daysBetween, loadPosts, read, write, gitCommit, ig} from './lib.mjs';

const DM = "Hey, thanks for commenting! Send me your website link (or your business name and city if you don't have one yet) and I'll look it over and send you the 3 fixes I'd make first. No charge. Neel";
const PUBLIC = 'Sent you a DM 👊';
export const wantsCheck = (text) => /\bwebsite\b/i.test(text ?? '');

async function main() {
  const today = eastern().date;
  const done = read('data/replied.json', {}); // comment id -> {status, tries}
  const {user_id} = await ig('/me', {params: {fields: 'user_id'}});
  const recent = loadPosts().filter((p) => p.status === 'posted' && daysBetween(p.date, today) <= 7);
  let changed = false;
  for (const p of recent) {
    const {data} = await ig(`/${p.media_id}/comments`, {params: {fields: 'id,text,username', limit: '100'}});
    for (const c of data.filter((c) => wantsCheck(c.text))) {
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
