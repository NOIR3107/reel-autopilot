#!/usr/bin/env python3
"""Soundtrack for src/reels/Arena.jsx: 128 bpm groove, a laser zap + pop on every shot, a riser into the final stand-off, an impact + pop on the win.
python3 tools/arena_sound.py public/arena-sound.wav <shot times comma-separated> <final> <seconds>"""
import sys
from synth import *

out, shots, final, dur = sys.argv[1], [float(x) for x in sys.argv[2].split(',')], float(sys.argv[3]), float(sys.argv[4])
m = Mix(dur)
beat = 60 / 128
roots = [110.0, 87.31, 130.81, 98.0]
for i in range(int(dur / beat)):
    s = i * beat
    pos = i % 4
    m.place(kick(), s, 0.6)
    if pos in (1, 3): m.place(clap(), s, 0.35)
    m.place(hat(), s + beat / 2, 0.35, pan=0.25)
    m.place(note(roots[(i // 4) % 4], beat * 0.85) * np.exp(-t(beat * 0.85) * 3), s, 0.25)
for s in shots:
    m.place(sweep(2600, 300, 0.22) * np.exp(-t(0.22) * 9), s - 0.04, 0.5)
    m.place(pop(500, 1500, 0.4), s + 0.18, 0.7)
m.place(riser(1.6), final - 1.6, 0.6)
for k in range(3):
    m.place(sweep(2200, 200, 0.2) * np.exp(-t(0.2) * 8), final + k * 0.55, 0.45)
m.place(impact(), final + 2.0, 0.8)
m.place(pop(600, 1800, 0.5), final + 2.1, 0.8)
m.write(out)
print('wrote', out, dur)
