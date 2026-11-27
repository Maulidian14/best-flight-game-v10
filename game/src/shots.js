// Emberline Air — screenshot poses.
// One job: put the game into a photogenic state for ?shot=1..4 and tell the
// outside world when the frame is ready (window.__shotReady). Every pose is
// a real moment of the real game — autopilot flying, never a staged render.

import * as THREE from 'three';
import { RING_COURSE, STRIPS, ISLANDS } from './config.js';
import { groundHeight } from './terrain.js';
import { autopilotFlyTo, autopilotLand } from './autopilot.js';
import { dust, signalSmoke } from './particles.js';

export function shotNumber() {
  const m = /[?&]shot=(\d)/.exec(window.location.search);
  return m ? parseInt(m[1], 10) : 0;
}

// Teleport the plane (pose setup only — the game then flies honestly).
function place(state, x, y, z, heading, speed, throttle) {
  state.pos.set(x, y, z);
  state.heading = heading;
  state.pitch = 0;
  state.bank = 0;
  state.speed = speed;
  state.throttle = throttle;
  state.rpm = throttle;
  state.onGround = false;
  state.airborne = true;
  state.verticalSpeed = 0;
}

export function setupShot(n, ctx) {
  const { state, mission, autopilot, P, camera } = ctx;
  if (n === 1) {
    // COVER — Takeoff roll on the Ember Isle runway: full throttle, nose
    // coming up, lighthouse and sunset sea ahead, HUD full. The autopilot
    // aims at ring 0, so the roll becomes a rotation the moment she is fast.
    ctx.startMission('rings');
    const strip = STRIPS[0];
    const h = (strip.heading * Math.PI) / 180;
    const gy = groundHeight(strip.x, strip.z);
    // Park at the threshold end of the strip, facing down its heading.
    place(state, strip.x - Math.sin(h) * (strip.length / 2 - 30), gy + 1.9, strip.z + Math.cos(h) * (strip.length / 2 - 30), strip.heading, 0, 1.0);
    state.onGround = true;
    state.airborne = false;
    state.gearDown = true;
    const r0 = RING_COURSE[0];
    autopilotFlyTo(autopilot, r0.x, r0.y, r0.z);
    camera.mode = 'chase';
    let tookOffAt = 0;
    ctx.shotReadyWhen = () => {
      // Catch the rotation: just airborne, still low over the runway — but
      // only once the touchdown dust from the rotation bounce (1.1 s life)
      // is dead, or the close chase camera turns it into giant squares.
      if (!state.airborne) { tookOffAt = 0; return false; }
      if (!tookOffAt) tookOffAt = state.flightTime;
      if (state.flightTime - tookOffAt < 1.6) return false;
      const g = groundHeight(state.pos.x, state.pos.z);
      return state.pos.y - g < 25 && state.speed > 30;
    };
  } else if (n === 2) {
    // Ring chase from the cockpit: threading the canyon rings over Gull
    // Rock, sun and clouds ahead, gauges lit. Fly at ring 0 and let the
    // shot catch the pass.
    ctx.startMission('rings');
    const r0 = RING_COURSE[0];
    // Start 370 m southwest of ring 0, heading 45° straight at it; the
    // autopilot aims at ring 0 itself so the shot catches the pass.
    place(state, r0.x - 260, r0.y + 8, r0.z + 260, 45, 52, 0.78);
    autopilotFlyTo(autopilot, r0.x, r0.y, r0.z);
    camera.mode = 'cockpit';
    ctx.shotReadyWhen = () => {
      const d = Math.hypot(state.pos.x - r0.x, state.pos.y - r0.y, state.pos.z - r0.z);
      return d < 55 || (ctx.mission && ctx.mission.ringsHit > 0);
    };
  } else if (n === 3) {
    // Rescue — the pickup moment on Tern Cay beach: parked on the sand,
    // gear down, the hiker boarding beside the orange signal smoke, turquoise
    // water behind. The shot fires once the pickup phase starts.
    ctx.startMission('rescue');
    const beach = STRIPS[2];
    const h = (beach.heading * Math.PI) / 180;
    // Start 400 m out: the approach is short on purpose — the shot's moment
    // is the pickup, ~13 s of game time in, and the headless harness only
    // waits 240 s of wall time while the game runs ~0.1x real time.
    // Start 50 m above the beach (was 36): under swiftshader the
    // autopilot's first descent porpoises, and its floor sat right on the
    // rising ground (~19 m) 74 m short of the strip — two renders flew
    // into the hillside there. +14 m lifts the whole descent clear of
    // the terrain without changing the landing itself.
    const ex = beach.x - Math.sin(h) * 400;
    const ez = beach.z + Math.cos(h) * 400;
    const gy = groundHeight(beach.x, beach.z);
    place(state, ex, gy + 50, ez, beach.heading, 38, 0.45);
    state.gearDown = true;
    state.flaps = 1;
    autopilotLand(autopilot, beach);
    camera.mode = 'wide'; // parked plane + hiker + smoke + beach need room
    let smoked = false;
    let pickupStart = 0;
    ctx.shotReadyWhen = () => {
      if (ctx.mission && ctx.mission.phase === 'pickup') {
        if (!smoked) {
          smoked = true;
          pickupStart = state.flightTime;
          const hp = ISLANDS[2].hiker;
          signalSmoke(P, hp.x, groundHeight(hp.x, hp.z) + 2, hp.z);
        }
        // Fire 1.0 s into the pickup (was 0.6): the orange signal smoke
        // needs the time to rise and spread into a visible column above
        // the hiker, while staying well inside the headless harness's
        // 240 s wall-time budget for this pose. The "Hiker boarding… 3s"
        // banner is still up.
        // AND the plane must be (nearly) stopped: on a fast approach the
        // wheels can graze rising ground before the strip, which trips
        // the pickup phase while the plane is still flying at 40+ m/s —
        // firing then catches a flyby, not the parked pickup moment.
        return state.flightTime - pickupStart > 1.0 && state.speed < 5;
      }
      return false;
    };
  } else if (n === 4) {
    // Precision — the moment after touchdown on the Ashen Peak strip, dust
    // in the air, volcano smoke behind.
    ctx.startMission('precision');
    const strip = STRIPS[3];
    const gy = groundHeight(strip.x, strip.z);
    const h = (strip.heading * Math.PI) / 180;
    // Start 320 m out: same reason as shot 3 — the moment is ~11 s of game
    // time in, and the harness waits a bounded wall time.
    const ex = strip.x - Math.sin(h) * 320;
    const ez = strip.z + Math.cos(h) * 320;
    place(state, ex, gy + 30, ez, strip.heading, 36, 0.35);
    state.gearDown = true;
    state.flaps = 1;
    autopilotLand(autopilot, strip);
    camera.mode = 'chase';
    let dusted = false;
    let doneElapsed = 0;
    ctx.shotReadyWhen = () => {
      if (!state.onGround) dusted = false; // a go-around earns a fresh dust puff
      if (state.onGround && !dusted) {
        dusted = true;
        dust(P, state.pos.x, state.pos.y, state.pos.z, 12);
      }
      // Fire 1.6 s of GAME time after the scored touchdown. Game time, not
      // wall time: under swiftshader the game runs slower than real time,
      // and the dust (1.1 s life) must be dead before the frame is taken.
      // The MISSION COMPLETE banner (3.2 s) is still up, the plane has
      // rolled out clear of the dust on the strip.
      // NOTE: mission.elapsed freezes when the mission completes (mode
      // 'complete' stops mission updates), so clock it on state.flightTime,
      // which keeps running while the sim runs.
      if (ctx.mission && ctx.mission.done && !doneElapsed) doneElapsed = state.flightTime;
      return doneElapsed > 0 && state.flightTime - doneElapsed > 1.3;
    };
  }
}
