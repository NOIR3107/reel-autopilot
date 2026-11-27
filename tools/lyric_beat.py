#!/usr/bin/env python3
"""Original moody half-time beat for a lyric reel, timed from its JSON script (bpm, segments, tail).
Soft electric-piano chords from the start, 808 + drums drop in on the first hook, a riser into every hook.
python3 tools/lyric_beat.py data/lyric-growth.json public/lyric-growth.wav"""
import sys, json
from synth import *

sc = json.load(open(sys.argv[1]))
beat = 60 / sc['bpm']
last = sc['segments'][-1]
total_beats = last['beat'] + last['beats'] + sc['tail']
m = Mix(total_beats * beat)
hooks = [s['beat'] for s in sc['segments'] if s.get('hook')]
drop = hooks[0] * beat

def keys(freqs, sec):  # mellow electric piano: sine + soft bell partial, slow decay
    tt = t(sec)
    return sum(np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 6) for f in freqs) / len(freqs) * np.exp(-tt * 1.4)

def eight08(hz, sec):
    tt = t(sec)
    ph = 2 * np.pi * np.cumsum(hz * (1 + 0.6 * np.exp(-tt * 30))) / SR
    return np.tanh(np.sin(ph) * 2.2) * np.exp(-tt * 1.1) * 0.8

# A minor: Am9 - Fmaj7 - C - G6, one chord per 2 beats (one lyric line each)
A = 110.0
CH = [[A * 2, 261.63, 329.63, 392.0, 493.88], [174.61, 220.0, 261.63, 329.63], [130.81, 196.0, 261.63, 329.63], [196.0, 246.94, 293.66, 329.63]]
ROOT = [55.0, 43.65, 65.41, 49.0]
for b in range(0, total_beats - 1, 2):
    k = (b // 2) % 4
    m.place(keys(CH[k], beat * 2.3), b * beat, 0.42)
    m.place(filt(note(CH[k][1] / 2, beat * 2, 0.004), 'lowpass', 900) * np.linspace(0.2, 1, int(SR * beat * 2)) ** 0.5, b * beat, 0.09)  # pad
    if b * beat >= drop - 0.01 and b < total_beats - sc['tail']:
        m.place(eight08(ROOT[k], beat * 1.9), b * beat, 0.85)
        m.place(eight08(ROOT[k], beat * 0.6), (b + 1.5) * beat, 0.5)

end_drums = (total_beats - sc['tail']) * beat
for i in range(int(total_beats * 2)):
    at = i * beat / 2
    if at >= end_drums:
        break
    if at < drop:  # before the drop: only a quiet tick on the beat
        if i % 2 == 0 and at > beat * 0.9:
            m.place(hat(), at, 0.35)
        continue
    m.place(hat(), at, 0.55, pan=0.15)
    if i % 8 == 7:  # triplet roll at the end of every bar
        for r in range(1, 3):
            m.place(hat(), at + r * beat / 6, 0.4, pan=0.15)
    if i % 4 == 0:
        m.place(kick(), at, 0.95)
    if i % 4 == 2:
        m.place(clap(), at, 0.8)
        m.place(clap(), at + 0.012, 0.3, pan=-0.3)

for h in hooks:
    m.place(riser(beat * 2) * 0.6, h * beat - beat * 2, 0.35)
    m.place(impact(), h * beat, 0.45)
m.write(sys.argv[2], fade=beat * 2)
print('wrote', sys.argv[2], round(total_beats * beat, 2), 's')
