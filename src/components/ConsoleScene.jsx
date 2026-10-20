import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { X, Volume2, VolumeX } from "lucide-react";
import { useReducedMotion } from "framer-motion";

// Camera targets
const IDLE_POS = new THREE.Vector3(2.5, 2.5, 4);
const IDLE_LOOK = new THREE.Vector3(0, 0, 0);
// PLAY_POS is now computed per-viewport inside CameraRig so narrow phones
// pull back far enough to actually show the console body around the screen.
const PLAY_LOOK = new THREE.Vector3(0, 0.4, -0.1);

// ─── Audio (Web Audio API, no files) ──────────────────────────
let audioCtx = null;
let muted = false;
function ctx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { /* no audio */ }
  }
  return audioCtx;
}
function setMuted(v) { muted = v; }

function tone({ freq = 440, type = "sine", dur = 0.1, gain = 0.15, slide = 0 }) {
  const a = ctx();
  if (!a || muted) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(50, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur);
}
function noise(dur = 0.25, gain = 0.3) {
  const a = ctx();
  if (!a || muted) return;
  const bufferSize = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, bufferSize, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  src.connect(lp).connect(g).connect(a.destination);
  src.start();
}
const sfx = {
  flap: () => tone({ freq: 520, type: "triangle", dur: 0.08, gain: 0.12, slide: 180 }),
  score: () => { tone({ freq: 880, type: "square", dur: 0.06, gain: 0.1 }); setTimeout(() => tone({ freq: 1320, type: "square", dur: 0.08, gain: 0.1 }), 60); },
  die: () => {
    tone({ freq: 220, type: "sawtooth", dur: 0.18, gain: 0.2, slide: -120 });
    noise(0.3, 0.25);
  },
};

// ─── Shake state (shared with CameraRig) ──────────────────────
const shake = { amp: 0 };

// ─── Pixel bat sprite (2 frames) ──────────────────────────────
// 11 cols × 9 rows, 1 = filled. Simple bat silhouette with wing flap.
const BAT_FRAMES = [
  // Frame 0 — wings down
  [
    "....XXX....",
    "...X.X.X...",
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XXXXXXXXXXX",
    ".XXXXXXXXX.",
    "..XXX.XXX..",
    "...X...X...",
    "...........",
  ],
  // Frame 1 — wings up
  [
    "X...XXX...X",
    "XX.X.X.X.XX",
    ".XXXXXXXXX.",
    "..XXXXXXX..",
    "..XXXXXXX..",
    "...XXXXX...",
    "...XX.XX...",
    "....X.X....",
    "...........",
  ],
];
function drawBat(ctx, cx, cy, frame, cell = 3) {
  const rows = BAT_FRAMES[frame];
  const w = rows[0].length;
  const h = rows.length;
  const ox = cx - (w * cell) / 2;
  const oy = cy - (h * cell) / 2;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      if (row[x] === "X") {
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }
  }
  // Eye
  const eyeX = ox + (frame === 0 ? 7 : 6) * cell;
  const eyeY = oy + 2 * cell;
  ctx.save();
  ctx.fillStyle = "#ff2e2e";
  ctx.fillRect(eyeX, eyeY, cell, cell);
  ctx.restore();
}

// ─── Flappy state hook (texture that mutates each frame) ──────
function useFlappyTexture(mode, flapRef, onScore, onDeath) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 390;
    canvas.height = 200;
    const t = new THREE.CanvasTexture(canvas);
    t.minFilter = THREE.NearestFilter; // crisp pixel art
    t.magFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const stateRef = useRef({
    canvas: texture.image,
    bird: { x: 70, y: 100, vy: 0, r: 10 },
    pipes: [],
    particles: [],
    spawn: 0,
    frameTimer: 0,
    frame: 0,
    score: 0,
    waitingForFlap: true,
  });

  function reset() {
    const s = stateRef.current;
    s.bird.x = 70;
    s.bird.y = 100;
    s.bird.vy = 0;
    s.pipes = [];
    s.spawn = 0;
    s.particles = [];
    s.score = 0;
    s.waitingForFlap = mode === "playing";
    onScore?.(0);
  }

  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [mode]);

  function burst(x, y) {
    const s = stateRef.current;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 140;
      s.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.55 + Math.random() * 0.25,
        max: 0.8,
        size: 2 + ((Math.random() * 2) | 0),
        color: Math.random() < 0.5 ? "#2997ff" : "#ffffff",
      });
    }
  }
  function sparkle(x, y) {
    const s = stateRef.current;
    for (let i = 0; i < 6; i++) {
      s.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 60,
        vy: -20 - Math.random() * 60,
        life: 0.4, max: 0.4,
        size: 2,
        color: "#f5c518",
      });
    }
  }

  useFrame((_, dt) => {
    const s = stateRef.current;
    const W = s.canvas.width;
    const H = s.canvas.height;
    const GAP = 72;
    const PIPE_W = 32;
    const SPEED = mode === "playing" ? 95 : 70;
    const G = mode === "playing" ? 540 : 420;
    const FLAP = -195;

    // Flap frame counter — alternates based on bird velocity for liveness
    s.frameTimer += dt * (Math.abs(s.bird.vy) > 50 ? 14 : 7);
    if (s.frameTimer > 1) { s.frameTimer = 0; s.frame = 1 - s.frame; }

    // Input / AI
    if (mode === "playing") {
      if (flapRef.current) {
        s.bird.vy = FLAP;
        s.waitingForFlap = false;
        flapRef.current = false;
        sfx.flap();
      }
      if (s.waitingForFlap) {
        s.bird.y = H / 2 + Math.sin(performance.now() * 0.004) * 6;
      } else {
        s.bird.vy += G * dt;
        s.bird.y += s.bird.vy * dt;
      }
    } else {
      const next = s.pipes.find((p) => p.x + PIPE_W > s.bird.x);
      const target = next ? next.gapY + GAP / 2 - 6 : H / 2;
      if (s.bird.y > target && s.bird.vy > FLAP * 0.4) s.bird.vy = FLAP;
      s.bird.vy += G * dt;
      s.bird.y += s.bird.vy * dt;
    }

    // Spawn + move pipes
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

    // Collisions + scoring
    if (!(mode === "playing" && s.waitingForFlap)) {
      for (const p of s.pipes) {
        const inX =
          s.bird.x + s.bird.r > p.x && s.bird.x - s.bird.r < p.x + PIPE_W;
        if (inX) {
          if (
            s.bird.y - s.bird.r < p.gapY ||
            s.bird.y + s.bird.r > p.gapY + GAP
          ) {
            burst(s.bird.x, s.bird.y);
            if (mode === "playing") {
              sfx.die();
              shake.amp = 0.12;
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
          if (mode === "playing") {
            sfx.score();
            sparkle(s.bird.x + 20, s.bird.y);
            onScore?.(s.score);
          }
        }
      }
      if (s.bird.y < 0 || s.bird.y > H) {
        burst(s.bird.x, s.bird.y);
        if (mode === "playing") {
          sfx.die();
          shake.amp = 0.12;
          onDeath?.(s.score);
        }
        reset();
      }
    }

    // Particles update
    for (const p of s.particles) {
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // ─── Draw ───
    const g2d = s.canvas.getContext("2d");
    g2d.imageSmoothingEnabled = false;
    const g = g2d.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050508");
    g.addColorStop(1, "#0a1324");
    g2d.fillStyle = g;
    g2d.fillRect(0, 0, W, H);

    // Pipes
    g2d.fillStyle = "#0071e3";
    for (const p of s.pipes) {
      g2d.fillRect(p.x, 0, PIPE_W, p.gapY);
      g2d.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      g2d.fillStyle = "#2997ff";
      g2d.fillRect(p.x - 2, p.gapY - 8, PIPE_W + 4, 8);
      g2d.fillRect(p.x - 2, p.gapY + GAP, PIPE_W + 4, 8);
      g2d.fillStyle = "#0071e3";
    }

    // Bat sprite — colour-shifts darker as bird falls
    g2d.fillStyle = "#2a2a2c";
    drawBat(g2d, s.bird.x, s.bird.y, s.frame, 3);

    // Particles on top
    for (const p of s.particles) {
      g2d.globalAlpha = Math.max(0, p.life / p.max);
      g2d.fillStyle = p.color;
      g2d.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
    g2d.globalAlpha = 1;

    // Label / score
    if (mode === "playing" && s.waitingForFlap) {
      g2d.fillStyle = "rgba(255,255,255,0.75)";
      g2d.font = "bold 16px system-ui, sans-serif";
      g2d.textAlign = "center";
      g2d.fillText("TAP OR SPACE", W / 2, H / 2 - 32);
    } else {
      g2d.fillStyle = "rgba(255,255,255,0.22)";
      g2d.font = "bold 56px system-ui, sans-serif";
      g2d.textAlign = "center";
      g2d.fillText(String(s.score), W / 2, H / 2 + 20);
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

  useFrame((state) => {
    if (!group.current) return;
    if (mode === "idle" && !reduceMotion) {
      const t = state.clock.elapsedTime;
      group.current.rotation.y = Math.sin(t * 0.4) * 0.25;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.05 - 0.1;
    } else if (mode === "playing") {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
    }
    const targetScale = hovered && mode === "idle" ? 1.04 : 1;
    const s = group.current.scale.x;
    const next = THREE.MathUtils.lerp(s, targetScale, 0.15);
    group.current.scale.set(next, next, next);
  });

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
        if (mode === "idle") {
          // Prime audio context on user gesture
          ctx();
          setMode("playing");
        }
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
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3().copy(IDLE_LOOK));
  const playTarget = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    // Responsive play distance — pull further back on narrow viewports so the
    // whole console (not just the screen face) stays in frame.
    const aspect = size.width / Math.max(1, size.height);
    let z, y;
    if (aspect >= 1.4) { z = 3.4; y = 0.9; }        // wide desktop
    else if (aspect >= 1.0) { z = 3.8; y = 0.9; }   // laptop / square
    else if (aspect >= 0.7) { z = 4.6; y = 1.0; }   // tablet / small laptop
    else { z = 5.6; y = 1.1; }                       // phone portrait
    playTarget.current.set(0, y, z);

    const targetPos = mode === "playing" ? playTarget.current : IDLE_POS;
    const targetLook = mode === "playing" ? PLAY_LOOK : IDLE_LOOK;
    const t = reduceMotion ? 1 : 0.08;
    camera.position.lerp(targetPos, t);
    look.current.lerp(targetLook, t);

    if (shake.amp > 0.001 && !reduceMotion) {
      const n = performance.now() * 0.07;
      camera.position.x += Math.sin(n) * shake.amp;
      camera.position.y += Math.cos(n * 1.3) * shake.amp;
      shake.amp = Math.max(0, shake.amp - 6 * dt);
    }

    camera.lookAt(look.current);
  });
  return null;
}

export default function ConsoleScene() {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState("idle");
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem("flappy.best") || "0", 10) || 0; }
    catch { return 0; }
  });
  const [lastRun, setLastRun] = useState(null);
  const flapRef = useRef(false);

  function flap() { flapRef.current = true; }

  function onDeath(finalScore) {
    setLastRun(finalScore);
    if (finalScore > best) {
      setBest(finalScore);
      try { localStorage.setItem("flappy.best", String(finalScore)); } catch {}
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (mode === "playing") {
        if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
        if (e.code === "Escape") setMode("idle");
        if (e.code === "KeyM") { const n = !isMuted; setIsMuted(n); setMuted(n); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, isMuted]);

  useEffect(() => {
    if (mode === "playing") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mode]);

  const containerClass =
    mode === "playing" ? "fixed inset-0 z-50" : "relative w-full h-full";

  return (
    <div
      className={containerClass}
      style={
        mode === "playing"
          ? {
              background:
                "radial-gradient(ellipse at center, #0f1420 0%, #050507 70%, #000 100%)",
            }
          : undefined
      }
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: IDLE_POS.toArray(), fov: 35 }}
        gl={{ antialias: true, alpha: mode !== "playing" }}
        onPointerDown={() => { if (mode === "playing") flap(); }}
      >
        {mode === "playing" && <color attach="background" args={["#0a0d14"]} />}
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

      {mode === "idle" && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-3 text-[10px] tracking-[0.2em] uppercase text-[#60605c]"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          CLICK CONSOLE TO PLAY
        </div>
      )}

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
            {lastRun != null && (
              <div className="text-[11px] tracking-wider text-[#2997ff] mt-3">
                LAST RUN — {lastRun}
              </div>
            )}
          </div>

          <div className="fixed top-5 right-5 z-10 flex items-center gap-2">
            <button
              onClick={() => { const n = !isMuted; setIsMuted(n); setMuted(n); }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#86868b] hover:text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={() => setMode("idle")}
              aria-label="Exit game"
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#86868b] hover:text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div
            className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-10 text-[10px] tracking-[0.2em] uppercase text-[#60605c]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            SPACE / TAP FLAP · M MUTE · ESC EXIT
          </div>
        </>
      )}
    </div>
  );
}
