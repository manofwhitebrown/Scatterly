"""SFX recipes: name -> fn(p, v) returning a mono float array. p = pitch factor (0.93..1.07), v = variant 0..2.
Style: soft rounded clicks, woody thumps, light ceramic and paper, warm chimes. All synthesised."""
import numpy as np
from dsp import (SR, bp, circ_reverb, decay, env, hp, lp, mixdown, n_, noise, put, silence, sine, sweep, t_, tail_reverb)

REG = {}


def sfx(fn):
    REG[fn.__name__] = fn
    return fn


def thud(f, d=0.25, k=14, drop=1.7): return decay(sweep(f * drop, f, d), k) * env(n_(d), 0.002, 0.03)
def burst(d, lo, hi, k=40, a=0.002): return decay(bp(noise(d), lo, hi), k) * env(n_(d), a, 0.01)
def air(d, f=900, k=10): return decay(lp(noise(d), f), k)
def chime(f, d=0.6, k=7, parts=(1, 2.01, 3.0, 4.2), amps=(1, 0.45, 0.2, 0.1)):
    return sum(a * decay(sine(f * m, d), k * (1 + 0.5 * i)) for i, (m, a) in enumerate(zip(parts, amps))) * env(n_(d), 0.003, 0.04)
def pluck(f, d=0.5, k=9): return decay(sine(f, d) + 0.35 * sine(2 * f, d) + 0.12 * sine(3 * f, d), k) * env(n_(d), 0.002, 0.03)
def seq(notes, gap, fn, total=None):
    total = total or (gap * len(notes) + 0.9)
    o = silence(total)
    for i, f in enumerate(notes): put(o, fn(f), i * gap)
    return o


# ---------- UI ----------
@sfx
def click(p, v): return mixdown(thud(520 * p, 0.05, 60, 1.3) * 0.8, burst(0.03, 2500, 6000, 120) * 0.35)
@sfx
def tap(p, v): return mixdown(thud(330 * p, 0.08, 38, 1.5) * 0.9, burst(0.04, 1500, 4500, 90) * 0.3)
@sfx
def open(p, v): return mixdown(sweep(300 * p, 520 * p, 0.12) * decay(env(n_(0.12), 0.01, 0.06), 5) * 0.6, burst(0.1, 600, 2400, 25, 0.01) * 0.3)
@sfx
def close(p, v): return mixdown(sweep(480 * p, 270 * p, 0.12) * env(n_(0.12), 0.005, 0.07) * 0.55, burst(0.06, 500, 1800, 50) * 0.25)
@sfx
def ui_back(p, v): return mixdown(pluck(440 * p, 0.14, 24) * 0.5, pluck(330 * p, 0.16, 22) * 0.5 * np.pad(np.ones(n_(0.16)), (n_(0.07), 0))[:n_(0.16)])
@sfx
def ui_toggle(p, v): return mixdown(thud(700 * p, 0.04, 70, 1.2) * 0.6, put(silence(0.1), thud(900 * p, 0.04, 70, 1.2) * 0.5, 0.04))
@sfx
def ui_slider(p, v): return pluck(1200 * p, 0.05, 70) * 0.5
@sfx
def swoosh(p, v): return decay(bp(noise(0.28), 400 * p, 3200 * p), 9) * np.sin(np.linspace(0, np.pi, n_(0.28))) ** 1.5 * 0.7
@sfx
def pop(p, v): return mixdown(sweep(300 * p, 760 * p, 0.07) * env(n_(0.07), 0.002, 0.04) * 0.7, burst(0.02, 2000, 6000, 150) * 0.2)
@sfx
def snap(p, v): return mixdown(thud(260 * p, 0.05, 70, 1.4) * 0.6, burst(0.03, 2200, 7000, 160) * 0.5)
@sfx
def zoom_in(p, v): return mixdown(sweep(220 * p, 520 * p, 0.28) * np.sin(np.linspace(0, np.pi, n_(0.28))) * 0.35, decay(bp(noise(0.28), 500, 2600), 8) * np.sin(np.linspace(0, np.pi, n_(0.28))) * 0.35)
@sfx
def zoom_out(p, v): return mixdown(sweep(520 * p, 220 * p, 0.28) * np.sin(np.linspace(0, np.pi, n_(0.28))) * 0.35, decay(bp(noise(0.28), 400, 2000), 8) * np.sin(np.linspace(0, np.pi, n_(0.28))) * 0.3)
@sfx
def tick(p, v): return mixdown(thud(1100 * p, 0.03, 120, 1.1) * 0.5, burst(0.015, 3000, 8000, 250) * 0.3)
@sfx
def hint(p, v): return tail_reverb(seq([784 * p, 988 * p, 1319 * p], 0.09, lambda f: chime(f, 0.5, 9, (1, 2.0), (1, 0.25))) * 0.5, 0.2, 0.4)
@sfx
def clue(p, v): return tail_reverb(seq([880 * p, 1175 * p], 0.08, lambda f: chime(f, 0.45, 10, (1, 2.0, 3.0), (1, 0.3, 0.1))) * 0.55, 0.2, 0.4)
@sfx
def error(p, v): return mixdown(thud(150 * p, 0.2, 14, 1.2) * 0.8, sweep(230 * p, 150 * p, 0.18) * env(n_(0.18), 0.005, 0.1) * 0.35)
@sfx
def mark_ruled_out(p, v): return mixdown(burst(0.08, 1500, 5000, 50, 0.003) * 0.4, thud(260 * p, 0.1, 30, 1.3) * 0.5)
@sfx
def mark_hunch(p, v): return tail_reverb(mixdown(chime(660 * p, 0.35, 12, (1, 1.5), (1, 0.3)) * 0.5, burst(0.05, 3000, 8000, 80) * 0.15), 0.25, 0.4)
@sfx
def clue_note(p, v): return mixdown(burst(0.18, 2200, 7000, 14, 0.01) * 0.3, chime(1047 * p, 0.35, 14, (1, 2.0), (1, 0.2)) * 0.3)
@sfx
def item_take(p, v): return mixdown(sweep(330 * p, 700 * p, 0.1) * env(n_(0.1), 0.004, 0.06) * 0.5, burst(0.05, 1800, 5000, 70) * 0.25)
# ---------- reward ----------
@sfx
def found(p, v): return tail_reverb(seq([523 * p, 659 * p, 784 * p, 1047 * p], 0.085, lambda f: chime(f, 0.7, 6)) * 0.45, 0.25, 0.7)
@sfx
def success(p, v):
    ns = [[660, 880], [523, 659, 784], [784, 988, 1319]][v % 3]
    return tail_reverb(seq([f * p for f in ns], 0.075, lambda f: chime(f, 0.45, 8)) * 0.5, 0.2, 0.5)
@sfx
def unlock(p, v): return tail_reverb(mixdown(put(silence(0.9), thud(200 * p, 0.06, 60) * 0.7, 0.0), put(silence(0.9), burst(0.05, 2000, 6000, 80) * 0.5, 0.0), put(silence(0.9), chime(1047 * p, 0.7, 6) * 0.5, 0.12), put(silence(0.9), chime(1568 * p, 0.6, 7) * 0.35, 0.18)), 0.2, 0.6)
@sfx
def unlock_room(p, v): return tail_reverb(seq([392 * p, 523 * p, 659 * p, 784 * p, 1047 * p], 0.1, lambda f: chime(f, 0.9, 5), 1.9) * 0.45, 0.3, 1.0)
@sfx
def coin(p, v): return tail_reverb(mixdown(put(silence(0.5), chime(988 * p, 0.12, 22, (1, 2.0), (1, 0.3)), 0), put(silence(0.5), chime(1319 * p, 0.4, 9, (1, 2.0, 3.0), (1, 0.3, 0.1)), 0.06)) * 0.5, 0.15, 0.3)
@sfx
def coin_spend(p, v): return tail_reverb(mixdown(put(silence(0.5), chime(1319 * p, 0.12, 22, (1, 2.0), (1, 0.3)), 0), put(silence(0.5), chime(988 * p, 0.35, 10, (1, 2.0), (1, 0.3)), 0.06)) * 0.5, 0.15, 0.3)
@sfx
def coin_tick(p, v): return mixdown(chime(1568 * p, 0.09, 40, (1, 2.4), (1, 0.3)) * 0.5, burst(0.01, 4000, 9000, 300) * 0.2)
@sfx
def star(p, v): return tail_reverb(mixdown(chime(1319 * p, 1.0, 4, (1, 2.0, 3.0, 5.0), (1, 0.5, 0.3, 0.15)), put(silence(1.0), chime(1760 * p, 0.8, 5), 0.07) * 0.6) * 0.5, 0.3, 0.9)
@sfx
def star_stamp(p, v): return tail_reverb(mixdown(thud(95 * p, 0.3, 11, 2.0) * 0.9, burst(0.06, 800, 3000, 45) * 0.4, put(silence(0.9), chime(1175 * p, 0.7, 6), 0.05) * 0.4), 0.2, 0.7)
@sfx
def bell(p, v): return tail_reverb(chime(1318 * p, 1.2, 3.5, (1, 2.76, 5.4), (1, 0.4, 0.15)) * 0.5, 0.25, 0.9)
@sfx
def win(p, v): return tail_reverb(seq([523 * p, 659 * p, 784 * p, 1047 * p], 0.11, lambda f: chime(f, 0.8, 5), 1.9) * 0.45, 0.3, 1.0)
@sfx
def fanfare(p, v): return tail_reverb(seq([392 * p, 523 * p, 659 * p, 784 * p, 1047 * p], 0.12, lambda f: mixdown(pluck(f, 0.7, 5) * 0.8, chime(f * 2, 0.5, 8) * 0.2), 2.2) * 0.5, 0.3, 1.1)
@sfx
def lose(p, v): return tail_reverb(seq([392 * p, 330 * p, 262 * p], 0.16, lambda f: pluck(f, 0.5, 7), 1.3) * 0.5, 0.25, 0.7)
@sfx
def timer_urgent(p, v): return mixdown(thud(880 * p, 0.05, 80, 1.1) * 0.7, put(silence(0.2), thud(880 * p, 0.05, 80, 1.1) * 0.7, 0.1))
# ---------- house foley ----------
@sfx
def drawer(p, v): return mixdown(air(0.4, 520 * p, 9) * 0.8, put(silence(0.4), burst(0.1, 900, 2600, 40) * 0.35, 0.27), put(silence(0.4), thud(120 * p, 0.12, 30) * 0.4, 0.28))
@sfx
def drawer_close(p, v): return mixdown(air(0.25, 480 * p, 14) * 0.6, put(silence(0.35), thud(105 * p, 0.2, 18, 1.8) * 0.9, 0.17), put(silence(0.35), burst(0.05, 700, 2500, 70) * 0.35, 0.17))
@sfx
def door(p, v): return mixdown(put(silence(0.7), burst(0.12, 1200, 3500, 50) * 0.35, 0), air(0.6, 320 * p, 7) * 0.5, put(silence(0.7), thud(85 * p, 0.3, 9, 1.4) * 0.5, 0.35))
@sfx
def door_close(p, v): return mixdown(thud(80 * p, 0.35, 9, 1.8) * 1.0, burst(0.08, 600, 2500, 40) * 0.5, put(silence(0.5), burst(0.04, 2000, 5000, 100) * 0.3, 0.14))
@sfx
def lock(p, v): return mixdown(burst(0.06, 1800, 6000, 90) * 0.7, put(silence(0.3), thud(240 * p, 0.08, 50) * 0.6, 0.06), put(silence(0.3), chime(1400 * p, 0.12, 40, (1, 2.3), (1, 0.3)) * 0.3, 0.05))
@sfx
def lock_open(p, v): return tail_reverb(mixdown(burst(0.05, 2000, 6000, 100) * 0.6, put(silence(0.9), thud(190 * p, 0.1, 40) * 0.8, 0.09), put(silence(0.9), burst(0.04, 1500, 5000, 100) * 0.5, 0.09), put(silence(0.9), chime(1175 * p, 0.6, 6, (1, 2.0), (1, 0.3)) * 0.5, 0.18)), 0.15, 0.4)
@sfx
def lock_fail(p, v): return mixdown(burst(0.04, 1800, 5000, 100) * 0.6, put(silence(0.3), burst(0.04, 1800, 5000, 100) * 0.4, 0.07), put(silence(0.3), thud(140 * p, 0.12, 30) * 0.6, 0.0))
@sfx
def key_jingle(p, v):
    o = silence(0.7)
    for i in range(6): put(o, mixdown(burst(0.12, 3000 * p, 9500, 35) * 0.5, chime((3300 + 400 * i) * p, 0.25, 22, (1, 1.5), (1, 0.4)) * 0.18), 0.045 * i + 0.01 * (i % 2))
    return o
@sfx
def keys(p, v):
    o = silence(0.5)
    for i in range(5): put(o, burst(0.1, 2800 * p, 9000, 45) * 0.5, 0.04 * i)
    return mixdown(o, put(silence(0.5), chime(3400 * p, 0.3, 20, (1, 1.6), (1, 0.4)) * 0.2, 0.02))
@sfx
def cupboard(p, v): return mixdown(thud(150 * p, 0.2, 18, 1.5) * 0.8, burst(0.06, 800, 3000, 60) * 0.45, put(silence(0.4), burst(0.04, 1200, 3500, 80) * 0.3, 0.12))
@sfx
def fridge_open(p, v): return mixdown(air(0.5, 700 * p, 6) * 0.45, burst(0.07, 1000, 3000, 40) * 0.5, put(silence(0.6), chime(110 * p, 0.5, 6, (1, 2.0), (1, 0.3)) * 0.15, 0.1))
@sfx
def fridge_close(p, v): return mixdown(thud(100 * p, 0.28, 10, 1.6) * 0.9, burst(0.1, 500, 2200, 30) * 0.4, put(silence(0.45), burst(0.03, 3000, 7000, 150) * 0.3, 0.1))
@sfx
def tap_water(p, v):
    d = 0.9
    w = bp(noise(d), 1500 * p, 5000, 2) * (0.6 + 0.4 * lp(noise(d), 12, 1) * 6)
    o = w * env(n_(d), 0.06, 0.25) * 0.5
    for i in range(7): put(o, sweep(900 * p, 1700 * p, 0.04) * env(n_(0.04), 0.002, 0.02) * 0.2, 0.1 + 0.11 * i + 0.01 * v)
    return o
@sfx
def kettle_click(p, v): return mixdown(thud(380 * p, 0.05, 80, 1.3) * 0.7, burst(0.04, 1500, 5000, 100) * 0.5, put(silence(0.3), thud(300 * p, 0.04, 90) * 0.4, 0.09))
@sfx
def cushion(p, v): return mixdown(air(0.35, 420 * p, 11) * np.sin(np.linspace(0.2, np.pi, n_(0.35))) * 0.8, burst(0.15, 200, 900, 20, 0.03) * 0.3)
@sfx
def wardrobe(p, v): return mixdown(air(0.5, 380 * p, 6) * 0.5, put(silence(0.6), thud(110 * p, 0.2, 14) * 0.7, 0.25), put(silence(0.6), burst(0.06, 1000, 3000, 50) * 0.3, 0.0))
@sfx
def hanger(p, v):
    o = silence(0.6)
    for i in range(3): put(o, mixdown(chime((2600 + 300 * i) * p, 0.25, 22, (1, 2.7), (1, 0.4)) * 0.3, burst(0.03, 3000, 8000, 160) * 0.3), 0.05 * i)
    return o
@sfx
def bag_zip(p, v):
    d = 0.4
    z = hp(noise(d), 2500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 70 * t_(d)))) * env(n_(d), 0.02, 0.08)
    return z * 0.3 * np.linspace(0.7, 1.2, n_(d))
@sfx
def shoe_drop(p, v): return mixdown(thud(100 * p, 0.16, 20, 1.8) * 0.9, burst(0.05, 600, 2000, 80) * 0.35, put(silence(0.4), thud(115 * p, 0.12, 24, 1.6) * 0.5, 0.16))
@sfx
def switch_lamp(p, v): return mixdown(thud(700 * p, 0.03, 120, 1.2) * 0.7, put(silence(0.2), thud(520 * p, 0.04, 100, 1.2) * 0.5, 0.02), burst(0.02, 2500, 7000, 200) * 0.3)
@sfx
def tv_on(p, v): return mixdown(thud(300 * p, 0.05, 80) * 0.5, put(silence(0.9), sweep(80 * p, 4800 * p, 0.35) * env(n_(0.35), 0.02, 0.15) * 0.12, 0.04), put(silence(0.9), burst(0.5, 3000, 9000, 6, 0.1) * 0.12, 0.08))
@sfx
def charger_plug(p, v): return mixdown(burst(0.05, 1200, 4000, 80) * 0.5, thud(210 * p, 0.07, 55) * 0.5, put(silence(0.4), chime(1760 * p, 0.2, 18, (1, 2.0), (1, 0.2)) * 0.2, 0.06))
@sfx
def bin_lid(p, v): return mixdown(thud(220 * p, 0.15, 25, 1.4) * 0.6, chime(540 * p, 0.3, 14, (1, 2.4, 3.9), (1, 0.4, 0.2)) * 0.35, burst(0.04, 1500, 5000, 90) * 0.3)
@sfx
def basket_rustle(p, v): return burst(0.35, 1800, 6500, 8, 0.03) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t_(0.35))) ** 2 * 0.6
@sfx
def rug_flap(p, v): return mixdown(air(0.3, 700 * p, 11) * 0.6, put(silence(0.4), thud(140 * p, 0.12, 24) * 0.4, 0.1))
@sfx
def paper(p, v): return hp(noise(0.3), 2200 * p) * np.sin(np.linspace(0, 3, n_(0.3))) ** 2 * decay(np.ones(n_(0.3)), 6) * 0.45
@sfx
def ceramic(p, v): return tail_reverb(mixdown(chime(1800 * p, 0.35, 16, (1, 1.5, 2.3), (1, 0.6, 0.3)) * 0.5, burst(0.02, 3000, 8000, 150) * 0.4), 0.12, 0.25)
@sfx
def step(p, v): return mixdown(thud(105 * p, 0.12, 40, 1.4) * 0.7, burst(0.06, 500, 1800, 60) * 0.4)
@sfx
def step_stairs(p, v): return mixdown(thud(150 * p, 0.1, 40, 1.4) * 0.6, burst(0.05, 800, 2600, 70) * 0.4, put(silence(0.3), thud(135 * p, 0.09, 40, 1.4) * 0.4, 0.13))
@sfx
def stairs(p, v):
    o = silence(0.9)
    for i in range(4): put(o, mixdown(thud(130 * p, 0.09, 40, 1.4) * 0.6, burst(0.05, 700, 2400, 70) * 0.4) * (0.85 + 0.15 * i / 3), 0.15 * i)
    return o
# ---------- puzzles ----------
@sfx
def puzzle_ok(p, v): return tail_reverb(seq([587 * p, 740 * p, 880 * p], 0.07, lambda f: chime(f, 0.4, 9)) * 0.5, 0.2, 0.5)
@sfx
def puzzle_wrong(p, v): return mixdown(thud(170 * p, 0.2, 14, 1.25) * 0.7, sweep(250 * p, 160 * p, 0.2) * env(n_(0.2), 0.005, 0.1) * 0.3)
@sfx
def puzzle_tick(p, v): return mixdown(thud(800 * p, 0.04, 90, 1.2) * 0.5, burst(0.02, 2500, 7000, 200) * 0.3)
@sfx
def puzzle_dial(p, v): return mixdown(burst(0.025, 1800, 6000, 150) * 0.6, thud(420 * p, 0.04, 100, 1.2) * 0.4)
@sfx
def puzzle_slide(p, v): return mixdown(decay(bp(noise(0.2), 400, 1800), 10) * 0.5, put(silence(0.3), thud(180 * p, 0.06, 50) * 0.5, 0.15))
@sfx
def puzzle_flip(p, v): return mixdown(burst(0.08, 1500, 5500, 40, 0.004) * 0.5, thud(250 * p, 0.06, 60) * 0.4)
@sfx
def puzzle_gear(p, v):
    o = silence(0.4)
    for i in range(5): put(o, mixdown(burst(0.03, 1800, 5000, 150) * 0.5, thud(320 * p, 0.03, 120) * 0.3), 0.06 * i)
    return o
@sfx
def puzzle_pipe(p, v): return mixdown(chime(240 * p, 0.3, 14, (1, 2.8, 4.1), (1, 0.4, 0.2)) * 0.5, burst(0.05, 800, 3000, 80) * 0.3)
@sfx
def puzzle_mirror(p, v): return tail_reverb(mixdown(chime(2093 * p, 0.5, 9, (1, 2.4), (1, 0.3)) * 0.4, burst(0.03, 4000, 9000, 150) * 0.2), 0.25, 0.5)
# ---------- cat ----------
def _meow(f0, d, p, shape):
    x = t_(d)
    f = f0 * p * (1 + shape * np.sin(np.pi * x / d)) * (1 + 0.012 * np.sin(2 * np.pi * 6 * x))
    ph = np.cumsum(f) / SR * 2 * np.pi
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
    s = bp(s, 400, 3200, 1) * env(n_(d), 0.06, 0.18)
    return s * 0.5
@sfx
def meow(p, v): return _meow(560, 0.5, p, 0.28)
@sfx
def meow2(p, v): return _meow(680, 0.28, p, 0.35)
@sfx
def cat_happy(p, v): return mixdown(_meow(760, 0.16, p, 0.2), put(silence(0.5), _meow(820, 0.16, p, 0.2), 0.2)) * 0.8
@sfx
def purr(p, v):
    d = 1.6
    r = lp(noise(d), 240) * (0.5 + 0.5 * np.sin(2 * np.pi * (24 + 2 * v) * t_(d))) ** 1.2
    return r * env(n_(d), 0.25, 0.5) * 2.4
