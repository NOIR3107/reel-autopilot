#!/usr/bin/env python3
"""Soundtrack for src/reels/Ring.jsx: a plucked note on every wall bounce (climbing a pentatonic scale, like the viral
ball-in-circle videos), a zip on every line cut, a pop + thud on every knockout, a riser and impact on the win.
python3 tools/ring_sound.py public/ring-sound.wav events.json"""
import sys, json
from synth import *

out, ev = sys.argv[1], json.load(open(sys.argv[2]))
m = Mix(ev['seconds'])
scale = [0, 2, 4, 7, 9]
def pluck(hz, sec=0.5):
    tt = t(sec)
    return (np.sin(2 * np.pi * hz * tt) + 0.35 * np.sin(4 * np.pi * hz * tt) + 0.12 * np.sin(6 * np.pi * hz * tt)) * np.exp(-tt * 9)
for k, s in enumerate(ev['bounces']):
    st = scale[k % 5] + 12 * ((k // 5) % 3)
    m.place(pluck(261.63 * 2 ** (st / 12)), s, 0.32, pan=0.3 * np.sin(k))
for s in ev['cuts']:
    m.place(sweep(3200, 900, 0.09) * np.exp(-t(0.09) * 30), s, 0.22)
# soft pulse bed so it never feels empty
beat = 60 / 120
for i in range(int(ev['end'] / beat)):
    m.place(kick(), i * beat, 0.28)
    m.place(hat(), i * beat + beat / 2, 0.18, pan=0.2)
for s in ev['outs'][:-1]:
    m.place(pop(500, 1600, 0.5), s, 0.8)
    m.place(thud(), s, 0.6)
end = ev['end']
m.place(riser(1.5), end - 1.5, 0.5)
m.place(impact(), end, 0.9)
m.place(pop(600, 1800, 0.5), end + 0.05, 0.8)
for k, st in enumerate([0, 4, 7, 12]):
    m.place(pluck(261.63 * 2 ** (st / 12), 1.4), end + 0.3 + k * 0.12, 0.35)
m.write(out)
print('wrote', out, ev['seconds'])
