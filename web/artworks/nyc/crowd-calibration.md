# Times Square crowd calibration

This artwork uses a **modelled hourly profile**, not a measured 24-hour dataset or a live crowd feed.

## Published anchors

- Times Square Alliance, Market Research & Data, accessed November 7, 2026: roughly **220,000 pedestrians entered Times Square per day in 2024**; typical daily volumes are described as 200,000–250,000.
  https://www.timessquarenyc.org/business-community/market-research-data
- Times Square Alliance, Accessibility Resources, accessed November 7, 2026: busiest periods **12–2 p.m. and 4–7 p.m.**; quietest **1–6 a.m. and 10–11 a.m. on workdays**.
  https://www.timessquarenyc.org/explore/accessibility-resources-for-times-square

No public full-day hourly count table was found in these sources. The Alliance reports that its counting system collects 24/7 data, but that is not the same as publishing the hourly observations.

## Simulation

The 24 hourly weights in `city-life.js` are authored estimates shaped around the published busy and quiet windows. They are normalized to 220,000 daily district entries. Values between hours are interpolated; they are not measured hourly observations.

A separate nonlinear curve maps the estimated relative flow to visible arrivals. It maintains a quiet-hour floor and increases arrival probability more strongly at busy times. A person in the scene is not a one-to-one census measurement. District foot traffic and simultaneous occupancy of this plaza are different quantities.

People finish their journeys when demand changes. They enter and exit at the scene edges, route around furniture, and maintain personal space through local avoidance. Café visitors walk to a chair, sit for a variable interval, and leave.

The simulation uses the New York calendar and a shared reversible clock. Body motion and variation intervals use simulation time, so playback speed affects all movement consistently. Vehicle demand remains an independent artistic profile.
