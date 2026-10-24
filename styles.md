# Script format, one file per day

The weekly writer saves one script per day as `queue/YYYY-MM-DD.json` (US Eastern date). The daily robot
renders it and posts it. `node scripts/validate.mjs queue/*.json` must pass before anything is committed.

Weekly mix: 7 story reels (the owner approved only this style). Rotate trades: roofing and HVAC 2 each, plumbing, electrical, landscaping 1 each.
The other styles below still work but are off until the owner asks for them.
Every reel is about 30 seconds and ends on "Comment WEBSITE". The full design rules live in rules.md.

## Fields every script has

```json
{
  "date": "2026-10-26",
  "style": "kinetic | teardown | mike | ad",
  "trade": "HVAC | roofing | plumbing | electrical | landscaping | ...",
  "topic": "one line naming the single idea (used to avoid repeats for 14 days)",
  "hook": "the opening line as one sentence (scored; must reach 70+)",
  "hook_formula": 3,
  "caption": "Instagram caption: first line is the ask, 2-4 short paragraphs, up to 3 hashtags, the trade named in plain words",
  "props": { "...": "style-specific, below" }
}
```

## story: a short drama with a cast, voiceover and music (the house style)

Copy the shape of queue/2026-10-25.json. `props` = {"trade": roofing|hvac|plumbing|electrical|landscaping, "lead": the owner,
"music": trap|funk|suspense|lofi, "narrator": "am_adam", "ctaTitle": ["line 1", "line 2"] (22 chars each), "scenes": [...]}.
8-12 scenes, then {"cta": true, "vo": "spoken ask ending in comment website", "part": "outro"}. 60-95 spoken words (about 30s).

```json
{"vo": "I need a plumber right now!", "key": "now", "layout": "phone", "who": "sarah", "speaker": "sarah", "mood": "worried",
 "pose": "phoneLook", "screen": "search", "set": "kitchen", "cam": "whip", "fx": ["shake"], "part": "drop", "beat": "fail", "say": "bubble, 40 chars"}
```

- Cast: owners mike (roofer), dan (plumber), rob (HVAC), tony (electrician), luis (landscaper); customers sarah, maya, karen;
  vince (the smug rival with the better website). `speaker` = who says the line out loud (their mouth moves, their own voice);
  leave it out for narration.
- `layout`: phone (who + phone screen), duo (two people, "cast": [left, right]), closeup (one big face), screen (the phone fills
  the shot), split (old vs new site). At least 3 layouts and 1 duo per reel.
- `set`: day, night, storm, office, kitchen. `cam`: push, pull, whip, dutch, still. Vary both scene to scene.
- `screen`: search (Google results typing), old, oldScroll, footer, loading, social, silent, competitor, new, ringing.
- `mood`: neutral, happy, worried, shocked, smug, squint, angry. `pose`: idle, phoneLook, call, shrug, fistPump, facepalm,
  point, wave, armsCrossed, explain, headHands, celebrate.
- `fx`: closed (red stamp), shake, hail, glow. `beat`: fail, win, ring (sound effects). `part` drives the music: hook (first
  scene), drop, break (the twist), rise (build-up), drop2 (the win), outro.
- Story shape: a hook that accuses or surprises the viewer, the owner is good at the trade, a customer struggles with his site
  (show it), the rival wins, someone says the hard truth out loud, the fix (split), the win (ringing), then the ask.
  Change the trade, the lead, the customer, the music, the sets and the order of layouts every day. Never reuse a hook.

## kinetic: bold words on color cards, 124 bpm

`props.cards`: 13-16 cards then `{"cta": true, "bg": "ink"}`. Card beats (1 beat = 0.48 s) must total 48-52 before the CTA.

```json
{"beats": 5, "bg": "ink", "text": "Your\nFacebook\npage is *not*\na website.", "hook": true}
```

- `bg`: ink, paper, lime, cobalt. Never the same twice in a row.
- `text`: 1-4 lines split with `\n`, each line at most 12 characters. `*word*` = accent color.
  `[word]` = the lime highlighter, at most once per reel.
- First card has `"hook": true`. One card may have `"turn": true` (the insight, 4-5 beats). Optional `"icon": "phone"`.

## teardown: fixing a fictional business's site on screen

```json
{
  "shop": {"name": "Ridgeway Roofing Co.", "domain": "ridgewayroofs.com", "phone": "(555) 016-7731", "trade": "roofing",
           "photo": "np-house.jpg", "accent": "#b45309", "fixedHeadline": ["Roof leak?", "Fixed this week."],
           "fixedSub": "Roof repairs and replacements across Tulsa.", "about": "residential roofing",
           "services": ["Repairs", "Replacement", "Inspections"], "icons": "general"},
  "hook": ["This roofing site loses calls in", "3 places."],
  "fixes": [{"problem": "...", "fixed": "..."}, {"problem": "...", "fixed": "..."}, {"problem": "...", "fixed": "..."}]
}
```

- The three fixes are always, in order: the headline that says nothing, the chat pop-up covering the page, the
  11-field contact form. Write fresh wording for them each time; `problem` at most 48 characters, `fixed` at most 52.
- `photo`: np-house.jpg, kestrel-hero.jpg or hvac-house.jpg. `icons`: "hvac" or "general".
- Phone numbers are always fictional (555) 01X-XXXX. Names must not be a real business you know of.
- `fixedHeadline`: 2 lines of at most 16 characters. `fixedSub` at most 48 characters.

## mike: Mike the contractor, one episode

`props.scenes`: 5-7 scenes then `{"sec": 6, "cta": true}`. Seconds total 29-31.

```json
{"sec": 4.0, "caption": "Narration, at most 60 chars", "say": "Mike's line, at most 40 chars",
 "mood": "neutral|happy|worried|shocked|smug|squint", "pose": "idle|phoneLook|call|shrug|fistPump|facepalm|point|wave",
 "screen": "silent|ringing|competitor|social|loading|new|old|oldScroll|footer", "stamp": "MYTH|TRUTH", "beat": "fail|win|ring"}
```

- Formats to rotate: short story, funny skit, myth vs truth. Mike always wins by the end.
- Mike owns Northpeak Roofing. `old` and `new` show his old and new site.

## ad: the premium before/after commercial

```json
{"trade": "roofing | hvac", "hook": [["Your"], ["website"], ["is"], ["costing"], ["you"], ["jobs.", 1]]}
```

- `hook` is optional: up to 8 words, `1` marks the lime word. Alternate roofing and HVAC week to week.
