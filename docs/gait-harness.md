# Pedestrian quality harness

Run `npm run judge:gait`, then `npm test`. The hosted review builder runs the gait gate before publishing and regenerates the report. A failing gate aborts the build. `current-report.json` includes the renderer source SHA-256 to identify what was measured.

Open `/gait-study/judge.html` for continuous old/new motion and eight-phase contact sheets. Inspect side, front, three-quarter and back; switch between 680-column desktop and 390-column phone sampling. The panels use the environment's CharacterGrid palette, glyph ramp and 6 × 10 tiles. The existing photographic comparison remains linked. The street view uses the actual person-contrast treatment and was inspected separately.

## What is automated

720 samples for each of nine height/stride combinations. Additional near-boundary samples check heel strike and toe-off. The gate measures joint discontinuities, bone lengths, head excursion, torso length change, knee bend, ground contact and opposing arms. Thresholds are project constraints, not medical norms or a scientific realism score. The regression test must also reject the frozen rejected renderer, protecting against a harness that merely approves everything.

## What the harness caught

The preceding renderer filtered its leg reach constraints by a hard stance flag. At support changes, this changed the pelvis constraint instantaneously. At the reference body/stride setting, the largest joint discontinuity was about 11 cm, including about 5 cm of pelvis jump. Head stabilization concealed some of the displacement while allowing the torso to change length. Prior limb-length and average-bounce tests missed this.

## Iterations in this review

1. Reproduced the failure in the frozen renderer; 17 gate violations across the nine combinations.
2. Restored continuous constraints through the full cycle. Parameter sweeps over pelvis targets and forward transfer exposed combinations with excessive knee flexion or torso deformation; these were rejected.
3. Added smooth swing allowances, stature/stride-aware pelvis targets, controlled swing knee bend and fore/aft weight transfer. Continuous tapered limb contours replace disconnected rod ends.
4. Examined the full rendered stride in side view and the front view at phone density. Added rounded shoulder connections and a small shoulder inclination after the front view exposed square shoulder caps. Checked three-quarter view and the actual street rendering.

The final numerical gate passes. All of this is deterministic and repeatable; the visual decisions above were made by the assistant inspecting rendered browser output. There is no unattended aesthetic model or claimed automatic proof of realism.

## Visual acceptance rubric

- No sudden body jump at support transitions.
- No rubber torso extension used to hide head movement.
- Support and swing legs read distinctly; knees do not jump into a stair-climbing pose.
- Connected thigh/knee/calf and shoulder/elbow contours, readable shoes and face profile.
- Same character cell dimensions as the environment at actual scene size.
- Review slow motion and normal speed; a still image alone cannot approve a gait.

Keep the rejected renderer immutable. Future changes must pass the gate and be inspected in these same views before sending another candidate for user review. Production remains separate from this review branch.
