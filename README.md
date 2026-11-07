# ASCII

Interactive city portraits, rendered in characters.

## NYC

Times Square as a living character canvas. Neon billboards trade places, the sky follows a New York calendar, and pedestrians and traffic move through a fixed street-level view.

- Ten billboard creatives, animated campaigns, and coordinated screen takeovers.
- Date-aware sunrise and sunset, four twilight palettes, and individually lit windows.
- Pedestrians with varied gait, personal space, and time-of-day crowd density.
- Red plaza seating and two-way traffic with headlights, brake lights, and reflections.
- A minimal immersive view with glass controls, built for desktop and mobile.

Built with vanilla JavaScript and Canvas 2D. No framework, backend, API keys, or build step.

## Run locally

```sh
git clone https://github.com/aryamandarda/ASCII.git
cd ASCII
python3 -m http.server 8000 --directory dist
```

Open [localhost:8000/projects/ASCII/nyc/](http://localhost:8000/projects/ASCII/nyc/) in a modern browser. Serve the files over HTTP rather than opening `index.html` directly.

## Explore

Select **Immerse** to enter the artwork. Use the date and time controls to explore the scene, the sunset icon to choose a palette, and the playback controls to pause or reverse time.

Speeds range from **0.5× to 5×**. At 1×, five simulated minutes pass in five seconds. People, traffic, billboards, and lighting follow the same clock. Reduced-motion preferences are respected.

## Development

The complete scene lives in [`dist/projects/ASCII/nyc/`](dist/projects/ASCII/nyc/). Its [artwork notes](dist/projects/ASCII/nyc/art-notes.md) describe the renderer and simulation. See [development and website integration](DEVELOPMENT.md) for running the artwork alongside the separate personal website.

Run the regression checks with Node.js 20 or later and FFmpeg installed:

```sh
npm test
```

The checks cover the character pipeline, calendar and daylight calculations, billboard sequencing, crowd movement, and traffic. No package installation is required.

## Credits

Created by [Aryaman Darda](https://github.com/aryamandarda).

Inspired by [the interactive ASCII work at mlsimon.com](https://mlsimon.com/). Campaign artwork, photography, and SunCalc are credited in [Third-party notices](THIRD_PARTY_NOTICES.md).

This is an artistic simulation. Crowd and traffic levels are modeled; weather is illustrative. It is not a live camera or advertising feed.
