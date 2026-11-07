# Development

This is a self-contained static artwork. There is no dependency installation or frontend build step.

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

## Separate artwork and personal website repositories

Keep this repository as the source of the artwork. The personal website can include it at build time and copy only `dist/projects/ASCII` into its own static output at `projects/ASCII`.

For example, pin this repository as a Git submodule under `vendor/ascii`, then copy `vendor/ascii/dist/projects/ASCII` into the website's public assets before building. This preserves `/projects/ASCII/nyc/` and keeps the personal homepage independent. Update the pinned artwork commit whenever a new version is ready.

Alternatively, deploy this repository independently and route `/projects/ASCII/*` to that deployment using the personal site's Cloudflare Worker. Keep the remaining paths routed to the personal website.

## Cloudflare Pages

For an independent static deployment, use `main`, no framework, no build command, and `dist` as the output directory. Connecting GitHub requires the Cloudflare Workers and Pages GitHub app to have access to this repository.

The contents of `.openai` belong to the private ChatGPT preview and are intentionally absent from this repository.

## Media

The current renderer uses the included image sheets for deterministic billboard animation. Original motion clips and preparation scripts are retained for reproducibility. Run the preparation scripts only when changing the creatives. Media credit and SunCalc's license are retained with the artwork.
