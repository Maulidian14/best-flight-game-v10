// Emberline Air — chase camera.
// One job: keep the camera behind the plane, smoothly, at every speed, and
// never fight the pilot. Five modes: chase, near (cockpit-ish), cockpit
// (over the nose, from the canopy), wide (a parked plane with its scene),
// and orbit for the menu. The camera looks where the plane is going, not
// where it is.

import * as THREE from 'three';

export function newCameraRig(camera) {
  return {
    camera,
    mode: 'chase', // chase | near | orbit
    pos: new THREE.Vector3(0, 60, 340),
    look: new THREE.Vector3(),
    orbitAngle: 0,
    shake: 0,
  };
}

const tmpTarget = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();

export function updateCamera(rig, state, dt, time) {
  const cam = rig.camera;
  const hRad = (state.heading * Math.PI) / 180;
  const pRad = (state.pitch * Math.PI) / 180;
  const bRad = (state.bank * Math.PI) / 180;

  if (rig.mode === 'orbit') {
    rig.orbitAngle += dt * 0.12;
    const r = 46;
    tmpTarget.set(
      state.pos.x + Math.sin(rig.orbitAngle) * r,
      state.pos.y + 14,
      state.pos.z + Math.cos(rig.orbitAngle) * r,
    );
    rig.pos.lerp(tmpTarget, 1 - Math.exp(-dt * 2.5));
    cam.position.copy(rig.pos);
    cam.lookAt(state.pos.x, state.pos.y + 2, state.pos.z);
    cam.rotation.z = 0;
    return;
  }

  if (rig.mode === 'cockpit') {
    // Cockpit: camera rides just above the canopy, over the nose, so the
    // nose, prop disc edge and wing roots stay in the lower frame and the
    // target fills the view ahead. Roll follows the bank.
    const fx = Math.sin(hRad), fz = -Math.cos(hRad);
    tmpTarget.set(
      state.pos.x + fx * 0.8,
      state.pos.y + 1.6 + Math.sin(pRad) * 0.8,
      state.pos.z + fz * 0.8,
    );
    rig.pos.lerp(tmpTarget, 1 - Math.exp(-dt * 18));
    const lookDist = 90;
    rig.look.set(
      state.pos.x + fx * lookDist,
      state.pos.y + Math.sin(pRad) * lookDist * 0.6 + 1.5,
      state.pos.z + fz * lookDist,
    );
    cam.position.copy(rig.pos);
    cam.lookAt(rig.look);
    cam.rotateZ(-bRad * 0.55);
    return;
  }

  // Desired offset: behind the tail, above the plane, in the plane's frame.
  // Chase sits close (dist 11) so the Kestrel fills ~45% of the frame height;
  // wide (dist 18) frames a parked plane with its surroundings for the rescue.
  const dist = rig.mode === 'near' ? 9 : rig.mode === 'wide' ? 18 : 11;
  const height = rig.mode === 'near' ? 3.4 : rig.mode === 'wide' ? 6 : 4.2;
  const back = new THREE.Vector3(-Math.sin(hRad), 0, Math.cos(hRad));
  tmpOffset.copy(back).multiplyScalar(dist);
  tmpOffset.y = height - Math.sin(pRad) * dist * 0.4;
  tmpTarget.copy(state.pos).add(tmpOffset);

  // Don't let the camera sink into a hillside: lift it above the ground.
  const minY = state.pos.y + 2.2;
  if (tmpTarget.y < minY) tmpTarget.y = minY;

  // Smooth follow: fast enough to feel attached, slow enough to feel heavy.
  const k = 1 - Math.exp(-dt * (rig.mode === 'near' ? 14 : 5.2));
  rig.pos.lerp(tmpTarget, k);

  // Look ahead of the nose, along the velocity, with a touch of pitch.
  const lookDist = rig.mode === 'near' ? 60 : rig.mode === 'wide' ? 55 : 42;
  rig.look.set(
    state.pos.x + Math.sin(hRad) * lookDist,
    state.pos.y + Math.sin(pRad) * lookDist * 0.6 + 1,
    state.pos.z - Math.cos(hRad) * lookDist,
  );
  cam.position.copy(rig.pos);

  // A touch of handheld shake at high speed and on the ground roll.
  const shakeAmp = state.onGround ? Math.min(0.35, state.speed * 0.008) : Math.max(0, (state.speed - 60) * 0.004);
  if (shakeAmp > 0.005) {
    cam.position.x += (Math.random() - 0.5) * shakeAmp;
    cam.position.y += (Math.random() - 0.5) * shakeAmp;
  }
  cam.lookAt(rig.look);
  // Roll the camera with the bank — a little, so the horizon tilts honestly.
  cam.rotateZ(-bRad * (rig.mode === 'near' ? 0.55 : 0.3));
}
