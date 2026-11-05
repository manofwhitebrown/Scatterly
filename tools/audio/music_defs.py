"""Original cosy lo-fi loops. Style only (tempo, mood, instruments, structure): no melody, chord order or sample is taken from any
reference track. Every loop is built from a fixed number of bars, the reverb is circular and the tail is folded onto the head, so the
loop point has no click. A/B sections of 8 bars each (16 bars)."""
import numpy as np
import dsp
from dsp import SR, bp, circ_reverb, crackle, decay, env, hp, lp, n_, noise, sweep, t_, wobble

mf = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def ep(m, d, vel=1.0, bright=1.0):
    f = mf(m)
    t = t_(d)
    idx = (1.6 + 1.2 * vel) * bright * np.exp(-t * 7)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    s += 0.22 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 5)
    s += 0.05 * np.sin(2 * np.pi * 7.01 * f * t) * np.exp(-t * 30)  # tine
    s = s * np.exp(-t * (1.6 + 0.02 * (m - 48)))
    return s * env(len(t), 0.004, 0.12) * vel * 0.3


def pad(ms, d, vel=1.0):
    t = t_(d)
    o = np.zeros(len(t))
    for m in ms:
        f = mf(m)
        for dt in (0.997, 1.003):
            o += (2 * ((f * dt * t) % 1) - 1) * 0.25 + np.sin(2 * np.pi * f * dt * t) * 0.35
    o = lp(o, 1500, 2) * env(len(t), 0.45, 0.6)
    return o * vel * 0.05


def bass(m, d, vel=1.0):
    f = mf(m)
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(4 * np.pi * f * t)
    return s * np.exp(-t * 2.6) * env(len(t), 0.01, 0.12) * vel * 0.34


def bell(m, d=1.2, vel=1.0):
    f = mf(m)
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t * 4) + 0.1 * np.sin(2 * np.pi * 3.97 * f * t) * np.exp(-t * 9)
    return s * np.exp(-t * 3.2) * env(len(t), 0.003, 0.2) * vel * 0.2


def pluck(m, d=0.9, vel=1.0):
    f = mf(m)
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) * np.exp(-t * 8) + 0.15 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    return s * np.exp(-t * 5) * env(len(t), 0.002, 0.1) * vel * 0.22


def kick(vel=1.0):
    return sweep(115, 46, 0.3) * np.exp(-np.arange(n_(0.3)) / SR * 14) * env(n_(0.3), 0.002, 0.05) * vel * 0.55


def rim(vel=1.0):
    x = np.exp(-np.arange(n_(0.09)) / SR * 55)
    return (bp(noise(0.09), 1500, 4200) * 0.6 + np.sin(2 * np.pi * 330 * t_(0.09)) * 0.35) * x * vel * 0.28


def brush(vel=1.0):
    return bp(noise(0.28), 1800, 7000) * np.exp(-np.arange(n_(0.28)) / SR * 13) * env(n_(0.28), 0.015, 0.1) * vel * 0.22


def hat(vel=1.0):
    return hp(noise(0.06), 7000) * np.exp(-np.arange(n_(0.06)) / SR * 70) * vel * 0.09


# chords as MIDI lists, voiced (low to high). Each spec: bars of chords for A and B.
def C(*m): return list(m)

TRACKS = {
    'morning': dict(bpm=86, swing=0.04, key='C', drums='light', melody=0.65, bell=False, wow=0.0012,
        A=[C(48, 55, 59, 62, 64), C(45, 55, 59, 60, 64), C(41, 53, 57, 60, 64), C(43, 55, 59, 62, 64)] * 2,
        B=[C(41, 53, 57, 60, 64), C(43, 55, 59, 62, 65), C(40, 52, 59, 62, 67), C(45, 55, 60, 64, 67), C(41, 53, 57, 60, 64), C(43, 55, 59, 62, 65), C(48, 55, 59, 62, 64), C(43, 55, 59, 62, 64)],
        scale=[60, 62, 64, 67, 69, 72, 74, 76]),
    'lofi_a': dict(bpm=72, swing=0.14, key='Am', drums='lofi', melody=0.5, bell=True, wow=0.0022,
        A=[C(45, 52, 55, 59, 64), C(41, 52, 57, 60, 64), C(48, 55, 59, 62, 64), C(43, 53, 59, 62, 64)] * 2,
        B=[C(38, 50, 53, 57, 64), C(40, 52, 55, 59, 62), C(41, 52, 57, 60, 64), C(40, 52, 56, 59, 62), C(38, 50, 53, 57, 64), C(40, 52, 55, 59, 62), C(41, 52, 57, 60, 64), C(43, 55, 59, 62, 65)],
        scale=[57, 60, 62, 64, 67, 69, 72, 74]),
    'lofi_b': dict(bpm=70, swing=0.16, key='Bm', drums='lofi', melody=0.5, bell=False, wow=0.0025,
        A=[C(47, 54, 57, 61, 66), C(43, 54, 59, 62, 66), C(50, 57, 61, 64, 66), C(45, 55, 59, 61, 64)] * 2,
        B=[C(40, 52, 55, 59, 66), C(42, 54, 57, 61, 64), C(43, 54, 59, 62, 66), C(45, 55, 59, 64, 67), C(40, 52, 55, 59, 66), C(42, 54, 57, 61, 64), C(43, 54, 59, 62, 66), C(45, 55, 61, 64, 67)],
        scale=[62, 64, 66, 69, 71, 73, 76, 78]),
    'puzzle': dict(bpm=64, swing=0.0, key='F', drums='none', melody=0.28, bell=True, wow=0.0016,
        A=[C(41, 48, 57, 60, 64), C(38, 53, 57, 60, 64), C(46, 53, 57, 62, 65), C(36, 55, 59, 64, 67)] * 2,
        B=[C(45, 52, 55, 60, 64), C(46, 53, 57, 62, 65), C(43, 50, 53, 58, 62), C(36, 52, 55, 59, 64), C(41, 48, 57, 60, 64), C(38, 53, 57, 60, 64), C(46, 53, 57, 62, 65), C(36, 55, 59, 64, 67)],
        scale=[60, 62, 65, 67, 69, 72, 74, 77]),
    'result_bed': dict(bpm=68, swing=0.0, key='G', drums='none', melody=0.4, bell=True, wow=0.0015,
        A=[C(43, 50, 59, 62, 66), C(40, 52, 59, 62, 67), C(48, 55, 59, 62, 67), C(38, 54, 57, 62, 66)] * 2,
        B=[], scale=[67, 69, 71, 74, 76, 79]),
}
BARS = {'result_bed': 8}


def render(name, variant=0, seed=1):
    spec = TRACKS[name]
    bars_a = spec['A']
    bars_b = spec['B']
    bars = list(bars_a) + list(bars_b)
    nb = BARS.get(name, len(bars))
    bars = bars[:nb]
    r = np.random.default_rng(seed * 100 + variant * 7 + sum(map(ord, name)))
    dsp.rng = r
    bpm = spec['bpm'] + (0, -4, 4)[variant % 3] * (1 if name != 'result_bed' else 0)
    beat = 60 / bpm
    bar_s = 4 * beat
    total = nb * bar_s
    N = n_(total)
    pad_len = n_(4.5)
    L = np.zeros(N + pad_len)
    R = np.zeros(N + pad_len)

    def add(sig, at, pan=0.0, g=1.0):
        if at < 0: at += total  # a note just before the downbeat belongs to the end of the loop
        i = int(at * SR)
        m = min(len(sig), len(L) - i)
        if m <= 0: return
        a = (pan + 1) * np.pi / 4
        L[i:i + m] += sig[:m] * np.cos(a) * g
        R[i:i + m] += sig[:m] * np.sin(a) * g

    sw = spec['swing']
    jit = lambda: r.uniform(-0.010, 0.010)
    vj = lambda: float(r.uniform(0.88, 1.08))
    for b, ch in enumerate(bars):
        t0 = b * bar_s
        add(pad(ch[1:], bar_s + 0.8, 0.9 if spec['drums'] != 'none' else 1.3), t0, 0.0)
        # electric piano: broken chord, roll on beat 1, a lighter re-touch on beat 3 and an off-beat
        hits = [(0, 1.0), (2.0 + sw * 0.5, 0.62), (3.5 + sw, 0.45)] if spec['drums'] != 'none' else [(0, 0.9), (2.0, 0.5)]
        for k, (pos, v) in enumerate(hits):
            for j, m in enumerate(ch[1:]):
                add(ep(m, 2.4 if k == 0 else 1.2, v * vj()), t0 + pos * beat + j * 0.028 + jit(), pan=-0.25 + 0.14 * j)
        # bass
        add(bass(ch[0], beat * 1.9, vj()), t0 + jit() + 0.004)
        if spec['drums'] != 'none':
            add(bass(ch[0] + (7 if b % 2 else 0), beat * 1.2, 0.6 * vj()), t0 + 2.5 * beat + sw * beat + jit())
        # drums
        kind = spec['drums']
        if kind != 'none':
            add(kick(vj()), t0 + jit() + 0.003, 0, 1.0)
            if kind == 'lofi': add(kick(0.6 * vj()), t0 + (2.5 + sw) * beat + jit(), 0, 1.0)
            for q in (1, 3):
                add(rim(vj()) if kind == 'lofi' else brush(vj() * 0.8), t0 + q * beat + jit(), 0.12)
            for e in range(8):
                pos = e * 0.5 + (sw * 0.5 if e % 2 else 0)
                if kind == 'light' and e % 2 == 0 and r.random() < 0.3: continue
                add(hat(vj() * (1.0 if e % 2 == 0 else 0.6)), t0 + pos * beat + jit(), 0.3)
        # melody: a few notes per bar from the scale, never on every bar, B section a bit busier
        sc = spec['scale']
        dens = spec['melody'] * (1.0 if b < 8 else 1.25)
        if r.random() < dens:
            n_notes = int(r.integers(1, 3 if spec['drums'] != 'none' else 2))
            pos = float(r.choice([0.5, 1.0, 1.5, 2.0, 2.5, 3.0]))
            idx = int(r.integers(2, len(sc) - 2))
            for _ in range(n_notes):
                m = sc[int(np.clip(idx, 0, len(sc) - 1))]
                sig = (bell(m, 1.8, 0.9 * vj()) if spec['bell'] else pluck(m, 1.0, vj()))
                add(sig, t0 + pos * beat + jit(), pan=float(r.uniform(-0.5, 0.5)))
                idx += int(r.choice([-2, -1, 1, 2]))
                pos += float(r.choice([0.5, 1.0, 1.5]))
                if pos >= 4: break
    # fold tails onto the head, then loop-safe processing
    Lw = dsp.wrap_tail(L, N)
    Rw = dsp.wrap_tail(R, N)
    mono = 0.5 * (Lw + Rw)
    st = np.stack([Lw, Rw], axis=1)
    rev = circ_reverb(mono, wet=1.0, rt=1.8 if name != 'puzzle' else 2.6, seed=seed + 5, damp=3200)
    st = st * 0.82 + rev * (0.30 if name != 'puzzle' else 0.42)
    st = np.stack([dsp.circ(lambda x: lp(x, 7500, 2), st[:, 0]), dsp.circ(lambda x: lp(x, 7500, 2), st[:, 1])], axis=1)
    # warm low end bump, soften highs further, tape wobble (whole cycles per loop) and a little vinyl dust
    st = wobble(st, spec['wow'], cycles=max(2, nb // 4))
    dust = crackle(N, 0.0035 if name != 'puzzle' else 0.002, 6.0, seed + 11)
    st[:, 0] += dust
    st[:, 1] += np.roll(dust, 977)
    return st, dict(bpm=bpm, bars=nb, seconds=total)


def tension(variant=0, seed=1):
    """Rush layer: a low pulse plus a filtered shimmer that opens and closes once per loop. 8 bars at 96 bpm."""
    r = np.random.default_rng(seed + 400 + variant)
    dsp.rng = r
    bpm = 96
    beat = 60 / bpm
    total = 8 * 4 * beat
    N = n_(total)
    t = np.arange(N) / SR
    pulse = np.zeros(N)
    for b in range(int(total / beat)):
        i = int(b * beat * SR)
        k = sweep(70, 52, 0.22) * np.exp(-np.arange(n_(0.22)) / SR * 16) * (0.9 if b % 4 == 0 else 0.55)
        m = min(len(k), N - i)
        pulse[i:i + m] += k[:m] * 0.4
    drone = (np.sin(2 * np.pi * 55 * t) + 0.4 * np.sin(2 * np.pi * 82.4 * t)) * 0.12
    open_ = 0.5 - 0.5 * np.cos(2 * np.pi * t / total)
    sh = bp(noise(total), 1800, 5200) * (0.04 + 0.1 * open_)
    tick = np.zeros(N)
    for b in range(int(total / (beat / 2))):
        i = int(b * beat / 2 * SR)
        h = hp(noise(0.03), 6000) * np.exp(-np.arange(n_(0.03)) / SR * 150) * 0.12 * (0.4 + 0.6 * open_[min(N - 1, i)])
        m = min(len(h), N - i)
        tick[i:i + m] += h[:m]
    mono = pulse + drone + sh + tick
    st = circ_reverb(mono, wet=0.3, rt=1.0, seed=seed + 9, damp=3000)
    return st, dict(bpm=bpm, bars=8, seconds=total)


def result_sting(variant=0):
    """6 s one-shot: a rising maj9 arpeggio into a warm held chord with a soft bell on top."""
    dsp.rng = np.random.default_rng(77 + variant)
    d = 6.0
    N = n_(d) + n_(1.5)
    L = np.zeros(N); R = np.zeros(N)

    def add(sig, at, pan=0.0):
        i = max(0, int(at * SR)); m = min(len(sig), N - i); a = (pan + 1) * np.pi / 4
        L[i:i + m] += sig[:m] * np.cos(a); R[i:i + m] += sig[:m] * np.sin(a)
    notes = [67, 71, 74, 78, 79, 83]
    for k, m in enumerate(notes):
        add(bell(m, 2.6, 1.0 - 0.05 * k), 0.18 * k, pan=-0.4 + 0.16 * k)
        add(ep(m - 12, 3.2, 0.8), 0.18 * k + 0.01, pan=-0.2)
    for m in (43, 50, 59, 62, 66):
        add(pad([m], 5.0, 1.6), 0.95, 0.0)
    add(bell(86, 3.0, 0.8), 1.3, 0.25)
    add(bell(91, 3.0, 0.6), 1.7, -0.25)
    st = np.stack([L, R], axis=1)
    mono = 0.5 * (L + R)
    w = dsp.tail_reverb(mono, wet=1.0, rt=2.0, seed=4)[:N]
    st = st * 0.8 + np.stack([w, np.roll(w, 700)], axis=1) * 0.35
    st = st[:n_(d + 1.0)]
    st *= (np.linspace(1, 0, len(st)) ** 0.3 * np.minimum(1, np.linspace(0, 1, len(st)) * 400))[:, None]
    return st, dict(bpm=0, bars=0, seconds=len(st) / SR)
