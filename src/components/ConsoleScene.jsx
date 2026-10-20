import { Suspense, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";

/**
 * Returns a THREE.CanvasTexture that an auto-playing Flappy demo paints
 * into on every tick. Updated texture is applied to the console screen.
 */
function useFlappyDemoTexture() {
  const texture = useMemo(() => {
    // Screen aspect 1.95:1.0 → render target 390x200
    const canvas = document.createElement("canvas");
    canvas.width = 390;
    canvas.height = 200;
    const t = new THREE.CanvasTexture(canvas);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const stateRef = useRef({
    canvas: texture.image,
    bird: { x: 70, y: 100, vy: 0, r: 8 },
    pipes: [],
    t: 0,
    spawn: 0,
    score: 0,
  });

  // Reset game helper
  function reset() {
    const s = stateRef.current;
    s.bird.x = 70;
    s.bird.y = 100;
    s.bird.vy = 0;
    s.pipes = [];
    s.spawn = 0;
    s.score = 0;
  }

  useFrame((_, dt) => {
    const s = stateRef.current;
    s.t += dt;
    const W = s.canvas.width;
    const H = s.canvas.height;
    const GAP = 70;
    const PIPE_W = 32;
    const SPEED = 70; // px/s
    const G = 420;
    const FLAP = -170;

    // ─ simple AI: flap when bird falls below next-pipe gap centre ─
    const nextPipe = s.pipes.find((p) => p.x + PIPE_W > s.bird.x);
    const target = nextPipe ? nextPipe.gapY + GAP / 2 - 6 : H / 2;
    if (s.bird.y > target && s.bird.vy > FLAP * 0.4) s.bird.vy = FLAP;

    // Physics
    s.bird.vy += G * dt;
    s.bird.y += s.bird.vy * dt;

    // Spawn pipes
    s.spawn += dt;
    if (s.spawn > 1.3) {
      s.spawn = 0;
      const margin = 25;
      const gapY =
        margin + Math.random() * (H - 2 * margin - GAP);
      s.pipes.push({ x: W + 10, gapY, scored: false });
    }

    // Move + prune pipes
    for (const p of s.pipes) p.x -= SPEED * dt;
    s.pipes = s.pipes.filter((p) => p.x + PIPE_W > -10);

    // Collisions / score
    for (const p of s.pipes) {
      const inX =
        s.bird.x + s.bird.r > p.x && s.bird.x - s.bird.r < p.x + PIPE_W;
      if (inX) {
        if (
          s.bird.y - s.bird.r < p.gapY ||
          s.bird.y + s.bird.r > p.gapY + GAP
        ) {
          reset();
          return;
        }
      }
      if (!p.scored && p.x + PIPE_W < s.bird.x - s.bird.r) {
        p.scored = true;
        s.score++;
      }
    }
    if (s.bird.y < 0 || s.bird.y > H) reset();

    // ─ Draw ─
    const ctx = s.canvas.getContext("2d");
    // Background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050508");
    g.addColorStop(1, "#0a1324");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Pipes
    ctx.fillStyle = "#0071e3";
    for (const p of s.pipes) {
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
      ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      ctx.fillStyle = "#2997ff";
      ctx.fillRect(p.x - 2, p.gapY - 8, PIPE_W + 4, 8);
      ctx.fillRect(p.x - 2, p.gapY + GAP, PIPE_W + 4, 8);
      ctx.fillStyle = "#0071e3";
    }

    // Bird
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.bird.x, s.bird.y, s.bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5c518";
    ctx.beginPath();
    ctx.moveTo(s.bird.x + s.bird.r - 2, s.bird.y - 1);
    ctx.lineTo(s.bird.x + s.bird.r + 5, s.bird.y + 1);
    ctx.lineTo(s.bird.x + s.bird.r - 2, s.bird.y + 3);
    ctx.closePath();
    ctx.fill();

    // Score — big and faint
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(s.score), W / 2, H / 2 + 20);

    texture.needsUpdate = true;
  });

  // Dispose on unmount
  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

/**
 * Low-poly retro console: base, raised screen, two joysticks, four buttons.
 * Built from Three.js primitives — zero external assets.
 * TODO: swap primitives for a GLB when a CC0 model is in `/public/models/`.
 */
function Console({ reduceMotion }) {
  const group = useRef(null);
  const screenGlow = useRef(null);

  useFrame((state) => {
    if (!group.current) return;
    if (!reduceMotion) {
      // Slow idle sway so it feels alive without demanding attention
      const t = state.clock.elapsedTime;
      group.current.rotation.y = Math.sin(t * 0.4) * 0.25;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.05 - 0.1;
    }
    // Screen glow pulse (even for reduced motion — subtle colour, not motion)
    if (screenGlow.current) {
      const p = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      screenGlow.current.intensity = p;
    }
  });

  const accent = "#0071e3";
  const bodyColor = "#1a1a1c";
  const bodyDark = "#0f0f10";
  const stickColor = "#2a2a2c";

  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {/* Base body — flat chunky slab */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.5, 2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Base bottom bevel */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[3.4, 0.1, 2.2]} />
        <meshStandardMaterial color={bodyDark} roughness={0.8} />
      </mesh>

      {/* Screen housing — tilted back block on top */}
      <group position={[0, 0.55, -0.35]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.4, 0.3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Screen bezel (recessed black frame) */}
        <mesh position={[0, 0.05, 0.16]}>
          <boxGeometry args={[2.1, 1.15, 0.05]} />
          <meshStandardMaterial color="#050506" roughness={0.3} />
        </mesh>
        {/* Live Flappy demo as the screen face */}
        <ScreenFace />
      </group>

      {/* Point light inside screen for cast glow */}
      <pointLight
        ref={screenGlow}
        position={[0, 0.7, 0.2]}
        color={accent}
        intensity={0.55}
        distance={5}
      />

      {/* Left joystick */}
      <JoyStick position={[-0.9, 0.3, 0.5]} stickColor={stickColor} accent={accent} />
      {/* Right joystick */}
      <JoyStick position={[0.9, 0.3, 0.5]} stickColor={stickColor} accent={accent} />

      {/* Four small buttons — centre of base */}
      <Button position={[-0.25, 0.26, 0.75]} color="#ff4d4d" />
      <Button position={[0, 0.26, 0.75]} color="#f5c518" />
      <Button position={[0.25, 0.26, 0.75]} color="#30c764" />
      <Button position={[0, 0.26, 0.5]} color={accent} />
    </group>
  );
}

function ScreenFace() {
  const tex = useFlappyDemoTexture();
  return (
    <mesh position={[0, 0.05, 0.19]}>
      <planeGeometry args={[1.95, 1.0]} />
      <meshStandardMaterial
        map={tex}
        emissive="#0071e3"
        emissiveIntensity={0.25}
        emissiveMap={tex}
        toneMapped={false}
      />
    </mesh>
  );
}

function JoyStick({ position, stickColor, accent }) {
  return (
    <group position={position}>
      {/* Mount base disc */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#232325" roughness={0.6} />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color={stickColor} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Ball top */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Button({ position, color }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} toneMapped={false} />
    </mesh>
  );
}

export default function ConsoleScene() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2.5, 2.5, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#000"]} />
        {/* Soft ambient + key + rim */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4a9eff" />

        <Suspense fallback={null}>
          <Float
            speed={reduceMotion ? 0 : 1.1}
            rotationIntensity={reduceMotion ? 0 : 0.15}
            floatIntensity={reduceMotion ? 0 : 0.4}
          >
            <Console reduceMotion={reduceMotion} />
          </Float>
          <ContactShadows
            position={[0, -0.75, 0]}
            opacity={0.55}
            scale={6}
            blur={2.4}
            far={2.5}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
