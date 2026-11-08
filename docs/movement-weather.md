# Movement and seasonal weather

The city is a stylized, date-driven simulation. Weather follows a repeatable seasonal model, not historical observations or a live forecast. Human movement uses a constrained skeleton informed by gait measurements, not motion capture or a clinical model.

## Walking measurements and implementation

Reference observations: adult walking is commonly around 1.2–1.4 m/s; stance occupies approximately 60% of a stride and swing 40%. Speed, stride length and cadence are coupled. Normal swing knee flexion is around 60°, with substantial variation between people and speeds.

The implementation chooses the following dimensions for a 1.75 m reference adult. All segment lengths scale with the person's height. These are modeling choices within ordinary adult proportions; anatomical measurement endpoints and populations differ between datasets.

| Quantity | Model value |
| --- | --- |
| Full head height | 22.4 cm, about 1/7.8 of standing height |
| Visible chin-to-collar neck | 3.5 cm |
| Shoulder breadth | 39.6 cm |
| Hip-joint spacing | 18.2 cm |
| Hip to knee | 42.9 cm |
| Knee to ankle | 43.1 cm |
| Shoulder to elbow | 32.6 cm |
| Elbow to wrist | 25.6 cm |
| Full stride, both steps | 0.98–1.32 m, coupled to personal pace |
| Free walking speed before avoidance | Approximately 0.46–0.96 m/s at 1× playback; 1.0 m/s absolute cap |
| Review gait | 0.82 m/s, 1.18 m stride, 83 steps/min |
| Measured-gait validation fixture | Approximately 63° peak knee flexion at a 1.35 m stride |
| Body turning limit | 1.6 radians/second of animation time |

The slower strolling range is an artistic choice for a crowded plaza, below the ordinary adult reference speed. Personal pace and stride length vary together. Unobstructed cars accelerate to 3.4–4.8 m/s, several times faster than people, and still brake for signals and queues.

The scene clock advances one simulated minute per real second at 1×. Pedestrian travel uses those same animation seconds; the city clock is deliberately accelerated, not literal real-time foot traffic. Higher playback speeds accelerate both travel and joint movement.

For distance traveled `d`, stride length `S`, and personal initial phase `φ`, the stride phase is `θ = 2πd/S + φ`. Cadence is `120v/S` steps/minute. Left and right legs differ by π. A stopped walker does not continue accumulating gait phase.

During stance (`0 ≤ u < 0.6`), a foot's fore/aft position relative to the root is `S(0.3 − u)`. Root travel cancels this displacement, planting the foot in a straight walk. Swing uses a cubic Hermite return with the same endpoint velocities. Heel rise, toe-off and ankle clearance are continuous. Collision avoidance and turning can still produce small sliding artifacts; the model does not store a separate world-space contact constraint through every turn.

The knee uses two-segment inverse kinematics with fixed thigh and shin lengths. Pelvis height follows the supporting leg while preventing either leg from overextending. The reference gait produces about 63° of swing knee flexion. Opposing arm motion follows the corresponding leg, with fixed upper-arm/forearm lengths and an elbow bend. Sitting blends targets through the same skeleton.

Heading is integrated with a rate limit and shortest-angle interpolation. It is not inferred anew from the sign of velocity at every frame. The face, hair, ears and neck share the skull/shoulder frame. A clipped hair cap cannot drift away from the face. The neck and torso use closed cross-sections with side walls, so a profile view retains chest thickness and a connected neck. Cloth panels, seams and folds give the shared ASCII pass stable tonal detail; there is no smooth sprite overlay on the final scene. The review study shows the underlying rig for inspection.

The character pass copies pre-rendered glyph pixels into a reusable buffer. It preserves the existing palette, glyphs and phone/desktop column counts while replacing hundreds of thousands of individual canvas calls. Animation targets 24 fps instead of imposing a 6 fps limit; actual throughput depends on the device. Billboard source clips remain 6 fps. Slow atmospheric changes are cached between pedestrian frames.

## Weather and persistence

Central Park's 1991–2020 monthly mean temperatures, precipitation and snowfall anchor the seasons. Rain is possible year-round; winter has more cold fronts capable of snow. Monthly anchors are interpolated smoothly, with a diurnal temperature cycle and deterministic multi-hour fronts. Front timing, cloud cover, wind and event intensity are artistic estimates rather than statistically calibrated weather reconstruction.

Each front builds cloud cover before precipitation and clears gradually afterward. Temperature controls the rain/snow transition. The sky has three simple appearances: clear, soft passing patches, or a continuous overcast deck with subtle texture. Three smooth noise scales add restrained cloud shape. Overcast is optically thick across the entire sky, including gaps in the lower patches, and suppresses the sun/moon discs. Dry fronts can produce full overcast without rain or snow. The same field controls cloud opacity and celestial visibility. Overcast also reduces the scene's direct daylight.

Snow depth uses hourly history from the preceding August, so January does not reset it. A 10:1 fresh-snow/liquid ratio provides a rough estimate. Above-freezing temperatures, sun exposure and warm rain increase melt. A cold dry day loses only a small amount. Sheltered ledges melt more slowly than exposed pavement; paths and vehicle lanes retain less snow. Snow is drawn only on pavement, curbs, table tops and manually mapped upward-facing ledges, not across billboard faces or pedestrians. Roofs outside the photograph's visible surfaces cannot be represented.

The hourly history is reconstructed deterministically after date jumps or cache eviction. Reversing playback restores the same cloud cover, snow depth and melt state. This is date persistence, not a browser-local saved accumulation dependent on how long a tab was left open.

## Billboard light and background buildings

Billboards have approximate positions, areas and inward-facing normals in the same metre space as the pedestrians. Their sampled creative colors feed a finite-area falloff that approaches inverse-square distance attenuation, with receiving-surface angle and a small approximate bounced-light term. Pavement and pedestrian/car materials receive the same source field. Ground illumination spans the plaza and is bounded under overlapping white campaigns. It does not copy advertisements onto dry paving. Screen halos are masked out of the sky. This is a 2.5D artistic light model, not calibrated photometry or ray tracing.

Seven mapped distant facades supplement the existing extracted windows. Their bays turn on independently through dusk at 24–40% of the nearby-window opacity, with a smaller glow radius.

## Moon

The bundled SunCalc computes illumination fraction, phase, bright-limb angle, altitude and parallactic angle for the scene's date and New York coordinates. The illuminated shape uses a curved terminator, so crescent, quarter, gibbous and full phases are distinct. Below-horizon moons are hidden; daytime moons are faint. Screen placement is fitted to the photograph rather than a calibrated astronomical camera. Clouds are composited over the disc.

## Local review

Use the temporary [review site](https://ascii-review.aryamandarda.workers.dev/review/) while it is active. It is deleted only on Aryaman’s instruction. For an offline copy, run `python3 scripts/build-local-preview.py` and open `.openai/Times-Square-Local-Test.html`. **Test scenes → Inspect walking mechanics** shows enlarged front, side, back and turning views, a joint overlay, pause, and quarter speed. Scene presets also expose night lighting, passing clouds and dry overcast. The seasonal presets cover January 2 snowfall, January 3 retained snow, January 6/7 thaw, April rain/clouds, summer and sunset. The calendar can be scrubbed in either direction. No preview controls ship in production.

Run `npm test`. New regression checks cover bone-length conservation, knee flexion, stance foot locking, continuous foot contact, heading wraparound, seasonal precipitation, multi-day accumulation/thaw, deterministic history, and lunar geometry. Existing crowd, lighting and traffic tests remain in place.

## References

- [Normative 3D gait data of 246 healthy adults at three speeds (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10912446/). Reference for gait variability and measured joint trajectories, not a claim that this renderer reproduces that dataset.
- [Frequency-dependent modulation across the gait cycle (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9248303/). Stance/swing timing.
- [Normal gait, Atlas of Limb Prosthetics](https://www.oandplibrary.org/alp/chap13-01.asp). Gait-cycle and joint-angle reference.
- [KIT Whole-Body Human Motion Database: anthropometric measurement definitions](https://motion-database.humanoids.kit.edu/anthropometric_table/).
- [NWS Central Park normals and extremes](https://www.weather.gov/media/okx/Climate/CentralPark/nycnormals.pdf). Monthly climate anchors.
- [NASA: Moon phases](https://science.nasa.gov/moon/moon-phases/); [US Naval Observatory: phases and illumination](https://aa.usno.navy.mil/faq/moon_phases). Phase geometry. SunCalc's existing license remains in the third-party notices.

- [PBRT: area lights](https://pbr-book.org/4ed/Light_Sources/Area_Lights) and [diffuse reflection](https://pbr-book.org/4ed/Reflection_Models/Diffuse_Reflection). Basis for the light falloff approximation.
- [NOAA cloud classification](https://www.weather.gov/lmk/cloud_classification). Passing layers, opaque stratus/nimbostratus, and fronts that thicken into overcast.

## Character rendering for pedestrians

The walking rig remains the motion source. Its visible coverage selects a separate glyph atlas with 18% background color and brighter character ink, so clothing and body shading read as character clusters. Depth-sorted cars and furniture erase covered person cells from this mask. Both masks clear every frame, and atlas selection is part of the cell cache key to prevent trails when a person moves. The enlarged mechanics inspector shows the underlying rig; judge the finished character treatment in the main scene.
