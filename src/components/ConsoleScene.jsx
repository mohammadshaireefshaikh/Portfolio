import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { X, Volume2, VolumeX, Play, Trophy, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";

// Camera targets (play distance computed in CameraRig)
// IDLE now frames the whole room, not just the arcade cabinet.
const IDLE_POS = new THREE.Vector3(3.8, 2.2, 5.2);
const IDLE_LOOK = new THREE.Vector3(0, 0.3, 0);
const PLAY_LOOK = new THREE.Vector3(0, 0.4, -0.1);

// Room geometry constants
const ROOM = {
  size: 10,         // floor is 10×10 (square room)
  height: 4.5,      // ceiling height
  floorY: -0.56,    // sits flush under the arcade cabinet's base
};

// ─── Audio ────────────────────────────────────────────────────
let audioCtx = null;
let muted = false;
let music = null;
function ctx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { /* no audio */ }
  }
  return audioCtx;
}
function setMuted(v) {
  muted = v;
  if (music) music.master.gain.setValueAtTime(v ? 0 : 0.04, audioCtx.currentTime);
}

function tone({ freq = 440, type = "sine", dur = 0.1, gain = 0.15, slide = 0 }) {
  const a = ctx();
  if (!a || muted) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur);
}

function noise(dur = 0.25, gain = 0.3, startFreq = 1200, endFreq = 200) {
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
  lp.frequency.setValueAtTime(startFreq, a.currentTime);
  lp.frequency.exponentialRampToValueAtTime(endFreq, a.currentTime + dur);
  src.connect(lp).connect(g).connect(a.destination);
  src.start();
}

const sfx = {
  flap: () => tone({ freq: 520, type: "triangle", dur: 0.08, gain: 0.12, slide: 180 }),
  score: () => {
    tone({ freq: 880, type: "square", dur: 0.06, gain: 0.1 });
    setTimeout(() => tone({ freq: 1320, type: "square", dur: 0.08, gain: 0.1 }), 60);
  },
  // BOOM — longer thud + rumble, ~1.2s
  boom: () => {
    tone({ freq: 110, type: "sine", dur: 0.5, gain: 0.4, slide: -70 });
    tone({ freq: 60, type: "triangle", dur: 0.7, gain: 0.25, slide: -20 });
    noise(1.2, 0.35, 1600, 90);
  },
};

// Sci-fi arpeggio drone — synth background music, no files
function startMusic() {
  const a = ctx();
  if (!a || music) return;

  const master = a.createGain();
  master.gain.value = muted ? 0 : 0.04;
  master.connect(a.destination);

  // Lowpass with LFO for movement
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 5;
  filter.connect(master);

  // Deep bass drone
  const bass = a.createOscillator();
  bass.type = "sine";
  bass.frequency.value = 55;
  const bassGain = a.createGain();
  bassGain.gain.value = 0.35;
  bass.connect(bassGain).connect(master);
  bass.start();

  // Pad — detuned saws
  const pad1 = a.createOscillator();
  pad1.type = "sawtooth";
  pad1.frequency.value = 110;
  const pad2 = a.createOscillator();
  pad2.type = "sawtooth";
  pad2.frequency.value = 110.5;
  const padGain = a.createGain();
  padGain.gain.value = 0.07;
  pad1.connect(padGain);
  pad2.connect(padGain);
  padGain.connect(filter);
  pad1.start();
  pad2.start();

  // Arpeggio
  const notes = [220, 277.18, 329.63, 440, 329.63, 277.18]; // Am7
  const arp = a.createOscillator();
  arp.type = "square";
  const arpGain = a.createGain();
  arpGain.gain.value = 0;
  arp.connect(arpGain).connect(filter);
  arp.start();

  let i = 0;
  const arpTimer = setInterval(() => {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    arp.frequency.setValueAtTime(notes[i], t);
    arpGain.gain.setValueAtTime(0.18, t);
    arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    i = (i + 1) % notes.length;
  }, 230);

  // Filter LFO
  const lfo = a.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = a.createGain();
  lfoGain.gain.value = 650;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  music = { master, bass, pad1, pad2, arp, lfo, arpTimer };
}
function stopMusic() {
  if (!music) return;
  music.bass.stop();
  music.pad1.stop();
  music.pad2.stop();
  music.arp.stop();
  music.lfo.stop();
  clearInterval(music.arpTimer);
  music.master.disconnect();
  music = null;
}

// ─── Shake state ──────────────────────────────────────────────
const shake = { amp: 0 };

// ─── Pixel bat sprite (2 frames) ──────────────────────────────
const BAT_FRAMES = [
  ["....XXX....", "...X.X.X...", "..XXXXXXX..", ".XXXXXXXXX.", "XXXXXXXXXXX", ".XXXXXXXXX.", "..XXX.XXX..", "...X...X...", "..........."],
  ["X...XXX...X", "XX.X.X.X.XX", ".XXXXXXXXX.", "..XXXXXXX..", "..XXXXXXX..", "...XXXXX...", "...XX.XX...", "....X.X....", "..........."],
];
function drawBat(ctx, cx, cy, frame, cell = 3) {
  const rows = BAT_FRAMES[frame];
  const w = rows[0].length;
  const h = rows.length;
  const ox = cx - (w * cell) / 2;
  const oy = cy - (h * cell) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rows[y][x] === "X") ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  ctx.save();
  ctx.fillStyle = "#ff2e2e";
  ctx.fillRect(ox + (frame === 0 ? 7 : 6) * cell, oy + 2 * cell, cell, cell);
  ctx.restore();
}

// ─── Flappy state ─────────────────────────────────────────────
function useFlappyTexture(mode, flapRef, onScore, onDeath) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 390;
    canvas.height = 200;
    const t = new THREE.CanvasTexture(canvas);
    t.minFilter = THREE.NearestFilter;
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
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 160;
      s.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.6 + Math.random() * 0.4, max: 1.0,
        size: 2 + ((Math.random() * 2) | 0),
        color: Math.random() < 0.5 ? "#2997ff" : "#ffffff",
      });
    }
  }
  function sparkle(x, y) {
    const s = stateRef.current;
    for (let i = 0; i < 6; i++) {
      s.particles.push({
        x, y, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 60,
        life: 0.4, max: 0.4, size: 2, color: "#f5c518",
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

    s.frameTimer += dt * (Math.abs(s.bird.vy) > 50 ? 14 : 7);
    if (s.frameTimer > 1) { s.frameTimer = 0; s.frame = 1 - s.frame; }

    // In 'dead' mode: don't tick physics, just update particles + draw frozen frame
    const frozen = mode === "dead";

    if (!frozen) {
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
      } else if (mode === "idle") {
        const next = s.pipes.find((p) => p.x + PIPE_W > s.bird.x);
        const target = next ? next.gapY + GAP / 2 - 6 : H / 2;
        if (s.bird.y > target && s.bird.vy > FLAP * 0.4) s.bird.vy = FLAP;
        s.bird.vy += G * dt;
        s.bird.y += s.bird.vy * dt;
      }

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

      if (!(mode === "playing" && s.waitingForFlap)) {
        for (const p of s.pipes) {
          const inX = s.bird.x + s.bird.r > p.x && s.bird.x - s.bird.r < p.x + PIPE_W;
          if (inX) {
            if (s.bird.y - s.bird.r < p.gapY || s.bird.y + s.bird.r > p.gapY + GAP) {
              burst(s.bird.x, s.bird.y);
              if (mode === "playing") {
                sfx.boom();
                shake.amp = 0.16;
                onDeath?.(s.score);
              } else {
                reset();
              }
              return;
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
            sfx.boom();
            shake.amp = 0.16;
            onDeath?.(s.score);
          } else {
            reset();
          }
        }
      }
    }

    // Particles always tick
    for (const p of s.particles) {
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // Draw
    const g2d = s.canvas.getContext("2d");
    g2d.imageSmoothingEnabled = false;
    const g = g2d.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050508");
    g.addColorStop(1, "#0a1324");
    g2d.fillStyle = g;
    g2d.fillRect(0, 0, W, H);

    g2d.fillStyle = "#0071e3";
    for (const p of s.pipes) {
      g2d.fillRect(p.x, 0, PIPE_W, p.gapY);
      g2d.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      g2d.fillStyle = "#2997ff";
      g2d.fillRect(p.x - 2, p.gapY - 8, PIPE_W + 4, 8);
      g2d.fillRect(p.x - 2, p.gapY + GAP, PIPE_W + 4, 8);
      g2d.fillStyle = "#0071e3";
    }

    if (!frozen || s.particles.length > 0) {
      g2d.fillStyle = frozen ? "#555558" : "#2a2a2c";
      drawBat(g2d, s.bird.x, s.bird.y, s.frame, 3);
    }

    for (const p of s.particles) {
      g2d.globalAlpha = Math.max(0, p.life / p.max);
      g2d.fillStyle = p.color;
      g2d.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
    g2d.globalAlpha = 1;

    if (mode === "playing" && s.waitingForFlap) {
      g2d.fillStyle = "rgba(255,255,255,0.75)";
      g2d.font = "bold 16px system-ui, sans-serif";
      g2d.textAlign = "center";
      g2d.fillText("TAP OR SPACE", W / 2, H / 2 - 32);
    } else if (!frozen) {
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
        emissiveIntensity={mode === "idle" ? 0.25 : 0.1}
        emissiveMap={tex}
        toneMapped={false}
      />
    </mesh>
  );
}

// Draggable joystick — real tilt follows pointer drag, lerps back on release
function JoyStick({ position, stickColor, accent }) {
  const stickRef = useRef(null);
  const tilt = useRef({ x: 0, z: 0 });
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!stickRef.current) return;
    const target = dragging.current ? tilt.current : { x: 0, z: 0 };
    stickRef.current.rotation.x = THREE.MathUtils.lerp(stickRef.current.rotation.x, target.x, 0.25);
    stickRef.current.rotation.z = THREE.MathUtils.lerp(stickRef.current.rotation.z, target.z, 0.25);
  });

  function onPointerDown(e) {
    e.stopPropagation();
    dragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    try { e.target.setPointerCapture(e.pointerId); } catch {}
  }
  function onPointerMove(e) {
    if (!dragging.current) return;
    const dx = (e.clientX - startPos.current.x) / 120;
    const dy = (e.clientY - startPos.current.y) / 120;
    tilt.current.z = Math.max(-0.5, Math.min(0.5, -dx));
    tilt.current.x = Math.max(-0.5, Math.min(0.5, dy));
  }
  function onPointerUp() {
    dragging.current = false;
    tilt.current = { x: 0, z: 0 };
  }

  return (
    <group position={position}>
      {/* Mount base — not draggable */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#232325" roughness={0.6} />
      </mesh>
      {/* Draggable stick group */}
      <group
        ref={stickRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
          <meshStandardMaterial color={stickColor} roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.47, 0]} castShadow>
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// Clickable button — visual only, animates on press
function Button({ position, color }) {
  const ref = useRef(null);
  const [pressed, setPressed] = useState(false);

  useFrame(() => {
    if (!ref.current) return;
    const target = pressed ? 0.4 : 1;
    const next = THREE.MathUtils.lerp(ref.current.scale.y, target, 0.3);
    ref.current.scale.y = next;
  });

  return (
    <mesh
      ref={ref}
      position={position}
      castShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        setPressed(true);
        tone({ freq: 220, type: "square", dur: 0.04, gain: 0.08 });
      }}
      onPointerUp={(e) => { e.stopPropagation(); setPressed(false); }}
      onPointerLeave={() => setPressed(false)}
    >
      <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={pressed ? 0.9 : 0.4}
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
    } else if (mode === "playing" || mode === "dead") {
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
        if (mode === "idle") { ctx(); setMode("playing"); }
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

/**
 * RoomShell — floor, three walls, baseboard trim, warm corner lamps,
 * cool back-wall accent. Phase 1 of the arcade-room build. Furniture
 * (sofa, pool table, Hot Wheels shelf, One Piece wall, speakers, etc.)
 * lands in later phases.
 */
function RoomShell() {
  const { size, height, floorY } = ROOM;
  const ceilY = floorY + height;
  const midY = (floorY + ceilY) / 2;
  const half = size / 2;

  return (
    <group>
      {/* Floor — warm dark wood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#1e1510" roughness={0.95} />
      </mesh>

      {/* Rug under the cabinet — tiny patch of warmth so the arcade reads as grounded */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.001, 0.2]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#2a1618" roughness={1} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, midY, -half]} receiveShadow>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color="#17181c" roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-half, midY, 0]} receiveShadow>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[half, midY, 0]} receiveShadow>
        <planeGeometry args={[size, height]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.95} />
      </mesh>
      {/* Ceiling — darker, keeps bounce light moody */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceilY, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0a0a0e" roughness={1} />
      </mesh>

      {/* Baseboards (thin dark strips where walls meet floor) */}
      <mesh position={[0, floorY + 0.08, -half + 0.01]}>
        <boxGeometry args={[size, 0.15, 0.03]} />
        <meshStandardMaterial color="#0a0a0c" />
      </mesh>
      <mesh position={[-half + 0.01, floorY + 0.08, 0]}>
        <boxGeometry args={[0.03, 0.15, size]} />
        <meshStandardMaterial color="#0a0a0c" />
      </mesh>
      <mesh position={[half - 0.01, floorY + 0.08, 0]}>
        <boxGeometry args={[0.03, 0.15, size]} />
        <meshStandardMaterial color="#0a0a0c" />
      </mesh>

      {/* Warm lamp spots (front-left + front-right ceiling corners) */}
      <pointLight
        position={[-half + 0.6, ceilY - 0.5, half - 0.6]}
        color="#f5a860"
        intensity={1.6}
        distance={9}
        decay={2}
        castShadow
      />
      <pointLight
        position={[half - 0.6, ceilY - 0.5, half - 0.6]}
        color="#f5a860"
        intensity={1.6}
        distance={9}
        decay={2}
      />
      {/* Cool rim light bouncing off the back wall */}
      <pointLight
        position={[0, ceilY - 0.5, -half + 0.8]}
        color="#4a7eff"
        intensity={0.9}
        distance={7}
        decay={2}
      />

      {/* Glowing lamp placeholders so the light sources read on the ceiling */}
      <mesh position={[-half + 0.6, ceilY - 0.1, half - 0.6]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffcf90" emissive="#ffcf90" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[half - 0.6, ceilY - 0.1, half - 0.6]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffcf90" emissive="#ffcf90" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CameraRig({ mode, reduceMotion }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3().copy(IDLE_LOOK));
  const playTarget = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const aspect = size.width / Math.max(1, size.height);
    let z, y;
    if (aspect >= 1.4) { z = 3.4; y = 0.9; }
    else if (aspect >= 1.0) { z = 3.8; y = 0.9; }
    else if (aspect >= 0.7) { z = 4.6; y = 1.0; }
    else { z = 5.6; y = 1.1; }
    playTarget.current.set(0, y, z);

    const targetPos = (mode === "playing" || mode === "dead") ? playTarget.current : IDLE_POS;
    const targetLook = (mode === "playing" || mode === "dead") ? PLAY_LOOK : IDLE_LOOK;
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

// ─── Local leaderboard helpers ────────────────────────────────
const LB_KEY = "flappy.scores";
function readScores() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || "[]"); }
  catch { return []; }
}
function writeScores(arr) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(arr.slice(0, 50))); } catch {}
}
function addScore(name, score) {
  const list = readScores();
  list.push({ name: name.trim().slice(0, 24) || "Anon", score, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  writeScores(list);
  return list;
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
  const [playerName, setPlayerName] = useState(() => {
    try { return localStorage.getItem("flappy.name") || ""; } catch { return ""; }
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const flapRef = useRef(false);

  function flap() { flapRef.current = true; }
  function savePlayerName(n) {
    setPlayerName(n);
    try { localStorage.setItem("flappy.name", n); } catch {}
  }

  function onDeath(finalScore) {
    setLastRun(finalScore);
    setMode("dead");
    setSubmitted(false);
    if (finalScore > best) {
      setBest(finalScore);
      try { localStorage.setItem("flappy.best", String(finalScore)); } catch {}
    }
  }

  function submitScore() {
    if (!playerName.trim()) return;
    addScore(playerName, lastRun ?? 0);
    setSubmitted(true);
  }
  function replay() { setMode("playing"); }

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (mode === "playing") {
        if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
        if (e.code === "Escape") setMode("idle");
        if (e.code === "KeyM") { const n = !isMuted; setIsMuted(n); setMuted(n); }
      } else if (mode === "dead") {
        if (e.code === "Space") replay();
        if (e.code === "Escape") setMode("idle");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, isMuted]);

  // Scroll lock + mode broadcast
  useEffect(() => {
    const inGame = mode === "playing" || mode === "dead";
    if (inGame) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mode]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("game-mode", { detail: mode }));
  }, [mode]);

  // Music lifecycle
  useEffect(() => {
    if (mode === "playing" || mode === "dead") startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [mode]);

  const inGame = mode === "playing" || mode === "dead";
  const containerClass = inGame ? "fixed inset-0 z-50" : "relative w-full h-full";

  return (
    <div
      className={containerClass}
      style={
        inGame
          ? { background: "radial-gradient(ellipse at center, #0f1420 0%, #050507 70%, #000 100%)" }
          : undefined
      }
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: IDLE_POS.toArray(), fov: 35 }}
        gl={{ antialias: true, alpha: !inGame }}
        onPointerDown={(e) => {
          // Only flap when clicking on empty canvas during play — joystick/button events stopPropagation
          if (mode === "playing") flap();
        }}
      >
        {inGame && <color attach="background" args={["#0a0d14"]} />}
        {/* Lighting: moody base + warm/cool point lights live inside RoomShell */}
        <ambientLight intensity={0.18} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={0.55}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.25} color="#4a9eff" />

        {/* Phase 1 — room shell only. Fades out while the game is in play */}
        <Suspense fallback={null}>
          {mode !== "playing" && mode !== "dead" && <RoomShell />}
        </Suspense>

        <CameraRig mode={mode} reduceMotion={reduceMotion} />

        <Suspense fallback={null}>
          <Float
            speed={reduceMotion || inGame ? 0 : 1.1}
            rotationIntensity={reduceMotion || inGame ? 0 : 0.15}
            floatIntensity={reduceMotion || inGame ? 0 : 0.4}
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
            opacity={inGame ? 0 : 0.55}
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

      {inGame && (
        <>
          {/* TOP-LEFT: Score + Name entry */}
          <div
            className="fixed top-5 left-5 z-10 text-white max-w-[260px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c]">SCORE</div>
            <div className="text-4xl font-bold tabular-nums tracking-tight">{score}</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c] mt-2">
              BEST — {best}
            </div>

            <div className="mt-5">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c] mb-1.5">
                PLAYER
              </div>
              <input
                type="text"
                maxLength={24}
                placeholder="your name"
                value={playerName}
                onChange={(e) => savePlayerName(e.target.value)}
                className="w-full bg-transparent border-b border-dashed border-white/[0.15] text-sm text-white placeholder-[#444] outline-none focus:border-[#2997ff] transition-colors px-0 py-1"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              />
            </div>
          </div>

          {/* TOP-RIGHT: Mute + Exit */}
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

          {mode === "playing" && (
            <div
              className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-10 text-[10px] tracking-[0.2em] uppercase text-[#60605c]"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              SPACE / TAP FLAP · M MUTE · ESC EXIT
            </div>
          )}

          {/* GAME OVER PANEL */}
          {mode === "dead" && (
            <div
              className="fixed inset-0 z-20 flex items-center justify-center p-6"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            >
              <div
                className="w-full max-w-sm p-6 sm:p-8 rounded-2xl"
                style={{
                  background: "#0a0d14",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  boxShadow: "6px 6px 0 0 rgba(0,113,227,0.5)",
                }}
              >
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#ff2e2e] mb-1">
                  GAME OVER
                </p>
                <div className="flex items-end gap-6 mb-6">
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c]">SCORE</div>
                    <div className="text-4xl font-bold tabular-nums text-white">{lastRun}</div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c]">BEST</div>
                    <div className="text-2xl font-bold tabular-nums text-[#2997ff]">{best}</div>
                  </div>
                </div>

                {!submitted ? (
                  <>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-[#60605c] mb-1.5 block">
                      SUBMIT AS
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      placeholder="your name"
                      value={playerName}
                      onChange={(e) => savePlayerName(e.target.value)}
                      className="w-full bg-transparent border-b border-dashed border-white/[0.15] text-sm text-white placeholder-[#444] outline-none focus:border-[#2997ff] transition-colors px-0 py-1.5 mb-5"
                      style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                    />
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={submitScore}
                        disabled={!playerName.trim() || lastRun < 1}
                        className="w-full px-4 py-2.5 text-xs tracking-[0.05em] text-white rounded-md disabled:opacity-30 transition-colors"
                        style={{ background: "#0071e3", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                      >
                        [ SUBMIT SCORE ]
                      </button>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={replay}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs tracking-[0.05em] text-white rounded-md transition-colors"
                          style={{
                            background: "transparent",
                            border: "1px solid #ecece8",
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          }}
                        >
                          <RotateCcw size={11} /> REPLAY
                        </button>
                        <button
                          onClick={() => setShowLeaderboard(true)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs tracking-[0.05em] text-white rounded-md transition-colors"
                          style={{
                            background: "transparent",
                            border: "1px solid #ecece8",
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          }}
                        >
                          <Trophy size={11} /> HALL
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#2997ff] mb-5">
                      → saved locally · pending Mohammad's approval
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={replay}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs tracking-[0.05em] text-white rounded-md"
                        style={{ background: "#0071e3", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                      >
                        <Play size={11} /> AGAIN
                      </button>
                      <button
                        onClick={() => setShowLeaderboard(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs tracking-[0.05em] text-white rounded-md"
                        style={{
                          background: "transparent",
                          border: "1px solid #ecece8",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        }}
                      >
                        <Trophy size={11} /> HALL
                      </button>
                    </div>
                  </>
                )}
                <p className="text-[10px] text-[#444] text-center mt-5 tracking-[0.1em]">
                  SPACE REPLAY · ESC EXIT
                </p>
              </div>
            </div>
          )}

          {/* LEADERBOARD MODAL */}
          {showLeaderboard && (
            <div
              className="fixed inset-0 z-30 flex items-center justify-center p-6"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
              onClick={() => setShowLeaderboard(false)}
            >
              <div
                className="w-full max-w-md p-6 rounded-2xl"
                style={{
                  background: "#0a0d14",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#f5c518]">
                    HALL OF FAME
                  </p>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="text-[#86868b] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <LeaderboardList />
                <p className="text-[10px] text-[#444] mt-4 leading-relaxed">
                  Scores are saved locally for now. Mohammad reviews new entries and promotes the best to the public hall. (Backend wiring pending.)
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardList() {
  const scores = readScores();
  if (!scores.length) {
    return <p className="text-sm text-[#60605c] italic py-6 text-center">No scores yet. Be first.</p>;
  }
  return (
    <ol className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
      {scores.slice(0, 20).map((s, i) => (
        <li
          key={i}
          className="grid grid-cols-[auto_1fr_auto] gap-3 items-center text-sm py-2 px-3 rounded"
          style={{
            background: i === 0 ? "rgba(245,197,24,0.08)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${i === 0 ? "rgba(245,197,24,0.2)" : "rgba(255,255,255,0.05)"}`,
          }}
        >
          <span className="text-[11px] text-[#60605c] tracking-[0.1em]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-white truncate">{s.name}</span>
          <span className="text-[#2997ff] tabular-nums font-semibold">{s.score}</span>
        </li>
      ))}
    </ol>
  );
}
