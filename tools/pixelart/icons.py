#!/usr/bin/env python3
"""Item icons (16x16 class, hand-authored with the pixel DSL). Keys: icon/<item>. Usage: icons.py <outdir>"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build
L = {'y': 'butter.2', 'Y': 'butter.3', 'z': 'butter.1', 'k': 'stone.2', 'K': 'stone.3', 'j': 'stone.1', 'n': 'woodWarm.2', 'N': 'woodWarm.3', 'm': 'woodWarm.1',
     'd': 'woodDark.2', 'D': 'woodDark.3', 'e': 'woodDark.1', 'o': 'paper', 'c': 'plaster.3', 'b': 'sky.2', 'B': 'sky.4', 'v': 'navy.2', 'V': 'navy.3',
     'r': 'terracotta.2', 'R': 'terracotta.3', 'q': 'terracotta.1', 'g': 'sage.2', 'G': 'sage.3', 'i': 'ink', 's': 'rose.3', 'p': 'rose.2', 't': 'teal.2', 'T': 'teal.3'}
I = {}
I['keys'] = ["..yyy.......", ".yYYYy......", ".yY.Yy..kk..", ".yYYYykkKkk.", "..yyy.k..jk.", ".....kk..kk.", "....kk..kk..", "...kk..kjk..", "..kkK..kkK..", "..kk........"]
I['wallet'] = ["nnnnnnnnnnn", "nNNNNNNNNNn", "nNNNNNNNNNn", "nnnnnnnnyYn", "nmmmmmmnyYn", "nNNNNNNnnnn", "nNNNNNNNNNn", "nmmmmmmmmmm"]
I['phone'] = ["..vvvvvv..", "..vbbbbv..", "..vbBBbv..", "..vbbbbv..", "..vbBbbv..", "..vbbbbv..", "..vbbbbv..", "..vvvvvv..", "..vvyyvv.."]
I['officeId'] = ["....kk....", "...k..k...", "...k..k...", "gggkggkggg", "goooooooog", "gosspooooG", "gossspoiio", "goppsooooG", "gooooiiioG", "gggggggggg"]
I['shoes'] = ["..........rr", "..........rRr", "....oooo..rRr", "...ocooooorRr", "..ooooooooRR.", ".rRRRRRRRRRq.", "rRRRoooooooRq", "qqqqqqqqqqqq", "jjjjjjjjjjjj"]
I['glasses'] = ["............", ".jjjj..jjjj.", "jBBbbjjbbBBj", "jBbbbj.jbbbj", "jbbbbj.jbbbj", ".jjjj..jjjj.", "............"]
I['earbuds'] = ["..oo..oo....", ".oooo.oooo..", ".oocc.occo..", "..oo...oo...", "..k.....k...", "...k...k....", "....k.k.....", ".....k......", "....kkk.....", "....kjk....."]
I['bag'] = ["...dddd...", "..d....d..", "..d....d..", "rrrrrrrrrr", "rRRRRRRRRq", "rRRRyyRRRq", "rRRRRRRRRq", "rRRRRRRRRq", "qqqqqqqqqq"]
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for k, rows in I.items(): build(rows, L).save(os.path.join(out, f'icon__{k}.png'))
    print(len(I), 'icons')
