"""Voiceover, score and sound effects for a story reel. Scene lengths come from the voiceover, so this
also writes the render props with each scene's seconds filled in.

usage: python3 tools/story_sound.py queue/DATE.json PROPS_OUT.json   (writes public/story-sound.wav)
Needs kokoro-onnx and the two Kokoro model files in $KOKORO_DIR (default models/kokoro).
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro
from synth import Mix, SR, t, kick, clap, hat, riser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KD = os.environ.get('KOKORO_DIR', os.path.join(ROOT, 'models/kokoro'))
SFX = os.path.join(ROOT, 'public/sfx/')


def sfx(name):
    a, sr = sf.read(SFX + name, always_2d=True)
    return resample_poly(a.mean(axis=1), SR, sr)


def piano(hz, sec):
    tt = t(sec)
    x = sum(np.sin(2 * np.pi * hz * h * tt) / h ** 1.6 for h in (1, 2, 3, 4))
    return x * np.exp(-tt * 2.2) * (1 - np.exp(-tt * 300))


def sub(hz, sec, glide=None):
    tt = t(sec)
    f = np.linspace(hz, glide, len(tt)) if glide else np.full_like(tt, hz)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 0.9) * (1 - np.exp(-tt * 200))


def main(queue_file, props_out):
    script = json.load(open(queue_file))
    p = script['props']
    k = Kokoro(os.path.join(KD, 'kokoro-v1.0.onnx'), os.path.join(KD, 'voices-v1.0.bin'))
    vo, scenes, parts = [], [], []
    for sc in p['scenes']:
        s, sr = k.create(sc['vo'], voice=sc.get('voice', 'am_michael'), speed=1.18, lang='en-us')
        s = resample_poly(s, SR, sr)
        sec = len(s) / SR + 0.12 + (0.4 if sc.get('part') == 'hook' else 0) + (1.2 if sc.get('cta') else 0)
        sec = round(sec, 2)
        vo.append(np.pad(s, (0, int(sec * SR) - len(s))))
        out = {k2: v for k2, v in sc.items() if k2 not in ('voice', 'part')}
        out['sec'] = sec
        if sc.get('cta'): out.pop('vo', None)  # spoken, not shown
        scenes.append(out)
        parts.append(sc.get('part', 'drop'))
    starts = np.cumsum([0] + [x['sec'] for x in scenes])
    dur = float(starts[-1])
    vo = np.concatenate(vo)
    vo = np.pad(vo, (0, max(0, int(dur * SR) - len(vo))))[: int(dur * SR)]

    # Dark trap score: 140 bpm, minor piano arpeggio, gliding 808, hats with rolls. Drops follow the story.
    B = 60 / 140
    chords = [[220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7], [164.8, 207.7, 246.9]]
    roots = [55.0, 43.65, 49.0, 41.2]
    part_at = lambda tm: parts[min(len(parts) - 1, int(np.searchsorted(starts, tm, side='right') - 1))]
    m = Mix(dur)
    for bar, b0 in enumerate(np.arange(0, dur, 4 * B)):
        ch, part = chords[bar % 4], part_at(b0)
        for i in range(3):
            for step in range(8):
                m.place(piano(ch[(step + i) % 3] * (2 if step % 4 == 3 else 1), B), b0 + step * B / 2 + i * 0.002, 0.10 / 3)
        if part in ('drop', 'drop2', 'outro'):
            for beat in range(4):
                tb = b0 + beat * B
                if beat in (0, 2): m.place(kick(), tb, 0.8)
                if beat in (1, 3): m.place(clap(), tb, 0.45)
                rolls = 4 if (part == 'drop2' and beat == 3) else 2
                for r in range(rolls): m.place(hat(), tb + r * B / rolls, 0.16 if r else 0.22, pan=0.2)
            m.place(sub(roots[bar % 4], 4 * B - 0.05, glide=roots[(bar + 1) % 4] if bar % 2 else None), b0, 0.55)
        elif part == 'rise':
            for r in range(16): m.place(hat(), b0 + r * B / 4, 0.05 + r * 0.01)
    if 'rise' in parts and 'drop2' in parts:
        a, b = starts[parts.index('rise')], starts[parts.index('drop2')]
        if b > a: m.place(riser(b - a), a, 0.35)

    fxmap = {'closed': [('impact-bass-1.mp3', 8 / 30, 0.9), ('glitch-1.mp3', 8 / 30, 0.35)], 'fail': [('impact-bass-2.mp3', 0, 0.6)],
             'win': [('sparkle.mp3', 0, 0.5), ('impact-bass-1.mp3', 0, 0.5)],
             'ring': [('notification.mp3', 0.2, 0.6), ('notification.mp3', 1.0, 0.5), ('notification.mp3', 1.8, 0.45)]}
    for i, sc in enumerate(scenes):
        if i: m.place(sfx('whoosh-short.mp3'), starts[i] - 0.12, 0.35)
        for tag in sc.get('fx', []) + [sc.get('beat', '')]:
            for name, off, g in fxmap.get(tag, []): m.place(sfx(name), starts[i] + off, g)
    env = np.convolve(np.abs(vo), np.ones(2400) / 2400, mode='same')
    duck = 1 - 0.55 * np.clip(env * 8, 0, 1)  # music sits under the voice
    m.L *= duck
    m.R *= duck
    m.place(vo, 0, 2.4)
    m.write(os.path.join(ROOT, 'public/story-sound.wav'), fade=0.8)
    props = {k2: v for k2, v in p.items() if k2 != 'scenes'}
    json.dump({**props, 'scenes': scenes}, open(props_out, 'w'))
    print(f'story sound {dur:.1f}s, {len(scenes)} scenes')


if __name__ == '__main__':
    main(*sys.argv[1:3])
