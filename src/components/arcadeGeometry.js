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
  return { distance: Math.max(1.85, 1.35 / (width / height)), offsetY: height * 0.07 };
}
