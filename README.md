# ASCII

Interactive city portraits, rendered in characters.

## NYC

Times Square as a living character canvas. Neon billboards trade places, the sky follows a New York calendar, and pedestrians and traffic move through a fixed street-level view.

- Ten billboard creatives, animated campaigns, and coordinated screen takeovers.
- Date-aware sunrise, sunset and moon phases, four twilight palettes, and individually lit windows.
- Seasonal rain, drifting clouds, snowfall, and snow that accumulates and thaws across days.
- Pedestrians with a proportioned skeleton, distance-driven gait, personal space, and time-of-day crowd density.
- Red plaza seating and two-way traffic with headlights, brake lights, and reflections.
- A minimal immersive view with glass controls, built for desktop and mobile.

Built with vanilla JavaScript and Canvas 2D. No frontend framework or build step. A small Cloudflare Worker and Durable Object persist anonymous likes; the artwork itself stays static.

A heart button shows the shared like count. Tap to like or unlike. An anonymous browser cookie remembers your choice; clearing cookies or changing devices creates a new identity. Counts are reactions, not verified unique people.

## Mac screensaver

[Download Times Square for Mac](https://github.com/aryamandarda/ASCII/releases) — choose the newest release containing version 1.0.3. Includes Apple Silicon and Intel, offline animation, and natural seasonal weather.

This is a public preview, not Apple-notarized. Read the [installation instructions](macos/INSTALL.md) before installing.

## Run locally

```sh
git clone https://github.com/aryamandarda/ASCII.git
cd ASCII
python3 -m http.server 8000 --directory dist
```

Open [localhost:8000/projects/ASCII/nyc/](http://localhost:8000/projects/ASCII/nyc/) in a modern browser. Serve the files over HTTP rather than opening `index.html` directly.

## Explore

Select **Immerse** to enter the artwork. Use the date and time controls to explore the scene, the sunset icon to choose a palette, and the playback controls to pause or reverse time. Use **Hide controls** or **H** for a clear view.

**Weather** offers Natural, Clear, Passing Clouds, Overcast, Rain, and Snow. Manual selections stay active as you change the date or play time forward/backward. Choose **Natural · Date synced** to immediately restore seasonal weather and snow history for the selected date and time. Overrides reset to Natural on reload; they do not change the calendar simulation.

On phones, Immerse keeps the full scene visible in both portrait and landscape and tucks away the controls. The heart stays visible. Choose **Zoom in** to fill the display and drag to explore; rotating returns to the full scene. **Fullscreen** is available on desktop. On iPhone, use Safari → Share → Add to Home Screen → Open as Web App for a view without the browser toolbar.

Speeds range from **0.5× to 5×**. At 1×, five simulated minutes pass in five seconds. People, traffic, billboards, and lighting follow the same clock. Reduced-motion preferences are respected.

## Mac screensaver preview

The native `.saver` wrapper packages this same scene for offline use on Apple Silicon and Intel Macs, with natural weather and continuous 1× playback. Each activation starts at the current date/time. Controls and likes are hidden.

See [Mac installation and testing notes](macos/INSTALL.md) and [downloadable previews](https://github.com/aryamandarda/ASCII/releases). Builds are ad-hoc signed; Apple notarization and physical Screen Saver host testing are still pending. To build on a Mac with Xcode Command Line Tools, run `bash macos/build.sh`.

## Development

The complete scene lives in [`dist/projects/ASCII/nyc/`](dist/projects/ASCII/nyc/). Its [artwork notes](dist/projects/ASCII/nyc/art-notes.md) describe the renderer and simulation. See [development and website integration](DEVELOPMENT.md) for running the artwork alongside the separate personal website.

Run the regression checks with Node.js 20 or later and FFmpeg installed:

```sh
npm test
```

For a repeatable phone layout review, copy `scripts/review/mobile.html` into `dist/review/mobile.html`, open `/review/mobile.html` on the local server, and select **Run layout checks**. It checks ten portrait, landscape, browser-height, and safe-area configurations. Real iOS Safari and Android devices should also be checked for browser toolbar and native fullscreen behavior.

The checks cover the character pipeline, calendar and daylight calculations, billboard sequencing, gait mechanics, crowd movement, traffic, and seasonal weather. See [movement and weather mechanics](docs/movement-weather.md) for dimensions, equations, references, and the local review. No package installation is required.

## Credits

Created by [Aryaman Darda](https://github.com/aryamandarda).

Campaign artwork, photography, and SunCalc are credited in [Third-party notices](THIRD_PARTY_NOTICES.md).

This is an artistic simulation. Crowd and traffic levels are modeled; weather is illustrative. It is not a live camera or advertising feed.
