#!/usr/bin/env bash
# npm run art:sheet -> docs/art/evidence/art-sheet.png (all 6 rooms composed from public/atlas, no browser). Optional arg: scale (default 1).
set -euo pipefail
T="$(mktemp)"; trap 'rm -f "$T"' EXIT
npx vite-node tools/artsheet/export.ts > "$T"
mkdir -p docs/art/evidence
python3 tools/artsheet/sheet.py "$T" docs/art/evidence/art-sheet.png "${1:-1}"
