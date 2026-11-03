#!/usr/bin/env python3
"""Offline audio synthesis (nothing recorded, nothing paid). numpy/scipy -> WAV -> OGG via ffmpeg. Usage: synth.py <outdir>
Loops are rendered with wrapped tails so they are gapless; every file is peak-normalised to -3 dBFS (sfx) or -6 dBFS (loops)."""
import os, subprocess, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
SR = 32000
rng = np.random.default_rng(7)
def t(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def lp(x, f): b, a = butter(2, f / (SR / 2), 'low'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(SR * d))
def tone(f, d, shape='sin'):
    x = np.sin(2 * np.pi * f * t(d)); return x if shape == 'sin' else np.tanh(2 * x)
def decay(x, k): return x * np.exp(-np.arange(len(x)) / SR * k)
def mix(*parts):
    n = max(len(p) for p in parts); o = np.zeros(n)
    for p in parts: o[:len(p)] += p
    return o
def at(x, off, total): o = np.zeros(int(SR * total)); i = int(SR * off); o[i:i + len(x)] += x[:len(o) - i]; return o
def vary(fn, i): return fn(1 + 0.06 * (i - 1))
SFX = {}
def drawer(p): n = noise(0.35); return mix(decay(lp(n, 500 * p), 9) * 0.9, at(decay(bp(noise(0.1), 800, 2500), 40), 0.28, 0.35) * 0.4)
def door(p): return mix(decay(tone(90 * p, .5), 9) * 0.9, decay(lp(noise(.5), 300), 14) * .6, at(decay(bp(noise(.1), 1500, 4000), 60) * .5, .0, .5))
def lock(p): return mix(decay(bp(noise(.15), 2000 * p, 5000), 60), at(decay(tone(1200 * p, .1, 'tanh') * .3, 50), .05, .15))
def paper(p): return decay(hp(noise(.3), 2500 * p), 12) * np.sin(np.linspace(0, 3, int(SR * .3))) ** 2
def ceramic(p): return mix(*[decay(tone(f * p, .5), 14 + i * 4) * 0.4 for i, f in enumerate((1800, 2700, 4100))], decay(bp(noise(.05), 3000, 8000), 120) * .5)
def keys(p): return mix(*[at(decay(bp(noise(.1), 3000, 9000), 45) * .5, 0.04 * i, .4) for i in range(5)], at(decay(tone(3400 * p, .3), 20) * .2, .02, .4))
def cushion(p): return decay(lp(noise(.3), 400 * p), 16) * env(int(SR * .3), .03, .2)
def step(p): return mix(decay(lp(noise(.12), 700 * p), 40), decay(tone(110 * p, .12), 40) * .5)
def purr(p): n = lp(noise(1.4), 220); return n * (0.55 + 0.45 * np.sin(2 * np.pi * 25 * t(1.4))) * env(len(n), .2, .4)
def tap(p): return decay(tone(660 * p, .12, 'tanh'), 35) * .6
def ok(p): return mix(*[at(decay(tone(f * p, .5), 6) * .4, .08 * i, .8) for i, f in enumerate((523, 659, 784))])
def meow(p): x = t(.5); f = 520 * p * (1 + .25 * np.sin(np.pi * x / .5)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), .06, .2) * .5
for name, fn in dict(drawer=drawer, door=door, lock=lock, paper=paper, ceramic=ceramic, keys=keys, cushion=cushion, step=step, purr=purr, tap=tap, ok=ok, meow=meow).items():
    SFX[name] = fn
def rain(d=12.0):
    n = bp(noise(d), 800, 7000) * 0.5 + lp(noise(d), 300) * .4
    x = n * (0.8 + 0.2 * lp(noise(d), 1.5) / 3)
    k = int(SR * 0.5); x[:k] = x[:k] * np.linspace(0, 1, k) + (x[-k:] * np.linspace(1, 0, k)); return x[:-k]  # crossfade tail into head: gapless
def lofi(bars=8, bpm=72):
    beat = 60 / bpm; total = bars * 4 * beat; o = np.zeros(int(SR * (total + 2)))
    chords = [(220, 261.6, 329.6, 392), (174.6, 220, 261.6, 329.6), (196, 246.9, 293.7, 349.2), (164.8, 207.7, 246.9, 311)]
    for b in range(bars):
        ch = chords[b % 4]; st = b * 4 * beat
        for f in ch:
            pad = (tone(f, 4 * beat + 1) + .5 * tone(f * 2.005, 4 * beat + 1)) * env(int(SR * (4 * beat + 1)), .4, .9) * .09
            o[int(SR * st):int(SR * st) + len(pad)] += pad
        for i, f in enumerate((ch[1] * 2, ch[2] * 2, ch[3] * 2, ch[2] * 2)):
            pl = decay(tone(f, .6), 5) * .12; s = int(SR * (st + i * beat)); o[s:s + len(pl)] += pl
        for i in range(4):
            s = int(SR * (st + i * beat)); k = decay(tone(55, .3), 14) * .3 * (i % 2 == 0); o[s:s + len(k)] += k
            h = decay(hp(noise(.08), 6000), 50) * .05; s2 = s + int(SR * beat / 2); o[s2:s2 + len(h)] += h
    o = lp(o, 5500)   # filter BEFORE wrapping so the filter state cannot create a seam
    n = int(SR * total); out = o[:n].copy(); out[:len(o) - n] += o[n:][:len(out)]   # wrap tail onto head: gapless
    return out
def save(out, name, x, peak_db):
    x = x / max(1e-9, np.abs(x).max()) * 10 ** (peak_db / 20); wav = os.path.join(out, name + '.wav')
    wavfile.write(wav, SR, (x * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', os.path.join(out, name + '.ogg')], check=True); os.remove(wav)
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for name, fn in SFX.items():
        for i in range(3): save(out, f'sfx_{name}_{i + 1}', vary(fn, i), -3)
    save(out, 'amb_rain', rain(), -9); save(out, 'music_lofi_a', lofi(), -9)
    print(len(os.listdir(out)), 'files', sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) // 1024, 'KB')
