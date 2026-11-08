# Artwork notes

The New York clock begins at the current instant and advances one simulated minute per real second at 1×. The 0.5×, 1×, 2×, 3× and 5× speeds affect every animated layer. Reverse playback samples the same timeline backward. Sunrise and sunset are calculated for 40.758° N, 73.9855° W and each calendar date in America/New_York. Weather and atmospheric variation are not forecast. Sun and moon placement are fitted into the photograph, not a measured celestial camera view. Moon phase, illumination and above-horizon visibility use the date and New York coordinates.

Crowd arrivals use the estimated hourly curve documented in crowd-calibration.md. Trips are deterministic, with offscreen entry and exit points. Existing walkers complete their journeys when the target arrival rate changes. Tables have independent walk-in, seated, and walk-out visits.

Motion artwork: Coca-Cola / Giant Ant, https://www.giantant.ca/coca-cola-case-study ; Spotify Now / Austin Shaw and Chace Hartman, https://www.austinshaw.com/portfolio/peaks-5f8dh . Other creatives are extracted from the supplied Times Square photo: Motown, Chrysler, Wicked, Phantom and Annie. Original artwork belongs to its respective owners. This is an artistic remix, not a live billboard feed.

Solar coordinates use the Meeus equations documented by NOAA: https://gml.noaa.gov/grad/solcalc/calcdetails.html . The November 7, 2026 fixture was checked against https://www.timeanddate.com/sun/usa/new-york?month=11&year=2026 .

SunCalc by Vladimir Agafonkin is distributed under the BSD license in vendor/SUNCALC-LICENSE.


Revision: plaza life and traffic

The render preserves 390 columns on phones and adds columns with the displayed scene size on desktop. Pedestrians use a constrained adult skeleton, smoothly integrated heading, a 60/40 stance/swing cycle and distance-driven strides; free walking pace is approximately 1.0–1.35 m per animation second. A 1.8 m camera-height ground projection keeps adults and furniture proportional. Cafe tabletops are 0.43 of adult height, with 0.57-height diameters, and four seating groups are placed at uneven depths and intervals across the pedestrian plaza. Groups have one to four chairs, independently projected to face the table.

Two separate traffic lanes follow the right-hand road in the supplied reference. Traffic demand is a stylized time-of-day curve, not observed vehicle counts. A deterministic traffic model includes acceleration, braking, gaps, red-light stops, white headlights, red tail/brake lights, and road-confined light spill. It can be sampled in either playback direction. Crowd routes stay on the pedestrian side of the curb.

Building windows are extracted from the fixed photograph and receive independent, date-seeded on/off times around dusk and dawn. Billboards cast bounded diffuse color onto the pavement, avoiding striped copies of the ads. Wet weather darkens the pavement.

Sky palettes: Gold (golden yellow and amber), Coral (orange and red), Rose (pink-lit clouds), and Violet (lavender afterglow). These are artistic color families, not formal weather classifications or a weather forecast. Each has different morning and evening colors. Atmospheric basis: https://weather.metoffice.gov.uk/learn-about/weather/optical-effects/why-is-the-sky-blue ; https://www.noaa.gov/jetstream/clouds/color-of-clouds ; https://cloudatlas.wmo.int/en/appearance-of-clouds-colour.html .

The project asset times-square-road-clean.png was created using the built-in image generator. Edit prompt: remove only all vehicles from the right-hand roadway of times-square-empty-day.jpg; reconstruct the asphalt and concealed storefront portions; preserve camera, framing, geometry, lighting and all other objects. Only the small road patch is composited into the original scene, leaving the skyline and billboard geometry unchanged.


The artwork is self-contained under /projects/ASCII/nyc/. The case of ASCII is intentional. Relative artwork files resolve against that base path, including direct visits without a trailing slash. The root entry remains a compatibility view for the existing Site URL and can be replaced with a personal homepage independently.

Pedestrians have varied stride, pace and arm movement, furniture-aware routes, local personal-space avoidance, and a nonlinear visual arrival rate. Window lighting covers additional façades and uses mostly soft white and cool reflective tones.

Peak-hour pedestrian arrivals are denser, with additional routes and finer simulation steps. Cars have more frequent arrival opportunities while preserving entrance clearance and stopping distance. Lamp silhouettes are enlarged to remain legible through the character grid.

Seasonal weather uses interpolated Central Park normals and deterministic weather fronts. Snow accumulates on pavement and visible ledges, then thaws through subsequent days. Cloud fields occur in both daylight and darkness and occlude the actual lunar phase. See `docs/movement-weather.md` in the repository for equations, parameter choices and limitations.
