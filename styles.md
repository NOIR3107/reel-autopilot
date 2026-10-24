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

## story: a short drama with voiceover (the house style)

Copy the shape of queue/2026-10-24.json. `props` = {"trade": roofing|hvac|plumbing|electrical|landscaping, "ctaTitle": ["line 1", "line 2"] (22 chars each), "scenes": [...]}.
8-12 scenes, then {"cta": true, "vo": "spoken ask ending in comment website", "part": "outro"}. 60-95 spoken words in total (about 30s).

```json
{"vo": "Your website is telling customers you're closed.", "key": "closed", "mood": "neutral", "pose": "phoneLook", "screen": "old",
 "fx": ["closed"], "part": "hook", "voice": "am_michael", "beat": "fail", "say": "optional speech bubble, 40 chars"}
```

- `vo` is spoken and shown one word at a time; 75 characters max. `key` = the word painted yellow (must be in the line).
- `part` drives the music: hook (first scene only), drop, break (the twist), rise (build-up), drop2 (the win), outro.
- `fx`: closed (red stamp slam), shake, hail (storm), glow (the win). `voice`: am_michael (narrator), af_heart (the customer).
- Story shape: hook that accuses or surprises the viewer, the owner is good at the trade, he loses jobs, a customer says the hard truth
  (in af_heart), the website problem, the fix, the win (ringing), then the ask. Give the owner a different first name each time
  (Mike is only the roofer). Mood, pose and screen lists are in the mike section.
- Hooks: say something about the viewer's own website or a concrete moment (2 AM, hail, July). Never a generic statement.

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
