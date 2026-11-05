"""Shared DSP helpers for the offline audio renderer. Pure numpy/scipy; every sound is synthesised, nothing sampled."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(11)


def reseed(seed):
    global rng
    rng = np.random.default_rng(seed)


def n_(d): return int(round(SR * d))
def t_(d): return np.arange(n_(d)) / SR
def noise(d): return rng.standard_normal(n_(d))


def _sos(kind, f, order=2):
    w = np.clip(np.asarray(f, dtype=float) / (SR / 2), 1e-4, 0.999)
    return butter(order, float(w) if w.ndim == 0 else list(w), kind, output='sos')


def lp(x, f, order=2): return sosfilt(_sos('low', f, order), x)
def hp(x, f, order=2): return sosfilt(_sos('high', f, order), x)
def bp(x, lo, hi, order=2): return sosfilt(_sos('band', [lo, hi], order), x)


def decay(x, k): return x * np.exp(-np.arange(len(x)) / SR * k)


def env(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = max(1, min(n, int(a * SR))), max(1, min(n, int(r * SR)))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def sine(f, d, ph=0.0): return np.sin(2 * np.pi * f * t_(d) + ph)


def sweep(f0, f1, d):
    f = np.geomspace(max(f0, 1), max(f1, 1), n_(d))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def put(dst, x, at_s, g=1.0):
    i = n_(at_s)
    if i >= len(dst): return dst
    m = min(len(x), len(dst) - i)
    dst[i:i + m] += x[:m] * g
    return dst


def silence(d): return np.zeros(n_(d))


def mixdown(*parts):
    n = max(len(p) for p in parts)
    o = np.zeros(n)
    for p in parts: o[:len(p)] += p
    return o


def to_stereo(x, pan=0.0):
    """pan -1..1, equal-power."""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def circ_reverb(x, wet=0.25, rt=1.6, seed=3, damp=3500):
    """Circular (loop-safe) stereo reverb. x: mono 1-D. Returns (N,2). The tail wraps onto the head, so the loop has no seam."""
    r = np.random.default_rng(seed)
    n = len(x)
    out = []
    for ch in range(2):
        m = min(n, int(rt * SR))
        ir = r.standard_normal(m) * np.exp(-np.arange(m) / SR * (6.9 / rt))
        ir = lp(ir, damp, 1)
        ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        X = np.fft.rfft(x)
        H = np.fft.rfft(ir, n)
        out.append(np.fft.irfft(X * H, n))
    wetc = np.stack(out, axis=1)
    dry = np.stack([x, x], axis=1)
    return dry * (1 - wet) + wetc * wet


def tail_reverb(x, wet=0.2, rt=0.5, seed=5, damp=5000):
    """One-shot mono reverb (extends the sound by the tail)."""
    r = np.random.default_rng(seed)
    m = int(rt * SR)
    ir = r.standard_normal(m) * np.exp(-np.arange(m) / SR * (6.9 / rt))
    ir = lp(ir, damp, 1)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    w = fftconvolve(x, ir)
    o = np.zeros(len(w))
    o[:len(x)] += x * (1 - wet)
    return o + w * wet


def wrap_tail(x, n):
    """Fold anything past n back onto the start (gapless loops)."""
    out = x[:n].copy()
    rest = x[n:]
    while len(rest):
        m = min(len(rest), n)
        out[:m] += rest[:m]
        rest = rest[m:]
    return out


def wobble(x2, depth=0.0015, cycles=3, loop_len=None):
    """Tape wobble: slow pitch drift with an integer number of cycles per loop, so the seam stays clean. x2: (N,2)."""
    n = len(x2)
    pos = np.arange(n) + depth * SR * np.sin(2 * np.pi * cycles * np.arange(n) / n) \
        + 0.3 * depth * SR * np.sin(2 * np.pi * (cycles * 3 + 1) * np.arange(n) / n)
    pos = np.mod(pos, n)
    i0 = np.floor(pos).astype(int)
    fr = (pos - i0)[:, None]
    i1 = (i0 + 1) % n
    return x2[i0] * (1 - fr) + x2[i1] * fr


def crackle(n, level=0.004, density=7.0, seed=9):
    r = np.random.default_rng(seed)
    x = np.zeros(n)
    k = int(density * n / SR)
    idx = r.integers(0, n - 40, k)
    for i in idx:
        x[i:i + 3] += r.standard_normal(3) * r.uniform(0.2, 1.0)
    x = hp(x, 1500, 1)
    return x * level + r.standard_normal(n) * level * 0.15


def peak_db(x): return 20 * np.log10(max(1e-9, np.abs(x).max()))


def rms_gated_db(x, gate_db=-50.0):
    m = np.mean(x, axis=1) if x.ndim == 2 else x
    w = max(1, int(0.02 * SR))
    k = len(m) // w
    fr = m[:k * w].reshape(k, w)
    r = np.sqrt(np.mean(fr ** 2, axis=1) + 1e-18)
    db = 20 * np.log10(r)
    act = db[db > gate_db + peak_db(m)]  # gate relative to peak
    if len(act) == 0: return -90.0
    return 20 * np.log10(np.sqrt(np.mean((10 ** (act / 20)) ** 2)))


def normalise(x, target_rms_db, ceil_db=-1.5):
    """Scale so gated RMS hits target, then reduce if the peak would pass the ceiling. Returns (x, applied_gain_db)."""
    g = target_rms_db - rms_gated_db(x)
    if peak_db(x) + g > ceil_db: g = ceil_db - peak_db(x)
    return x * 10 ** (g / 20), g


def circ(fn, x):
    """Apply a filter as if the loop repeated forever: filter three tiled copies, keep the middle one (no start-up transient)."""
    n = len(x)
    return fn(np.tile(x, 3))[n:2 * n]
