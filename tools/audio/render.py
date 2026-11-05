#!/usr/bin/env python3
"""Offline renderer: synthesises every sound (nothing sampled, nothing downloaded), normalises it, encodes OGG Vorbis, measures the
loop seams and writes evidence. Usage:
  python3 tools/audio/render.py [--only sfx|amb|music] [--out public/audio] [--cand tools/audio/candidates] [--evidence docs/art/evidence]
Loudness method: music and ambience are measured with ffmpeg ebur128 (integrated LUFS) and gained to -16 / -26 LUFS; sfx are too short for
LUFS, so their gated RMS (frames within 50 dB of the peak) is gained to -19 dBFS. Every file is then capped so no sample is above -1.5 dBFS."""
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dsp, sfx_defs, amb_defs, music_defs

TARGET = dict(music=-16.0, amb=-26.0, sfx_rms=-19.0)
CEIL = -1.5
MUSIC = ['morning', 'lofi_a', 'lofi_b', 'puzzle', 'result_bed']
OUT_NAME = {'result_bed': 'music_result'}  # file names in public/audio


def write_wav(path, x, sr=dsp.SR):
    wavfile.write(path, sr, (np.clip(x, -1, 1) * 32767).astype(np.int16))


def lufs(wav):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', wav, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1]) if m else -70.0


def encode(wav, ogg, kind):
    if kind == 'music': args = ['-ac', '2', '-ar', '44100', '-b:a', '96k']
    elif kind == 'cand': args = ['-ac', '2', '-ar', '32000', '-b:a', '64k']
    elif kind == 'amb': args = ['-ac', '1', '-ar', '32000', '-b:a', '56k']
    else: args = ['-ac', '1', '-ar', '32000', '-q:a', '2']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', *args, ogg], check=True)


def decode(ogg, wav):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', ogg, '-acodec', 'pcm_s16le', wav], check=True)


def seam(x):
    """Jump at the loop point divided by the typical sample-to-sample step near it (about 1 = no click)."""
    m = x.mean(axis=1) if x.ndim == 2 else x
    w = int(0.05 * dsp.SR)
    ref = np.std(np.diff(np.concatenate([m[-w:], m[:w]]))) + 1e-9
    return float(abs(m[0] - m[-1]) / ref)


def finish(x, kind, path, tmp):
    """Normalise, write wav, encode ogg. Returns report dict."""
    wav = os.path.join(tmp, 'x.wav')
    if kind == 'sfx':
        x, g = dsp.normalise(x, TARGET['sfx_rms'], CEIL)
        write_wav(wav, x)
    else:
        write_wav(wav, x * 0.3)
        cur = lufs(wav)
        tgt = TARGET['amb'] if kind == 'amb' else TARGET['music']
        g = tgt - cur + 20 * np.log10(0.3)
        y = x * 10 ** (g / 20)
        pk = dsp.peak_db(y)
        if pk > CEIL: y = y * 10 ** ((CEIL - pk) / 20)
        x = y
        write_wav(wav, x)
    encode(wav, path, kind)
    return dict(file=os.path.basename(path), kb=round(os.path.getsize(path) / 1024, 1), peak_db=round(dsp.peak_db(x), 1), seam=round(seam(x), 2), seconds=round(len(x) / dsp.SR, 1))


def evidence(x, name, outdir, info):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    m = x.mean(axis=1) if x.ndim == 2 else x
    fig, ax = plt.subplots(3, 1, figsize=(10, 7))
    tt = np.arange(len(m)) / dsp.SR
    step = max(1, len(m) // 4000)
    ax[0].plot(tt[::step], m[::step], lw=0.4); ax[0].set_title(f'{name}: {info["bars"]} bars, {info["bpm"]} bpm, {info["seconds"]:.1f} s (sections A 0-8 bars, B 8-16)')
    ax[1].specgram(m, NFFT=2048, Fs=dsp.SR, noverlap=1024, cmap='magma'); ax[1].set_ylim(0, 9000)
    w = int(0.05 * dsp.SR)
    j = np.concatenate([m[-w:], m[:w]])
    ax[2].plot(np.arange(len(j)) / dsp.SR * 1000, j, lw=0.6); ax[2].axvline(50, color='r', lw=0.8); ax[2].set_title('loop seam: last 50 ms | first 50 ms (red line = the wrap)')
    fig.tight_layout(); fig.savefig(os.path.join(outdir, f'audio-{name}.png'), dpi=70); plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', choices=['sfx', 'amb', 'music'])
    ap.add_argument('--out', default='public/audio')
    ap.add_argument('--cand', default='tools/audio/candidates')
    ap.add_argument('--evidence', default='docs/art/evidence')
    a = ap.parse_args()
    for d in (a.out, a.cand, a.evidence): os.makedirs(d, exist_ok=True)
    rep = []
    with tempfile.TemporaryDirectory() as tmp:
        if a.only in (None, 'sfx'):
            for name, fn in sfx_defs.REG.items():
                for v in range(3):
                    dsp.reseed(1000 + sum(map(ord, name)) * 7 + v)
                    x = fn(1 + 0.06 * (v - 1), v)
                    rep.append(finish(np.asarray(x, float), 'sfx', os.path.join(a.out, f'sfx_{name}_{v + 1}.ogg'), tmp))
        if a.only in (None, 'amb'):
            for name, fn in amb_defs.AMB.items():
                dsp.reseed(50 + sum(map(ord, name)))
                rep.append(finish(fn(), 'amb', os.path.join(a.out, f'amb_{name}.ogg'), tmp))
        if a.only in (None, 'music'):
            for name in MUSIC:
                for v in range(3):
                    x, info = music_defs.render(name, v)
                    out = os.path.join(a.out if v == 0 else a.cand, f'{OUT_NAME.get(name, "music_" + name)}.ogg' if v == 0 else f'{OUT_NAME.get(name, "music_" + name)}_v{v + 1}.ogg')
                    r = finish(x, 'music' if v == 0 else 'cand', out, tmp); r['variant'] = v + 1; r['bpm'] = info['bpm']; rep.append(r)
                    if v == 0: evidence(x, OUT_NAME.get(name, 'music_' + name), a.evidence, info)
            x, info = music_defs.tension(0)
            rep.append(finish(x, 'music', os.path.join(a.out, 'music_rush_tension.ogg'), tmp)); evidence(x, 'music_rush_tension', a.evidence, info)
            x, info = music_defs.result_sting(0)
            rep.append(finish(x, 'music', os.path.join(a.out, 'music_result_sting.ogg'), tmp))
    json.dump(rep, open(os.path.join(a.evidence, 'audio-report.json'), 'w'), indent=1)
    tot = sum(r['kb'] for r in rep)
    print(f'{len(rep)} files, {tot:.0f} KB; worst seam {max(r["seam"] for r in rep if r["seconds"] > 5):.2f}')


if __name__ == '__main__':
    main()
