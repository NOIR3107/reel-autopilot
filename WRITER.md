# Sunday writer: instructions for the weekly Claude task

Budget: this whole job must stay small. At most 4 web searches, no rendering, no browsing. Read, research, write, validate, push.

1. Read `rules.md`, `styles.md`, `data/insights.json` (may not exist yet) and the last 14 entries of `data/posts.json`
   (may not exist yet). Look at `queue/` to see which dates already have a script.
2. Learn from competitors (at most 4 web searches, about 10 minutes): look for reels and posts that are doing well right now
   for web designers, marketing agencies and contractors on Instagram (hooks, formats, topics, calls to action). Write 3 to 5
   short, specific takeaways into `rules.md` between `<!-- COMPETITORS:START -->` and `<!-- COMPETITORS:END -->` (replace
   last week's), and use them in this week's hooks and stories. Never copy anyone's script or name a real business in a reel.
3. Fill every missing date from tomorrow through 7 days out (US Eastern dates) with one script each, as
   `queue/YYYY-MM-DD.json`. Do not touch dates that already have a file.
   - Mix per 7 days: 7 story reels, as styles.md says. Rotate trades and give each owner a different name.
   - No topic used in the last 14 days. HVAC and roofing in at least 4 of the 7; rotate other trades into the rest.
   - Once `data/insights.json` exists, lean toward the styles, trades and hook formulas at the top of each list,
     but keep the style mix above.
4. Run `npm ci` once, then `node scripts/validate.mjs queue/*.json`. Fix every failure and re-run until all pass.
   Never weaken `scripts/validate.mjs` or the tools to make a script pass.
5. If `data/insights.json` has 10+ reels, rewrite only the part of `rules.md` between `<!-- LEARNED:START -->` and
   `<!-- LEARNED:END -->`: at most 8 short bullets, each tied to numbers in insights.json (for example
   "kinetic beats teardown on shares, 64 vs 41"). Keep lessons from last week that still hold.
6. Commit with the message `queue: week of <first date>` and push to `main`.
7. Finish with a short summary for Neel: dates filled, the competitor takeaways, what the numbers say, and one concrete
   suggestion to grow the business this week (an offer, a collab, an outreach idea). Keep it under 8 lines.
