import * as THREE from "three";

export function createCabinetSides() {
  const points = [
    [-0.38, 0.3], [0.32, 0.3], [0.32, 0.91], [0.52, 0.95],
    [0.52, 1.08], [0.29, 1.14], [0.10, 1.70], [0.34, 1.82],
    [0.27, 2.02], [-0.38, 2.02],
  ];
  const profile = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  profile.closePath();
  const sideFace = new THREE.ShapeGeometry(profile);
  const pos = sideFace.attributes.position;
  const uv = sideFace.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 0.38) / 0.9, pos.getY(i) / 2.02);
  return { profile, sideFace };
}

export function getArcadeFraming(width, height) {
  return { distance: Math.max(1.85, 1.35 / (width / height)) * (width < 768 ? 1.08 : 1), offsetY: height * 0.07 };
}

// Phones: the room sits in a short, wide 40svh block, so ZOOM IN (narrower
// lens) until the diorama spans the full width — owner wants it big.
export function getRoomFov(width, height) {
  const aspect = width / Math.max(1, height);
  const zoom = width < 768 ? Math.min(0.72, 0.62 * Math.max(1, aspect / 1.1)) : 1;
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(10)) * zoom));
}

const signPosition = new THREE.Vector3();
export function getArcadeSignPosition(object, camera, { width, height }) {
  signPosition.setFromMatrixPosition(object.matrixWorld).project(camera);
  const signWidth = Math.min(184, Math.max(144, width * 0.28));
  const inset = signWidth * 0.54 + 12; // Includes the reminder's 1.08× pop-out.
  return [
    THREE.MathUtils.clamp((signPosition.x + 1) * width / 2, inset, width - inset),
    THREE.MathUtils.clamp((1 - signPosition.y) * height / 2, height < 480 ? 60 : 116, height - 90),
  ];
}
