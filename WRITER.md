# Sunday writer: instructions for the weekly Claude task

Budget: this whole job must stay small. At most 4 web searches, no rendering, no browsing. Read, research, write, validate, push.

1. Read `rules.md`, `styles.md`, `data/insights.json` (may not exist yet) and the last 14 entries of `data/posts.json`
   (may not exist yet). Look at `queue/` to see which dates already have a script.
2. Find what is going viral (at most 4 web searches, about 10 minutes): look for reels and posts that are doing well right now
   for AI automation for small businesses, SEO and web design tips, and interactive choose-your-path stories on Instagram (hooks, formats, topics, calls to action). Rank what you find by how far each reel beat its own account's usual views (the ig-viral method),
   name each one's hook formula, and write 3 to 5 short, specific takeaways into `rules.md` between `<!-- COMPETITORS:START -->` and `<!-- COMPETITORS:END -->` (replace
   last week's), and use them in this week's hooks and stories. Never copy anyone's script or name a real business in a reel.
3. Two reels a day: you write the morning reel; the evening reel is the daily Neelville island episode, which the robot
   writes itself from data/island.json (never write `-2` files, or that day's island episode is skipped). Fill every
   missing morning file from tomorrow through 7 days out (US Eastern dates) as `queue/YYYY-MM-DD.json`. Do not touch
   files that already exist.
   - Mix per 7 days: 3 AUTOMATION (Neel's services: quote follow-up, instant lead reply, review requests; he sells these),
     3 SEO + DESIGN (websites), 1 WILDCARD (whatever is getting big views right now in AI, tech or business; or the next
     survival part if `survival/next.md` has a winner). No FREE SKILL reels (Neel stopped that series). Copy the shape of
     queue/2026-11-06.json (automation), 2026-10-29.json (SEO) and 2026-10-28.json (survival).
   - Rotate formats, never the same main format two days in a row: 3D scene (`model3d`: robot, house, phone, star), before/after
     (`split`), phone chat drama (`phone`), myth vs fact (`stamp` MYTH then FACT), workflow (`flow`). Automation reels use
     `"bgc": "#1f2a44"`. The robot rotates the visual look and colours itself (full-screen look 'c' and classic 'b'), so
     don't fight it; vary formats and props instead.
   - Hooks: write 5 candidates per reel, each from a different formula, and pick the one that would stop YOU scrolling.
     Formulas that work now: "Send this to [person] who [situation]" (drives shares, the top signal), "If you [very specific
     situation]...", contradiction ("[common belief]? Wrong / won't / isn't"), "POV: [relatable moment]", "This feels illegal to
     know", a surprising true number. Never use the same formula or the same first word two days in a row; never open with
     "Stop" more than once a week. Run `python3 tools/hookscore.py --hook "..." --json` only as a floor (40+ required): it
     catches weak lines, it can't spot a great one. The first scene's vo must be the hook and flow into the second line.
   - SEO + design: only true, checkable facts (Google's own documentation is the bar). No invented numbers.
   - Survival: write the next part only if `survival/next.md` says which option won; otherwise write an extra SEO reel.
   - Every reel ends with a reason to follow and a comment keyword. A new keyword needs its DM in `data/dms.json` (the link
     or the offer, plus a question back; under 1000 characters). Comments with the keyword get that DM automatically.
   - No hashtags (validate fails on any). Use SEO keywords instead: work the search phrase into the first caption line,
     and end the caption with one plain line of 4–6 phrases people would type into Instagram search
     (e.g. "Local SEO for contractors, how to rank on Google, roofing website tips.").
   - Automation reels only offer what Neel sells: quote follow-up, instant lead reply, review requests, missed-call text back,
     on-my-way texts. Never invent a claim about Neel ("I use this every day") that he hasn't said.
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
