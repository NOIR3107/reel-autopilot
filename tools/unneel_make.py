#!/usr/bin/env python3
"""Voice + music for one Unneel ad reel. python3 tools/unneel_make.py <id> -> public/unneel-<id>.wav and /tmp props json.
Each card is spoken by Kokoro (female voice); card length = its line + a short pause, so picture and voice stay in step.
Music: a steady 120 bpm electronic groove under the voice (drums, bass, pad), original, via tools/synth.py."""
import json, os, sys
import numpy as np
from scipy.signal import resample_poly
import soundfile as sf
from kokoro_onnx import Kokoro
from synth import *

ROOT = os.path.join(os.path.dirname(__file__), '..')
ad = next(a for a in json.load(open(f'{ROOT}/data/unneel-ads.json')) if a['id'] == sys.argv[1])
KD = os.environ.get('KOKORO_DIR', f'{ROOT}/models/kokoro')
k = Kokoro(f'{KD}/kokoro-v1.0.onnx', f'{KD}/voices-v1.0.bin')
SR = 44100
voice, cards, starts, acc = [], [], [], 0.0
for c in ad['cards']:
    s, sr = k.create(c['vo'], voice='af_bella', speed=1.08, lang='en-us')
    s = resample_poly(s, SR, sr)
    sec = round(len(s) / SR + (0.9 if c.get('cta') else 0.28), 2)
    starts.append(acc)
    voice.append(np.pad(s, (0, max(0, int(sec * SR) - len(s)))))
    cards.append({'text': c['text'], 'bg': c['bg'], 'cta': bool(c.get('cta')), 'start': round(acc, 2), 'sec': sec})
    acc += sec
dur = acc + 0.5
voice = np.concatenate(voice)
m = Mix(dur)
beat = 60 / 120
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (261.63, 329.63, 392.0), (196.0, 246.94, 293.66)]
roots = [110.0, 87.31, 130.81, 98.0]
for i in range(int(dur / beat)):
    s = i * beat
    bar, pos = divmod(i, 4)
    m.place(kick(), s, 0.5)
    if pos in (1, 3): m.place(clap(), s, 0.28)
    m.place(hat(), s + beat / 2, 0.3, pan=0.25)
    m.place(note(roots[bar % 4], beat * 0.85) * np.exp(-t(beat * 0.85) * 3), s, 0.22)
    if pos == 0:
        tt = t(4 * beat)
        pad = sum(note(h, 4 * beat, 0.004) for h in chords[bar % 4]) / 3
        m.place(filt(pad, 'lowpass', 1800) * np.minimum(tt / 0.1, 1) * np.minimum((4 * beat - tt) / 0.2, 1), s, 0.16)
for s in starts[1:]:
    m.place(tick(True), s, 0.35)
    m.place(whoosh(0.35), s - 0.12, 0.18)
m.place(pop(500, 1500, 0.5), starts[-1] + 0.2, 0.5)
for s, c in zip(starts, cards):  # voice on top
    pass
m.place(voice, 0, 1.0)
out = f'{ROOT}/public/unneel-{ad["id"]}.wav'
m.write(out)
json.dump({'cards': cards, 'audio': f'unneel-{ad["id"]}.wav', 'sec': round(dur, 2)}, open(f'/tmp/unneel-{ad["id"]}.json', 'w'))
print(ad['id'], round(dur, 1), 's')
