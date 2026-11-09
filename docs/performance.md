# Performance and energy

## What is measured

The scene exposes per-frame timings on the `#art` canvas: `data-render-ms` and `data-render-stages`. These are elapsed rendering times, not battery measurements. Browser frame delivery also depends on display scheduling, compositing, other applications, and the device.

A repeatable busy-scene comparison uses the same New York date/time, weather, viewport, character count, and crowd count. Warm up the assets and crowd checkpoint before collecting samples. Run one renderer at a time; avoid other live renderers competing for the same CPU/GPU.

The November 2026 crowd optimization removes duplicate pedestrian drawing: one set of geometry and material calculations feeds both the scene and its color-preservation mask, without copying a separate image for every person. CPU-backed canvases are used where the next step reads their pixels. Small immutable rig meshes and parsed colors are reused. Billboard color samples are read in one batch, and unchanged light halos are cached. The glyph curve uses equivalent precomputed thresholds; all 16,777,216 RGB inputs were checked against the previous formula. The crowd count and avoidance rules are retained. Collision checks reject distant walkers by axis before measuring distance, and use a bounded two-dimensional length calculation rather than generalized `hypot` calls.

## First complete frame

Loading the background is not enough to reveal the scene. The renderer waits for the billboard images to settle and for the crowd worker to supply a valid state for the selected time. A completed crowd containing zero people is valid; an unfinished worker result is not. Time does not advance past a pending initial state, and a date jump holds the last complete picture until the replacement crowd is ready.

## Browser energy use

The artwork is a live simulation. Rendering pauses while the browser document is hidden. Closing the artwork tab stops its renderer and crowd worker. Frame timings and Activity Monitor’s Energy Impact are not battery-percent-per-hour measurements; battery drain also depends on brightness, display arrangement, power mode, and other applications.
