# Sunday writer: instructions for the weekly Claude task

Budget: this whole job must stay small. At most 4 web searches, no rendering, no browsing. Read, research, write, validate, push.

1. Read `rules.md`, `styles.md`, `data/insights.json` (may not exist yet) and the last 14 entries of `data/posts.json`
   (may not exist yet). Look at `queue/` to see which dates already have a script.
2. Learn from competitors (at most 4 web searches, about 10 minutes): look for reels and posts that are doing well right now
   for AI tools and Claude skills, SEO and web design tips, and interactive choose-your-path stories on Instagram (hooks, formats, topics, calls to action). Write 3 to 5
   short, specific takeaways into `rules.md` between `<!-- COMPETITORS:START -->` and `<!-- COMPETITORS:END -->` (replace
   last week's), and use them in this week's hooks and stories. Never copy anyone's script or name a real business in a reel.
3. Fill every missing date from tomorrow through 7 days out (US Eastern dates) with one script each, as
   `queue/YYYY-MM-DD.json`. Do not touch dates that already have a file.
   - Mix per 7 days: 3 "FREE SKILL" explainers, 3 "SEO + DESIGN" explainers, 1 survival part (see styles.md, series).
     Copy the shape of queue/2026-10-27.json (skill), 2026-10-29.json (SEO) and 2026-10-28.json (survival).
   - Skills: a real, popular, free Claude skill or tool repo each time (check it exists). Never show or say the repo name,
     link or install command in the reel; people must comment the keyword to get it. Number the series (FREE SKILL n/7).
   - SEO + design: only true, checkable facts (Google's own documentation is the bar). No invented numbers.
   - Survival: write the next part only if `survival/next.md` says which option won; otherwise write an extra SEO reel.
   - Every reel ends with a reason to follow and a comment keyword.
   - The only on-screen character is Neel: `"host": "neel"` in explainers, `"who": "neel"` (speaker "neel") in survival. No other characters.
   - No topic used in the last 21 days.
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
