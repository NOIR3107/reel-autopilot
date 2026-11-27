#!/usr/bin/env python3
"""Bed for the gun-loop + lyric reel on the original reel's timeline (voice added after, by tools/voiceover.py).
0-8.4 s: hook sound design (from public/gungrowth-bed.wav). In the narration gaps: a dark pad and a soft sub pulse.
The user's own recording supplies only the "love me" moments and its final seconds (SONG below, source -> place).
python3 tools/gunlove_audio.py <recording.wav 48k stereo> <out.wav>"""
import sys, os
from synth import *
from scipy.io import wavfile

TOTAL, HOOK = 40.7, 8.4
SONG = [(11.1, 13.85, 11.15), (17.3, 20.0, 17.3), (25.75, 28.5, 25.7), (35.0, 40.66, 35.0)]
VO_GAPS = [(8.4, 11.15), (13.85, 17.3), (20.0, 25.7), (28.5, 35.0)]
here = os.path.dirname(os.path.abspath(__file__))
m = Mix(TOTAL)

sr, bed = wavfile.read(f'{here}/../public/gungrowth-bed.wav')
bed = bed.astype(float) / 32767
n = int(HOOK * SR)
fade = np.ones(n); fade[-int(0.08 * SR):] = np.linspace(1, 0, int(0.08 * SR))
m.L[:n] += bed[:n, 0] * fade; m.R[:n] += bed[:n, 1] * fade

def pad(sec, freqs):
    tt = t(sec)
    x = sum(filt(note(f, sec, 0.005), 'lowpass', 700) for f in freqs) / len(freqs)
    env = np.minimum(1, tt / 0.4) * np.minimum(1, (sec - tt) / 0.3)
    return x * env
CHORDS = [[110, 130.81, 164.81], [87.31, 110, 130.81], [65.41, 98, 130.81], [98, 123.47, 146.83]]
for k, (a, b) in enumerate(VO_GAPS):
    m.place(pad(b - a, CHORDS[k % 4]), a, 0.32)
    for i in range(int((b - a) / 0.75)):  # soft sub pulse under the narration
        tt = t(0.5)
        m.place(np.sin(2 * np.pi * np.cumsum(np.geomspace(90, 45, len(tt))) / SR) * np.exp(-tt * 7), a + i * 0.75, 0.45)
    m.place(whoosh(0.5), b - 0.45, 0.25)

rsr, rec = wavfile.read(sys.argv[1])
rec = rec.astype(float) / 32767
assert rsr == SR
for s0, s1, at in SONG:
    seg = rec[int(s0 * SR):int(s1 * SR)].copy()
    f = int(0.03 * SR); seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
    i = int(at * SR); seg = seg[: m.n - i]
    m.L[i:i + len(seg)] += seg[:, 0] * 1.1; m.R[i:i + len(seg)] += seg[:, 1] * 1.1
m.write(sys.argv[2], fade=0.6)
print('wrote', sys.argv[2])
