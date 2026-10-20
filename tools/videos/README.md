# Help & videos recorder

Records the explainer videos shown under **More → Help & videos** (`videos/<en|ar>/<id>.mp4` plus a `<id>.jpg` poster).

- The app runs against `mock-demo.cjs`, an in-memory stand-in for the Supabase endpoints, filled with a made-up building ("Cedar Residence", `demo-state.cjs`, Arabic wording in `demo-ar.cjs`). No real names, numbers or accounts appear.
- `recorder.cjs` drives real Chrome (Playwright, `channel: "chrome"`) at 390×844 with a device scale of 2, injects the captions, the tap dot, the title/end cards and stand-ins for the share sheet and WhatsApp, captures Chrome's screencast frames and encodes them to H.264 with WebCodecs. `mp4mux.cjs` writes the MP4 (index first, so phones start playing straight away).
- `videos.cjs` holds the scripts and the English/Arabic captions, one entry per video. The ids match `HELP_VIDEOS` in `src/app.js`.
- `frames.cjs <video.mp4> <out.jpg> [count] [tileWidth] [start] [end]` makes a contact sheet for checking a recording.

Run from the repo root (needs Google Chrome and the `playwright` package, which resolves from the parent folder's `node_modules`):

```bash
node tools/videos/run.cjs
```

`run.cjs` swaps `src/cloud-config.js` for a demo config during the run and always restores it, starts the demo server (port 4199) and `local-server.js` (4180), records, and writes each video's length into `HELP_VIDEOS`. Pass `en` or `ar`, and optionally a comma-separated list of ids, to re-record only some.
