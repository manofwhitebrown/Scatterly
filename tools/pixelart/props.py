#!/usr/bin/env python3
"""Hand-authored props (marked B in ASSET-LIST). Run: props.py <outdir>. Each sprite shares the DSL legend style."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build, mirror
L = {  # shared legend
 'w': 'plaster.4', 'c': 'plaster.2', 'd': 'plaster.1', 'n': 'woodWarm.2', 'N': 'woodWarm.3', 'm': 'woodWarm.1',
 'r': 'terracotta.2', 'R': 'terracotta.3', 'q': 'terracotta.1', 'y': 'butter.2', 'Y': 'butter.3', 'z': 'butter.1',
 'g': 'sage.2', 'G': 'sage.3', 'h': 'sage.1', 't': 'teal.2', 'T': 'teal.3', 'u': 'teal.1', 'b': 'sky.2', 'B': 'sky.3', 'k': 'stone.2',
 'K': 'stone.3', 'j': 'stone.1', 'p': 'rose.2', 'P': 'rose.3', 'l': 'plum.2', 'L': 'plum.3', 'v': 'navy.2', 'V': 'navy.3', 'i': 'ink', 'o': 'paper'}
S = {}
S['prop/teapot'] = ["...ii.....", "..iyyi....", ".tTTTTt.t.", "tTbTTTTtt.", "ttTTTTTt.t", "ttttttttt.", ".uttttu...", "..uuuu...."]
S['prop/mug'] = ["........", ".rRRRR..", ".rRRRRr.", ".rrrrrr.", ".rrrrrr.", "..qqqq.."]
S['prop/bread'] = ["..NNNN..", ".NnnnnN.", "NnNnnNnN", "nnnnnnnn", "nmmmmmmn", ".mmmmmm."]
S['prop/apple'] = ["...h....", "..gh.g..", ".rRRrr..", "rRRrrrr.", "rrrrrrr.", ".rrrrq..", "..qqq..."]
S['prop/bookStack'] = ["..vvvvvvvv.", ".vVVVVVVVv.", ".vvvvvvvvo.", "rRRRRRRRRo.", "rrrrrrrrro.", "..yyyyyyyyy", "..gGGGGGGgo", "..gggggggg."]
S['prop/bookOpen'] = ["..oooo..oooo..", ".owwwwooowwwo.", ".owddwoowddwo.", ".owwwwooowwwo.", ".owddwoowddwo.", "..cccccccccc.."]
S['prop/cactus'] = ["....gG....", "..g.gG.g..", "..gGgG.gG.", "..gGgGGgG.", "...gggggg.", "....gggg..", "...nnnnn..", "...nmmmn..", "....mmm..."]
S['prop/fern'] = ["g..g.g..g", ".gGgGgGg.", "..gGGGg..", ".gGgGgGg.", "...ggg...", "..nnnnn..", "..nmmmn.."]
S['prop/tulips'] = ["..p...r...", ".pPp.rRr..", ".ppp.rrr..", "..g...g...", "..gg.gg...", "...bbbb...", "...bBbb...", "...bbbb..."]
S['prop/succulent'] = ["...gGg...", ".gGgGgGg.", "gGgGGgGgg", ".gggGggg.", "..rrrrr..", "..rqqqr.."]
S['prop/plate'] = [".kKKKKKKk.", "kKowwwwoKk", ".kKKKKKKk.", "..jjjjjj.."]
S['prop/kettle'] = ["...jj...", "..kKKk..", ".kKbKKkk", "kKKKKKKkk", "kkkkkkkk.", ".jjjjjj.."]
S['prop/cookies'] = [".nNNn..", "nnNNnn.", "nmnnmn.", ".mmmm.."]
S['prop/record'] = ["..jjjj..", ".jkKkkj.", "jkkyykkj", "jkkyykkj", ".jkkkkj.", "..jjjj.."]
S['prop/alarmClock'] = [".r..r.", "rrrrrr", "rwiwwr", "rwwiwr", "rrrrrr", ".q..q."]
S['prop/candle'] = ["..y.", "..Y.", ".oww", ".owc", ".owc", ".owc", ".dcc"]
S['prop/umbrella'] = ["..vvv..", ".vVvVvv", "vVvVvVv.", "...n....", "...n....", "..nn...."]
S['prop/catBowl'] = [".......", ".pPPPp.", "pPpppPp", ".ppppp."]
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for k, rows in S.items(): build(rows, L).save(os.path.join(out, k.replace('/', '__') + '.png'))
    print(len(S), 'props')
