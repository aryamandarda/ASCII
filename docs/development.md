# Development

The artwork is static. Shared likes use the Worker in `server/index.js` and one SQLite-backed Durable Object per artwork, configured in `wrangler.jsonc`. There is no separate database service or frontend build step.

For the complete app including persisted local likes, run `npm ci` and `npm run dev:worker`. Run `npm run test:worker` for Workers-runtime tests of concurrent likes, retry deduplication, unlike, cookie state, input rejection, and asset routing. `npm test` runs the existing artwork checks. Plain static/offline previews show an unavailable count and keep the artwork usable.

The public endpoint is `/ascii-art/nyc/api/likes`; `/api/likes/nyc` remains compatible. Only a random browser ID is stored with each active like; no IP address, name, or email is stored in the counter. Cookie expiry is one year. This is a lightweight reaction counter, not an identity or bot-verification system. Production data persists across code deployments.

Serve `web` with an HTTP server, for example:

```sh
python3 -m http.server 8000 --directory web
```

Open `http://localhost:8000/artworks/nyc/`. The root entry is a compatibility view of the same artwork.

Run the existing checks with Node.js and FFmpeg installed:

```sh
node --test tests/*.test.cjs
```

The checks cover pedestrian separation, seating clearance, vehicle spacing, time reversal, New York daylight and calendar transitions, character rendering, perspective transforms, and the source video clips.

For real-browser GPU checks, copy `tools/review/gpu.html` to `web/review/gpu.html` and open `/review/gpu.html` on the local server. It compares 16,384 sampled colors against the CPU character code at both glyph sizes, checks the mask cutoff and pixel orientation, and exercises context loss and restoration. `tools/review/mobile.html` provides portrait, landscape, and safe-area layout checks in the same way. The `web/review/` directory is excluded from production assets.

## Local visual review before a pull request

Build a standalone, offline review file:

```sh
python3 tools/build-local-preview.py
```

Open `.openai/Times-Square-Local-Test.html` in a browser. No server or package installation is needed. The file includes all scene images, campaign frames, JavaScript and CSS. Its Test scenes panel offers snowfall, retained snow, consecutive thaw days, spring rain, a cloudy night, summer and sunset presets, plus a phone viewport. **Inspect walking mechanics** opens an enlarged gait study with front/side/back/turning views, a skeleton overlay, pause, and quarter speed. Resize the browser to check desktop granularity. Use Hide controls or H inside the artwork to toggle the scene controls.

The preview is generated from current source, starts paused, and does not publish or create a pull request. Review the gait, clouds, accumulated snow, pavement, screen glow, crowd and menu behavior before proposing changes. Run `npm test` for automated coverage of adaptive detail, bounded diffuse illumination and control toggling alongside gait, seasonal history and lunar phase checks. [Mechanics and reference measurements](movement-weather.md) explain the implementation and approximations.

## Archived review deployment

The former `ascii-review` review address is disabled. The production artwork is served at https://aryamandarda.com/ascii-art/nyc/. Local review tools remain available for future artworks and changes. The old video-download helper is retained under `tools/archive/video-download/` for provenance; its public address is disabled.

## Personal website integration

The canonical artwork path is `/ascii-art/nyc/`. Keep this repository and its Worker independent of the personal website; Cloudflare path routes preserve the artwork URL when the homepage launches. See [Hosting](hosting.md) for the exact routes and migration steps.

## Cloudflare Pages

For an independent static deployment, use `main`, no framework, no build command, and `web` as the output directory. Connecting GitHub requires the Cloudflare Workers and Pages GitHub app to have access to this repository.

The contents of `.openai` belong to the private ChatGPT preview and are intentionally absent from this repository.

## Media

The current renderer uses the included image sheets for deterministic billboard animation. Original motion clips and preparation scripts are retained for reproducibility. Run the preparation scripts only when changing the creatives. Media credit and SunCalc's license are retained with the artwork.
