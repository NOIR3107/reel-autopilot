#!/usr/bin/env python3
"""Sound for src/reels/Race.jsx: every bounce plays the next note of a bright melody, each broken ring crashes and
lifts the key, the winner gets a fanfare. python3 tools/race_sound.py queue/<date>.json public/race-sound.wav"""
import json
import sys
from synth import *

p = json.load(open(sys.argv[1]))['props']
OUTRO, SLOW = 150, 3  # same as Race.jsx / raceSim.mjs
S = p['end'] - 30
out = lambda fr: fr if fr < S else S + (fr - S) * SLOW  # sim frame -> video frame (slow motion at the end)
DUR = (out(p['end']) + OUTRO) / 30
m = Mix(DUR)

def bell(hz, sec=0.5):
    tt = t(sec)
    return (np.sin(2 * np.pi * hz * tt) + 0.35 * np.sin(2 * np.pi * hz * 2.01 * tt) + 0.12 * np.sin(2 * np.pi * hz * 3.99 * tt)) * np.exp(-tt * 7)

# an original 16-step tune in C major pentatonic; each ring break moves it up a step
TUNE = [0, 2, 4, 7, 9, 7, 4, 2, 4, 7, 9, 12, 9, 7, 4, 7]
breaks = p['breaks']
for k, fr in enumerate(p['bounces']):
    lift = [0, 2, 4, 5, 7][min(4, sum(b['frame'] <= fr for b in breaks))]
    hz = 523.25 * 2 ** ((TUNE[k % len(TUNE)] + lift) / 12)
    if fr >= S: hz /= 2  # slow motion: an octave down
    m.place(bell(hz, 0.9 if fr >= S else 0.5), f(out(fr)), 0.32, pan=0.3 * np.sin(k))

for c in p.get('close', []):  # near miss: a quick gasp-like swoosh up
    m.place(sweep(300, 1200, 0.35) * np.exp(-t(0.35) * 5) * 0.4, f(out(c['frame'])), 0.35)
m.place(riser(1.0 * SLOW), f(S), 0.4)  # the build into the winning escape
for b in breaks:
    at = f(out(b['frame']))
    m.place(filt(rng.standard_normal(int(SR * 0.6)), 'highpass', 2500) * np.exp(-t(0.6) * 9), at, 0.5)  # glass
    m.place(impact(), at, 0.55)
    m.place(whoosh(0.6), at - 0.05, 0.35)

end = f(out(p['end']))
for i, hz in enumerate((523.25, 659.25, 783.99, 1046.5)):  # fanfare: a quick climb, then the chord rings
    m.place(note(hz, 0.18, 0.004) * np.exp(-t(0.18) * 6), end + i * 0.11, 0.22)
m.place(sum(note(h, 2.2, 0.004) for h in (523.25, 659.25, 783.99)) / 3 * np.exp(-t(2.2) * 1.4), end + 0.45, 0.35)
for i in range(6):
    m.place(pop(500 + 120 * i, 1400 + 150 * i, 0.3), end + 0.5 + i * 0.13, 0.45, pan=(-1) ** i * 0.5)

m.write(sys.argv[2])
print(f'wrote {sys.argv[2]}: {DUR:.1f}s, {len(p["bounces"])} bounces, {len(breaks)} breaks')
