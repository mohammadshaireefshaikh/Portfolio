import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { X, Volume2, VolumeX, Play, Trophy, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";

// Camera targets (play distance computed in CameraRig)
// IDLE frames the whole room; PLAY lerps toward the (shrunken) arcade screen.
const IDLE_POS = new THREE.Vector3(3.8, 2.2, 5.2);
const IDLE_LOOK = new THREE.Vector3(0, 0.3, 0);
const PLAY_LOOK = new THREE.Vector3(0, -0.18, -0.07);

// Room geometry constants
const ROOM = {
  size: 10,         // floor is 10×10 (square room)
  height: 4.5,      // ceiling height
  floorY: -0.56,    // flush with the shrunken cabinet's new base position
};

// Realistic-scale pass: the cocktail arcade cabinet is tuned at ~0.45× of
// its original "demo" size so it reads as a bartop/cocktail unit (≈1.4m
// wide × ~0.9m tall) next to the sofa and pool table.
const CABINET_SCALE = 0.45;

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
    // Hover scale is a tiny multiplier on the realistic base size, so the
    // cabinet keeps its tuned footprint instead of snapping back to 1.
    const targetScale =
      hovered && mode === "idle" ? CABINET_SCALE * 1.04 : CABINET_SCALE;
    const s = group.current.scale.x;
    const next = THREE.MathUtils.lerp(s, targetScale, 0.15);
    group.current.scale.set(next, next, next);
  });

  // Replace cursor with the "Click to play" label while hovered in idle mode
  useEffect(() => {
    if (mode !== "idle") return;
    document.body.style.cursor = hovered ? "none" : "";
    window.dispatchEvent(new CustomEvent("console-hover", { detail: hovered }));
    return () => {
      document.body.style.cursor = "";
      window.dispatchEvent(new CustomEvent("console-hover", { detail: false }));
    };
  }, [hovered, mode]);

  const bodyColor = "#1a1a1c";
  const bodyDark = "#0f0f10";
  const stickColor = "#2a2a2c";
  const accent = "#0071e3";

  return (
    <group
      ref={group}
      // Position tuned so the shrunken cabinet base sits flush on the floor.
      // CABINET_SCALE is applied every frame in useFrame above.
      position={[0, -0.45, 0]}
      scale={CABINET_SCALE}
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

// ─── Phase 3 furniture ────────────────────────────────────────

function Speaker({ position, rotation = [0, 0, 0], accent = "#f5a860" }) {
  const grill = "#111113";
  const body = "#1a1a1e";
  return (
    <group position={position} rotation={rotation}>
      {/* Stand */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.52, 0.1, 0.5]} />
        <meshStandardMaterial color="#0e0e10" roughness={0.9} />
      </mesh>
      {/* Cabinet */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 1.3, 0.38]} />
        <meshStandardMaterial color={body} roughness={0.85} />
      </mesh>
      {/* Tweeter */}
      <mesh position={[0, 1.2, 0.2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 20]} />
        <meshStandardMaterial color={grill} roughness={0.9} />
      </mesh>
      {/* Woofer */}
      <mesh position={[0, 0.75, 0.2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.025, 24]} />
        <meshStandardMaterial color={grill} roughness={0.9} />
      </mesh>
      {/* Woofer centre dome */}
      <mesh position={[0, 0.75, 0.215]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Power LED */}
      <mesh position={[0.15, 0.4, 0.2]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CatHouse({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.6, 0.6]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.95} />
      </mesh>
      {/* Round entrance (dark hole) */}
      <mesh position={[0, 0.26, 0.305]}>
        <circleGeometry args={[0.17, 24]} />
        <meshStandardMaterial color="#0a0906" roughness={1} />
      </mesh>
      {/* Pitched roof — two tilted boxes */}
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.86, 0.04, 0.72]} />
        <meshStandardMaterial color="#4a3220" roughness={0.9} />
      </mesh>
      <mesh position={[-0.22, 0.9, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.72]} />
        <meshStandardMaterial color="#3a2718" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.9, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.72]} />
        <meshStandardMaterial color="#3a2718" roughness={0.9} />
      </mesh>
      {/* Pet-tag plate */}
      <mesh position={[0, 0.55, 0.306]}>
        <boxGeometry args={[0.26, 0.07, 0.004]} />
        <meshStandardMaterial color="#f5c518" roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Cat({ position, rotation = [0, 0, 0], color = "#2a2a2c" }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[0.22, 0.3, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.4, 0.08]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.07, 0.53, 0.08]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.07, 0.53, 0.08]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.045, 0.42, 0.18]}>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshStandardMaterial color="#8bff30" emissive="#8bff30" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.045, 0.42, 0.18]}>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshStandardMaterial color="#8bff30" emissive="#8bff30" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      {/* Tail curled around */}
      <mesh position={[0.13, 0.1, 0.14]} rotation={[0, 0.5, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function PopcornMachine({ position, rotation = [0, 0, 0] }) {
  const red = "#c42c2c";
  const gold = "#d7a84a";
  return (
    <group position={position} rotation={rotation}>
      {/* Wheels */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* Cart base */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.85, 0.2, 0.55]} />
        <meshStandardMaterial color={red} roughness={0.6} />
      </mesh>
      {/* Lower cabinet door */}
      <mesh position={[0, 0.22, 0.278]}>
        <planeGeometry args={[0.6, 0.14]} />
        <meshStandardMaterial color="#2a0e0e" />
      </mesh>
      {/* Glass box */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.78, 0.7, 0.48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Glass top rim */}
      <mesh position={[0, 1.07, 0]}>
        <boxGeometry args={[0.84, 0.06, 0.52]} />
        <meshStandardMaterial color={red} />
      </mesh>
      {/* Popcorn (two spheres clumped) */}
      <mesh position={[-0.12, 0.72, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#fff2b8" emissive="#fff2b8" emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0.14, 0.78, 0.06]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#fff6c8" emissive="#fff6c8" emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
      {/* Top crown */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[0.85, 0.18, 0.5]} />
        <meshStandardMaterial color={red} roughness={0.6} />
      </mesh>
      {/* "POPCORN" sign — gold stripe */}
      <mesh position={[0, 1.18, 0.255]}>
        <planeGeometry args={[0.7, 0.08]} />
        <meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      {/* Warm top light */}
      <pointLight position={[0, 0.9, 0]} color="#ffcc80" intensity={0.7} distance={2.5} decay={2} />
    </group>
  );
}

function AnimeShelf({ wallX, y = 1.3 }) {
  const shelfLen = 2.2;
  const colors = ["#f5c518", "#30d158", "#ff2d55", "#0a84ff", "#bf5af2"];
  return (
    <group position={[wallX, y, -2.5]} rotation={[0, -Math.sign(wallX) * Math.PI / 2, 0]}>
      {/* Plank */}
      <mesh position={[0, 0, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[shelfLen, 0.04, 0.22]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.9} />
      </mesh>
      {/* Figures */}
      {colors.map((c, i) => {
        const x = (i / (colors.length - 1) - 0.5) * (shelfLen - 0.4);
        return (
          <group key={i} position={[x, 0.08, 0.08]}>
            {/* Legs */}
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.1, 0.14, 0.08]} />
              <meshStandardMaterial color="#1a1515" />
            </mesh>
            {/* Body */}
            <mesh position={[0, 0.24, 0]} castShadow>
              <boxGeometry args={[0.12, 0.16, 0.09]} />
              <meshStandardMaterial color={c} roughness={0.6} metalness={0.2} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.38, 0]} castShadow>
              <boxGeometry args={[0.1, 0.1, 0.09]} />
              <meshStandardMaterial color="#f3d2a0" roughness={0.95} />
            </mesh>
            {/* Hair spike */}
            <mesh position={[0, 0.46, 0]} rotation={[0, 0, i * 0.3]}>
              <coneGeometry args={[0.07, 0.08, 4]} />
              <meshStandardMaterial color={c} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Window({ x = -2.5, y = 1.7 }) {
  // Faux back-wall window glowing like a nighttime city view
  return (
    <group position={[x, y, -ROOM.size / 2 + 0.02]}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 1.2, 0.08]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.6} />
      </mesh>
      {/* Glowing scene */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[1.45, 1.05]} />
        <meshStandardMaterial
          color="#1a2a4a"
          emissive="#2a4080"
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* City-light dots to sell the view */}
      {Array.from({ length: 18 }).map((_, i) => {
        const px = ((i * 97) % 100 - 50) / 100 * 1.3;
        const py = (((i * 53) % 100) - 50) / 100 * 0.85;
        const warm = i % 3 === 0;
        return (
          <mesh key={i} position={[px, py, 0.05]}>
            <boxGeometry args={[0.015, 0.015, 0.001]} />
            <meshStandardMaterial
              color={warm ? "#ffcf90" : "#80b0ff"}
              emissive={warm ? "#ffcf90" : "#80b0ff"}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        );
      })}
      {/* Window cross-mullion */}
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[1.45, 0.02, 0.001]} />
        <meshStandardMaterial color="#0a0a0e" />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[0.02, 1.05, 0.001]} />
        <meshStandardMaterial color="#0a0a0e" />
      </mesh>
      {/* Soft bluish spill into room */}
      <pointLight position={[0, 0, 0.8]} color="#4080ff" intensity={0.5} distance={3} decay={2} />
    </group>
  );
}

// ─── Phase 2 furniture ────────────────────────────────────────
// All pieces use local y=0 = floor so the whole group just drops to ROOM.floorY.

function PoolTable({ position, rotation = [0, 0, 0] }) {
  const legY = 0.375;
  const topY = 0.78;
  const feltY = 0.84;
  return (
    <group position={position} rotation={rotation}>
      {/* Four legs */}
      {[[-1.1, 0.5], [1.1, 0.5], [-1.1, -0.5], [1.1, -0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, legY, z]} castShadow>
          <boxGeometry args={[0.18, 0.75, 0.18]} />
          <meshStandardMaterial color="#2b1a10" roughness={0.85} />
        </mesh>
      ))}
      {/* Wooden rail */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.18, 1.4]} />
        <meshStandardMaterial color="#3b2410" roughness={0.7} />
      </mesh>
      {/* Green felt */}
      <mesh position={[0, feltY, 0]} receiveShadow>
        <boxGeometry args={[2.4, 0.04, 1.2]} />
        <meshStandardMaterial color="#0b5a24" roughness={0.95} />
      </mesh>
      {/* Six pockets */}
      {[[-1.15, 0.55], [1.15, 0.55], [-1.15, -0.55], [1.15, -0.55], [0, 0.6], [0, -0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, feltY + 0.015, z]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
      {/* Rack of 3 balls */}
      {[
        [-0.1, 0.1, "#ff3030"],
        [0.1, 0.1, "#ffcf00"],
        [0, -0.08, "#ffffff"],
      ].map(([x, z, col], i) => (
        <mesh key={i} position={[x, feltY + 0.06, z]} castShadow>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial color={col} roughness={0.35} metalness={0.1} />
        </mesh>
      ))}
      {/* Cue */}
      <mesh position={[0.4, feltY + 0.03, 0.4]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.01, 1.6, 10]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.6} />
      </mesh>
      {/* Hanging lamp above table */}
      <mesh position={[0, 2.1, 0]}>
        <coneGeometry args={[0.35, 0.3, 20, 1, true]} />
        <meshStandardMaterial color="#0e0a06" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffe8b0" emissive="#ffe8b0" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.9, 0]} color="#ffd890" intensity={1.3} distance={4} decay={2} />
    </group>
  );
}

function Sofa({ position, rotation = [0, 0, 0] }) {
  const uphol = "#2a1f1a";
  const cushion = "#3a2b22";
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.3, 0.95]} />
        <meshStandardMaterial color={uphol} roughness={0.9} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.75, -0.37]} castShadow>
        <boxGeometry args={[2.4, 0.55, 0.2]} />
        <meshStandardMaterial color={uphol} roughness={0.9} />
      </mesh>
      {/* Arms */}
      {[-1.15, 1.15].map((x, i) => (
        <mesh key={i} position={[x, 0.55, 0]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.95]} />
          <meshStandardMaterial color="#241915" roughness={0.9} />
        </mesh>
      ))}
      {/* Seat cushions */}
      {[-0.73, 0, 0.73].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0.08]} castShadow>
          <boxGeometry args={[0.7, 0.16, 0.78]} />
          <meshStandardMaterial color={cushion} roughness={0.95} />
        </mesh>
      ))}
      {/* Back cushions */}
      {[-0.73, 0, 0.73].map((x, i) => (
        <mesh key={i} position={[x, 0.82, -0.22]} castShadow>
          <boxGeometry args={[0.7, 0.42, 0.14]} />
          <meshStandardMaterial color={cushion} roughness={0.95} />
        </mesh>
      ))}
      {/* A throw pillow for warmth */}
      <mesh position={[-0.73, 0.65, 0.1]} rotation={[0.3, 0.2, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#8b2e2e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function HotWheelsShelf({ wallX, y = 1.3 }) {
  const shelfLen = 3.4;
  const colors = ["#ff3b30", "#ffcc00", "#30d158", "#0a84ff", "#ff9f0a", "#bf5af2", "#ff2d55"];
  const rows = 3;
  const perRow = 7;
  return (
    <group position={[wallX, y, 0]} rotation={[0, -Math.sign(wallX) * Math.PI / 2, 0]}>
      {Array.from({ length: rows }).map((_, r) => {
        const rowY = r * 0.42;
        return (
          <group key={r} position={[0, rowY, 0]}>
            {/* Shelf plank */}
            <mesh position={[0, 0, 0.08]} castShadow receiveShadow>
              <boxGeometry args={[shelfLen, 0.04, 0.2]} />
              <meshStandardMaterial color="#1a1a1e" roughness={0.9} />
            </mesh>
            {/* Shelf brackets */}
            {[-shelfLen / 2 + 0.3, 0, shelfLen / 2 - 0.3].map((bx, bi) => (
              <mesh key={bi} position={[bx, -0.06, 0.08]}>
                <boxGeometry args={[0.04, 0.12, 0.16]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            ))}
            {/* Cars */}
            {Array.from({ length: perRow }).map((_, i) => {
              const x = (i / (perRow - 1) - 0.5) * (shelfLen - 0.5);
              const col = colors[(r * perRow + i) % colors.length];
              return (
                <group key={i} position={[x, 0.08, 0.06]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.3, 0.09, 0.14]} />
                    <meshStandardMaterial color={col} roughness={0.4} metalness={0.35} />
                  </mesh>
                  <mesh position={[0, 0.07, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.07, 0.14]} />
                    <meshStandardMaterial color={col} roughness={0.4} metalness={0.35} />
                  </mesh>
                  {/* Wheels */}
                  <mesh position={[-0.1, -0.03, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  <mesh position={[0.1, -0.03, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  <mesh position={[-0.1, -0.03, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  <mesh position={[0.1, -0.03, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// 5-panel multi-piece wall art (step layout). Loads a single image and
// slices it horizontally across 5 vertical frames with step heights
// (short-tall-tallest-tall-short), matching the classic multi-panel
// canvas format.
function MultiPanelWallArt({ x = 0, y = 1.6, texturePath = "/img/zoro-wallart.jpg" }) {
  const base = useTexture(`${import.meta.env.BASE_URL}${texturePath.replace(/^\//, "")}`);

  const panelCount = 5;
  const panelWidth = 0.42;
  const gap = 0.05;
  const stepHeights = [0.75, 1.1, 1.4, 1.1, 0.75]; // short → tall → short

  // One cloned texture per panel, each showing a 1/5 vertical strip
  const slices = useMemo(() => {
    const arr = [];
    for (let i = 0; i < panelCount; i++) {
      const t = base.clone();
      t.needsUpdate = true;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.repeat.set(1 / panelCount, 1);
      t.offset.set(i / panelCount, 0);
      t.colorSpace = THREE.SRGBColorSpace;
      arr.push(t);
    }
    return arr;
  }, [base]);

  return (
    <group position={[x, y, -ROOM.size / 2 + 0.03]}>
      {stepHeights.map((h, i) => {
        const panelX = (i - (panelCount - 1) / 2) * (panelWidth + gap);
        return (
          <group key={i} position={[panelX, 0, 0]}>
            {/* Thin dark frame */}
            <mesh castShadow>
              <boxGeometry args={[panelWidth, h, 0.03]} />
              <meshStandardMaterial color="#0a0a0e" roughness={0.6} />
            </mesh>
            {/* Image slice */}
            <mesh position={[0, 0, 0.019]}>
              <planeGeometry args={[panelWidth * 0.96, h * 0.96]} />
              <meshStandardMaterial
                map={slices[i]}
                emissive="#ffffff"
                emissiveMap={slices[i]}
                emissiveIntensity={0.15}
                roughness={0.9}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
      {/* Picture spotlight */}
      <pointLight position={[0, 1.3, 0.8]} color="#ffcf90" intensity={0.7} distance={4.5} decay={2} />
    </group>
  );
}

/**
 * RoomShell — floor, three walls, baseboard trim, warm corner lamps,
 * cool back-wall accent. Phase 1 of the arcade-room build. Furniture
 * from Phase 2 (sofa, pool table, Hot Wheels shelf, One Piece poster)
 * mounts inside this group.
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

      {/* ─── Phase 2 furniture ─── */}
      <PoolTable position={[-3.2, floorY, 1.4]} rotation={[0, 0.25, 0]} />
      <Sofa position={[3.0, floorY, 1.3]} rotation={[0, -Math.PI / 3, 0]} />
      <HotWheelsShelf wallX={half - 0.02} y={1.4} />
      {/* 5-panel wall art — centred on back wall above the arcade */}
      <Suspense fallback={null}>
        <MultiPanelWallArt x={0} y={2.3} />
      </Suspense>

      {/* ─── Phase 3 furniture ─── */}
      {/* 3 corner floor speakers (per sketch) */}
      <Speaker position={[-half + 0.5, floorY, half - 0.5]} rotation={[0, Math.PI / 5, 0]} />
      <Speaker position={[half - 0.5, floorY, half - 0.5]} rotation={[0, -Math.PI / 5, 0]} />
      <Speaker position={[-half + 0.5, floorY, -half + 0.5]} rotation={[0, 2 * Math.PI / 3, 0]} />

      {/* Cat house + cat, tucked right of the sofa */}
      <CatHouse position={[4.1, floorY, -1.4]} rotation={[0, -Math.PI / 3, 0]} />
      <Cat position={[3.6, floorY, -0.8]} rotation={[0, -Math.PI / 2.5, 0]} />

      {/* Popcorn machine — left wall between pool table and corner */}
      <PopcornMachine position={[-half + 0.8, floorY, -1.0]} rotation={[0, Math.PI / 2.5, 0]} />

      {/* Anime figure shelf — right wall, further back than Hot Wheels */}
      <AnimeShelf wallX={half - 0.02} y={2.2} />

      {/* Window — back wall, left of arcade (balances One Piece on the right) */}
      <Window x={-2.5} y={1.7} />
    </group>
  );
}

function CameraRig({ mode, reduceMotion }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3().copy(IDLE_LOOK));
  const playTarget = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const aspect = size.width / Math.max(1, size.height);
    // Play-mode framing tuned for the realistic 0.45× cabinet — the screen
    // face sits around (0, -0.18, -0.07), so camera y hovers near that line.
    let z, y;
    if (aspect >= 1.4) { z = 1.55; y = 0.0; }
    else if (aspect >= 1.0) { z = 1.75; y = 0.0; }
    else if (aspect >= 0.7) { z = 2.15; y = 0.05; }
    else { z = 2.75; y = 0.1; }
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

      {mode === "idle" && <HoverLabel />}

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

/**
 * Replaces the cursor with a "Click to play" badge while the user is
 * hovering the arcade cabinet in idle mode. Listens for the
 * 'console-hover' CustomEvent dispatched by the Console component.
 */
function HoverLabel() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onHover = (e) => setVisible(!!e.detail);
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("console-hover", onHover);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("console-hover", onHover);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  if (!visible) return null;
  return (
    <div
      className="pointer-events-none fixed z-[95]"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(18px, -10px)",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] tracking-[0.15em] uppercase text-white"
        style={{
          background: "#0071e3",
          boxShadow: "0 4px 18px rgba(0,113,227,0.5)",
        }}
      >
        <span>▸</span>
        Click to play
      </div>
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
