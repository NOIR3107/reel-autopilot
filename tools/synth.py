"""Shared synth helpers for reel soundtracks: drums, effects, notes, and a stereo mix bus."""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)
f = lambda frame: frame / 30.0  # frame -> seconds


def t(sec):
    return np.arange(int(SR * sec)) / SR


def filt(x, kind, freq, order=2):
    return sosfilt(butter(order, freq, btype=kind, fs=SR, output='sos'), x)


def sweep(f0, f1, sec):
    freqs = np.geomspace(f0, f1, int(SR * sec))
    return np.sin(2 * np.pi * np.cumsum(freqs) / SR)


def kick():
    tt = t(0.45)
    return sweep(160, 42, 0.45) * np.exp(-tt * 9) * 0.9 + filt(rng.standard_normal(len(tt)), 'highpass', 3000) * np.exp(-tt * 120) * 0.15


def clap():
    tt = t(0.25)
    n = filt(rng.standard_normal(len(tt)), 'bandpass', [900, 3200])
    e = sum(np.exp(-np.maximum(tt - d, 0) * 60) * (tt >= d) for d in (0, 0.012, 0.024)) / 3
    return n * e * 0.5


def hat(open_=False):
    tt = t(0.2)
    return filt(rng.standard_normal(len(tt)), 'highpass', 7500) * np.exp(-tt * (18 if open_ else 70)) * 0.22


def tick(hi):
    tt = t(0.03)
    return filt(rng.standard_normal(len(tt)), 'bandpass', [2500, 6000] if hi else [1500, 3500]) * np.exp(-tt * 300) * 0.5


def whoosh(sec=0.7):
    tt = t(sec)
    n = rng.standard_normal(len(tt))
    out = np.zeros_like(n)
    seg = len(n) // 12
    for k in range(12):  # bandpass that sweeps up then down
        c = 500 + 2600 * np.sin(np.pi * (k + 0.5) / 12)
        out[k * seg:(k + 1) * seg] = filt(n, 'bandpass', [c * 0.6, c * 1.4])[k * seg:(k + 1) * seg]
    return out * np.sin(np.pi * tt / sec) ** 2 * 0.5


def thud():
    tt = t(0.5)
    return (sweep(110, 60, 0.5) * 0.8 + np.sin(2 * np.pi * 233 * tt) * 0.15) * np.exp(-tt * 7)


def pop(f0=700, f1=1400, g=0.35):
    tt = t(0.12)
    return sweep(f0, f1, 0.12) * np.exp(-tt * 40) * g


def riser(sec):
    tt = t(sec)
    n = rng.standard_normal(len(tt))
    out = np.zeros_like(n)
    steps = 24
    seg = len(n) // steps
    for k in range(steps):
        c = 300 * (20 ** (k / steps))
        out[k * seg:(k + 1) * seg] = filt(n, 'bandpass', [c * 0.7, min(c * 1.3, 20000)])[k * seg:(k + 1) * seg]
    ramp = (tt / sec) ** 2
    return (out * 0.45 + sweep(180, 1500, sec) * 0.18) * ramp


def impact():
    tt = t(2.0)
    return sweep(70, 32, 2.0) * np.exp(-tt * 2.2) * 1.0 + filt(rng.standard_normal(len(tt)), 'lowpass', 2500) * np.exp(-tt * 5) * 0.5


def note(hz, sec, detune=0.0):
    tt = t(sec)
    saw = lambda fr: 2 * ((tt * fr) % 1) - 1
    return (saw(hz * (1 + detune)) + saw(hz * (1 - detune)) + 0.5 * saw(hz / 2)) / 2.5




class Mix:
    def __init__(self, dur):
        self.n = int(SR * dur)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def place(self, sig, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        if i >= self.n:
            return
        if i < 0:  # starts before 0:00, keep only the audible tail
            sig, i = sig[-i:], 0
        sig = sig[: self.n - i] * gain
        self.L[i:i + len(sig)] += sig * (1 - max(pan, 0))
        self.R[i:i + len(sig)] += sig * (1 + min(pan, 0))

    def write(self, path, fade=1.2):
        f = np.ones(self.n)
        f[-int(SR * fade):] = np.linspace(1, 0, int(SR * fade))
        mix = np.tanh(np.stack([self.L, self.R], axis=1) * f[:, None] * 1.2)
        mix /= np.max(np.abs(mix)) / 0.89
        assert np.isfinite(mix).all()
        wavfile.write(path, SR, (mix * 32767).astype(np.int16))
