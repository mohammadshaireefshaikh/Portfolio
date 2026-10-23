import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { createCabinetSides, getArcadeFraming, getRoomFov, getArcadeSignPosition } from "./arcadeGeometry";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, ContactShadows, RoundedBox, OrbitControls, useGLTF, Html } from "@react-three/drei";
import { X, Volume2, VolumeX, Play, Trophy, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";

// Camera targets (play distance computed in CameraRig)
// IDLE is a far, long-lens 3/4 "isometric" view — ported from the FixMyHair
// clinic hero (ortho camera, ~31° elevation, ~40° azimuth). A 20° FOV from
// ~24m away reads as near-orthographic while still letting PLAY mode dolly in.
const IDLE_POS = new THREE.Vector3(19.5, 16.5, 21);
// Look target sits below the floor so the room rides high in the frame and
// the hero's bottom text strip only covers the plinth / front edge.
const IDLE_LOOK = new THREE.Vector3(0.2, -0.55, -0.4);
// Upright arcade cabinet: screen face sits ~1.46 m up on its front. The cabinet
// stands against the back wall at CAB_POS; PLAY_LOOK is that screen in world.
const CAB_POS = [1.3, -0.56, -2.65];
// Goliath MK3 screen centre: y ≈ 0.96 + 0.32, recessed ~0.08 behind the front.
const PLAY_LOOK = new THREE.Vector3(CAB_POS[0], CAB_POS[1] + 1.345, CAB_POS[2] + 0.19);
const IDLE_FOV = 20;
const PLAY_FOV = 48; // player POV: wider lens, standing close
// Idle orbit limits (distance / elevation / swing) so visitors can't dive
// under the plinth or swing round behind the open right/front sides.
const ORBIT = {
  minDist: 14, maxDist: 48,
  minPolar: 0.35, maxPolar: 1.32,
  azimuth: Math.atan2(IDLE_POS.x - IDLE_LOOK.x, IDLE_POS.z - IDLE_LOOK.z),
  swing: 0.75,
};

// Room geometry — big games-room diorama on a floating plinth. Back wall +
// left wall are solid rounded slabs; the RIGHT wall is a single-sided plane
// facing inward, so the iso camera (front-right) sees straight through it
// while the anime shelf mounted on it stays visible (dollhouse cut-away).
// No ceiling, open front.
const ROOM = {
  size: 10.0,       // width  (x)
  depth: 7.0,       // depth  (z)
  height: 2.9,      // wall height
  wallT: 0.17,      // wall slab thickness — wall-mounted props must sit at -depth/2 + wallT
  floorY: -0.56,
};

// Diorama palette — the clinic's soft, matte, uniformly-rough surfaces
// (roughness ≈ 0.62, metal 0) translated to the portfolio's charcoal brand.
const PAL = {
  plinth: "#24262c",
  floor:  "#34373f",
  wall:   "#3b3e47",
  dado:   "#2f4a63",   // sage-dado → muted brand blue
  cap:    "#4f5663",   // subtle on charcoal (the clinic's white cap on ivory)
  trim:   "#1b1c21",
};

// Realistic-scale pass: the cocktail arcade cabinet is tuned at ~0.45× of
// its original "demo" size so it reads as a bartop/cocktail unit (≈1.4m
// wide × ~0.9m tall) next to the sofa and pool table.
const CABINET_SCALE = 1.0; // upright cabinet is modelled at true size

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

// ENTER THE ROOM — "something big sliding": brown-noise rumble swept through a
// lowpass, a sub-bass drop, and a handful of ice crackles. ~2.6 s, no files.
function rumble() {
  const a = ctx();
  if (!a || muted) return;
  const dur = 2.6;
  const t0 = a.currentTime;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02; // brown noise
    d[i] = last * 3.5;
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 1.2;
  lp.frequency.setValueAtTime(70, t0);
  lp.frequency.exponentialRampToValueAtTime(520, t0 + 0.9);
  lp.frequency.exponentialRampToValueAtTime(45, t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.95, t0 + 0.35);
  g.gain.setValueAtTime(0.95, t0 + 1.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(lp).connect(g).connect(a.destination);
  src.start(t0);

  // Sub drop under the slide
  const sub = a.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(52, t0);
  sub.frequency.exponentialRampToValueAtTime(26, t0 + dur);
  const sg = a.createGain();
  sg.gain.setValueAtTime(0.0001, t0);
  sg.gain.exponentialRampToValueAtTime(0.6, t0 + 0.3);
  sg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  sub.connect(sg).connect(a.destination);
  sub.start(t0);
  sub.stop(t0 + dur);

  // THUD — the last slab lands: short sub hit + dull crack at the tail
  const th = t0 + dur - 0.35;
  const thud = a.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(90, th);
  thud.frequency.exponentialRampToValueAtTime(28, th + 0.45);
  const tg = a.createGain();
  tg.gain.setValueAtTime(0.0001, th);
  tg.gain.exponentialRampToValueAtTime(0.9, th + 0.015);
  tg.gain.exponentialRampToValueAtTime(0.0001, th + 0.55);
  thud.connect(tg).connect(a.destination);
  thud.start(th);
  thud.stop(th + 0.6);
  setTimeout(() => { noise(0.18, 0.5, 900, 120); quake.amp = Math.max(quake.amp, 0.3); }, (dur - 0.35) * 1000);

  // Ice crackles while the slabs let go
  for (let i = 0; i < 7; i++) {
    const at = 250 + Math.random() * 1500;
    setTimeout(() => noise(0.06 + Math.random() * 0.05, 0.14, 2600, 500), at);
  }
}

// Anticipation: rising charge whine + ticking blink, ~0.45 s
function charge() {
  const a = ctx();
  if (!a || muted) return;
  const t0 = a.currentTime;
  const o = a.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(70, t0);
  o.frequency.exponentialRampToValueAtTime(900, t0 + 0.45);
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(400, t0);
  lp.frequency.exponentialRampToValueAtTime(3000, t0 + 0.45);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
  o.connect(lp).connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + 0.5);
  [0, 150, 270, 360, 420].forEach((ms) =>
    setTimeout(() => tone({ freq: 1800, type: "square", dur: 0.02, gain: 0.05 }), ms));
}
// Impact: crack + boom, then the long rumble underneath
function impact() {
  noise(0.12, 0.5, 6000, 800);
  tone({ freq: 95, type: "sine", dur: 0.6, gain: 0.5, slide: -60 });
  tone({ freq: 48, type: "triangle", dur: 0.9, gain: 0.3, slide: -18 });
  rumble();
}

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
// Room quake on ENTER (moves the world, not the camera — OrbitControls owns
// the camera in idle and would fight a camera offset).
// amp = impact shake (decays); tremble = anticipation shiver (held until cleared)
const quake = { amp: 0, tremble: 0 };

function Quake({ children }) {
  const ref = useRef(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const a = quake.amp + quake.tremble;
    if (a > 0.0005) {
      const n = performance.now() * (quake.tremble > 0 && quake.amp < 0.01 ? 0.09 : 0.05);
      ref.current.position.set(
        Math.sin(n) * a,
        Math.cos(n * 1.37) * a * 0.5,
        Math.sin(n * 0.83) * a * 0.7
      );
      quake.amp *= Math.exp(-1.6 * dt);
    } else if (ref.current.position.lengthSq() > 0) {
      ref.current.position.set(0, 0, 0);
    }
  });
  return <group ref={ref}>{children}</group>;
}

// Scorch: a burn mark on the plinth that fades in on impact and stays.
function Scorch({ at }) {
  const ref = useRef(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    // charred core → pale ash halo → nothing (black alone vanishes on charcoal)
    grd.addColorStop(0, "rgba(0,0,0,0.95)");
    grd.addColorStop(0.35, "rgba(10,8,8,0.7)");
    grd.addColorStop(0.6, "rgba(150,140,130,0.28)");
    grd.addColorStop(1, "rgba(150,140,130,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    // ragged edge
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * 6.28, r = 70 + Math.random() * 50;
      g.beginPath(); g.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 8 + Math.random() * 14, 0, 6.28);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fill();
    }
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(() => {
    if (!ref.current) return;
    const t = (performance.now() - at) / 1000;
    ref.current.material.opacity = t < 0 ? 0 : THREE.MathUtils.lerp(0, 0.6, Math.min(1, t / 0.35));
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0.4]} position={[0.3, ROOM.floorY + 0.018, 0.2]} renderOrder={2}>
      <planeGeometry args={[7, 7]} />
      <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

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
    // Portrait 0.8 — drawn on our own plane fitted to the Goliath's bezel
    // window (0.6 × 0.75 m). Classic Flappy is portrait anyway.
    canvas.width = 320;
    canvas.height = 400;
    const t = new THREE.CanvasTexture(canvas);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const stateRef = useRef({
    canvas: texture.image,
    bird: { x: 70, y: 146, vy: 0, r: 10 },
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
    s.bird.y = s.canvas.height / 2;
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
      g2d.fillStyle = frozen ? "#777780" : "#f0ca75";
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

// Lit "FLAPPY" header strip on top of the cabinet — text baked into a tiny
// canvas texture (no font loader, no extra bundle).
function Marquee({ glow, accent }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 104;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, "#310a0c");
    grad.addColorStop(1, "#10090a");
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    // Subtle scanline band
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.fillRect(0, 0, c.width, 14);
    g.strokeStyle = accent;
    g.lineWidth = 7;
    g.strokeRect(4, 4, c.width - 8, c.height - 8);
    g.fillStyle = "#f4cf78";
    g.font = "900 64px 'Space Grotesk', system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.letterSpacing = "10px";
    g.fillText("FLAPPY", c.width / 2 + 5, c.height / 2 + 2);
    // Pixel bat glyph each side
    g.fillStyle = "#d6a64c";
    const drawMiniBat = (cx, cy, cell) => {
      const rows = BAT_FRAMES[0];
      const ox = cx - (rows[0].length * cell) / 2;
      const oy = cy - (rows.length * cell) / 2;
      rows.forEach((row, yy) => [...row].forEach((ch, xx) => {
        if (ch === "X") g.fillRect(ox + xx * cell, oy + yy * cell, cell, cell);
      }));
    };
    drawMiniBat(70, c.height / 2, 4);
    drawMiniBat(c.width - 70, c.height / 2, 4);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [accent]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, 1.91, 0.315]}>
      <planeGeometry args={[0.72, 0.16]} />
      <meshStandardMaterial
        map={tex}
        emissive="#ffffff"
        emissiveMap={tex}
        emissiveIntensity={glow ? 1.1 : 0.75}
        roughness={0.35}
        toneMapped={false}
      />
    </mesh>
  );
}

function ScreenFace({ mode, flapRef, onScore, onDeath }) {
  const tex = useFlappyTexture(mode, flapRef, onScore, onDeath);
  return (
    <mesh position={[0, 0, 0.025]}>
      <planeGeometry args={[0.62, 0.465]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
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

function Console({ reduceMotion, mode, setMode, flapRef, onScore, onDeath, showSign = true }) {
  const group = useRef(null);
  const screenGlow = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  function startGame(e) {
    e.stopPropagation();
    if (mode !== "idle") return;
    setHasPlayed(true);
    ctx();
    setMode("playing");
  }

  useFrame(() => {
    if (!group.current) return;
    if (mode === "idle" && !reduceMotion) {
      // A floor-standing cabinet stays planted.
      group.current.rotation.y = 0;
      group.current.rotation.x = 0;
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

  const glow = hovered && mode === "idle";

  // Electrocoin Goliath MK3 by Delinx (Sketchfab, CC-BY-4.0). Local origin =
  // floor, centre; faces +z after the +90° yaw (source faces -x).
  // Footprint 0.72 w × 1.96 h × 0.89 d.
  return (
    <group
      ref={group}
      position={CAB_POS}
      scale={CABINET_SCALE}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={startGame}
    >
      {mode === "idle" && !hasPlayed && showSign && (
        <Html position={[0, 2.28, 0]} center calculatePosition={getArcadeSignPosition} zIndexRange={[20, 0]}>
          {/* pointerup + touch-action:manipulation: phones sometimes never
              deliver `click` here (scroll-intent heuristics, 300 ms delay);
              startGame is idempotent so both firing is harmless. */}
          <button
            type="button"
            className="arcade-play-sign"
            style={{ touchAction: "manipulation" }}
            onPointerUp={startGame}
            onClick={startGame}
            aria-label="Play Flappy on the arcade cabinet"
          >
            <span className="arcade-play-sign__led" aria-hidden="true" />
            <span>CLICK TO PLAY GAME</span>
            <span className="arcade-play-sign__reminder" aria-hidden="true">✦ CLICK ME ✦</span>
          </button>
        </Html>
      )}
      <Suspense fallback={null}>
        <GoliathCabinet mode={mode} flapRef={flapRef} onScore={onScore} onDeath={onDeath} />
      </Suspense>
      <pointLight position={[0, 1.86, 0.44]} color="#ffd18b" intensity={glow ? 0.4 : 0.2} distance={1.2} />
      <pointLight ref={screenGlow} position={[0, 1.3, 0.55]} color="#6b9bff" intensity={hovered ? 0.45 : 0.2} distance={2} />
    </group>
  );
}

// Loads the Goliath GLB (Draco + WebP, 600 KB) and pipes the live Flappy
// CanvasTexture into its "screen" material. Decoder self-hosted in /draco.
const GOLIATH_URL = `${import.meta.env.BASE_URL}models/goliath.glb`;
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;
function GoliathCabinet({ mode, flapRef, onScore, onDeath }) {
  const { scene } = useGLTF(GOLIATH_URL, DRACO_PATH);
  const tex = useFlappyTexture(mode, flapRef, onScore, onDeath);

  // Clone once so material edits don't leak into drei's cache
  const cab = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material?.name === "screen") {
        // The model's CRT goes black; the live game is a separate plane
        // mounted in the bezel window (see GoliathScreen).
        o.material = new THREE.MeshBasicMaterial({ color: "#05060a" });
      } else if (o.material?.name === "ScreenDecal") {
        // Glass overlay used KHR transmission (refraction → a second, shifted
        // copy of the game). Keep the bezel art, drop the refraction.
        const m = o.material.clone();
        m.transmission = 0;
        m.transparent = true;
        m.opacity = 1;
        m.alphaTest = 0.02;
        m.depthWrite = false;
        m.needsUpdate = true;
        o.material = m;
        o.renderOrder = 3;
      }
    });
    return s;
  }, [scene, tex]);

  return (
    <>
      <primitive object={cab} position={[0, 0.96, 0]} rotation={[0, Math.PI / 2, 0]} />
      {/* Live game, unlit, sitting just in front of the bezel glass. Window in
          model space: y -0.04..0.81, 0.68 wide, glass at x -0.176 (→ +z here). */}
      <mesh position={[0, 0.96 + 0.385, 0.19]}>
        <planeGeometry args={[0.54, 0.68]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.35, 0.45]} color="#7fb0ff" intensity={0.35} distance={1.4} />
    </>
  );
}
useGLTF.preload(GOLIATH_URL, DRACO_PATH);

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

function AnimeShelf({ wallX, y = 1.3, z = 0, shelfLen = 4.2 }) {
  const colors = ["#f5c518", "#30d158", "#ff2d55", "#0a84ff", "#bf5af2", "#ff9f0a", "#ffffff", "#5ac8fa"];
  return (
    <group position={[wallX, y, z]} rotation={[0, -Math.sign(wallX) * Math.PI / 2, 0]}>
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
    <group position={[x, y, -ROOM.depth / 2 + ROOM.wallT + 0.04]}>
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

function HotWheelsShelf({ wallX, y = 1.3, shelfLen = 5.4, rows = 3, perRow = 11 }) {
  const colors = ["#ff3b30", "#ffcc00", "#30d158", "#0a84ff", "#ff9f0a", "#bf5af2", "#ff2d55"];
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

// 5-panel multi-piece wall art (step layout). Loads a single image,
// rotates it 90° onto an off-screen canvas so a portrait source reads
// as landscape across the panels, then slices that landscape image
// into 5 vertical strips (classic multi-piece canvas format).
function MultiPanelWallArt({ x = 0, y = 1.6, texturePath = "/img/zoro-wallart.jpg" }) {
  const [rotated, setRotated] = useState(null);

  // Draw the source image rotated −90° into a canvas, then wrap it as a
  // Three.js CanvasTexture. This way the source can stay portrait on
  // disk but display as landscape across the panels.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;   // swap dims → landscape
      canvas.height = img.width;
      const g = canvas.getContext("2d");
      g.translate(canvas.width / 2, canvas.height / 2);
      g.rotate(-Math.PI / 2);
      g.drawImage(img, -img.width / 2, -img.height / 2);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      setRotated(t);
    };
    img.src = `${import.meta.env.BASE_URL}${texturePath.replace(/^\//, "")}`;
  }, [texturePath]);

  const panelCount = 5;
  const panelWidth = 0.42;
  const gap = 0.05;
  const stepHeights = [0.75, 1.1, 1.4, 1.1, 0.75]; // short → tall → short

  // One cloned slice per panel from the rotated (landscape) canvas
  const slices = useMemo(() => {
    if (!rotated) return [];
    const arr = [];
    for (let i = 0; i < panelCount; i++) {
      const t = rotated.clone();
      t.image = rotated.image;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.repeat.set(1 / panelCount, 1);
      t.offset.set(i / panelCount, 0);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      arr.push(t);
    }
    return arr;
  }, [rotated]);

  return (
    <group position={[x, y, -ROOM.depth / 2 + ROOM.wallT + 0.04]}>
      {stepHeights.map((h, i) => {
        const panelX = (i - (panelCount - 1) / 2) * (panelWidth + gap);
        return (
          <group key={i} position={[panelX, 0, 0]}>
            {/* Thin dark frame */}
            <mesh castShadow>
              <boxGeometry args={[panelWidth, h, 0.03]} />
              <meshStandardMaterial color="#0a0a0e" roughness={0.6} />
            </mesh>
            {/* Image slice — only mounts once the canvas is ready */}
            {slices[i] && (
              <mesh position={[0, 0, 0.019]}>
                <planeGeometry args={[panelWidth * 0.96, h * 0.96]} />
                <meshStandardMaterial
                  map={slices[i]}
                  emissive="#ffffff"
                  emissiveMap={slices[i]}
                  emissiveIntensity={0.18}
                  roughness={0.9}
                  toneMapped={false}
                />
              </mesh>
            )}
          </group>
        );
      })}
      {/* Picture spotlight */}
      <pointLight position={[0, 1.3, 0.8]} color="#ffcf90" intensity={0.75} distance={4.5} decay={2} />
    </group>
  );
}

// ─── Media wall: flat LED TV + black-glass table + PS5 + cable ─────
function TVWall({ x, wallZ, floorY }) {
  const tvW = 1.7, tvH = 0.96, tvY = floorY + 1.55;
  const tableY = floorY + 0.5;
  return (
    <group>
      {/* TV — thin bezel + dark glossy screen */}
      <group position={[x, tvY, wallZ + 0.06]}>
        <RoundedBox args={[tvW, tvH, 0.05]} radius={0.012} smoothness={3} castShadow>
          <meshStandardMaterial color="#0d0e11" roughness={0.35} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.027]}>
          <planeGeometry args={[tvW - 0.05, tvH - 0.05]} />
          <meshStandardMaterial color="#0a1628" roughness={0.12} metalness={0.2} emissive="#0e2a55" emissiveIntensity={0.35} />
        </mesh>
        {/* Standby LED */}
        <mesh position={[0, -tvH / 2 + 0.02, 0.03]}>
          <boxGeometry args={[0.03, 0.006, 0.004]} />
          <meshStandardMaterial color="#ff2e2e" emissive="#ff2e2e" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      {/* Black glass table — top slab + two black legs */}
      <group position={[x, tableY, wallZ + 0.32]}>
        <RoundedBox args={[1.5, 0.035, 0.46]} radius={0.01} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#0b0b0d" roughness={0.08} metalness={0.1} transmission={0.25} thickness={0.2} transparent opacity={0.92} />
        </RoundedBox>
        {[-0.62, 0.62].map((lx) => (
          <mesh key={lx} position={[lx, -(tableY - floorY) / 2 + 0.0175, 0]} castShadow>
            <boxGeometry args={[0.05, tableY - floorY - 0.035, 0.4]} />
            <meshStandardMaterial color="#111216" roughness={0.5} metalness={0.2} />
          </mesh>
        ))}
        {/* Lower glass shelf */}
        <mesh position={[0, -(tableY - floorY) * 0.5, 0]} receiveShadow>
          <boxGeometry args={[1.4, 0.025, 0.4]} />
          <meshPhysicalMaterial color="#0b0b0d" roughness={0.08} metalness={0.1} transmission={0.25} thickness={0.2} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* PS5 — white tall body with black core + blue light strip, on the table */}
      <group position={[x + 0.42, tableY + 0.0175, wallZ + 0.3]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.09, 0.4, 0.26]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.45} />
        </mesh>
        {/* Two white "fins" */}
        <RoundedBox args={[0.028, 0.42, 0.28]} radius={0.01} smoothness={3} position={[-0.055, 0.21, 0]} castShadow>
          <meshStandardMaterial color="#f2f3f5" roughness={0.45} />
        </RoundedBox>
        <RoundedBox args={[0.028, 0.42, 0.28]} radius={0.01} smoothness={3} position={[0.055, 0.21, 0]} castShadow>
          <meshStandardMaterial color="#f2f3f5" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.3, 0.131]}>
          <boxGeometry args={[0.08, 0.004, 0.003]} />
          <meshStandardMaterial color="#4da3ff" emissive="#4da3ff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* Base stand */}
        <mesh position={[0, 0.006, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.012, 20]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.5} />
        </mesh>
      </group>

      {/* HDMI cable: PS5 → up the wall → TV */}
      <mesh position={[x + 0.42, tableY + 0.12, wallZ + 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.28, 8]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>
      <mesh position={[x + 0.42, (tableY + 0.12 + tvY - tvH / 2) / 2, wallZ + 0.03]}>
        <cylinderGeometry args={[0.006, 0.006, (tvY - tvH / 2) - (tableY + 0.12), 8]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Automatic cat feeder: white body + hopper + bowl with kibble ──
function CatFeeder({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.3, 0.42, 0.3]} radius={0.03} smoothness={3} position={[0, 0.21, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f1f2f4" roughness={0.62} />
      </RoundedBox>
      {/* Hopper lid */}
      <RoundedBox args={[0.26, 0.1, 0.26]} radius={0.02} smoothness={3} position={[0, 0.47, 0]} castShadow>
        <meshStandardMaterial color="#d7dae0" roughness={0.62} />
      </RoundedBox>
      {/* Chute */}
      <mesh position={[0, 0.1, 0.16]} rotation={[0.6, 0, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.1]} />
        <meshStandardMaterial color="#d7dae0" roughness={0.62} />
      </mesh>
      {/* Bowl */}
      <mesh position={[0, 0.03, 0.3]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.1, 0.06, 24]} />
        <meshStandardMaterial color="#9fb3c8" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Kibble */}
      {[[-0.03, 0.02], [0.03, -0.01], [0, 0.04], [0.05, 0.03], [-0.05, -0.03]].map(([kx, kz], i) => (
        <mesh key={i} position={[kx, 0.065, 0.3 + kz]}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color="#8a5a2b" roughness={0.9} />
        </mesh>
      ))}
      {/* Status LED */}
      <mesh position={[0.09, 0.36, 0.152]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#30d158" emissive="#30d158" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Sleeping cat (curled), sized to sit inside CatHouse ──────────
function SleepingCat({ position, rotation = [0, 0, 0], color = "#2a2a2c" }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Curled body */}
      <mesh position={[0, 0.09, 0]} scale={[1.25, 0.65, 1]} castShadow>
        <sphereGeometry args={[0.15, 20, 16]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Head tucked on top */}
      <mesh position={[0.1, 0.16, 0.05]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.07, 0.23, 0.02]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.025, 0.05, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.13, 0.23, 0.06]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.025, 0.05, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Tail wrapped round the front */}
      <mesh position={[-0.02, 0.05, 0.14]} rotation={[0, 0.2, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.025, 0.3, 10]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  );
}

/**
 * RoomShell — open-sided diorama ported from the FixMyHair clinic hero:
 * a floating rounded plinth, a floor slab, a back wall + left return wall
 * (both real boxes with rounded edges so the soft light catches them),
 * a dado band + cap along the back wall, no ceiling, no front/right walls.
 * Lighting lives at Canvas root (3 big soft directionals + hemisphere).
 */
function RoomShell() {
  const { size: W, depth: D, height: H, floorY } = ROOM;
  const hw = W / 2;
  const hd = D / 2;
  const wallT = 0.17;        // clinic wall thickness
  const dadoH = 0.83;        // clinic dado height
  const R = 0.04;            // rounded-edge radius (bevel look)
  const backZ = -hd + wallT; // inner face of the back wall

  return (
    <group>
      {/* Floating plinth — rounded, slightly larger than the floor */}
      <RoundedBox args={[W + 0.5, 0.3, D + 0.5]} radius={0.09} smoothness={4}
        position={[0, floorY - 0.05 - 0.15, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={PAL.plinth} roughness={0.62} />
      </RoundedBox>

      {/* Floor slab */}
      <RoundedBox args={[W, 0.1, D]} radius={0.02} smoothness={3}
        position={[0, floorY - 0.05, 0]} receiveShadow>
        <meshStandardMaterial color={PAL.floor} roughness={0.62} />
      </RoundedBox>
      {/* Area rug under the sofa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.9, floorY + 0.004, 0.5]} receiveShadow>
        <planeGeometry args={[3.6, 2.4]} />
        <meshStandardMaterial color="#2b2630" roughness={0.98} />
      </mesh>

      {/* Back wall — solid rounded slab */}
      <RoundedBox args={[W, H, wallT]} radius={R} smoothness={3}
        position={[0, floorY + H / 2, -hd + wallT / 2]} receiveShadow castShadow>
        <meshStandardMaterial color={PAL.wall} roughness={0.62} />
      </RoundedBox>

      {/* Left wall — solid rounded slab, full depth */}
      <RoundedBox args={[wallT, H, D]} radius={R} smoothness={3}
        position={[-hw + wallT / 2, floorY + H / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={PAL.wall} roughness={0.62} />
      </RoundedBox>

      {/* Right wall — single-sided plane facing INTO the room. The iso camera
          sits outside it on +x, sees its back face (culled) and looks straight
          through; the shelf mounted on it stays visible. Dollhouse cut-away. */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[hw - 0.01, floorY + H / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color={PAL.wall} roughness={0.62} side={THREE.FrontSide} />
      </mesh>

      {/* Dado band + cap along the back wall */}
      <mesh position={[0, floorY + dadoH / 2, backZ + 0.025]} receiveShadow>
        <boxGeometry args={[W - 0.34, dadoH, 0.05]} />
        <meshStandardMaterial color={PAL.dado} roughness={0.62} />
      </mesh>
      <mesh position={[0, floorY + dadoH + 0.025, backZ + 0.035]} castShadow>
        <boxGeometry args={[W - 0.34, 0.05, 0.07]} />
        <meshStandardMaterial color={PAL.cap} roughness={0.62} />
      </mesh>

      {/* Baseboards (back + left) */}
      <mesh position={[0, floorY + 0.06, backZ + 0.015]}>
        <boxGeometry args={[W - 0.34, 0.12, 0.03]} />
        <meshStandardMaterial color={PAL.trim} roughness={0.62} />
      </mesh>
      <mesh position={[-hw + wallT + 0.015, floorY + 0.06, 0]}>
        <boxGeometry args={[0.03, 0.12, D - 0.34]} />
        <meshStandardMaterial color={PAL.trim} roughness={0.62} />
      </mesh>

      {/* Pair of wall lamps on the back wall (outboard of the art/TV) */}
      {[-4.45, 4.6].map((lx) => (
        <group key={lx} position={[lx, floorY + H - 0.5, backZ]}>
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.07, 0.07, 0.22]} />
            <meshStandardMaterial color="#8a9099" roughness={0.4} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.07, 0.22]} castShadow>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color="#f2f2ee" roughness={0.62} emissive="#fff3dc" emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}

      {/* ─── BACK WALL, left → right (per sketch) ─── */}
      {/* Cat feeder in the back-left corner */}
      <CatFeeder position={[-hw + 0.75, floorY, backZ + 0.4]} rotation={[0, 0.35, 0]} />
      {/* TV + black glass table + PS5 + cable */}
      <TVWall x={-2.4} wallZ={backZ} floorY={floorY} />
      {/* Cat house with the cat asleep inside, entrance to the room */}
      <CatHouse position={[-0.55, floorY, backZ + 0.45]} rotation={[0, 0.15, 0]} />
      <SleepingCat position={[-0.55, floorY + 0.02, backZ + 0.45]} rotation={[0, 0.9, 0]} />
      {/* Arcade cabinet is mounted at Canvas root at CAB_POS (needs pointer events) */}
      {/* Big One Piece 5-panel wall art — right of the arcade */}
      <Suspense fallback={null}>
        <MultiPanelWallArt x={3.3} y={floorY + 1.62} />
      </Suspense>

      {/* ─── LEFT WALL: Hot Wheels collection shelf ─── */}
      <HotWheelsShelf wallX={-hw + wallT + 0.02} y={1.05} />

      {/* ─── RIGHT WALL: anime action-figure shelf (wall itself is see-through) ─── */}
      <AnimeShelf wallX={hw - 0.04} y={1.3} z={-0.4} />

      {/* ─── FLOOR ─── */}
      {/* Sofa in the middle, facing the TV (-z) */}
      <Sofa position={[-1.0, floorY, 0.55]} rotation={[0, Math.PI, 0]} />
      {/* Pool table behind the sofa, toward the open front */}
      <PoolTable position={[-0.8, floorY, 2.3]} rotation={[0, 0, 0]} />

      {/* Three speakers at the three far corners */}
      <Speaker position={[-hw + 0.55, floorY, -hd + 0.75]} rotation={[0, Math.PI / 4 + Math.PI / 2, 0]} />
      <Speaker position={[hw - 0.55, floorY, -hd + 0.75]} rotation={[0, -Math.PI / 4 - Math.PI / 2, 0]} />
      <Speaker position={[-hw + 0.55, floorY, hd - 0.55]} rotation={[0, Math.PI / 4, 0]} />
    </group>
  );
}

// Camera owner rules:
//  - play/dead: CameraRig drives a raised view aimed down at the screen/deck.
//  - idle: CameraRig animates back to IDLE_POS, then hands the camera to
//    OrbitControls so visitors can rotate / zoom the room.
function CameraRig({ mode, reduceMotion, controlsRef, onSettled }) {
  const { camera, size } = useThree();
  const idleFov = getRoomFov(size.width, size.height);
  const look = useRef(new THREE.Vector3().copy(IDLE_LOOK));
  const playTarget = useRef(new THREE.Vector3());
  const playLook = useRef(new THREE.Vector3());
  const settled = useRef(true); // idle hand-over done?
  const prevMode = useRef(mode);

  // Reframe the room when the viewport changes, including device rotation.
  useEffect(() => {
    settled.current = false;
    onSettled?.(false);
  }, [idleFov, onSettled]);

  useFrame((_, dt) => {
    const inGame = mode === "playing" || mode === "dead";
    if (prevMode.current !== mode) {
      prevMode.current = mode;
      settled.current = false;
      onSettled?.(false);
      if (inGame && controlsRef.current) {
        // Start the dolly from wherever the visitor left the orbit camera
        look.current.copy(controlsRef.current.target);
      }
    }

    // Stand above screen centre and look slightly down at the display and deck.
    const { distance: dz, offsetY } = getArcadeFraming(size.width, Math.max(1, size.height));
    playTarget.current.set(PLAY_LOOK.x, PLAY_LOOK.y + 0.54, PLAY_LOOK.z + dz);
    playLook.current.copy(PLAY_LOOK);
    if (inGame) camera.setViewOffset(size.width, size.height, 0, offsetY, size.width, size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();

    const t = reduceMotion ? 1 : 1 - Math.exp(-5 * dt);
    const targetFov = inGame ? PLAY_FOV : idleFov;

    if (inGame || !settled.current) {
      const targetPos = inGame ? playTarget.current : IDLE_POS;
      const targetLook = inGame ? playLook.current : IDLE_LOOK;
      camera.position.lerp(targetPos, t);
      look.current.lerp(targetLook, t);

      const nextFov = THREE.MathUtils.lerp(camera.fov, targetFov, t);
      if (Math.abs(nextFov - camera.fov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }

      if (shake.amp > 0.001 && !reduceMotion) {
        const n = performance.now() * 0.07;
        camera.position.x += Math.sin(n) * shake.amp;
        camera.position.y += Math.cos(n * 1.3) * shake.amp;
        shake.amp = Math.max(0, shake.amp - 6 * dt);
      }
      camera.lookAt(look.current);

      // Returned home → snap the last few mm and hand over to OrbitControls.
      if (!inGame && camera.position.distanceTo(IDLE_POS) < 0.05) {
        camera.position.copy(IDLE_POS);
        camera.fov = idleFov;
        camera.updateProjectionMatrix();
        look.current.copy(IDLE_LOOK);
        if (controlsRef.current) {
          controlsRef.current.target.copy(IDLE_LOOK);
          controlsRef.current.update();
        }
        settled.current = true;
        onSettled?.(true);
      }
    }
  });
  return null;
}

// One finger = page scroll (pan-y), two fingers = orbit/pinch. While the
// game is fullscreen the page is locked anyway, so taps can own the canvas.
function TouchPolicy({ inGame }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.domElement.style.touchAction = inGame ? "none" : "pan-y";
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
  const controlsRef = useRef(null);
  const [orbitOn, setOrbitOn] = useState(true); // false while CameraRig animates

  // ENTER THE ROOM intro: LoadingOverlay fires 'room-enter' on the click.
  // Slab wall / shockwave / debris / smoke live in IntroCurtain (full-viewport
  // overlay). Here: sounds, room quake, scorch. Timeline (ms after click):
  // 0 charge + tremble · 450 freeze · 540 impact.
  const [introAt, setIntroAt] = useState(null);   // blast timestamp (scorch)
  const [introDone, setIntroDone] = useState(false); // curtain cleared → sign
  useEffect(() => {
    const onEnter = () => {
      charge();
      if (reduceMotion) { setTimeout(impact, 540); setIntroDone(true); return; }
      quake.tremble = 0.04;
      setTimeout(() => { quake.tremble = 0; }, 450);
      setTimeout(() => {
        impact();
        quake.amp = 0.42;
        setIntroAt(performance.now());
      }, 540);
    };
    const onRevealed = () => setIntroDone(true);
    window.addEventListener("room-enter", onEnter);
    window.addEventListener("room-revealed", onRevealed);
    return () => {
      window.removeEventListener("room-enter", onEnter);
      window.removeEventListener("room-revealed", onRevealed);
    };
  }, [reduceMotion]);
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

  // Stop rendering the room once it's scrolled out of view: shadows + orbit
  // damping at 60 fps behind the page is what made the lower sections stutter.
  const wrapRef = useRef(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={containerClass}
      style={
        inGame
          ? { background: "radial-gradient(ellipse at center, #0f1420 0%, #050507 70%, #000 100%)" }
          : undefined
      }
    >
      <Canvas
        frameloop={inGame || onScreen ? "always" : "never"}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: IDLE_POS.toArray(), fov: IDLE_FOV, near: 0.1, far: 120 }}
        gl={{
          antialias: true,
          alpha: !inGame,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onPointerDown={(e) => {
          // Only flap when clicking on empty canvas during play — joystick/button events stopPropagation
          if (mode === "playing") flap();
        }}
        onCreated={({ gl }) => {
          const el = gl.domElement;
          // Plain wheel scrolls the page; ctrl/⌘+wheel (and trackpad pinch,
          // which browsers report as ctrl+wheel) zooms the room.
          el.addEventListener(
            "wheel",
            (e) => { if (!e.ctrlKey && !e.metaKey) e.stopImmediatePropagation(); },
            { capture: true, passive: true }
          );
        }}
      >
        {inGame && <color attach="background" args={["#0a0d14"]} />}

        {/* Lighting rig ported from the FixMyHair clinic hero:
            3 big soft lights (warm key / cool fill / warm top-edge) + a pale
            sky-ish hemisphere standing in for the clinic's world colour.
            No point lights, no HDRI — soft, even, matte. */}
        <hemisphereLight args={["#cfd6e0", "#24262c", 0.5]} />
        <directionalLight
          position={[-6, 9, 7]}
          intensity={2.2}
          color="#ffe4c8"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-radius={7}
          shadow-bias={-0.00015}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-camera-near={1}
          shadow-camera-far={40}
        />
        <directionalLight position={[7, 6, 2]} intensity={1.1} color="#d2e6ff" />
        <directionalLight position={[0, 9, -6]} intensity={1.5} color="#fff4e0" />

        {/* Phase 1 — room shell only. Fades out while the game is in play */}
        <Quake>
          <Suspense fallback={null}>
            {mode !== "playing" && mode !== "dead" && <RoomShell />}
          </Suspense>
        </Quake>
        {introAt != null && !inGame && !reduceMotion && (
          <Quake><Scorch at={introAt} /></Quake>
        )}

        <CameraRig
          mode={mode}
          reduceMotion={reduceMotion}
          controlsRef={controlsRef}
          onSettled={setOrbitOn}
        />
        <OrbitControls
          ref={controlsRef}
          enabled={!inGame && orbitOn}
          target={IDLE_LOOK.toArray()}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          zoomSpeed={0.6}
          minDistance={ORBIT.minDist}
          maxDistance={ORBIT.maxDist}
          minPolarAngle={ORBIT.minPolar}
          maxPolarAngle={ORBIT.maxPolar}
          minAzimuthAngle={ORBIT.azimuth - ORBIT.swing}
          maxAzimuthAngle={ORBIT.azimuth + ORBIT.swing}
          touches={{ ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
        {/* Must sit AFTER OrbitControls: its connect() forces touch-action:none,
            which eats one-finger scrolling on phones. */}
        <TouchPolicy inGame={inGame} />

        <Suspense fallback={null}>
          {/* No Float — a 1.9 m cabinet stands on the floor */}
          <Console
            reduceMotion={reduceMotion}
            mode={mode}
            setMode={setMode}
            flapRef={flapRef}
            onScore={setScore}
            onDeath={onDeath}
            showSign={introDone}
          />
          <ContactShadows
            position={[0, ROOM.floorY + 0.01, 0]}
            opacity={inGame ? 0 : 0.4}
            scale={14}
            blur={2.4}
            far={3}
          />
        </Suspense>
      </Canvas>

      {mode === "idle" && <HoverLabel />}

      {inGame && (
        <>
          {/* TOP-LEFT: Score + Name entry */}
          <div
            className="fixed top-5 left-4 sm:left-5 z-10 text-white max-w-[140px] sm:max-w-[260px]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c]">SCORE</div>
            <div className="text-4xl font-bold tabular-nums tracking-tight">{score}</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c] mt-2">
              BEST — {best}
            </div>

            <div className="fixed bottom-14 left-4 w-36 sm:static sm:mt-5 sm:w-auto">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#60605c] mb-1.5">
                PLAYER
              </div>
              <input
                type="text"
                maxLength={24}
                placeholder="your name"
                value={playerName}
                onChange={(e) => savePlayerName(e.target.value)}
                className="w-full bg-transparent border-b border-dashed border-white/[0.15] text-base sm:text-sm text-white placeholder-[#86868b] outline-none focus:border-[#2997ff] transition-colors px-0 py-1"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              />
            </div>
          </div>

          {/* TOP-RIGHT: Mute + Exit */}
          <div className="fixed top-5 right-5 z-10 flex items-center gap-2">
            <button
              onClick={() => { const n = !isMuted; setIsMuted(n); setMuted(n); }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#86868b] hover:text-white transition-colors"
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
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#86868b] hover:text-white transition-colors"
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
              className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-10 w-[calc(100%_-_2rem)] max-w-md text-center text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-[#86868b]"
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
                    <p className="text-sm text-[#2997ff] mb-2">
                      → saved on this device
                    </p>
                    <a
                      href={`mailto:shaikh.mohammad1099@gmail.com?subject=${encodeURIComponent(
                        `Flappy Hall of Fame: ${playerName.trim()} scored ${lastRun}`
                      )}&body=${encodeURIComponent(
                        `Name: ${playerName.trim()}\nScore: ${lastRun}\n\nPlease add me to the Hall of Fame.`
                      )}`}
                      className="block text-[11px] text-[#9aa3b5] underline hover:text-white mb-5"
                    >
                      email it to Mohammad for the Hall of Fame →
                    </a>
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
