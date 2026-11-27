#!/usr/bin/env python3
"""Add a Kokoro voiceover to a finished clip, ducking its music under the voice.
python3 tools/voiceover.py in.mp4 lines.json out.mp4 [voice] [speed]
lines.json = [[seconds, "text"], ...]; a line that would overlap the previous one is pushed back to start after it."""
import sys, os, json, subprocess, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

src, lines_path, out = sys.argv[1:4]
voice = sys.argv[4] if len(sys.argv) > 4 else 'am_michael'
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.1
KD = os.environ.get('KOKORO_DIR', os.path.expanduser('~/claude-animation-skills/kit/models'))
k = Kokoro(f'{KD}/kokoro-v1.0.onnx', f'{KD}/voices-v1.0.bin')
SR = 48000

tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vn', '-ac', '2', '-ar', str(SR), f'{tmp}/music.wav'], check=True)
music, _ = sf.read(f'{tmp}/music.wav')
vo = np.zeros(len(music))
free = 0.0
for at, text in json.load(open(lines_path)):
    s, sr = k.create(text, voice=voice, speed=speed, lang='en-us')
    s = np.interp(np.arange(int(len(s) * SR / sr)) * sr / SR, np.arange(len(s)), s)  # resample to 48 kHz
    start = max(at, free)
    i = int(start * SR)
    if i >= len(vo):
        print('skipped (past the end):', text); continue
    n = min(len(s), len(vo) - i)
    vo[i:i + n] += s[:n]
    free = start + len(s) / SR + 0.08
    print(f'{start:5.2f}-{free:5.2f}  {text}')

# duck the music to 40% while the voice speaks (smoothed so it breathes, not pumps)
env = np.convolve((np.abs(vo) > 0.01).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')
gain = 1 - 0.6 * np.clip(env * 3, 0, 1)
mix = music * gain[:, None] + (vo / max(1e-6, np.abs(vo).max()) * 0.9)[:, None]
mix /= max(1.0, np.abs(mix).max() / 0.98)
sf.write(f'{tmp}/mix.wav', mix, SR)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-i', f'{tmp}/mix.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out], check=True)
print('wrote', out)
