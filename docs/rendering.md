# Rendering Times Square

Times Square is a fixed-view, layered 2D scene converted into colored characters. It combines a reference photograph with procedural lighting, weather, people, vehicles, and animated advertising. There is no 3D engine, shader pipeline, or runtime video-to-ASCII service.

This document describes the current implementation. Earlier experiments and asset preparation notes remain in [art-notes.md](../web/artworks/nyc/art-notes.md).

## 1. Establish the scene

The compositor uses a **1280 × 854** world canvas. The reference photograph supplies the buildings and architectural detail. Hand-defined masks and polygons identify the sky, ground, billboard faces, and other surfaces that need independent treatment. A roadway cleanup patch removes conflicting photographic detail where simulated traffic is drawn.

The fixed camera is a deliberate constraint: billboard corners, walking space, road lanes, seating, window positions, and depth relationships can be calibrated directly against the photograph. This is image-space composition rather than a reconstructed 3D city.

## 2. Drive everything from one clock

[`calendar.js`](../web/artworks/nyc/calendar.js) represents the selected date and time in New York. SunCalc supplies solar and lunar calculations. At normal playback, each real second advances the calendar by one simulated minute; a simulated day takes about 24 real minutes.

The date determines lighting and seasonal conditions. Playback can pause, accelerate, or reverse. Crowd simulation runs through a worker where available, with checkpoint/replay behavior and a main-thread fallback. Billboard animation also samples the shared timeline, so scrubbing does not depend on independent media-player clocks.

## 3. Compose the environment

[`environment.js`](../web/artworks/nyc/environment.js) builds the environment using the photograph and scene masks, with reusable intermediate canvases and cached layers. Solar elevation changes exposure and sky color. Moon phase, clouds, window illumination, and the selected twilight palette change the atmosphere.

[`weather.js`](../web/artworks/nyc/weather.js) generates seasonal conditions from deterministic inputs. Ground snow depends on recent accumulation and thaw history, not merely the current precipitation switch. Explicit weather overrides affect the current view; selecting Natural restores the date-driven model.

This is a plausible artistic model. It does not fetch live weather, measured pedestrian counts, or current traffic data.

## 4. Put moving artwork on the billboards

The billboard faces are measured as four-corner polygons. [`billboard-model.js`](../web/artworks/nyc/billboard-model.js) supplies their placement and campaign selection; [`motion-manifest.js`](../web/artworks/nyc/motion-manifest.js) describes the prepared motion sheets.

The browser loads five animated creatives as image atlases, alongside five static posters. Preparation reduces the motion frames to 128 pixels wide at 6 fps. Each screen first draws its selected creative onto a small staging canvas, 240 pixels wide with height derived from the screen's aspect ratio.

A projective homography maps each screen's unit square to its four measured corners. Canvas 2D cannot directly project a textured quadrilateral, so the renderer approximates the mapping with **two vertical subdivisions and four clipped affine triangles**. Slight triangle overlap hides cracks. This trades some perspective precision for a small, predictable rendering cost.

Screen colors also feed bounded light-spill effects on nearby ground and actors. Campaign sequencing, image-sheet sampling, and takeover timing all use the simulation clock.

## 5. Animate and layer the street

[`pedestrian-rig.js`](../web/artworks/nyc/pedestrian-rig.js) constructs people from a proportioned, articulated skeleton. Gait follows traveled distance, helping keep foot motion connected to movement through the plaza. Crowd routing handles separation and seating clearance; density varies with the time of day.

Vehicles follow calibrated lanes and signals. Headlights, brake lights, and reflections help place them in the changing scene. Street objects and actors are sorted for depth before drawing, so people, cars, and plaza furniture overlap coherently. Weather particles are composited afterward.

Each pedestrian’s geometry, lighting, and material colors are calculated once. The resulting drawing commands feed both the world and a **pedestrian coverage mask**, preserving depth order without recalculating the rig or transferring a separate image for every person. That mask survives into the character conversion step and allows the renderer to preserve clothing color. [Movement and weather mechanics](movement-weather.md) gives the equations, dimensions, and modeling assumptions in detail.

## 6. Convert the finished scene into characters

[`character-grid.js`](../web/artworks/nyc/character-grid.js) and [`fixed-screens.js`](../web/artworks/nyc/fixed-screens.js) implement the final pass:

1. Choose a character grid appropriate to the viewport. Rows follow `round(columns × 854 / 1280 × 0.6)` to account for the glyph aspect ratio.
2. Downsample the composed scene and pedestrian mask to one sample per character cell.
3. Quantize RGB into **8 levels per channel**, giving **512 colors**. A **4 × 4 Bayer matrix** distributes quantization thresholds spatially to soften color transitions.
4. Select one of eight glyph densities from ` .:-+*#@` using the sample's luminance.
5. Copy the selected glyph's cached pixels into the output image.

The desktop glyph atlas uses **6 × 10** cells with bold 10 px monospace characters. A compact **3 × 5** atlas is prepared by downsampling for artwork views narrower than 1920 CSS pixels. The character count stays the same; larger views retain the **6 × 10** output. The canvas is then fitted to the display while preserving the scene's aspect ratio.

The renderer keeps the previous encoded value for each cell. If color, glyph, and pedestrian-mask state are unchanged, its pixels are left alone. Changed cells are copied through `Uint32Array` views into a reusable image buffer; `putImageData` updates the bounding range of changed rows. This avoids issuing hundreds of thousands of individual glyph drawing calls per frame, although sampling and comparison still visit the full grid.

## 7. Preserve color without clothing stripes

Early versions used a very dark background behind the pedestrian glyphs. Once repeated across rows, the gaps read as horizontal bands across shirts and trousers. Increasing video quality alone could not solve that source-rendering problem.

The approved correction raises the pedestrian cell background from **18% to 82%** of its quantized color and uses a restrained **1.16× foreground gain**, clamped per channel. It reduces the contrast between character strokes and their background while retaining the colored character texture. The main scene atlas also uses an 82% background, with a shared foreground gain limited to avoid clipping.

The pedestrian mask selects the corresponding atlas when its sampled alpha exceeds 180. Keeping that choice inside the source renderer carries the correction into the browser and captured frames.

## Performance and tradeoffs

The first visible frame waits for both the assets and a valid crowd state. During date jumps, it holds the last complete scene until the worker catches up.

The browser requests animation frames but caps scene draws at **24 fps**, and pauses normal playback while the document is hidden. A cap is not a guarantee: frame time depends on viewport detail, device, crowd, weather, and browser.

The largest work happens in scene composition, canvas readback, character sampling, and pixel copying. Reused canvases, glyph atlases, dirty-cell comparisons, and worker-based crowd calculations reduce repeated work. Motion sheets remove runtime video decoding but consume decoded image memory. Adaptive character density balances detail against the cost of the output buffer.

For inspection, the visible `#art` canvas exposes `data-render-ms`, `data-render-stages`, `data-columns`, `data-glyph-width`, and `data-frame`. Stage timings separate the environment, crowd, advertising, ground, actors, precipitation, and character pass. These are diagnostics, not claims of a particular frame rate on every machine.
