import assert from 'node:assert/strict';
import { FlappySim, makeRng, medalFor, GROUND_Y, BIRD_R, VIEW_H } from '../src/components/flappySim.js';

// Run: node scripts/check-flappy.mjs
function replay(seed, flaps) {
  const sim = new FlappySim(seed);
  const scheduled = new Set(flaps);
  while (sim.state !== 'over') {
    if (scheduled.has(sim.steps)) sim.flap();
    sim.step();
  }
  return sim;
}

// Same seed, same sequence, all inside 0..1.
const a = makeRng(42);
const b = makeRng(42);
for (let i = 0; i < 1000; i++) {
  const v = a();
  assert.equal(v, b());
  assert.ok(v >= 0 && v < 1);
}

// One flap and no more lands on the ground, before any pipe arrives.
const drop = replay(1, [0]);
assert.equal(drop.cause, 'ground');
assert.equal(drop.score, 0);
assert.equal(drop.y, GROUND_Y + BIRD_R);

// Flapping non-stop stops at the ceiling instead of flying over the pipes.
const climber = new FlappySim(1);
for (let i = 0; i < 120; i++) {
  climber.flap();
  climber.step();
  assert.ok(climber.y <= VIEW_H / 2 - BIRD_R, 'Bird must stay under the ceiling');
}

// The attract pilot plays most seeds far past any medal, so gaps stay reachable.
function pilotRun(seed) {
  const sim = new FlappySim(seed);
  const flaps = [0];
  let lastGap = 0;
  sim.flap();
  while (sim.state !== 'over' && sim.score < 300) {
    if (sim.steps > 0 && sim.wantsFlap()) {
      flaps.push(sim.steps);
      sim.flap();
    }
    sim.step();
    const newest = sim.pipes[sim.pipes.length - 1];
    if (newest && newest.gapY !== lastGap) {
      assert.ok(Math.abs(newest.gapY - lastGap) <= 0.7 + 1e-9, 'Next gap must stay within reach');
      lastGap = newest.gapY;
    }
  }
  return { sim, flaps };
}
const scores = [];
for (let seed = 1; seed <= 100; seed++) scores.push(pilotRun(seed).sim.score);
scores.sort((x, y) => x - y);
assert.ok(scores[50] >= 50, `Pilot median ${scores[50]} is too low: gaps may be unfair`);

// Same seed and flaps replay exactly; a different seed or a lost flap changes the run.
let replayed = 0;
for (let seed = 1; seed <= 100 && replayed < 10; seed++) {
  const { sim, flaps } = pilotRun(seed);
  if (sim.state !== 'over' || sim.score < 5) continue;
  replayed += 1;
  const again = replay(seed, flaps);
  assert.equal(again.score, sim.score, 'Replay must reach the same score');
  assert.equal(again.steps, sim.steps, 'Replay must end on the same step');
  assert.notEqual(replay(seed + 1, flaps).steps, sim.steps, 'A different seed must change the run');
  const lost = flaps.filter((_, i) => i !== flaps.length >> 1);
  assert.notEqual(replay(seed, lost).steps, sim.steps, 'Dropping a flap must change the run');
}
assert.equal(replayed, 10, 'Not enough finished runs to replay');

assert.deepEqual([4, 5, 15, 30, 50].map(medalFor), [null, 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);

// Pipes and bird blend smoothly between steps instead of jumping.
const sim = new FlappySim(7);
sim.flap();
for (let i = 0; i < 200; i++) {
  if (sim.wantsFlap()) sim.flap();
  sim.step();
}
const before = sim.view(0);
const after = sim.view(1);
assert.equal(after.y, sim.y);
assert.ok(before.pipes[0].x > after.pipes[0].x, 'Pipes must move left across a step');

console.log('Flappy sim: RNG, physics, ceiling, pilot, replay and interpolation pass.');
