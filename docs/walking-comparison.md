# Walking comparison, before changing the characters

Review-only page: `/gait-study/`. No changes to the production walking rig, character geometry, gait, or scene grid in this experiment.

## Reference and method

Eadweard Muybridge, Animal Locomotion plate 2 (1887), twelve photographic poses assembled into an animation by Jjkutch. Public domain: https://commons.wikimedia.org/wiki/File:Muybridge_human_male_walking_animated.gif . The locally hosted JPEG frame sheet is derived from that GIF. The unclothed subject is a historical anatomical motion study.

Four panels: source photographs, current raw rig, photographs through the scene character grid, current rig through that same grid. The rig is 160 scene pixels tall. Fixed scaling approximately matches reference height; no per-frame body normalization. Both are sampled at twelve phases, approximately aligned at foot contact. The camera and anatomy are not identical. The reference is retimed to the engine's stride period; its editorial GIF duration is not evidence of real cadence. This is a qualitative comparison, not a measured motion-capture fit.

Grid choices reproduce 680 desktop or 390 phone scene columns using CharacterGrid.size, palette, code, ramp, 6 by 10 glyph tiles and scene background gain. Diagnostic enlargement magnifies existing cells. The optional latest-person contrast treatment has the same cell size and uses a coverage mask. No sprite assets are substituted into the scene.

## Findings from inspection and code

- The raw rig already has a rigid upper-body appearance, before ASCII conversion. Its shoulders and hips have no independent axial rotation. Adding character contrast cannot address this.
- At 1.75 m height, 1.18 m stride and full locomotion, 120 phase samples yield about 5.91 cm peak-to-peak pelvis movement. The head receives the identical vertical displacement; there is no independent stabilization. This explains a mechanism for the reported bobbing; it is not a claim that every 5.9 cm excursion is abnormal.
- Knee flexion spans roughly 10.35 to 63.08 degrees at those settings. The peak angle by itself does not diagnose a stair-like gait: timing, thigh position and foot trajectory must be assessed together. The current knee is derived from a prescribed ankle path and a pelvis-height solve, not fitted to recorded motion.
- The side-view face is still an ellipse with overlapping hair/skin ellipses and tiny ear/nose details. At the shared grid resolution many distinguishing cues disappear. Improving geometry/silhouette at that resolution is preferable to adding finer person-only cells.
- The source retains a recognizable human silhouette through the same grid, although its lighting and contrast differ. This suggests that grid granularity alone is not the main problem. Appearance and articulation both need attention.

## Next experiment, not yet applied

Keep translation, crowd routing and the common character grid. Compare one controlled candidate with a less rigid torso, less direct head-to-pelvis coupling, revised swing timing/foot clearance, and a coherent profile silhouette. Evaluate the whole character at scene size before adjusting the crowd. Avoid treating the photographic reference as a universal body shape or using its edited playback rate as a speed target.

## Revised candidate

The original renderer is preserved as `dist/gait-study/baseline-rig.js`; the checkbox switches both engine panels at the same phase. The scene now uses the revised rig on the review branch. The character grid is unchanged.

Pelvis height follows a low-amplitude trajectory with a leg-reach constraint rather than maximizing support-leg extension. The torso connects that pelvis to a stabilized shoulder frame; the head remains attached to it. Shoulder/pelvis twist oppose one another, with a small varying forward inclination. Swing clearance is reduced while preserving heel/toe contact. Thicker legs, connected visible shoes, and a continuous profile contour improve the silhouette. At the 1.18 m test stride, sampled head excursion drops from 5.91 cm to 0.37 cm and pelvis excursion to 1.33 cm. These are engine measurements, not measurements extracted from the reference.
