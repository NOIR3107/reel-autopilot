#!/usr/bin/env python3
"""Synthesize the ad's soundtrack, timed to the frames in src/ad/Ad.jsx (30 fps).
Original sound, no samples: python3 tools/ad_sound.py public/ad-sound.wav"""
import sys
from synth import *

DUR = 36.0
m = Mix(DUR)
place = m.place
f = lambda frame: frame / 30.0  # frame -> seconds

# ---- 0 to frame 340: tension. Low drone + a ticking clock while the old site fails.
tt = t(f(345))
drone = (np.sin(2 * np.pi * 55 * tt) + 0.5 * np.sin(2 * np.pi * 82.4 * tt)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt))
drone += filt(rng.standard_normal(len(tt)), 'lowpass', 300) * 0.3
place(drone * np.minimum(tt / 0.5, 1) * np.minimum((f(345) - tt) / 0.3, 1), 0, 0.22)
for k, s in enumerate(np.arange(0.0, f(270), 0.5)):
    place(tick(k % 2 == 0), s, 0.5, pan=0.3 if k % 2 else -0.3)
for fr in (92, 150, 210):  # each red X
    place(thud(), f(fr), 0.6)
    place(whoosh(0.5), f(fr) - 0.25, 0.5)

# ---- riser into the wipe, impact on the reveal
place(riser(f(340) - f(270)), f(270), 0.9)
place(impact(), f(340), 0.9)

# ---- groove from the reveal to the end: 120 bpm, Am - F - C - G
beat = 0.5
start = f(340)
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (130.81, 164.81, 196.0), (196.0, 246.94, 293.66)]
roots = [110.0, 87.31, 65.41, 98.0]
end = 35.0
i = 0
s = start
while s < end:
    bar, pos = divmod(i, 4)
    place(kick(), s, 0.9)
    if pos in (1, 3):
        place(clap(), s, 0.6)
    place(hat(), s + beat / 2, 0.8, pan=0.25)
    if pos == 3:
        place(hat(True), s + beat * 0.75, 0.5, pan=-0.25)
    place(note(roots[bar % 4], beat * 0.9) * np.exp(-t(beat * 0.9) * 3), s, 0.35)
    if pos == 0:
        chord = sum(note(h, 4 * beat, 0.004) for h in chords[bar % 4]) / 3
        tt2 = t(4 * beat)
        env = np.minimum(tt2 / 0.25, 1) * np.minimum((4 * beat - tt2) / 0.3, 1)
        duck = 1 - 0.55 * np.exp(-((tt2 % beat)) * 10)  # pump around each kick
        pad = filt(chord, 'lowpass', 1600) * env * duck
        place(pad, s, 0.32, pan=-0.15)
        place(pad, s + 0.012, 0.32, pan=0.15)
    i += 1
    s = start + i * beat

for fr in (392, 420, 448, 476):  # feature chips
    place(pop(), f(fr), 0.6)
for fr in (548, 660, 812):  # laptop, comparison, CTA
    place(whoosh(0.8), f(fr) - 0.3, 0.6)
place(pop(500, 1600, 0.5), f(870), 0.9)  # WEBSITE pill
place(impact() * 0.4, f(870), 0.5)
place(sum(note(h, 3.0, 0.004) for h in chords[0]) / 3 * np.exp(-t(3.0) * 1.2), 35.0, 0.3)  # final chord

m.write(sys.argv[1])
print(f'wrote {sys.argv[1]}: {DUR}s stereo')
