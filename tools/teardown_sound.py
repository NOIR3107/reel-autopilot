#!/usr/bin/env python3
"""Soundtrack for src/reels/Teardown.jsx (30 fps): a soft lo-fi beat, marker squeaks as circles draw, mouse clicks,
a pop on each fix, whooshes on camera moves. python3 tools/teardown_sound.py public/teardown-sound.wav"""
import sys
from synth import *

DUR = 30.0
m = Mix(DUR)
f = lambda frame: frame / 30.0
FIX_STARTS, BA, CTA = [90, 300, 510], 720, 800


def keys(hz, sec):  # soft electric-piano tone
    tt = t(sec)
    x = np.sin(2 * np.pi * hz * tt) + 0.35 * np.sin(2 * np.pi * hz * 2 * tt) * np.exp(-tt * 4)
    return x * np.exp(-tt * 1.6) * (1 + 0.15 * np.sin(2 * np.pi * 5 * tt)) * np.minimum(tt / 0.01, 1)


def squeak(sec=0.6):
    tt = t(sec)
    return filt(rng.standard_normal(len(tt)), 'bandpass', [2500, 5500]) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * np.sin(np.pi * tt / sec) * 0.35


def click():
    tt = t(0.04)
    return filt(rng.standard_normal(len(tt)), 'bandpass', [1800, 4000]) * np.exp(-tt * 250)


# lo-fi groove, 88 bpm, swung hats, Fmaj7 - Em7 - Dm7 - Cmaj7
beat = 60 / 88
chords = [(174.61, 220.0, 261.63, 329.63), (164.81, 196.0, 246.94, 293.66), (146.83, 174.61, 220.0, 261.63), (130.81, 164.81, 196.0, 246.94)]
for i in range(int(DUR / beat)):
    s = i * beat
    bar, pos = divmod(i, 4)
    if pos in (0, 2):
        m.place(filt(kick(), 'lowpass', 900), s, 0.6)
    if pos in (1, 3):
        m.place(filt(clap(), 'lowpass', 2500), s, 0.35)
    m.place(hat(), s + beat * 0.58, 0.28, pan=0.2)
    if pos == 0:
        for h in chords[bar % 4]:
            m.place(keys(h, 4 * beat), s, 0.09, pan=-0.1)

for fs in FIX_STARTS:
    m.place(whoosh(0.5), f(fs) - 0.1, 0.4)
    m.place(squeak(), f(fs + 30), 0.6)
    m.place(click(), f(fs + 100), 0.9)
    m.place(pop(700, 1600, 0.4), f(fs + 110), 0.8)
m.place(pop(400, 900, 0.3), f(42), 0.6)  # chat pop-up appears
m.place(whoosh(0.7), f(BA + 8), 0.5)
m.place(whoosh(0.6), f(CTA), 0.45)
m.place(pop(500, 1500, 0.5), f(CTA + 26), 0.8)

m.write(sys.argv[1])
print(f'wrote {sys.argv[1]}: {DUR}s')
