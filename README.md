# Emberline Air v10 — Meridian Archipelago Courier

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node 22+](https://img.shields.io/badge/Node-22%2B-brightgreen.svg)](https://nodejs.org)
[![make.fun bounty](https://img.shields.io/badge/make.fun-best%20flight%20game-orange.svg)](https://make.fun/c/best-flight-game-20261126-0057)

A bush-pilot flight game for make.fun's **best flight game** bounty ($500).
You fly the Kestrel-9, a single-engine STOL courier plane, across the
Meridian Archipelago at golden hour — threading sky rings through a carved
canyon, landing mail on island strips, picking up a stranded hiker under
orange signal smoke, and putting her down feather-soft on a volcano strip.

v10 is the Final-round build: the chase camera sits close so the Kestrel
fills the frame, a true cockpit view rides over the nose, island name labels
never drift over the HUD, and every sortie is named, scored and visible on
the instruments — airspeed and altitude both as lit numbers and as analog
gauges.

## How to play

Open `game/index.html` in desktop Chrome (or `node serve.ts` and visit
http://localhost:8080). No install, no network — every file the game loads
lives under `game/`, three.js included as a vendored minified build.

| Key | Action |
| --- | --- |
| W / S | Throttle up / down |
| ↑ / ↓ | Pitch |
| ← / → | Bank and turn |
| Q / E | Rudder |
| Space | Brake |
| F | Flaps |
| G | Landing gear |
| C | Camera: chase → near → cockpit |
| 1–4 | Start a sortie |
| P | Pause · M sound · R restart |

Mouse: hold and drag to steer. Keep speed above 47 kt or she stalls.
Fuel burns with throttle — park on any strip and the ground crew refuels
you. Hard landings and hillsides cost hull.

## The four sorties

1. **Canyon Ring Slalom** — thread all 8 sky rings in order through the
   Gull Rock canyon, fast and clean. Ghost rings mark the chain ahead;
   the HUD counts down the next gate with its distance (`G-04 · 791m`).
2. **Island Courier Run** — land at three island strips in order (Marlin
   Bay village, Tern Cay beach, Ashen Peak) and drop the mail. Centreline
   and softness decide the pay.
3. **Volcano Rescue** — land on Tern Cay beach, hold still while the
   stranded hiker boards beside the orange signal smoke, then bring them
   both home to Ember Isle.
4. **Ashen Precision Landing** — put her down dead centre on the 240 m
   gravel strip under the smoking volcano. Scored out of 1000.

## Under the hood

- `game/src/` is split one job per file: `config` (world numbers),
  `terrain` (islands, canyon, sky, rings), `props` (hiker, village,
  boats), `aircraft` (Kestrel-9 + afterburner), `physics`, `camera`
  (chase / near / cockpit / orbit), `hud` (instruments + analog gauges),
  `missions`, `autopilot`, `particles`, `audio`, `input`, `shots`
  (screenshot poses), `main` (boot + loop).
- Screenshots in `screenshots/` are real renders of the game's own code
  in headless Chromium — the takeoff roll, the cockpit ring chase, the
  rescue pickup, and the Ashen touchdown.
- `main.ts` hands the entry in: it copies `game/` + `screenshots/` to
  the output directory and writes `dossier.json` with the kit's
  `buildDossier` (`vendor/makefun-game.ts`, unchanged).

## Entry

Built for the make.fun competition
[best-flight-game-20261126-0057](https://make.fun/c/best-flight-game-20261126-0057).
License: MIT — see [LICENSE](LICENSE).
