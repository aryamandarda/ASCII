<div align="center">

# Times Square

**A living portrait of New York, rendered in characters.**

Light, weather, billboards, pedestrians, and traffic share one changing city clock.

[**Explore the artwork ↗**](https://aryamandarda.com/ascii-art/nyc/) · [How it works](docs/rendering.md) · [Run locally](#run-locally) · [Mac preview](#mac-screensaver)

[![Times Square rendered as a full-color character canvas](docs/images/times-square.png)](https://aryamandarda.com/ascii-art/nyc/)

*One fixed viewpoint. A city that keeps moving.*

</div>

## The scene

A photograph provides the architecture; a layered Canvas 2D simulation brings the street to life. The finished scene is sampled into a grid of colored characters on every rendered frame.

- **A changing sky** — New York sunrise and sunset, moon phases, twilight palettes, and individually lit windows.
- **Seasonal weather** — clouds, rain, snowfall, and ground snow that accumulates and thaws across days.
- **A living plaza** — articulated pedestrians, personal space, seating, and time-of-day crowd density.
- **Street traffic** — two-way movement, signals, headlights, brake lights, and reflections.
- **Animated billboards** — ten creatives, perspective-mapped screens, and coordinated campaign takeovers.
- **An explorable clock** — choose a date, pause, reverse time, or change the playback speed and weather.

Built with **vanilla JavaScript and Canvas 2D**. No frontend framework or frontend build step. The scene runs locally; a small Cloudflare Worker and Durable Object provide the shared like counter.

## Explore

Open [**aryamandarda.com/ascii-art/nyc/**](https://aryamandarda.com/ascii-art/nyc/) and select **Immerse**. Press **H** or choose **Hide controls** for an unobstructed view. On phones, the full scene fits the display; **Zoom in** lets you drag through the details.

At **1×**, one simulated minute passes each real second. Speeds range from **0.5× to 5×**. Date, lighting, weather, people, traffic, and billboards follow that clock. The browser respects reduced-motion preferences.

Weather is a seasonal simulation, not a live forecast. Manual weather selections last until you choose **Natural · Date synced** or reload. This is an artwork, not a live camera or advertising feed.

## Run locally

With Python 3 installed:

```sh
git clone https://github.com/aryamandarda/ASCII.git
cd ASCII
python3 -m http.server 8000 --directory dist
```

Open [localhost:8000/projects/ASCII/nyc/](http://localhost:8000/projects/ASCII/nyc/). The artwork works without the like service.

For the complete app, including local likes and the public URL layout, use Node.js 20 or later:

```sh
npm ci
npm run dev:worker
```

Open the local address printed by Wrangler at `/ascii-art/nyc/`.

## How it is built

```mermaid
flowchart LR
    A[Photograph and masks] --> D[Layered scene · Canvas 2D]
    B[Calendar, weather and city simulation] --> D
    C[Billboard image sheets] --> D
    D --> E[Sample colors and character density]
    E --> F[Cached glyph atlas]
    F --> G[Visible character canvas]
```

The renderer uses a 1280 × 854 scene, perspective-mapped billboards, a 512-color palette, ordered dithering, and cached glyph pixels. A separate pedestrian mask preserves clothing colors through the character pass. Unchanged character cells reuse their previous pixels.

| Read more | What it covers |
| --- | --- |
| [Rendering the scene](docs/rendering.md) | Compositing order, billboard projection, character conversion, color correction, and performance tradeoffs |
| [Movement and weather](docs/movement-weather.md) | Gait, crowd spacing, vehicles, snow history, equations, and reference measurements |
| [Development](DEVELOPMENT.md) | Local previews, visual review, tests, and media preparation |
| [Hosting](docs/hosting.md) | Cloudflare routing and integration with the future personal website |

## Mac screensaver

The same scene is also packaged as an offline macOS `.saver`, with Apple Silicon and Intel binaries, natural weather, and continuous 1× playback.

**Experimental preview:** recurring white-screen behavior in the macOS Screen Saver host is under investigation. The web artwork is the recommended way to view the scene while that is resolved. Downloads are ad-hoc signed and are not Apple-notarized.

[Preview releases](https://github.com/aryamandarda/ASCII/releases) · [Installation and limitations](macos/INSTALL.md)

## Development

```sh
npm test                # Scene regressions; Node.js 20+ and FFmpeg
npm run test:worker    # Routing and like service; run npm ci first
```

The artwork lives in [`dist/projects/ASCII/nyc/`](dist/projects/ASCII/nyc/). Supporting areas are [`worker/`](worker/), [`macos/`](macos/), [`scripts/`](scripts/), [`tests/`](tests/), and [`docs/`](docs/).

For a bug report, include your browser or macOS version, viewport size, scene date and weather, and steps to reproduce it. Changes to the scene should preserve the shared clock and include a visual review as well as the relevant regression checks.

## Credits and rights

Created by [**Aryaman Darda**](https://github.com/aryamandarda).

Campaign imagery, source photography, and SunCalc retain their respective rights and notices. See [third-party notices](THIRD_PARTY_NOTICES.md) before reusing assets. No blanket license to the included photography or advertising artwork is implied.
