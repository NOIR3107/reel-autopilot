#!/usr/bin/env python3
"""Soundtrack bed for the gun-hook + lyric reel (voice is added after, by tools/voiceover.py).
Hook: low drone, one gunshot, a metallic whir that climbs as the bullet runs the loop, a hit of silence before the drop.
Then the original lyric beat (tools/lyric_beat.py) starts at the cut.
python3 tools/gungrowth_audio.py data/lyric-growth2.json public/gungrowth-bed.wav"""
import sys, subprocess, os
from synth import *
from scipy.io import wavfile

HOOK, SHOT, ENTER, LOOP_END = 8.4, 0.45, 2.5, 7.8
here = os.path.dirname(os.path.abspath(__file__))
beat_path = '/tmp/gungrowth-beat.wav'
subprocess.run([sys.executable, f'{here}/lyric_beat.py', sys.argv[1], beat_path], check=True)
sr, beat = wavfile.read(beat_path)
beat = beat.astype(float) / 32767
m = Mix(HOOK + len(beat) / sr)

# drone: two detuned low saws, filtered, swelling
tt = t(HOOK)
drone = filt(note(55, HOOK, 0.006), 'lowpass', 300) * np.minimum(1, tt / 1.5) * (0.6 + 0.4 * tt / HOOK)
m.place(drone, 0, 0.35)
# gunshot: sharp crack + body + tail
crack = filt(rng.standard_normal(int(SR * 0.6)), 'bandpass', [700, 6000]) * np.exp(-t(0.6) * 22)
m.place(crack, SHOT, 1.0); m.place(thud(), SHOT, 0.9); m.place(impact(), SHOT, 0.35)
# shell casing tinks
for k, d in enumerate((1.25, 1.42, 1.53)):
    tk = np.sin(2 * np.pi * (5200 - k * 400) * t(0.15)) * np.exp(-t(0.15) * 40)
    m.place(tk, SHOT + d, 0.18 / (k + 1))
# bullet in the tube: a metallic whir whose pitch climbs, panning round the loop
n = int(SR * (LOOP_END - ENTER))
fr = np.geomspace(180, 900, n)
whir = np.sin(2 * np.pi * np.cumsum(fr) / SR) * filt(rng.standard_normal(n), 'bandpass', [1500, 5000]) * 0.5 + np.sin(2 * np.pi * np.cumsum(fr * 2.01) / SR) * 0.3
whir *= np.minimum(1, np.linspace(0, 6, n)) * np.linspace(0.5, 1, n)
for i, s in enumerate(np.array_split(whir, 40)):
    m.place(s, ENTER + i * (LOOP_END - ENTER) / 40, 0.45, pan=float(np.sin(i / 40 * 2 * np.pi)) * 0.7)
m.place(riser(1.2), HOOK - 1.2, 0.35)
# the beat drops at the cut
m.L[int(HOOK * SR):int(HOOK * SR) + len(beat)] += beat[:, 0] * 0.9
m.R[int(HOOK * SR):int(HOOK * SR) + len(beat)] += beat[:, 1] * 0.9
m.write(sys.argv[2], fade=1.5)
print('wrote', sys.argv[2], round(m.n / SR, 2))
