import { FlappySim, makeRng, randomSeed, STEP } from "./flappySim.js";

const SCROLL_PER_STEP = 0.6 * STEP;
const fraction = (rng) => Number(rng() % (1n << 20n)) / (1 << 20);

// ── Ghost: replays a recorded run on the same pipes, a little ahead of the player ──
const GHOST_LEAD_STEPS = 72; // 0.6s
export const GHOST_X = GHOST_LEAD_STEPS * SCROLL_PER_STEP;

export class GhostRun {
  constructor(run) {
    this.score = run.score;
    this.sim = new FlappySim(run.seed);
    this.flaps = new Set(run.flaps);
    for (let i = 0; i < GHOST_LEAD_STEPS; i++) this.advance();
  }

  advance() {
    if (this.sim.state === "over") return;
    if (this.flaps.has(this.sim.steps)) this.sim.flap();
    this.sim.step();
  }

  get alive() {
    return this.sim.state !== "over";
  }
}

// ── Challenge links: a run packed into the URL hash, which never reaches a server ──
const MAX_LINK_FLAPS = 2000;

export function encodeRun({ seed, flaps }) {
  if (flaps.length === 0 || flaps.length > MAX_LINK_FLAPS) return null;
  return `${seed.toString(36)}.${flaps.map((f, i) => (f - (flaps[i - 1] ?? 0)).toString(36)).join("-")}`;
}

// Scores are never taken from the link: replaying the flaps is what earns them.
export function decodeRun(text) {
  const match = /^([0-9a-z]{1,11})\.([0-9a-z]{1,4}(?:-[0-9a-z]{1,4})*)$/.exec(text ?? "");
  if (!match) return null;
  const deltas = match[2].split("-").map((d) => parseInt(d, 36));
  if (deltas.length > MAX_LINK_FLAPS) return null;
  let seed = 0n;
  for (const c of match[1]) seed = seed * 36n + BigInt(parseInt(c, 36));
  let step = 0;
  const flaps = deltas.map((d) => (step += d));
  return { seed, flaps, score: replayScore(seed, flaps) };
}

export function replayScore(seed, flaps) {
  const sim = new FlappySim(seed);
  const scheduled = new Set(flaps);
  while (sim.state !== "over") {
    if (scheduled.has(sim.steps)) sim.flap();
    else if (sim.state === "ready") return 0; // a run must open with a flap
    sim.step();
  }
  return sim.score;
}

// ── Royale: 29 bots hop in behind the player on the same pipes, last bird standing ──
export const ROYALE_BOTS = 29;
const HOP_STEPS = 5;
const FEED_SECONDS = 2.8;
const NAME_A = ["Dusk", "Ember", "Hollow", "Moss", "Night", "Quiet", "Rust", "Slate", "Storm", "Velvet"];
const NAME_B = ["Bat", "Moth", "Owl", "Raven", "Swift", "Wren"];
const TINTS = ["#ffc9c9", "#c9e0ff", "#d6ffc9", "#ffedc2", "#e6ccff", "#c9fff1", "#ffd9f2", "#e0e0e0"];

class RoyaleBot {
  constructor(seed, index) {
    const rng = makeRng(seed ^ (BigInt(index + 1) * 0x94d049bb133111ebn));
    const skill = fraction(rng) * (index === 0 ? 0.15 : 1); // lower is sharper; the first bot is always strong
    this.rng = rng;
    this.name = `${NAME_A[index % NAME_A.length]}${NAME_B[index % NAME_B.length]}${index + 1}`;
    this.tint = TINTS[index % TINTS.length];
    this.blunderChance = 0.02 + 0.5 * skill * skill;
    this.wobble = 0.015 + 0.035 * skill;
    this.latency = 4 + Math.round(skill * 12);
    this.hopStep = 10 + index * HOP_STEPS + Math.floor(fraction(rng) * 4);
    this.sim = new FlappySim(seed);
    this.x = -this.hopStep * SCROLL_PER_STEP;
    this.aimedAt = null;
    this.offset = 0;
    this.flapAt = null;
    this.finished = false;
  }

  // Aims for the next gap, reacts late, and sometimes commits to a bad line.
  wantsFlap() {
    const sim = this.sim;
    const next = sim.pipes.find((p) => p.x > 0);
    if (next && next !== this.aimedAt) {
      this.aimedAt = next;
      const off = fraction(this.rng) < this.blunderChance;
      const sign = fraction(this.rng) < 0.5 ? 1 : -1;
      this.offset = off ? sign * (next.halfGap / (1 << 20) + 0.08) : (fraction(this.rng) * 2 - 1) * this.wobble;
    }
    if (this.flapAt === null && sim.wantsFlap(this.offset)) this.flapAt = sim.steps + this.latency;
    if (this.flapAt !== null && sim.steps >= this.flapAt) {
      this.flapAt = null;
      return true;
    }
    return false;
  }

  advance(matchStep) {
    if (this.finished || matchStep < this.hopStep) return null;
    if (this.sim.state === "ready") this.sim.flap();
    if (this.sim.state === "over") {
      this.sim.step();
      this.x -= SCROLL_PER_STEP;
      if (this.x < -1.6) this.finished = true;
      return null;
    }
    if (this.wantsFlap()) this.sim.flap();
    this.sim.step();
    return this.sim.state === "over" ? { name: this.name, score: this.sim.score } : null;
  }

  get visible() {
    return this.sim.state !== "ready" && !this.finished;
  }
}

export class RoyaleMatch {
  feed = [];
  steps = 0;
  winAt = null;

  constructor(seed = randomSeed()) {
    this.bots = Array.from({ length: ROYALE_BOTS }, (_, i) => new RoyaleBot(seed, i));
  }

  advance() {
    this.steps += 1;
    for (const bot of this.bots) {
      const death = bot.advance(this.steps);
      if (death) this.feed.push({ ...death, at: this.steps });
    }
    if (this.winAt === null && this.alive() === 0) this.winAt = this.steps;
  }

  alive() {
    return this.bots.filter((bot) => bot.sim.state !== "over").length;
  }

  recentFeed() {
    return this.feed.filter((f) => (this.steps - f.at) * STEP < FEED_SECONDS).slice(-3).reverse();
  }

  // Where the player finishes if they die now: first if every bot went before them.
  placement() {
    return this.alive() + 1;
  }
}
