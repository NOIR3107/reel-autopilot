#!/usr/bin/env python3
"""Soundtracks for src/reels/MikeEpisode.jsx, timed from mike-episodes.json: a bouncy major-key pluck loop,
a whoosh per scene, a sad 'wah-wah' on fail beats, a rising chime on wins, a ringtone, stamp hits, CTA pop.
python3 tools/mike_sound.py <story|skit|myth|queue/<date>.json> public/mike-<ep>.wav"""
import json
import os
import sys
from synth import *

ep, out = sys.argv[1], sys.argv[2]
# ep is a built-in sample name, or a path to a reel script whose props carry {"scenes": [...]}
scenes = (json.load(open(ep))['props']['scenes'] if ep.endswith('.json')
          else json.load(open(os.path.join(os.path.dirname(__file__), '..', 'src', 'reels', 'mike-episodes.json')))[ep]['scenes'])
DUR = sum(s['sec'] for s in scenes)
m = Mix(DUR)


def pluck(hz, sec=0.4):
    tt = t(sec)
    x = sum(np.sin(2 * np.pi * hz * k * tt) / k ** 1.6 for k in (1, 2, 3))
    return x * np.exp(-tt * 9) * np.minimum(tt / 0.003, 1)


def wahwah():
    out_ = np.zeros(int(SR * 1.4))  # second note starts at 0.6s and runs 0.75s
    for j, (a, b) in enumerate([(311.13, 293.66), (293.66, 233.08)]):
        tt = t(0.55 if j == 0 else 0.75)
        tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(a, b, len(tt))) / SR) * (1 + 0.3 * np.sin(2 * np.pi * 6 * tt))
        tone = filt(np.sign(tone) * np.abs(tone) ** 0.6, 'lowpass', 1400) * np.minimum(tt / 0.03, 1) * np.exp(-tt * 1.5)
        i = int(SR * 0.6 * j)
        out_[i:i + len(tone)] += tone
    return out_


def ringtone(sec):
    tt = t(sec)
    tone = np.where((tt * 12).astype(int) % 2 == 0, np.sin(2 * np.pi * 1320 * tt), np.sin(2 * np.pi * 1760 * tt))
    gate = ((tt % 1.0) < 0.6).astype(float)
    return tone * gate * 0.5


# bouncy loop, 108 bpm, C - Am - F - G
beat = 60 / 108
prog = [(261.63, 329.63, 392.0), (220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66)]
for i in range(int(DUR / beat)):
    s = i * beat
    bar, pos = divmod(i, 4)
    ch = prog[bar % 4]
    m.place(filt(kick(), 'lowpass', 1200), s, 0.45 if pos in (0, 2) else 0)
    if pos in (1, 3):
        m.place(clap(), s, 0.25)
    m.place(pluck(ch[0] / 2, 0.5), s, 0.3)
    m.place(pluck(ch[(i * 2) % 3] * 2, 0.3), s + beat / 2, 0.16, pan=0.25)
    m.place(pluck(ch[(i * 2 + 1) % 3] * 2, 0.3), s, 0.16, pan=-0.25)

start = 0.0
for sc in scenes:
    if start > 0:
        m.place(whoosh(0.45), start - 0.12, 0.35)
    if sc.get('beat') == 'fail':
        m.place(wahwah(), start + 0.5, 0.5)
    if sc.get('beat') == 'win':
        for j, h in enumerate((523.25, 659.25, 783.99, 1046.5)):
            m.place(pluck(h, 0.6), start + 0.2 + j * 0.09, 0.4)
    if sc.get('beat') == 'ring':
        m.place(ringtone(sc['sec'] - 0.4), start + 0.1, 0.35)
    if sc.get('stamp'):
        m.place(thud(), start + 40 / 30, 0.7)
        m.place(clap(), start + 40 / 30, 0.5)
    if sc.get('cta'):
        m.place(pop(500, 1500, 0.5), start + 14 / 30, 0.8)
    start += sc['sec']

m.write(out)
print(f'wrote {out}: {DUR}s')
