#!/usr/bin/env python3
"""Phase 6 extras: wall key hook spot (`spot/keyHook/closed|open`, room-slice) and the three small marks that replace the text glyphs
(`ui/check` searched tick, `ui/hunch` amber question mark, `ui/ruledOut` red cross; core). Pivot = bottom centre for all.
Usage: spots2.py <room-slice dir> <core dir>"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build
from props import L
KEY_CLOSED = ["nNNNNNNNNNNn", "nNmNNmNNmNNn", "nNyNNYNNyNNn", "nNYNNyNNYNNn", "nNyNNyNNyNNn", "nnnnnnnnnnnn"]
KEY_OPEN   = ["nNNNNNNNNNNn", "nNmNNmNNmNNn", "nNyNNoNNyNNn", "nNYNNmNNYNNn", "nNyNNNNNyNNn", "nnnnnnnnnnnn"]
MARKS = {
 'check': ["...gggggg...", "..gGGGGGGg..", ".gGGGGGGGwg.", "gGGGGGGGwGGg", "gGGGGGGwGGGg", "gGwGGGwGGGGg", "gGGwGwGGGGGg", "gGGGwGGGGGGg", ".gGGGGGGGGg.", "..gGGGGGGg..", "...gggggg..."],
 'hunch': ["...yyyyyy...", "..yYYYYYYy..", ".yYYiiiiYYy.", "yYYiiYYiiYYy", "yYYYYYYiiYYy", "yYYYYYiiYYYy", "yYYYYiiYYYYy", "yYYYYYYYYYYy", "yYYYYiiYYYYy", ".yYYYYYYYYy.", "..yyyyyyyy.."],
 'ruledOut': ["...pppppp...", "..pPPPPPPp..", ".pPwPPPPwPp.", "pPPPwPPwPPPp", "pPPPPwwPPPPp", "pPPPPwwPPPPp", "pPPPwPPwPPPp", ".pPwPPPPwPp.", "..pPPPPPPp..", "...pppppp..."],
}
def put(d, key, im):
    piv = json.load(open(os.path.join(d, 'pivots.json'))) if os.path.exists(os.path.join(d, 'pivots.json')) else {}
    im.save(os.path.join(d, key.replace('/', '__') + '.png')); piv[key] = {'pivot': [im.width // 2, im.height - 2]}
    json.dump(piv, open(os.path.join(d, 'pivots.json'), 'w'), indent=0)
if __name__ == '__main__':
    slice_dir, core_dir = sys.argv[1], sys.argv[2]
    put(slice_dir, 'spot/keyHook/closed', build(KEY_CLOSED, L)); put(slice_dir, 'spot/keyHook/open', build(KEY_OPEN, L))
    for k, rows in MARKS.items(): put(core_dir, f'ui/{k}', build(rows, L))
    print('spots2 done')
