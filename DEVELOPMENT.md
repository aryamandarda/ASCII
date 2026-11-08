# Development

The artwork is static. Shared likes use the Worker in `worker/index.js` and one SQLite-backed Durable Object per artwork, configured in `wrangler.jsonc`. There is no separate database service or frontend build step.

For the complete app including persisted local likes, run `npm ci` and `npm run dev:worker`. Run `npm run test:worker` for Workers-runtime tests of concurrent likes, retry deduplication, unlike, cookie state, input rejection, and asset routing. `npm test` runs the existing artwork checks. Plain static/offline previews show an unavailable count and keep the artwork usable.

The live endpoint is `/api/likes/nyc`. Only a random browser ID is stored with each active like; no IP address, name, or email is stored in the counter. Cookie expiry is one year. This is a lightweight reaction counter, not an identity or bot-verification system. Production data persists across code deployments.

Serve `dist` with an HTTP server, for example:

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000/projects/ASCII/nyc/`. The root entry is a compatibility view of the same artwork.

Run the existing checks with Node.js and FFmpeg installed:

```sh
node --test tests/*.test.cjs
```

The checks cover pedestrian separation, seating clearance, vehicle spacing, time reversal, New York daylight and calendar transitions, character rendering, perspective transforms, and the source video clips.

## Local visual review before a pull request

Build a standalone, offline review file:

```sh
python3 scripts/build-local-preview.py
```

Open `.openai/Times-Square-Local-Test.html` in a browser. No server or package installation is needed. The file includes all scene images, campaign frames, JavaScript and CSS. Its Test scenes panel offers snowfall, retained snow, consecutive thaw days, spring rain, a cloudy night, summer and sunset presets, plus a phone viewport. **Inspect walking mechanics** opens an enlarged gait study with front/side/back/turning views, a skeleton overlay, pause, and quarter speed. Resize the browser to check desktop granularity. Use Hide controls or H inside the artwork to toggle the scene controls.

The preview is generated from current source, starts paused, and does not publish or create a pull request. Review the gait, clouds, accumulated snow, pavement, screen glow, crowd and menu behavior before proposing changes. Run `npm test` for automated coverage of adaptive detail, bounded diffuse illumination and control toggling alongside gait, seasonal history and lunar phase checks. [Mechanics and reference measurements](docs/movement-weather.md) explain the implementation and approximations.

## Temporary Cloudflare review site

The review deployment is a separate Worker named `ascii-review`, served at `https://ascii-review.aryamandarda.workers.dev/review/`. It uses the `preview/seasonal-gait` branch. The production Worker is `ascii-art` and continues to follow `main`.

Its build command is `python3 scripts/build-local-preview.py --hosted`. This generates `dist/review/index.html` with the same weather presets and walking study as the offline review. Assets load from their normal URLs, so the review page itself stays small. The generated page is excluded from Git and asks search engines not to index it.

The review uses the existing Workers Builds deployment method, with an explicit target: `npx wrangler deploy --name ascii-review --assets dist --compatibility-date 2026-11-08`. Update only the review branch during review; do not merge into `main` or change the production build trigger until release is requested.

Keep the temporary review site available until Aryaman explicitly says the review is finished and asks for deletion. At that point, remove its build trigger first and then delete only the `ascii-review` Worker. Keep the source branch and production site. A later review can recreate the same Worker name and URL.

## Separate artwork and personal website repositories

Keep this repository as the source of the artwork. The personal website can include it at build time and copy only `dist/projects/ASCII` into its own static output at `projects/ASCII`.

For example, pin this repository as a Git submodule under `vendor/ascii`, then copy `vendor/ascii/dist/projects/ASCII` into the website's public assets before building. This preserves `/projects/ASCII/nyc/` and keeps the personal homepage independent. Update the pinned artwork commit whenever a new version is ready.

Alternatively, deploy this repository independently and route `/projects/ASCII/*` to that deployment using the personal site's Cloudflare Worker. Keep the remaining paths routed to the personal website.

## Cloudflare Pages

For an independent static deployment, use `main`, no framework, no build command, and `dist` as the output directory. Connecting GitHub requires the Cloudflare Workers and Pages GitHub app to have access to this repository.

The contents of `.openai` belong to the private ChatGPT preview and are intentionally absent from this repository.

## Media

The current renderer uses the included image sheets for deterministic billboard animation. Original motion clips and preparation scripts are retained for reproducibility. Run the preparation scripts only when changing the creatives. Media credit and SunCalc's license are retained with the artwork.
