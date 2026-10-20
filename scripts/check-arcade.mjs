import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCabinetSides, getArcadeFraming, getRoomFov, getArcadeSignPosition } from '../src/components/arcadeGeometry.js';

// Run: node scripts/check-arcade.mjs
const { profile, sideFace } = createCabinetSides();
assert.ok(profile.getPoints().length >= 10, 'Cabinet must retain its shaped side panels');
for (const uv of sideFace.attributes.uv.array) {
  assert.ok(Number.isFinite(uv) && uv >= 0 && uv <= 1, 'Artwork UVs must stay on the panel');
}

for (const [width, height] of [[320, 650], [390, 260], [648, 724], [390, 844], [1440, 900], [844, 390]]) {
  const { distance, offsetY } = getArcadeFraming(width, height);
  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
  camera.position.set(0, 2.0, 0.07 + distance);
  camera.lookAt(0, 1.46, 0.07);
  camera.setViewOffset(width, height, 0, offsetY, width, height);
  camera.updateMatrixWorld();
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).y < 0, 'Raised camera must look down toward the screen');
  // Close-up prioritises the marquee, screen and controls over the base.
  for (const x of [-0.44, 0.44]) for (const y of [0.95, 2.02]) for (const z of [-0.4, 0.53]) {
    const point = new THREE.Vector3(x, y, z).project(camera);
    assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `Screen or controls clipped at ${width}x${height}`);
  }
  const signWidth = Math.min(184, Math.max(144, width * 0.28));
  const sign = new THREE.Object3D();
  for (const x of [-20, 0, 20]) {
    sign.position.set(x, 2.34, 0);
    sign.updateMatrixWorld();
    const [screenX, screenY] = getArcadeSignPosition(sign, camera, { width, height });
    assert.ok(screenX - signWidth * 0.54 >= 12 && screenX + signWidth * 0.54 <= width - 12, 'Sign must fit during pop-out');
    assert.ok(screenY >= (height < 480 ? 60 : 116) && screenY <= height - 90, 'Sign must clear the navigation and lower edge');
  }
}
assert.ok(Math.abs(getRoomFov(1440, 900) - 20) < 1e-6, 'Desktop room framing stays unchanged');
assert.ok(getRoomFov(390, 844) > getRoomFov(648, 724), 'Narrow phones need a wider view of the room');
assert.ok(getArcadeFraming(648, 724).distance > 1.85, 'Mobile play camera is pulled back');
sideFace.dispose();
console.log('Arcade geometry, responsive sign and mobile framing pass at six viewport sizes.');
