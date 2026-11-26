#!/usr/bin/env python3
"""Soundtrack for src/reels/Bridge.jsx: light 120 bpm groove, a thud + clang on every crash (same timings as the component), a pop when a truck finally fits."""
import sys
from synth import *

DUR = [2.2, 1.7, 1.4, 1.2, 1.0, 0.85, 0.75, 0.65]
starts = [0.8]
for d in DUR[:-1]: starts.append(starts[-1] + d)
hits = [s + 0.7 * d for s, d in zip(starts, DUR)]
pass_s = starts[-1] + DUR[-1]
dur = 16.2
m = Mix(dur)
beat = 0.5
roots = [110.0, 87.31, 130.81, 98.0]
for i in range(int(dur / beat)):
    s = i * beat
    m.place(kick(), s, 0.4)
    if i % 4 in (1, 3): m.place(clap(), s, 0.22)
    m.place(hat(), s + beat / 2, 0.25, pan=0.2)
    m.place(note(roots[(i // 4) % 4], beat * 0.85) * np.exp(-t(beat * 0.85) * 3), s, 0.2)
for h in hits:
    m.place(thud(), h, 0.9)
    m.place(impact(), h, 0.55)
    m.place(whoosh(0.5), h - 0.5, 0.25)
m.place(riser(1.0), pass_s - 1.0, 0.4)
m.place(pop(500, 1800, 0.5), pass_s + 1.6, 0.8)
m.write(sys.argv[1])
print('wrote', sys.argv[1])
