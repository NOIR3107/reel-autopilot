# Reel autopilot

Posts one Instagram reel a day for a web designer who builds sites for local trades
(HVAC and roofing first). No API keys for AI. Runs free on GitHub.

## Who does what

| When | Who | What |
|---|---|---|
| Every hour | GitHub `Daily reel` | At today's time slot: reads `queue/<date>.json`, checks it, makes the sound, renders, posts. Once a day max. |
| Saturday | GitHub `Weekly report` | Renews the Instagram key, pulls stats, writes `data/insights.json`, locks the best posting time, opens a report issue. |
| Sunday | Claude scheduled task | Reads `rules.md`, `styles.md`, `data/insights.json`, writes next week's 7 scripts into `queue/`, updates the LEARNED part of `rules.md`, pushes. |

## The four styles

`kinetic` (3 a week), `teardown` (2), `mike` (1), `ad` (1). Never the same style two days in a row.
Script format for each: `styles.md`. Brand and content rules: `rules.md`.

## Files

- `src/` Remotion videos. `src/index.jsx` lists the four compositions.
- `scripts/daily.mjs`, `scripts/weekly.mjs` the two robots. `scripts/validate.mjs` the checks every script must pass.
- `tools/` hook scorer, human-voice detector, caption linter, sound synth.
- `queue/` one script per day. `media/` posted videos (deleted after 30 days). `data/` post log and stats.

## Secrets (repo Settings > Secrets and variables > Actions)

- `IG_TOKEN` Instagram long-lived token (instagram_business_basic, instagram_business_content_publish, instagram_business_manage_insights).
- `GH_PAT` fine-grained token for this repo with Secrets: read and write, so the weekly job can save the renewed key.

## Commands

```
npm test                                   # self-check
npm run check -- queue/*.json              # check scripts
DRY_RUN=1 DATE=2026-10-26 node scripts/daily.mjs   # render a day without posting
```

The repo must stay public: Instagram downloads each video from its jsDelivr link.
