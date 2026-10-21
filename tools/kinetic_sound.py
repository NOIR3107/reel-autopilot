#!/usr/bin/env python3
"""Soundtrack for src/reels/Kinetic.jsx, timed from the same kinetic-cards.json: a 124 bpm groove, a hit on every
card cut, a drop into the turn card, a pop on the CTA. python3 tools/kinetic_sound.py public/kinetic-sound.wav [queue/<date>.json]"""
import json
import os
import sys
from synth import *

HOUSE = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'src', 'reels', 'kinetic-cards.json')))
# optional 2nd arg: a reel script whose props carry {"cards": [...]}; bpm and length stay the house values
d = dict(HOUSE, cards=json.load(open(sys.argv[2]))['props']['cards']) if len(sys.argv) > 2 else HOUSE
DUR = float(d['totalSeconds'])
beat = 60 / d['bpm']
m = Mix(DUR)

starts, acc = [], 0
for c in d['cards']:
    starts.append(acc * beat)
    acc += c.get('beats', 0)
turn = next(s for s, c in zip(starts, d['cards']) if c.get('turn'))
cta = next(s for s, c in zip(starts, d['cards']) if c.get('cta'))

# groove: four on the floor, claps on 2 and 4, 8th hats; drums drop out for 2 beats into the turn
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (261.63, 329.63, 392.0), (196.0, 246.94, 293.66)]
roots = [110.0, 87.31, 130.81, 98.0]
n = int(DUR / beat)
for i in range(n):
    s = i * beat
    bar, pos = divmod(i, 4)
    drop = turn - 2 * beat <= s < turn
    if not drop:
        m.place(kick(), s, 0.8)
        if pos in (1, 3):
            m.place(clap(), s, 0.45)
        m.place(hat(), s + beat / 2, 0.55, pan=0.25)
    m.place(note(roots[bar % 4], beat * 0.85) * np.exp(-t(beat * 0.85) * 3), s, 0.32)
    if pos == 0:
        tt = t(4 * beat)
        pad = sum(note(h, 4 * beat, 0.004) for h in chords[bar % 4]) / 3
        duck = 1 - 0.5 * np.exp(-(tt % beat) * 10)
        m.place(filt(pad, 'lowpass', 1800) * np.minimum(tt / 0.1, 1) * np.minimum((4 * beat - tt) / 0.2, 1) * duck, s, 0.24)

# a hit on every card cut
for s in starts[1:]:
    m.place(tick(True), s, 0.6)
    m.place(sweep(900, 300, 0.12) * np.exp(-t(0.12) * 25), s, 0.25)

# into the turn: riser over the drop, impact on the card
m.place(riser(2 * beat), turn - 2 * beat, 0.7)
m.place(impact(), turn, 0.7)

# CTA
m.place(whoosh(0.6), cta - 0.25, 0.5)
m.place(pop(500, 1500, 0.5), cta + 10 / 30, 0.8)

m.write(sys.argv[1])
print(f'wrote {sys.argv[1]}: {DUR}s, turn at {turn:.2f}s, cta at {cta:.2f}s')
