// Deterministic Flappy sim: a fixed 60 steps/s and a seeded generator, so a seed
// plus the steps it flapped on always replays to the same score. Used by the
// cabinet screen and flappy.html.
// World units, y up, bird at x = 0. One unit is 100px on the cabinet's 400px screen.
export const HZ = 60;
export const STEP = 1 / HZ;
export const MAX_FRAME = 0.1; // a stalled frame slows the game instead of skipping it
export const VIEW_H = 4;
export const GROUND_Y = -1.62;
export const BIRD_R = 0.1;
export const PIPE_HALF_W = 0.16;
export const GAP_HALF = 0.36;

const GRAVITY = 5.4;
const FLAP = 1.95;
const SPEED = 0.95;
const CEILING = VIEW_H / 2 - BIRD_R;
const FLOOR = GROUND_Y + BIRD_R;
const SPAWN_X = 2.76;
const DESPAWN_X = -1.12;
const SPAWN_STEPS = 78; // 1.3s between pipes
const GAP_MIN = GROUND_Y + 0.25 + GAP_HALF;
const GAP_MAX = VIEW_H / 2 - 0.25 - GAP_HALF;
const MAX_GAP_SHIFT = 0.7; // keeps the next gap reachable in the time between pipes

// mulberry32
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

export function medalFor(score) {
  return score >= 50 ? "PLATINUM" : score >= 30 ? "GOLD" : score >= 15 ? "SILVER" : score >= 5 ? "BRONZE" : null;
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
  spawnIn = SPAWN_STEPS;
  lastGap = 0;
  prevY = 0;
  prevRot = 0;
  moved = 0;

  constructor(seed = randomSeed()) {
    this.seed = seed;
    this.rng = makeRng(seed);
  }

  flap() {
    if (this.state === "over") return;
    this.state = "play";
    this.vy = FLAP;
  }

  step() {
    this.prevY = this.y;
    this.prevRot = this.rot;
    this.moved = 0;
    this.time += STEP;

    if (this.state === "ready") {
      this.y = Math.sin(this.time * 4) * 0.06;
      this.scroll += SPEED * STEP;
      return;
    }

    // Keeps falling after a pipe hit, until it lands.
    const playing = this.state === "play";
    this.vy -= GRAVITY * STEP;
    this.y += this.vy * STEP;
    if (this.y > CEILING) {
      this.y = CEILING;
      this.vy = 0;
    }
    if (this.y < FLOOR) {
      this.y = FLOOR;
      this.vy = 0;
      if (playing) this.die("ground");
    }
    this.rot = Math.max(-1.2, Math.min(0.5, this.vy * 0.32));

    if (this.state === "play") {
      this.movePipes();
      this.checkPipes();
      this.scroll += SPEED * STEP;
    }
    if (playing) this.steps += 1;
  }

  die(cause) {
    this.state = "over";
    this.cause = cause;
  }

  movePipes() {
    this.spawnIn -= 1;
    if (this.spawnIn <= 0) {
      this.spawnIn = SPAWN_STEPS;
      const low = Math.max(GAP_MIN, this.lastGap - MAX_GAP_SHIFT);
      const high = Math.min(GAP_MAX, this.lastGap + MAX_GAP_SHIFT);
      this.lastGap = low + this.rng() * (high - low);
      this.pipes.push({ x: SPAWN_X, gapY: this.lastGap, scored: false });
    }
    this.moved = SPEED * STEP;
    for (const pipe of this.pipes) pipe.x -= this.moved;
    this.pipes = this.pipes.filter((pipe) => pipe.x > DESPAWN_X);
  }

  checkPipes() {
    for (const pipe of this.pipes) {
      if (Math.abs(pipe.x) < PIPE_HALF_W + BIRD_R) {
        if (this.y + BIRD_R > pipe.gapY + GAP_HALF) return this.die("pipeTop");
        if (this.y - BIRD_R < pipe.gapY - GAP_HALF) return this.die("pipeBottom");
      }
      if (!pipe.scored && pipe.x < -(PIPE_HALF_W + BIRD_R)) {
        pipe.scored = true;
        this.score += 1;
      }
    }
  }

  // Attract-mode pilot: flap when sinking below the aim point. Past a pipe's middle
  // it starts sinking toward a lower next gap, without dropping out of the current one.
  wantsFlap() {
    const i = this.pipes.findIndex((pipe) => pipe.x > -(PIPE_HALF_W + BIRD_R));
    const pipe = this.pipes[i];
    const after = this.pipes[i + 1];
    let aim = pipe ? pipe.gapY - 0.16 : -0.16;
    if (pipe && after && pipe.x < 0) aim = Math.max(Math.min(aim, after.gapY - 0.16), pipe.gapY - GAP_HALF + BIRD_R + 0.1);
    const below = aim - this.y;
    return below > 0 && this.vy < (below > 0.3 ? FLAP * 0.4 : 0);
  }

  // Snapshot blended between the last two steps by `alpha` (0..1).
  view(alpha) {
    return {
      y: this.prevY + (this.y - this.prevY) * alpha,
      rot: this.prevRot + (this.rot - this.prevRot) * alpha,
      scroll: this.scroll - SPEED * STEP * (1 - alpha),
      pipes: this.pipes.map((pipe) => ({ x: pipe.x + this.moved * (1 - alpha), gapY: pipe.gapY })),
    };
  }
}
