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
| Full stride, both steps | 1.25–1.41 m |
| Free walking speed before avoidance | Approximately 1.0–1.35 m/s at 1× playback |
| Reference gait | 1.20 m/s, 1.35 m stride, 107 steps/min |
| Reference peak swing knee flexion | Approximately 63° |
| Body turning limit | 1.6 radians/second of animation time |

The scene clock advances one simulated minute per real second at 1×. Pedestrian travel uses those same animation seconds; the city clock is deliberately accelerated, not literal real-time foot traffic. Higher playback speeds accelerate both travel and joint movement.

For distance traveled `d`, stride length `S`, and personal initial phase `φ`, the stride phase is `θ = 2πd/S + φ`. Cadence is `120v/S` steps/minute. Left and right legs differ by π. A stopped walker does not continue accumulating gait phase.

During stance (`0 ≤ u < 0.6`), a foot's fore/aft position relative to the root is `S(0.3 − u)`. Root travel cancels this displacement, planting the foot in a straight walk. Swing uses a cubic Hermite return with the same endpoint velocities. Heel rise, toe-off and ankle clearance are continuous. Collision avoidance and turning can still produce small sliding artifacts; the model does not store a separate world-space contact constraint through every turn.

The knee uses two-segment inverse kinematics with fixed thigh and shin lengths. Pelvis height follows the supporting leg while preventing either leg from overextending. The reference gait produces about 63° of swing knee flexion. Opposing arm motion follows the corresponding leg, with fixed upper-arm/forearm lengths and an elbow bend. Sitting blends targets through the same skeleton.

Heading is integrated with a rate limit and shortest-angle interpolation. It is not inferred anew from the sign of velocity at every frame. The face, hair, ears and neck share the skull/shoulder frame. A clipped hair cap cannot drift away from the face. Neck geometry has straight boundaries, avoiding rounded stroke caps that previously made it look elongated.

The character pass copies pre-rendered glyph pixels into a reusable buffer. It preserves the existing palette, glyphs and phone/desktop column counts while replacing hundreds of thousands of individual canvas calls. Animation targets 24 fps instead of imposing a 6 fps limit; actual throughput depends on the device. Billboard source clips remain 6 fps. Slow atmospheric changes are cached between pedestrian frames.

## Weather and persistence

Central Park's 1991–2020 monthly mean temperatures, precipitation and snowfall anchor the seasons. Rain is possible year-round; winter has more cold fronts capable of snow. Monthly anchors are interpolated smoothly, with a diurnal temperature cycle and deterministic multi-hour fronts. Front timing, cloud cover, wind and event intensity are artistic estimates rather than statistically calibrated weather reconstruction.

Each front builds cloud cover before precipitation and clears gradually afterward. Temperature controls the rain/snow transition. Clouds are a drifting, layered noise field with shaded interiors and soft boundaries, clipped to the photograph's actual sky. The same cloud field obscures sun and moon. Overcast also reduces the scene's direct daylight.

Snow depth uses hourly history from the preceding August, so January does not reset it. A 10:1 fresh-snow/liquid ratio provides a rough estimate. Above-freezing temperatures, sun exposure and warm rain increase melt. A cold dry day loses only a small amount. Sheltered ledges melt more slowly than exposed pavement; paths and vehicle lanes retain less snow. Snow is drawn only on pavement, curbs, table tops and manually mapped upward-facing ledges, not across billboard faces or pedestrians. Roofs outside the photograph's visible surfaces cannot be represented.

The hourly history is reconstructed deterministically after date jumps or cache eviction. Reversing playback restores the same cloud cover, snow depth and melt state. This is date persistence, not a browser-local saved accumulation dependent on how long a tab was left open.

## Moon

The bundled SunCalc computes illumination fraction, phase, bright-limb angle, altitude and parallactic angle for the scene's date and New York coordinates. The illuminated shape uses a curved terminator, so crescent, quarter, gibbous and full phases are distinct. Below-horizon moons are hidden; daytime moons are faint. Screen placement is fitted to the photograph rather than a calibrated astronomical camera. Clouds are composited over the disc.

## Local review

Run `python3 scripts/build-local-preview.py` and open `.openai/Times-Square-Local-Test.html`. **Test scenes → Inspect walking mechanics** shows enlarged front, side, back and turning views, a joint overlay, pause, and quarter speed. Scene presets cover January 2 snowfall, January 3 retained snow, January 6/7 thaw, April rain/clouds, summer and sunset. The calendar can be scrubbed in either direction. No preview controls ship in production.

Run `npm test`. New regression checks cover bone-length conservation, knee flexion, stance foot locking, continuous foot contact, heading wraparound, seasonal precipitation, multi-day accumulation/thaw, deterministic history, and lunar geometry. Existing crowd, lighting and traffic tests remain in place.

## References

- [Normative 3D gait data of 246 healthy adults at three speeds (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10912446/). Reference for gait variability and measured joint trajectories, not a claim that this renderer reproduces that dataset.
- [Frequency-dependent modulation across the gait cycle (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9248303/). Stance/swing timing.
- [Normal gait, Atlas of Limb Prosthetics](https://www.oandplibrary.org/alp/chap13-01.asp). Gait-cycle and joint-angle reference.
- [KIT Whole-Body Human Motion Database: anthropometric measurement definitions](https://motion-database.humanoids.kit.edu/anthropometric_table/).
- [NWS Central Park normals and extremes](https://www.weather.gov/media/okx/Climate/CentralPark/nycnormals.pdf). Monthly climate anchors.
- [NASA: Moon phases](https://science.nasa.gov/moon/moon-phases/); [US Naval Observatory: phases and illumination](https://aa.usno.navy.mil/faq/moon_phases). Phase geometry. SunCalc's existing license remains in the third-party notices.
