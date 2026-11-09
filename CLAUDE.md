# Notes for Claude sessions

- Neelville (src/reels/Island.jsx, src/reels/islandKit.js, scripts/island.mjs): Neel's standing rule is that everything on the island is extremely detailed: houses, railings, streets, everything. New pieces go in islandKit.js as merged, vertex-coloured geometry so detail stays cheap to render.
- Follower requests for their lot go in data/island.json under "requests" as {user, items, business}.
- No repeats: one lot per follower. A second request from someone who already has a lot is skipped (enforced in scripts/island.mjs).
- Since Nov 10 2026: two reels a day, all written by code. Morning (part 1) alternates the country ring race (scripts/race.mjs, data/race.json) and a stickman mindset reel (scripts/mindset.mjs, episodes in data/mindset.json, calm am_michael voice); evening (part 2) is Neelville. Explainer scripts are parked in archive/explainers; the weekly writer task is paused. A queue/DATE.json file overrides that day's morning reel.
