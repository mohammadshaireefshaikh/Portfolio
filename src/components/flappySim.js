// Deterministic Flappy sim: 120 steps/s in 2^20 fixed point, so a seed plus the
// steps it flapped on always replays to the same score. World units, y up, bird
// at x = 0. Drives the game on the cabinet screen.
const ONE = 1 << 20;
const fx = (v) => Math.round(v * ONE);

export const HZ = 120;
export const STEP = 1 / HZ;
export const MAX_FRAME = 0.25; // longer frames (hidden tab, stall) are dropped, not caught up
export const VIEW_H = 2.56; // world height one screen shows
export const GROUND_Y = -0.975;
export const BIRD_R = 0.068;
export const PIPE_HALF_W = 0.13;

const G = Math.trunc(fx(5) / HZ);
const FLAP = fx(1.4);
const FALL_CAP = fx(2.2);
const GROUND = fx(GROUND_Y);
const R = fx(BIRD_R);
const R2 = R * R;
const HALF_W = Math.trunc((26 * fx(0.01)) / 2);
const SCROLL = Math.trunc(fx(0.6) / HZ);
const SPAWN_X = fx(1.2);
const DESPAWN_X = fx(-1.2);
const SPACING = fx(1);
const FIRST_PIPE_STEP = 180;
const HALF_GAP = Math.trunc(fx(0.47) / 2);
const OPENING_HALF_GAPS = [0.62, 0.59, 0.56, 0.53, 0.5].map((g) => Math.trunc(fx(g) / 2));
const GAP_MIN_Y = fx(-0.2);
const GAP_RANGE = fx(0.8) - GAP_MIN_Y;
const FAR = fx(10);
const TILT = Math.PI / 8;

const MASK64 = (1n << 64n) - 1n;

// SplitMix64.
export function makeRng(seed) {
  let state = BigInt(seed) & MASK64;
  return () => {
    state = (state + 0x9e3779b97f4a7c15n) & MASK64;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    return (z ^ (z >> 31n)) & MASK64;
  };
}

export function randomSeed() {
  const a = new BigUint64Array(1);
  crypto.getRandomValues(a);
  return a[0] & ((1n << 53n) - 1n);
}

export function medalFor(score) {
  return score >= 40 ? "PLATINUM" : score >= 30 ? "GOLD" : score >= 20 ? "SILVER" : score >= 10 ? "BRONZE" : null;
}

// Circle against the pipe rectangles, which run far past the top of the screen.
function hitsPipe(y, pipe) {
  const dx = -Math.max(pipe.x - HALF_W, Math.min(0, pipe.x + HALF_W));
  if (Math.abs(dx) >= R) return null;
  const bottom = y - Math.max(-FAR, Math.min(y, pipe.gapY - pipe.halfGap));
  if (dx * dx + bottom * bottom < R2) return "pipeBottom";
  const top = y - Math.max(pipe.gapY + pipe.halfGap, Math.min(y, FAR));
  return dx * dx + top * top < R2 ? "pipeTop" : null;
}

export class FlappySim {
  state = "ready"; // ready | play | over
  y = 0;
  vy = 0;
  rot = 0;
  pipes = [];
  score = 0;
  steps = 0;
  cause = null;
  scroll = 0;
  time = 0;
  spawned = 0;
  prevY = 0;
  prevRot = 0;
  moved = 0;
  flaps = [];
  revived = false;

  constructor(seed = randomSeed()) {
    this.seed = seed;
    this.rng = makeRng(seed);
  }

  flap() {
    if (this.state === "over") return;
    if (this.state === "ready") {
      this.state = "play";
      this.y = 0;
    }
    this.vy = FLAP;
    if (this.flaps[this.flaps.length - 1] !== this.steps) this.flaps.push(this.steps);
  }

  // One second chance per run: pipes clear and the bird restarts mid-screen.
  revive() {
    if (this.state !== "over" || this.revived) return;
    this.revived = true;
    this.state = "play";
    this.cause = null;
    this.pipes = [];
    this.y = 0;
    this.prevY = 0;
    this.vy = FLAP;
    this.rot = TILT;
    this.prevRot = TILT;
  }

  step() {
    this.prevY = this.y;
    this.prevRot = this.rot;
    this.moved = 0;
    this.time += STEP;
    const wasPlaying = this.state === "play";

    if (this.state === "ready") {
      this.y = fx(Math.sin(this.time * 5) * 0.05);
    } else {
      // Keeps falling after a pipe hit, until it lands.
      if (this.vy < -FALL_CAP) this.vy = -FALL_CAP;
      this.vy -= G;
      this.y += Math.trunc(this.vy / HZ);
      if (this.y - R < GROUND) {
        this.y = GROUND + R;
        this.vy = 0;
        if (wasPlaying) this.die("ground");
      }
      if (this.state === "play") this.checkPipes();
      if (this.state === "play") this.advancePipes();
      this.rot = this.vy > 0 ? TILT : Math.max(-Math.PI / 2, TILT + (this.vy / ONE) * 0.5);
    }

    if (this.state !== "over") this.scroll += SCROLL;
    if (wasPlaying) this.steps += 1;
  }

  die(cause) {
    this.state = "over";
    this.cause = cause;
  }

  checkPipes() {
    for (const pipe of this.pipes) {
      const cause = hitsPipe(this.y, pipe);
      if (cause) return this.die(cause);
    }
  }

  advancePipes() {
    const last = this.pipes[this.pipes.length - 1];
    if (last ? SPAWN_X - last.x >= SPACING : this.steps >= FIRST_PIPE_STEP) {
      this.pipes.push({
        x: SPAWN_X,
        gapY: GAP_MIN_Y + Math.trunc((Number(this.rng() % BigInt(ONE)) * GAP_RANGE) / ONE),
        // The first few gaps are wider, easing the player in.
        halfGap: OPENING_HALF_GAPS[this.spawned] ?? HALF_GAP,
        passed: false,
      });
      this.spawned += 1;
    }
    this.moved = SCROLL;
    for (const pipe of this.pipes) {
      pipe.x -= SCROLL;
      if (!pipe.passed && pipe.x <= 0) {
        pipe.passed = true;
        this.score += 1;
      }
    }
    if (this.pipes.length > 0 && this.pipes[0].x < DESPAWN_X) this.pipes.shift();
  }

  // Attract-mode pilot: flap when falling below the next gap's aim point.
  wantsFlap(offset = 0) {
    const next = this.pipes.find((p) => p.x + HALF_W + R > 0);
    const aim = (next ? next.gapY - fx(0.1) : 0) + fx(offset);
    return this.y < aim && this.vy <= 0;
  }

  // World-unit snapshot, blended between the last two steps by `alpha` (0..1).
  view(alpha) {
    return {
      y: (this.prevY + (this.y - this.prevY) * alpha) / ONE,
      rot: this.prevRot + (this.rot - this.prevRot) * alpha,
      scroll: (this.scroll - SCROLL * (1 - alpha)) / ONE,
      pipes: this.pipes.map((p) => ({
        x: (p.x + this.moved * (1 - alpha)) / ONE,
        gapY: p.gapY / ONE,
        halfGap: p.halfGap / ONE,
      })),
    };
  }
}
