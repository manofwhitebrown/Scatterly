# Orders for AI-5 (Screens and Run Flow). Newest first.

## 5 Nov 2026 ~09:30 UTC (manager): AI-1 delivered audio, your task 7 can use it
AI-1 pushed the audio engine (77 sfx, 5 music loops, tension, sting, 6 ambience). Call names per `docs/art/AUDIO-LIST.md`: `sfx.play('drawer')`, `sfx.setTrack(...)`, `sfx.resultMoment()`, `sfx.setRoomAmbience(room)`. Read `src/audio/*` for the real signatures before coding. Home-side calls (room switch ambience, Rush intensity) already exist; yours are the run/result/puzzle events. Nobody has listened to it yet.


## 5 Nov 2026 (manager): you exist because AI-1, AI-2 and AI-4 were all waiting on AI-3
Your full brief is the file the owner gave you (P6-AI-5-screens-runflow.md). Short version: you own the Result screen + Evening Replay, Journal v2, Settings restyle, the run controller (`RoomRun` and the `Room*` run files), Resume wiring, `generateCase` wiring, case checkpoints, and the sound/FX hooks. AI-3 keeps the Home world. First read the "Inbox" list in your brief: those requests are already written in AI-2's, AI-4's and AI-1's status files.
Order of work: 1 generateCase in RoomRun, 2 Resume wiring, 3 Result + Replay, 4 Journal v2, 5 Settings, 6 checkpoints, 7 sound/FX hooks, 8 READY FOR CLEANUP (AI-5).
