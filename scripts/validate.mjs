// Checks a day's script before it is queued or rendered. CLI: node scripts/validate.mjs queue/*.json
import fs from 'node:fs';
import {py} from './lib.mjs';
import {BUSINESSES} from '../src/biz.js';

const MIN_HOOK = 70;
const STYLES = ['kinetic', 'teardown', 'mike', 'ad'];
const BANNED = /\d+(\.\d+)?\s?%|percent|studies show|survey|research shows|guarantee|game.?changer|unlock|level up|in today'?s video|stop scrolling|follow for more|\$\d|discount|limited time|[—–]/i;
const BG = ['ink', 'paper', 'lime', 'cobalt'];
const MOODS = ['neutral', 'happy', 'worried', 'shocked', 'smug', 'squint'];
const POSES = ['idle', 'phoneLook', 'call', 'shrug', 'fistPump', 'facepalm', 'point', 'wave'];
const SCREENS = ['silent', 'ringing', 'competitor', 'social', 'loading', 'new', 'old', 'oldScroll', 'footer'];
const PHOTOS = ['np-house.jpg', 'kestrel-hero.jpg', 'hvac-house.jpg'];
const PHONE = /^\(555\) 01\d-\d{4}$/;

const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function checkStyle(s, errs) {
  const p = s.props ?? {};
  if (s.style === 'kinetic') {
    const cards = p.cards ?? [];
    const body = cards.slice(0, -1);
    if (!cards.at(-1)?.cta) errs.push('kinetic: last card must be {"cta": true}');
    if (body.length < 13 || body.length > 16) errs.push(`kinetic: ${body.length} cards, want 13-16`);
    const beats = body.reduce((t, c) => t + (c.beats ?? 0), 0);
    if (beats < 48 || beats > 52) errs.push(`kinetic: ${beats} beats before the CTA, want 48-52`);
    if (!body[0]?.hook) errs.push('kinetic: first card needs "hook": true');
    if ((JSON.stringify(body).match(/\[[^\]]+\]/g) ?? []).length > 1) errs.push('kinetic: the [highlighter] may be used once');
    body.forEach((c, i) => {
      if (!BG.includes(c.bg)) errs.push(`kinetic card ${i + 1}: bg must be one of ${BG}`);
      if (i && c.bg === body[i - 1].bg) errs.push(`kinetic card ${i + 1}: same color as the card before`);
      const lines = String(c.text ?? '').split('\n');
      if (!c.text || lines.length > 4) errs.push(`kinetic card ${i + 1}: 1-4 lines`);
      lines.forEach((l) => { if (l.replace(/[*[\]]/g, '').length > 12) errs.push(`kinetic card ${i + 1}: "${l}" is over 12 characters`); });
    });
  } else if (s.style === 'teardown') {
    const sh = p.shop ?? {};
    if (!str(sh.name, 26) || !str(sh.domain, 30) || !PHONE.test(sh.phone ?? '')) errs.push('teardown: shop needs name (26), domain (30), a (555) 01X-XXXX phone');
    if (!PHOTOS.includes(sh.photo)) errs.push(`teardown: shop.photo must be one of ${PHOTOS}`);
    if (!/^#[0-9a-f]{6}$/i.test(sh.accent ?? '')) errs.push('teardown: shop.accent must be a hex color');
    if (!Array.isArray(sh.fixedHeadline) || sh.fixedHeadline.length !== 2 || !sh.fixedHeadline.every((l) => str(l, 16))) errs.push('teardown: fixedHeadline = 2 lines of 16 characters max');
    if (!str(sh.fixedSub, 48) || !str(sh.about, 60)) errs.push('teardown: fixedSub (48) and about (60) required');
    if (!Array.isArray(sh.services) || sh.services.length !== 3 || !['hvac', 'general'].includes(sh.icons)) errs.push('teardown: 3 services and icons "hvac" or "general"');
    if (!Array.isArray(p.hook) || p.hook.length !== 2 || p.hook.join(' ').length > 46) errs.push('teardown: hook = [plain, red], 46 characters total');
    if (!Array.isArray(p.fixes) || p.fixes.length !== 3 || !p.fixes.every((f) => str(f.problem, 48) && str(f.fixed, 52))) errs.push('teardown: 3 fixes, problem (48) and fixed (52)');
  } else if (s.style === 'mike') {
    const sc = p.scenes ?? [];
    const body = sc.slice(0, -1);
    if (!sc.at(-1)?.cta) errs.push('mike: last scene must be {"sec": N, "cta": true}');
    if (body.length < 5 || body.length > 7) errs.push(`mike: ${body.length} scenes, want 5-7`);
    const secs = sc.reduce((t, x) => t + (x.sec ?? 0), 0);
    if (secs < 29 || secs > 31) errs.push(`mike: ${secs}s total, want 29-31`);
    body.forEach((x, i) => {
      const n = `mike scene ${i + 1}`;
      if (!MOODS.includes(x.mood) || !POSES.includes(x.pose) || !SCREENS.includes(x.screen)) errs.push(`${n}: mood, pose and screen must come from the lists in styles.md`);
      if (!x.caption && !x.say) errs.push(`${n}: needs a caption or a line to say`);
      if (x.caption && !str(x.caption, 60)) errs.push(`${n}: caption over 60 characters`);
      if (x.say && !str(x.say, 40)) errs.push(`${n}: line over 40 characters`);
      if (x.stamp && !['MYTH', 'TRUTH'].includes(x.stamp)) errs.push(`${n}: stamp is MYTH or TRUTH`);
    });
    if (body[0] && !body[0].caption) errs.push('mike: the first scene needs a caption (the hook)');
  } else if (s.style === 'ad') {
    if (!BUSINESSES[p.trade]) errs.push(`ad: trade must be one of ${Object.keys(BUSINESSES)}`);
    if (p.hook && (!Array.isArray(p.hook) || p.hook.length > 8)) errs.push('ad: hook = up to 8 words like [["Your"], ["jobs.", 1]]');
  }
}

// Returns a list of problems; empty means the script can be rendered and posted.
export function validate(s, {quality = true} = {}) {
  const errs = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date ?? '')) errs.push('date must be YYYY-MM-DD');
  if (!STYLES.includes(s.style)) return [...errs, `style must be one of ${STYLES}`];
  if (!str(s.topic, 120) || !str(s.trade, 30) || !str(s.hook, 120)) errs.push('topic, trade and hook are required');
  if (typeof s.caption !== 'string' || s.caption.length < 80) errs.push('caption missing or under 80 characters');
  else {
    if ((s.caption.match(/#\w+/g) ?? []).length > 3) errs.push('caption: at most 3 hashtags');
    if (!/WEBSITE/.test(s.caption)) errs.push('caption must ask people to comment WEBSITE');
  }
  const banned = JSON.stringify(s).match(BANNED);
  if (banned) errs.push(`remove "${banned[0]}": no stats, prices, guarantees, em dashes or banned phrases`);
  checkStyle(s, errs);
  if (quality && !errs.length) {
    const hook = py('hookscore.py', ['--hook', s.hook]);
    if (hook.score < MIN_HOOK) errs.push(`hook "${s.hook}" scored ${hook.score}, needs ${MIN_HOOK}+ (weakest: ${hook.weakest}) ${hook.flags.join(' ')}`);
    const human = py('detect.py', ['-'], s.caption);
    if (human.verdict !== 'PASS') errs.push(`caption sounds machine-written (${human.human_score}): ${Object.entries(human.checks).filter(([, c]) => c.score < 55).map(([k, c]) => `${k} ${c.detail}`).join('; ')}`);
    const lint = py('caption.py', ['-', '--keywords', s.trade], s.caption);
    if (lint.verdict === 'FIX') errs.push(`caption: ${lint.checks.filter((c) => c.status === 'FAIL').map((c) => `${c.check} ${c.detail}`).join('; ')}`);
  }
  return errs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let bad = 0;
  for (const f of process.argv.slice(2)) {
    const errs = validate(JSON.parse(fs.readFileSync(f, 'utf8')));
    console.log(errs.length ? `FAIL ${f}\n  - ${errs.join('\n  - ')}` : `ok   ${f}`);
    bad += errs.length > 0;
  }
  process.exit(bad ? 1 : 0);
}
