#!/usr/bin/env python3
"""Every model used by tools/render3d/models.json must have a verified front in fronts.json. Exit 1 otherwise."""
import json, os, sys
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, '..', 'render3d')
f = json.load(open(os.path.join(R, 'fronts.json')))
known = set(f['verified_front_at_rot0']) | set(f['symmetric_or_front_agnostic'])
used = {v['model'] for v in json.load(open(os.path.join(R, 'models.json'))).values()}
missing = sorted(used - known)
for m in missing: print('no verified front:', m)
print(f'check-fronts: {len(used)} models, {len(missing)} without a verified front'); sys.exit(1 if missing else 0)
