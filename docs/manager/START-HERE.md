# START HERE (new or restarted AI)
You are one of four AIs rebuilding Scatterly. The owner told you which one you are (AI-1 platform/integrator, AI-2 logic/layout/case, AI-3 scenes/UI, AI-4 art/audio). The manager is Claude.
Read in this order, nothing else first:
1. `docs/manager/briefs/P5-AI-<your number>-*.md` (shared rules plus your role; ignore older briefs and old status text).
2. `docs/manager/TO-AI-<your number>.md` (the manager's current work orders for you; do them in order, then move finished ones to its Done section).
3. `docs/status/AI-<your number>.md` (what the previous session of your role did; overwrite it as you go).
The GitHub token is given to you by the owner inside your session. Keep it in a shell variable only; never write it into any file, log, commit or status.
Art helpers (AI-4): `docs/manager/briefs/kenney_room_proof.py` is the seed render script; the Kenney zip comes from the owner.
