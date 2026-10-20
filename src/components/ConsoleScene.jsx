import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";

// Camera targets — lerped between in useFrame
const IDLE_POS = new THREE.Vector3(2.5, 2.5, 4);
const IDLE_LOOK = new THREE.Vector3(0, 0, 0);
const PLAY_POS = new THREE.Vector3(0, 0.55, 1.55);
const PLAY_LOOK = new THREE.Vector3(0, 0.5, -0.1);

/**
 * Shared Flappy state. flapRef used in PLAY mode to receive input.
 * In IDLE mode a simple AI keeps the bird alive for the screen demo.
 */
function useFlappyTexture(mode, flapRef, onScore, onDeath) {
  const texture = useMemo(() => {
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
    spawn: 0,
    score: 0,
    waitingForFlap: true, // in play mode, don't start physics until first flap
  });

  // Reset when mode changes
  useEffect(() => {
    const s = stateRef.current;
    s.bird.x = 70;
    s.bird.y = 100;
    s.bird.vy = 0;
    s.pipes = [];
    s.spawn = 0;
    s.score = 0;
    s.waitingForFlap = mode === "playing";
    if (onScore) onScore(0);
  }, [mode, onScore]);

  function reset() {
    const s = stateRef.current;
    s.bird.x = 70;
    s.bird.y = 100;
    s.bird.vy = 0;
    s.pipes = [];
    s.spawn = 0;
    s.score = 0;
    s.waitingForFlap = mode === "playing";
    if (onScore) onScore(0);
  }

  useFrame((_, dt) => {
    const s = stateRef.current;
    const W = s.canvas.width;
    const H = s.canvas.height;
    const GAP = 70;
    const PIPE_W = 32;
    const SPEED = mode === "playing" ? 90 : 70;
    const G = mode === "playing" ? 520 : 420;
    const FLAP = -180;

    if (mode === "playing") {
      // Consume flap input
      if (flapRef.current) {
        s.bird.vy = FLAP;
        s.waitingForFlap = false;
        flapRef.current = false;
      }
      if (s.waitingForFlap) {
        // Hover-bob the bird before the player's first flap
        s.bird.y = H / 2 + Math.sin(performance.now() * 0.004) * 6;
      } else {
        s.bird.vy += G * dt;
        s.bird.y += s.bird.vy * dt;
      }
    } else {
      // AI: flap when bird is below next gap centre
      const nextPipe = s.pipes.find((p) => p.x + PIPE_W > s.bird.x);
      const target = nextPipe ? nextPipe.gapY + GAP / 2 - 6 : H / 2;
      if (s.bird.y > target && s.bird.vy > FLAP * 0.4) s.bird.vy = FLAP;
      s.bird.vy += G * dt;
      s.bird.y += s.bird.vy * dt;
    }

    // Spawn pipes (skip while waiting for first flap in play mode)
    if (!(mode === "playing" && s.waitingForFlap)) {
      s.spawn += dt;
      if (s.spawn > 1.3) {
        s.spawn = 0;
        const margin = 25;
        const gapY = margin + Math.random() * (H - 2 * margin - GAP);
        s.pipes.push({ x: W + 10, gapY, scored: false });
      }
      for (const p of s.pipes) p.x -= SPEED * dt;
      s.pipes = s.pipes.filter((p) => p.x + PIPE_W > -10);
    }

    // Collisions / scoring (skip during pre-flap)
    if (!(mode === "playing" && s.waitingForFlap)) {
      for (const p of s.pipes) {
        const inX =
          s.bird.x + s.bird.r > p.x && s.bird.x - s.bird.r < p.x + PIPE_W;
        if (inX) {
          if (
            s.bird.y - s.bird.r < p.gapY ||
            s.bird.y + s.bird.r > p.gapY + GAP
          ) {
            if (mode === "playing") {
              onDeath?.(s.score);
              reset();
              return;
            } else {
              reset();
              return;
            }
          }
        }
        if (!p.scored && p.x + PIPE_W < s.bird.x - s.bird.r) {
          p.scored = true;
          s.score++;
          if (mode === "playing" && onScore) onScore(s.score);
        }
      }
      if (s.bird.y < 0 || s.bird.y > H) {
        if (mode === "playing") onDeath?.(s.score);
        reset();
      }
    }

    // Draw
    const ctx = s.canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050508");
    g.addColorStop(1, "#0a1324");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#0071e3";
    for (const p of s.pipes) {
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
      ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      ctx.fillStyle = "#2997ff";
      ctx.fillRect(p.x - 2, p.gapY - 8, PIPE_W + 4, 8);
      ctx.fillRect(p.x - 2, p.gapY + GAP, PIPE_W + 4, 8);
      ctx.fillStyle = "#0071e3";
    }

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

    // Score / idle label
    if (mode === "playing" && s.waitingForFlap) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TAP OR SPACE", W / 2, H / 2 - 30);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "bold 56px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(s.score), W / 2, H / 2 + 20);
    }

    texture.needsUpdate = true;
  });

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function ScreenFace({ mode, flapRef, onScore, onDeath }) {
  const tex = useFlappyTexture(mode, flapRef, onScore, onDeath);
  return (
    <mesh position={[0, 0.05, 0.19]}>
      <planeGeometry args={[1.95, 1.0]} />
      <meshStandardMaterial
        map={tex}
        emissive="#0071e3"
        emissiveIntensity={mode === "playing" ? 0.1 : 0.25}
        emissiveMap={tex}
        toneMapped={false}
      />
    </mesh>
  );
}

function Console({ reduceMotion, mode, setMode, flapRef, onScore, onDeath }) {
  const group = useRef(null);
  const screenGlow = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Idle sway + hover scale pulse
  useFrame((state) => {
    if (!group.current) return;
    if (mode === "idle" && !reduceMotion) {
      const t = state.clock.elapsedTime;
      group.current.rotation.y = Math.sin(t * 0.4) * 0.25;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.05 - 0.1;
    } else if (mode === "playing") {
      // Face the camera head-on in play mode
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
    }
    const targetScale = hovered && mode === "idle" ? 1.04 : 1;
    const s = group.current.scale.x;
    const next = THREE.MathUtils.lerp(s, targetScale, 0.15);
    group.current.scale.set(next, next, next);
  });

  // Cursor + a11y when hovered in idle
  useEffect(() => {
    if (mode !== "idle") return;
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered, mode]);

  const bodyColor = "#1a1a1c";
  const bodyDark = "#0f0f10";
  const stickColor = "#2a2a2c";
  const accent = "#0071e3";

  return (
    <group
      ref={group}
      position={[0, -0.3, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => {
        e.stopPropagation();
        if (mode === "idle") setMode("playing");
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.5, 2]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.6}
          metalness={0.2}
          emissive={hovered && mode === "idle" ? accent : "#000"}
          emissiveIntensity={hovered && mode === "idle" ? 0.12 : 0}
        />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[3.4, 0.1, 2.2]} />
        <meshStandardMaterial color={bodyDark} roughness={0.8} />
      </mesh>

      {/* Screen housing */}
      <group position={[0, 0.55, -0.35]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.4, 0.3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, 0.16]}>
          <boxGeometry args={[2.1, 1.15, 0.05]} />
          <meshStandardMaterial color="#050506" roughness={0.3} />
        </mesh>
        <ScreenFace mode={mode} flapRef={flapRef} onScore={onScore} onDeath={onDeath} />
      </group>

      <pointLight
        ref={screenGlow}
        position={[0, 0.7, 0.2]}
        color={accent}
        intensity={hovered ? 0.9 : 0.55}
        distance={5}
      />

      <JoyStick position={[-0.9, 0.3, 0.5]} stickColor={stickColor} accent={accent} />
      <JoyStick position={[0.9, 0.3, 0.5]} stickColor={stickColor} accent={accent} />

      <Button position={[-0.25, 0.26, 0.75]} color="#ff4d4d" />
      <Button position={[0, 0.26, 0.75]} color="#f5c518" />
      <Button position={[0.25, 0.26, 0.75]} color="#30c764" />
      <Button position={[0, 0.26, 0.5]} color={accent} />
    </group>
  );
}

function JoyStick({ position, stickColor, accent }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#232325" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color={stickColor} roughness={0.5} metalness={0.3} />
      </mesh>
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

function CameraRig({ mode, reduceMotion }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3().copy(IDLE_LOOK));

  useFrame(() => {
    const targetPos = mode === "playing" ? PLAY_POS : IDLE_POS;
    const targetLook = mode === "playing" ? PLAY_LOOK : IDLE_LOOK;
    const t = reduceMotion ? 1 : 0.08;
    camera.position.lerp(targetPos, t);
    look.current.lerp(targetLook, t);
    camera.lookAt(look.current);
  });
  return null;
}

export default function ConsoleScene() {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState("idle"); // 'idle' | 'playing'
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem("flappy.best") || "0", 10) || 0; }
    catch { return 0; }
  });
  const [lastRun, setLastRun] = useState(null);
  const flapRef = useRef(false);

  function flap() {
    flapRef.current = true;
  }

  function onDeath(finalScore) {
    setLastRun(finalScore);
    if (finalScore > best) {
      setBest(finalScore);
      try { localStorage.setItem("flappy.best", String(finalScore)); } catch {}
    }
  }

  // Keyboard: space in play, esc to exit
  useEffect(() => {
    const onKey = (e) => {
      if (mode === "playing") {
        if (e.code === "Space" || e.code === "ArrowUp") {
          e.preventDefault();
          flap();
        }
        if (e.code === "Escape") setMode("idle");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  // Lock body scroll while playing
  useEffect(() => {
    if (mode === "playing") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mode]);

  const containerClass =
    mode === "playing"
      ? "fixed inset-0 z-50"
      : "relative w-full h-full";

  return (
    <div className={containerClass} style={mode === "playing" ? { background: "#000" } : undefined}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: IDLE_POS.toArray(), fov: 35 }}
        gl={{ antialias: true, alpha: mode !== "playing" }}
        onPointerDown={() => { if (mode === "playing") flap(); }}
      >
        {mode === "playing" && <color attach="background" args={["#000"]} />}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4a9eff" />

        <CameraRig mode={mode} reduceMotion={reduceMotion} />

        <Suspense fallback={null}>
          <Float
            speed={reduceMotion || mode === "playing" ? 0 : 1.1}
            rotationIntensity={reduceMotion || mode === "playing" ? 0 : 0.15}
            floatIntensity={reduceMotion || mode === "playing" ? 0 : 0.4}
          >
            <Console
              reduceMotion={reduceMotion}
              mode={mode}
              setMode={setMode}
              flapRef={flapRef}
              onScore={setScore}
              onDeath={onDeath}
            />
          </Float>
          <ContactShadows
            position={[0, -0.75, 0]}
            opacity={mode === "playing" ? 0 : 0.55}
            scale={6}
            blur={2.4}
            far={2.5}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Idle "Click to play" hint — subtle, bottom-centre of canvas */}
      {mode === "idle" && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-3 text-[10px] tracking-[0.2em] uppercase text-[#60605c]"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          CLICK CONSOLE TO PLAY
        </div>
      )}

      {/* Play-mode HUD */}
      {mode === "playing" && (
        <>
          <div
            className="pointer-events-none fixed top-5 left-5 z-10 text-white"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c]">SCORE</div>
            <div className="text-4xl font-bold tabular-nums tracking-tight">{score}</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c] mt-2">
              BEST — {best}
            </div>
          </div>

          <button
            onClick={() => setMode("idle")}
            aria-label="Exit game"
            className="fixed top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full text-[#86868b] hover:text-white transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <X size={16} />
          </button>

          <div
            className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-10 text-[10px] tracking-[0.2em] uppercase text-[#60605c]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            SPACE / TAP TO FLAP · ESC TO EXIT
          </div>

          {lastRun != null && (
            <div
              className="pointer-events-none fixed top-24 left-5 z-10 text-[11px] tracking-wider text-[#2997ff]"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              LAST RUN — {lastRun}
            </div>
          )}
        </>
      )}
    </div>
  );
}
