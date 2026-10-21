# Sunday writer: instructions for the weekly Claude task

Budget: this whole job must stay small. No web searches, no rendering, no browsing. Read, write, validate, push.

1. Read `rules.md`, `styles.md`, `data/insights.json` (may not exist yet) and the last 14 entries of `data/posts.json`
   (may not exist yet). Look at `queue/` to see which dates already have a script.
2. Fill every missing date from tomorrow through 7 days out (US Eastern dates) with one script each, as
   `queue/YYYY-MM-DD.json`. Do not touch dates that already have a file.
   - Mix per 7 days: 3 kinetic, 2 teardown, 1 mike, 1 ad. Never the same style two days in a row, including the
     day before the first new date.
   - Ad trade alternates week to week: look at the last ad in `queue/` and use the other one (roofing / hvac).
   - Mike rotates formats: short story, funny skit, myth vs truth. Look at the last mike script and use the next.
   - No topic used in the last 14 days. HVAC and roofing in at least 4 of the 7; rotate other trades into the rest.
   - Once `data/insights.json` exists, lean toward the styles, trades and hook formulas at the top of each list,
     but keep the style mix above.
3. Run `npm ci` once, then `node scripts/validate.mjs queue/*.json`. Fix every failure and re-run until all pass.
   Never weaken `scripts/validate.mjs` or the tools to make a script pass.
4. If `data/insights.json` has 10+ reels, rewrite only the part of `rules.md` between `<!-- LEARNED:START -->` and
   `<!-- LEARNED:END -->`: at most 8 short bullets, each tied to numbers in insights.json (for example
   "kinetic beats teardown on shares, 64 vs 41"). Keep lessons from last week that still hold.
5. Commit with the message `queue: week of <first date>` and push to `main`.
6. Finish with a 3 line summary: dates filled, styles, and any lesson added.
