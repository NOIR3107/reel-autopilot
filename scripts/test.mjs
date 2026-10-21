// Self-check: node scripts/test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {slotFor, eastern, SLOTS} from './lib.mjs';
import {validate} from './validate.mjs';
import {score, groupMeans, bestSlot, ranks} from './weekly.mjs';

// Time slots rotate, lock, and re-test the last 6 days of every 28.
const st = {start: '2026-11-01', locked_slot: null};
assert.deepEqual([0, 1, 2, 3].map((d) => slotFor(`2026-11-0${d + 1}`, st)), [10, 13, 17, 10]);
const locked = {start: '2026-11-01', locked_slot: 13, locked_on: '2026-11-15'};
assert.equal(slotFor('2026-11-20', locked), 13);
assert.ok(SLOTS.includes(slotFor('2026-12-10', locked)));
assert.deepEqual(eastern(new Date('2026-07-01T17:30:00Z')), {date: '2026-07-01', hour: 13}); // summer, UTC-4
assert.deepEqual(eastern(new Date('2026-12-01T03:30:00Z')), {date: '2026-11-30', hour: 22}); // winter, UTC-5

// Every style's sample script passes; common mistakes are caught.
const sample = (k) => JSON.parse(fs.readFileSync(new URL(`../test/samples/${k}.json`, import.meta.url)));
for (const k of ['kinetic', 'teardown', 'mike', 'ad']) assert.deepEqual(validate(sample(k)), [], k);
const kin = sample('kinetic');
assert.ok(validate({...kin, caption: kin.caption + ' 53% of homeowners leave'}, {quality: false}).some((e) => e.includes('53%')));
assert.ok(validate({...kin, caption: kin.caption.replace('Picture it.', 'Picture it — now.')}, {quality: false}).some((e) => e.includes('—')));
const twoInks = structuredClone(kin); twoInks.props.cards[1].bg = 'ink';
assert.ok(validate(twoInks, {quality: false}).some((e) => e.includes('same color')));
const longLine = structuredClone(kin); longLine.props.cards[2].text = 'Facebook sets all the rules';
assert.ok(validate(longLine, {quality: false}).some((e) => e.includes('over 12')));
const td = sample('teardown'); td.props.shop.phone = '(918) 555-0100';
assert.ok(validate(td, {quality: false}).some((e) => e.includes('phone')));
const mk = sample('mike'); mk.props.scenes[0].pose = 'dance';
assert.ok(validate(mk, {quality: false}).some((e) => e.includes('mood, pose')));
assert.ok(validate({...sample('ad'), props: {trade: 'plumbing'}}, {quality: false}).some((e) => e.includes('trade')));
assert.ok(validate({...kin, hook: 'So today I want to talk about websites.'}).some((e) => e.includes('needs 70+')));

// Scoring and summaries.
assert.deepEqual(ranks([1, 3, 2]), [0, 1, 0.5]);
const mkp = (i, style, slot) => ({style, slot, seconds: 30, stats: {reach: 100, likes: i, comments: 0, shares: i, saved: 0, ig_reels_avg_watch_time: i * 1000}});
const ps = [mkp(1, 'ad', 10), mkp(2, 'ad', 10), mkp(5, 'mike', 13), mkp(6, 'mike', 13), mkp(9, 'kinetic', 17), mkp(10, 'kinetic', 17)];
score(ps);
assert.ok(ps[5].score > ps[0].score);
assert.deepEqual(groupMeans(ps, 'style').map((g) => g.style), ['kinetic', 'mike', 'ad']);
assert.equal(bestSlot(ps.map((p, i) => ({...p, stats: {...p.stats, reach: i}}))), 17);

console.log('all checks passed');
