"""Ambience loops: mono, 24 s, seamless. Beds are filtered noise made periodic (filtered over three tiled copies, middle copy kept);
events (chirps, crackles, ticks) are placed with wrap-around, so the loop point carries no click."""
import numpy as np
import dsp
from dsp import SR, bp, decay, env, hp, lp, n_, noise, sweep, t_

D = 24.0
N = n_(D)


def periodic(fn):
    base = dsp.rng.standard_normal(N)
    return fn(np.tile(base, 3))[N:2 * N]


def place(dst, x, at_s):
    i = int(at_s * SR) % len(dst)
    idx = (np.arange(len(x)) + i) % len(dst)
    np.add.at(dst, idx, x)


def rain():
    a = periodic(lambda x: bp(x, 700, 6500))
    b = periodic(lambda x: lp(x, 260))
    slow = periodic(lambda x: lp(x, 0.4, 1))
    slow = slow / (np.abs(slow).max() + 1e-9)
    o = a * (0.55 + 0.25 * slow) + b * 0.5
    for _ in range(140):
        place(o, hp(dsp.rng.standard_normal(260), 3000) * np.exp(-np.arange(260) / SR * 700) * dsp.rng.uniform(0.3, 1.2) * 0.5, dsp.rng.uniform(0, D))
    return o


def birds():
    o = periodic(lambda x: bp(x, 2500, 7000)) * 0.03 + periodic(lambda x: lp(x, 180)) * 0.05
    r = dsp.rng
    for _ in range(26):
        base = r.uniform(2400, 4300)
        phrase = int(r.integers(2, 6))
        t0 = r.uniform(0, D)
        for k in range(phrase):
            d = r.uniform(0.05, 0.12)
            f0 = base * r.uniform(0.9, 1.15)
            ch = sweep(f0, f0 * r.uniform(0.75, 1.35), d) * env(n_(d), 0.008, 0.03)
            ch += 0.25 * sweep(f0 * 2, f0 * 2.4, d) * env(n_(d), 0.008, 0.03)
            place(o, ch * r.uniform(0.15, 0.4), t0 + k * (d + r.uniform(0.04, 0.09)))
    return o


def kitchen():
    t = np.arange(N) / SR
    hum = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((50, 0.5), (100, 0.35), (150, 0.12), (200, 0.05)))
    hum *= 1 + 0.08 * np.sin(2 * np.pi * 3 * t / D)
    air = periodic(lambda x: lp(x, 500)) * 0.12
    o = hum * 0.12 + air
    # compressor click-on / off once per loop and a faint tick every 4 s
    place(o, decay(sweep(120, 60, 0.12), 25) * 0.3, 3.0)
    for k in range(6):
        place(o, decay(bp(dsp.rng.standard_normal(1500), 1500, 4000), 120) * 0.08, 1.0 + k * 4.0)
    return o


def clock():
    o = periodic(lambda x: lp(x, 200)) * 0.02
    for k in range(int(D)):
        tone = 1900 if k % 2 == 0 else 1500
        tk = (np.sin(2 * np.pi * tone * t_(0.03)) * 0.6 + bp(dsp.rng.standard_normal(n_(0.03)), 1000, 5000) * 0.6) * np.exp(-np.arange(n_(0.03)) / SR * 130)
        body = np.sin(2 * np.pi * 420 * t_(0.12)) * np.exp(-np.arange(n_(0.12)) / SR * 40) * 0.25
        place(o, tk * 0.5, k * 1.0 + 0.03)
        place(o, body, k * 1.0 + 0.03)
    return o


def night():
    o = periodic(lambda x: lp(x, 220)) * 0.07 + periodic(lambda x: bp(x, 300, 1200)) * 0.012
    r = dsp.rng
    t = np.arange(N) / SR
    for c in range(3):
        f = 4100 + 280 * c
        gate = (np.sin(2 * np.pi * (14 + 3 * c) * t + c) > 0.55).astype(float)
        gate = lp(gate, 90, 1) * (0.5 + 0.5 * np.sin(2 * np.pi * (1 + c) * t / D + c * 2)) ** 2
        o += np.sin(2 * np.pi * f * t) * gate * 0.018
    return o


def fireplace():
    r = dsp.rng
    o = periodic(lambda x: lp(x, 150)) * 0.14 + periodic(lambda x: bp(x, 400, 1800)) * 0.03
    for _ in range(190):
        d = r.uniform(0.004, 0.02)
        c = bp(r.standard_normal(n_(d) + 40), r.uniform(1200, 3500), r.uniform(4500, 9000)) * np.exp(-np.arange(n_(d) + 40) / SR / d * 3)
        place(o, c * r.uniform(0.15, 1.0) * 0.45, r.uniform(0, D))
    for _ in range(10):
        place(o, decay(bp(r.standard_normal(n_(0.12)), 200, 900), 28) * 0.4, r.uniform(0, D))
    return o


AMB = dict(rain=rain, birds=birds, kitchen=kitchen, clock=clock, night=night, fireplace=fireplace)
