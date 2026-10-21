import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

/**
 * Theatre curtain for ENTER THE ROOM. A fixed, full-viewport, transparent
 * Canvas layered above the whole page (navbar, hero text, chat button).
 * A wall of charcoal slabs seals the view; on 'room-enter' it arms (shivers),
 * then at the blast a shockwave runs out from the centre, slabs are knocked
 * radially outward and fall, debris arcs out and smoke lingers. Unmounts via
 * onDone once every slab and chunk is gone. The room's quake, scorch and all
 * sounds stay in ConsoleScene (same event, same timeline).
 */
const ROWS = 11;
const DEBRIS_N = 160;
const SMOKE_N = 14;
const CAM_Z = 30;
const FOV = 40;

// Plane at z=0 that exactly fills the curtain camera's view (+ bleed)
function viewBasis(size) {
  const halfH = CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 1.08;
  const halfW = halfH * (size.width / Math.max(1, size.height)) * 1.08;
  return { halfH, halfW };
}

function softDiscTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.35)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function Slabs({ blastAt, arming, onGone }) {
  const { size } = useThree();
  const mesh = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const gone = useRef(false);

  const data = useMemo(() => {
    const { halfH, halfW } = viewBasis(size);
    const cell = (2 * halfH) / ROWS;
    const cols = Math.ceil((2 * halfW) / cell) + 1;
    const maxR = Math.hypot(halfW, halfH);
    const items = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * cell;
        const y = (r - (ROWS - 1) / 2) * cell;
        const rad = Math.hypot(x, y) || 0.001;
        items.push({
          x, y,
          delay: (rad / maxR) * 0.55 + Math.random() * 0.12,
          kx: (x / rad) * (2.5 + Math.random() * 2.5),
          ky: (y / rad) * (2.5 + Math.random() * 2.5),
          spin: (Math.random() - 0.5) * 4,
          seed: Math.random() * Math.PI * 2,
          depth: 0.6 + Math.random() * 0.5,
        });
      }
    }
    return { items, cell };
  }, [size.width, size.height]);

  useEffect(() => {
    if (!mesh.current) return;
    const col = new THREE.Color();
    data.items.forEach((_, i) => {
      col.setHSL(0.6, 0.06, 0.12 + Math.random() * 0.09);
      mesh.current.setColorAt(i, col);
    });
    mesh.current.instanceColor.needsUpdate = true;
  }, [data]);

  useFrame(() => {
    if (!mesh.current || gone.current) return;
    const now = performance.now();
    let allGone = blastAt != null;
    data.items.forEach((it, i) => {
      const t = blastAt == null ? -1 : (now - blastAt) / 1000 - it.delay;
      let s = 1;
      dummy.rotation.set(0, 0, 0);
      if (t > 0) {
        dummy.position.set(
          it.x + it.kx * t,
          it.y + it.ky * t - 4.9 * t * t,
          3 * t // toward the viewer
        );
        dummy.rotation.set(it.spin * t, it.seed * 0.1, it.spin * 0.6 * t);
        s = THREE.MathUtils.clamp(1 - (t - 0.9) * 1.6, 0, 1);
        if (s > 0) allGone = false;
      } else {
        allGone = false;
        if (arming) {
          const j = 0.05 + 0.04 * Math.random();
          dummy.position.set(
            it.x + Math.sin(now * 0.07 + it.seed) * j,
            it.y + Math.cos(now * 0.09 + it.seed * 2) * j,
            0
          );
        } else {
          dummy.position.set(it.x, it.y, Math.sin(now * 0.002 + it.seed) * 0.03);
        }
      }
      dummy.scale.set(s, s, s * it.depth);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (allGone) { gone.current = true; onGone?.(); }
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, data.items.length]} frustumCulled={false}>
      <boxGeometry args={[data.cell * 0.97, data.cell * 0.97, data.cell * 0.5]} />
      <meshStandardMaterial color="#ffffff" roughness={0.95} metalness={0.02} flatShading />
    </instancedMesh>
  );
}

function Blast({ at }) {
  const { size } = useThree();
  const b = useMemo(() => viewBasis(size), [size.width, size.height]);
  const ring = useRef(null);
  const debris = useRef(null);
  const smoke = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const disc = useMemo(softDiscTexture, []);
  useEffect(() => () => disc.dispose(), [disc]);

  const parts = useMemo(() => {
    const d = [];
    for (let i = 0; i < DEBRIS_N; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 10;
      d.push({
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + 2, vz: 2 + Math.random() * 8,
        spin: (Math.random() - 0.5) * 12, size: 0.12 + Math.random() * 0.24, seed: Math.random() * 6.28,
      });
    }
    const s = [];
    for (let i = 0; i < SMOKE_N; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 3;
      s.push({ ox: Math.cos(ang) * r, oy: Math.sin(ang) * r, rise: 0.6 + Math.random(), grow: 6 + Math.random() * 6, seed: Math.random() });
    }
    return { d, s };
  }, []);

  useEffect(() => {
    if (!debris.current) return;
    const col = new THREE.Color();
    parts.d.forEach((_, i) => { col.setHSL(0.6, 0.05, 0.1 + Math.random() * 0.12); debris.current.setColorAt(i, col); });
    debris.current.instanceColor.needsUpdate = true;
  }, [parts]);

  useFrame(() => {
    const t = (performance.now() - at) / 1000;
    if (t < 0) return;
    if (ring.current) {
      const k = Math.min(1, t / 0.7);
      const e = 1 - Math.pow(1 - k, 3);
      const R = 0.5 + e * Math.hypot(b.halfW, b.halfH) * 1.5;
      ring.current.scale.set(R, R, 1);
      ring.current.material.opacity = 0.85 * (1 - k);
      ring.current.visible = k < 1;
    }
    if (debris.current) {
      const life = THREE.MathUtils.clamp(1 - (t - 1.3) * 1.4, 0, 1);
      parts.d.forEach((p, i) => {
        dummy.position.set(p.vx * t, p.vy * t - 4.9 * t * t, p.vz * t);
        dummy.rotation.set(p.spin * t, p.seed, p.spin * 0.7 * t);
        const s = p.size * life;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        debris.current.setMatrixAt(i, dummy.matrix);
      });
      debris.current.instanceMatrix.needsUpdate = true;
    }
    if (smoke.current) {
      const fade = THREE.MathUtils.clamp(1 - t / 4.2, 0, 1);
      smoke.current.children.forEach((sp, i) => {
        const p = parts.s[i];
        const g = 1.5 + p.grow * Math.min(1, t / 2.5);
        sp.position.set(p.ox * (1 + t * 0.3), p.oy + p.rise * t, 1 + t * 0.4);
        sp.scale.set(g, g, 1);
        sp.material.opacity = 0.32 * fade * Math.min(1, t / 0.25);
        sp.material.rotation = p.seed * 6 + t * 0.15;
      });
    }
  });

  return (
    <group>
      <mesh ref={ring}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial color="#dfeaff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={debris} args={[null, null, DEBRIS_N]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} flatShading />
      </instancedMesh>
      <group ref={smoke}>
        {parts.s.map((_, i) => (
          <sprite key={i}>
            <spriteMaterial map={disc} color="#3a3e48" transparent opacity={0} depthWrite={false} />
          </sprite>
        ))}
      </group>
    </group>
  );
}

export default function IntroCurtain({ reduceMotion, onDone }) {
  const [arming, setArming] = useState(false);
  const [blastAt, setBlastAt] = useState(null);
  const [slabsGone, setSlabsGone] = useState(false);
  const [fxOver, setFxOver] = useState(false);

  useEffect(() => {
    const onEnter = () => {
      if (reduceMotion) { onDone?.(); return; }
      setArming(true);
      setTimeout(() => setArming(false), 450);
      setTimeout(() => {
        setBlastAt(performance.now());
        setTimeout(() => setFxOver(true), 4600);
      }, 540);
    };
    window.addEventListener("room-enter", onEnter);
    return () => window.removeEventListener("room-enter", onEnter);
  }, [reduceMotion, onDone]);

  // Tell the room the view is clear (sign may appear), then unmount after smoke
  useEffect(() => {
    if (slabsGone) window.dispatchEvent(new CustomEvent("room-revealed"));
  }, [slabsGone]);
  useEffect(() => {
    if (slabsGone && fxOver) onDone?.();
  }, [slabsGone, fxOver, onDone]);

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <hemisphereLight args={["#cfd6e0", "#24262c", 0.6]} />
        <directionalLight position={[-6, 9, 12]} intensity={2.2} color="#ffe4c8" />
        <directionalLight position={[7, 6, 10]} intensity={1.1} color="#d2e6ff" />
        {!slabsGone && <Slabs blastAt={blastAt} arming={arming} onGone={() => setSlabsGone(true)} />}
        {blastAt != null && !fxOver && <Blast at={blastAt} />}
      </Canvas>
    </div>
  );
}
