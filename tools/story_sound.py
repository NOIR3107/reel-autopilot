"""Voiceover, score and sound effects for a story reel. Scene lengths come from the voiceover, so this
also writes the render props with each scene's seconds filled in.

usage: python3 tools/story_sound.py queue/DATE.json PROPS_OUT.json   (writes public/story-sound.wav)
Needs kokoro-onnx and the two Kokoro model files in $KOKORO_DIR (default models/kokoro).
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro
from synth import Mix, SR, t, kick, clap, hat, riser, thud

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KD = os.environ.get('KOKORO_DIR', os.path.join(ROOT, 'models/kokoro'))
SFX = os.path.join(ROOT, 'public/sfx/')


VOICE = {'narrator': 'am_adam', 'mike': 'am_michael', 'dan': 'am_eric', 'rob': 'am_onyx', 'tony': 'am_fenrir', 'luis': 'am_liam',
         'sarah': 'af_heart', 'maya': 'af_nova', 'karen': 'af_bella', 'vince': 'am_puck', 'kai': 'am_echo', 'leo': 'am_liam', 'mara': 'af_nicole', 'host': 'am_adam', 'ava': 'af_nicole'}


def sfx(name):
    a, sr = sf.read(SFX + name, always_2d=True)
    return resample_poly(a.mean(axis=1), SR, sr)


def groan(sec=1.6, seed=0):
    tt = t(sec)
    rng = np.random.default_rng(seed)
    f = 70 + 25 * np.sin(2 * np.pi * 1.3 * tt) + 10 * rng.standard_normal(len(tt)).cumsum() / np.sqrt(len(tt))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.6 * np.sin(2 * np.pi * 7 * tt))
    x = np.tanh(3 * x) + 0.3 * rng.standard_normal(len(tt))
    from scipy.signal import butter, lfilter
    b, a = butter(2, 900 / (SR / 2))
    return lfilter(b, a, x) * np.sin(np.pi * tt / sec) ** 0.5


def piano(hz, sec):
    tt = t(sec)
    x = sum(np.sin(2 * np.pi * hz * h * tt) / h ** 1.6 for h in (1, 2, 3, 4))
    return x * np.exp(-tt * 2.2) * (1 - np.exp(-tt * 300))


def sub(hz, sec, glide=None):
    tt = t(sec)
    f = np.linspace(hz, glide, len(tt)) if glide else np.full_like(tt, hz)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 0.9) * (1 - np.exp(-tt * 200))


def score(m, style, dur, starts, parts):
    """Four music beds. Every one follows the story: quiet on the twist (break), building on rise, biggest on the win (drop2)."""
    part_at = lambda tm: parts[min(len(parts) - 1, int(np.searchsorted(starts, tm, side='right') - 1))]
    if style == 'funk':  # bright, bouncy, major key, 112 bpm
        B, chords, roots = 60 / 112, [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]], [65.4, 55.0, 43.65, 49.0]
    elif style == 'suspense':  # cinematic, slow pulse, 90 bpm
        B, chords, roots = 60 / 90, [[146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [130.8, 155.6, 196.0], [110.0, 138.6, 164.8]], [36.7, 29.1, 32.7, 27.5]
    elif style == 'lofi':  # chill, swung, 84 bpm
        B, chords, roots = 60 / 84, [[261.6, 329.6, 392.0, 493.9], [220.0, 261.6, 329.6, 392.0], [174.6, 220.0, 261.6, 329.6], [196.0, 246.9, 293.7, 349.2]], [65.4, 55.0, 43.65, 49.0]
    else:  # trap: dark minor, 140 bpm
        B, chords, roots = 60 / 140, [[220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7], [164.8, 207.7, 246.9]], [55.0, 43.65, 49.0, 41.2]
    for bar, b0 in enumerate(np.arange(0, dur, 4 * B)):
        ch, part = chords[bar % 4], part_at(b0)
        big = part in ('drop', 'drop2', 'outro', 'hook') and not (style == 'trap' and part == 'hook')
        if style == 'suspense':
            pad = sum(np.sin(2 * np.pi * hz * t(4 * B)) for hz in ch) / len(ch)
            m.place(pad * np.minimum(1, t(4 * B) * 2) * np.minimum(1, (4 * B - t(4 * B)) * 3), b0, 0.12)
            for beat in range(4):
                m.place(sub(roots[bar % 4], B * 0.9), b0 + beat * B, 0.35 if big else 0.18)
            if big: m.place(kick(), b0, 0.9); m.place(kick(), b0 + 2.5 * B, 0.6)
            if part == 'drop2':
                for r in range(8): m.place(hat(), b0 + r * B / 2, 0.12)
            continue
        steps = 8 if style != 'lofi' else 4
        for step in range(steps):
            notes = ch if style == 'lofi' else [ch[step % len(ch)] * (2 if step % 4 == 3 else 1)]
            for hz in notes:
                m.place(piano(hz, B * (2 if style == 'lofi' else 1)), b0 + step * 4 * B / steps, (0.05 if style == 'lofi' else 0.10) / (1 if len(notes) == 1 else 2))
        if part == 'rise':
            for r in range(16): m.place(hat(), b0 + r * B / 4, 0.05 + r * 0.01)
            continue
        if not big and part != 'hook':
            continue
        if style == 'funk' and big:  # the earworm: a bright 2-bar pentatonic riff on top
            riff = [(0, 659.3), (0.5, 784.0), (1, 880.0), (1.5, 784.0), (2.5, 659.3), (3, 587.3), (3.5, 523.3)] if bar % 2 == 0 else \
                   [(0, 587.3), (0.5, 659.3), (1, 784.0), (2, 1046.5), (2.5, 880.0), (3, 784.0)]
            for at, hz in riff:
                tt = t(B * 0.45); pl = (np.sign(np.sin(2 * np.pi * hz * tt)) * 0.35 + np.sin(2 * np.pi * hz * 2 * tt) * 0.4) * np.exp(-tt * 9) * (1 - np.exp(-tt * 400))
                m.place(pl, b0 + at * B, 0.10, pan=0.15)
        for beat in range(4):
            tb = b0 + beat * B
            swing = B * 0.12 if style == 'lofi' else 0
            if style == 'funk':
                if beat in (0, 2): m.place(kick(), tb, 0.75)
                if beat == 3: m.place(kick(), tb + B / 2, 0.5)
                if beat in (1, 3): m.place(clap(), tb, 0.5)
                for r in range(4): m.place(hat(open_=(r == 2)), tb + r * B / 4, 0.12, pan=-0.2)
                m.place(sub(roots[bar % 4] * (2 if beat % 2 else 1), B * 0.45), tb + B / 2 * (beat % 2), 0.45)
            elif style == 'lofi':
                if beat in (0, 2): m.place(kick(), tb, 0.55)
                if beat in (1, 3): m.place(clap(), tb, 0.25)
                m.place(hat(), tb, 0.08); m.place(hat(), tb + B / 2 + swing, 0.06)
            else:
                if beat in (0, 2): m.place(kick(), tb, 0.8)
                if beat in (1, 3): m.place(clap(), tb, 0.45)
                rolls = 4 if (part == 'drop2' and beat == 3) else 2
                for r in range(rolls): m.place(hat(), tb + r * B / rolls, 0.16 if r else 0.22, pan=0.2)
        if style == 'trap':
            m.place(sub(roots[bar % 4], 4 * B - 0.05, glide=roots[(bar + 1) % 4] if bar % 2 else None), b0, 0.55)
        elif style == 'lofi':
            m.place(sub(roots[bar % 4], 4 * B - 0.1), b0, 0.3)
    if style == 'lofi':  # vinyl crackle
        n = np.zeros(m.n); idx = np.random.default_rng(3).integers(0, m.n, int(dur * 40)); n[idx] = np.random.default_rng(4).uniform(-1, 1, len(idx))
        m.L += n * 0.05; m.R += n * 0.05
    if 'rise' in parts and 'drop2' in parts:
        a, b = starts[parts.index('rise')], starts[parts.index('drop2')]
        if b > a: m.place(riser(b - a), a, 0.35)


def main(queue_file, props_out):
    script = json.load(open(queue_file))
    p = script['props']
    # Pre-made human voice lines (tools/chatter_vo.py) win over Kokoro when they exist.
    vodir = os.environ.get('VO_DIR') or os.path.join(ROOT, 'public/vo', os.path.basename(queue_file)[:-5])
    k = None
    vo, scenes, parts, mouth = [], [], [], []
    narrator = p.get('narrator', VOICE['narrator'])
    for sc in p['scenes']:
        voice = sc.get('voice') or (VOICE.get(sc['speaker'], narrator) if sc.get('speaker') else narrator)
        pre = os.path.join(vodir, f'{len(scenes):02d}.wav')
        if os.path.exists(pre):
            s, sr = sf.read(pre, always_2d=True)
            s = resample_poly(s.mean(axis=1), SR, sr)
            on = np.flatnonzero(np.abs(s) > 0.02 * np.abs(s).max())
            s = s[max(0, on[0] - 800): on[-1] + 2400] / np.abs(s).max() * 0.45  # trim silence, match Kokoro's level
        else:
            k = k or Kokoro(os.path.join(KD, 'kokoro-v1.0.onnx'), os.path.join(KD, 'voices-v1.0.bin'))
            s, sr = k.create(sc['vo'], voice=voice, speed=1.15 if sc.get('speaker') else 1.18, lang='en-us')
            s = resample_poly(s, SR, sr)
        sec = len(s) / SR + 0.12 + (0.4 if sc.get('part') == 'hook' else 0) + (1.2 if sc.get('cta') else 0)
        sec = round(sec, 2)
        vo.append(np.pad(s, (0, int(sec * SR) - len(s))))
        # mouth level per video frame, for lip flap
        hop = SR // 30
        lv = [float(np.sqrt(np.mean(s[j:j + hop] ** 2))) if j < len(s) else 0.0 for j in range(0, int(sec * SR), hop)]
        top = max(lv) or 1
        mouth.append([round(min(1, v / top * 1.3), 2) if sc.get('speaker') else 0 for v in lv])
        out = {k2: v for k2, v in sc.items() if k2 not in ('voice', 'part')}
        out['sec'] = sec
        if sc.get('cta'): out.pop('vo', None)  # spoken, not shown
        scenes.append(out)
        parts.append(sc.get('part', 'drop'))
    starts = np.cumsum([0] + [x['sec'] for x in scenes])
    dur = float(starts[-1])
    vo = np.concatenate(vo)
    vo = np.pad(vo, (0, max(0, int(dur * SR) - len(vo))))[: int(dur * SR)]

    m = Mix(dur)
    score(m, p.get('music', 'trap'), dur, starts, parts)

    fxmap = {'closed': [('impact-bass-1.mp3', 8 / 30, 0.9), ('glitch-1.mp3', 8 / 30, 0.35)], 'fail': [('impact-bass-2.mp3', 0, 0.6)],
             'win': [('sparkle.mp3', 0, 0.5), ('impact-bass-1.mp3', 0, 0.5)],
             'ring': [('notification.mp3', 0.2, 0.6), ('notification.mp3', 1.0, 0.5), ('notification.mp3', 1.8, 0.45)],
             'say': [('pop.mp3', 0, 0.5)], 'radio': [('glitch-2.mp3', 0, 0.3), ('glitch-1.mp3', 0.8, 0.2)], 'whip': [('whoosh-cinematic.mp3', -0.1, 0.45)], 'hail': [('glitch-2.mp3', 0, 0.12)]}
    for i, sc in enumerate(scenes):
        if i: m.place(sfx('whoosh-short.mp3'), starts[i] - 0.12, 0.35)
        if 'knock' in sc.get('fx', []):
            for k3, at in enumerate((0.15, 0.45, 0.75, 1.6, 1.9, 2.2)): m.place(thud(), starts[i] + at, 0.9 if k3 < 3 else 0.7)
        if sc.get('layout') == 'horde' or 'groan' in sc.get('fx', []):
            for g in range(3): m.place(groan(1.4 + g * 0.3, seed=i * 7 + g), starts[i] + g * 0.6, 0.35, pan=(-0.5, 0.4, 0)[g])
        for tag in sc.get('fx', []) + [sc.get('beat', ''), 'say' if sc.get('say') else '', 'whip' if sc.get('cam') == 'whip' else '']:
            for name, off, g in fxmap.get(tag, []): m.place(sfx(name), starts[i] + off, g)
    env = np.convolve(np.abs(vo), np.ones(2400) / 2400, mode='same')
    duck = 1 - 0.55 * np.clip(env * 8, 0, 1)  # music sits under the voice
    m.L *= duck
    m.R *= duck
    m.place(vo, 0, 2.4)
    m.write(os.path.join(ROOT, 'public/story-sound.wav'), fade=0.8)
    props = {k2: v for k2, v in p.items() if k2 != 'scenes'}
    json.dump({**props, 'scenes': scenes, 'mouth': mouth}, open(props_out, 'w'))
    print(f'story sound {dur:.1f}s, {len(scenes)} scenes')


if __name__ == '__main__':
    main(*sys.argv[1:3])
