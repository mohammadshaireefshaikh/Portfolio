import assert from 'node:assert/strict';
import { FlappySim, makeRng, medalFor } from '../src/components/flappySim.js';
import { GhostRun, RoyaleMatch, ROYALE_BOTS, encodeRun, decodeRun, replayScore } from '../src/components/flappyModes.js';

// Run: node scripts/check-flappy.mjs
function pilotRun(seed, cap) {
  const sim = new FlappySim(seed);
  sim.flap();
  while (sim.state !== 'over' && sim.score < cap) {
    if (sim.steps > 0 && sim.wantsFlap()) sim.flap();
    sim.step();
  }
  return sim;
}

// Published SplitMix64 vector for seed 0.
const next = makeRng(0n);
assert.equal(next(), 0xe220a8397b1dcdafn);
assert.equal(next(), 0x6e789e6aa1b965f4n);

// Physics stay pinned: these runs must never drift, or saved ghosts and links break.
for (const [seed, steps, y] of [[42n, 8260, 654739], [7n, 8260, 132237]]) {
  const sim = pilotRun(seed, 40);
  assert.deepEqual([sim.score, sim.steps, sim.y], [40, steps, y], `Physics changed on seed ${seed}`);
}

// One flap and no more falls to the ground before the first pipe arrives.
const drop = new FlappySim(1n);
drop.flap();
while (drop.state !== 'over') drop.step();
assert.equal(drop.cause, 'ground');
assert.equal(drop.score, 0);
assert.ok(drop.steps < 180, 'First pipe must not arrive before the bird lands');

// The flap log replays the same run, and a lost flap or other seed changes it.
const run = pilotRun(5n, 200);
const flaps = run.flaps;
assert.equal(flaps[0], 0, 'A run opens with a flap on step 0');
const finished = pilotRun(5n, 200);
assert.deepEqual(finished.flaps, flaps, 'Same seed and pilot must log the same flaps');
const dead = new FlappySim(9n);
dead.flap();
while (dead.state !== 'over') {
  if (dead.wantsFlap() && dead.score < 12) dead.flap();
  dead.step();
}
assert.equal(replayScore(9n, dead.flaps), dead.score, 'Replay must reach the same score');
assert.notEqual(replayScore(10n, dead.flaps), dead.score, 'A different seed must change the run');

// Revive: once only, clears pipes and carries on flying.
const reviver = new FlappySim(3n);
reviver.flap();
for (let i = 0; i < 400 && reviver.state !== 'over'; i++) reviver.step();
const before = reviver.score;
reviver.revive();
assert.equal(reviver.state, 'play');
assert.equal(reviver.pipes.length, 0);
assert.equal(reviver.score, before);
while (reviver.state !== 'over') reviver.step();
reviver.revive();
assert.equal(reviver.state, 'over', 'A run only gets one revive');

// Ghost: ahead of the player on identical pipes, and ends with the recorded score.
const ghost = new GhostRun({ seed: 9n, flaps: dead.flaps, score: dead.score });
assert.equal(ghost.sim.steps, 72, 'Ghost must start 0.6s ahead');
while (ghost.alive) ghost.advance();
assert.equal(ghost.sim.score, dead.score);

// Challenge links round-trip, re-earn the score, and reject garbage.
const code = encodeRun({ seed: 9n, flaps: dead.flaps });
const decoded = decodeRun(code);
assert.equal(decoded.seed, 9n);
assert.deepEqual(decoded.flaps, dead.flaps);
assert.equal(decoded.score, dead.score, 'Link score must come from replaying it');
for (const bad of [null, '', 'x', 'abc.', '<script>.1', `1.${'1-'.repeat(2001)}1`]) {
  assert.equal(decodeRun(bad), null, `Must reject: ${String(bad).slice(0, 20)}`);
}
assert.equal(replayScore(1n, [5, 10]), 0, 'A run that does not open with a flap scores nothing');
assert.equal(encodeRun({ seed: 1n, flaps: Array.from({ length: 2001 }, (_, i) => i) }), null, 'Long runs get no link');

// Royale: deterministic, thins out over time, and always ends.
const play = (seed) => {
  const match = new RoyaleMatch(seed);
  const alive = {};
  for (let i = 1; i <= 7200 && match.alive() > 0; i++) {
    match.advance();
    if (i % 1200 === 0) alive[i / 120] = match.alive();
  }
  return { match, alive };
};
const a = play(11n);
const b = play(11n);
assert.deepEqual(a.alive, b.alive, 'Same seed must play the same match');
assert.equal(a.match.bots.length, ROYALE_BOTS);
assert.ok(new Set(a.match.bots.map((bot) => bot.name)).size === ROYALE_BOTS, 'Bot names must be unique');
assert.ok(a.match.alive() < ROYALE_BOTS / 2, `Most bots must fall within a minute: ${a.match.alive()} alive`);
assert.ok(a.match.feed.length > 0, 'Deaths must reach the feed');
assert.ok(a.match.feed[0].score >= 0);
const scores = a.match.bots.map((bot) => bot.sim.score).sort((x, y) => x - y);
assert.ok(scores[scores.length - 1] >= 5, `Strongest bot only reached ${scores[scores.length - 1]}`);

assert.deepEqual([9, 10, 20, 30, 40].map(medalFor), [null, 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);

// Pipes and bird blend smoothly between steps instead of jumping.
const sim = new FlappySim(7n);
sim.flap();
for (let i = 0; i < 400; i++) {
  if (sim.wantsFlap()) sim.flap();
  sim.step();
}
assert.ok(sim.view(0).pipes[0].x > sim.view(1).pipes[0].x, 'Pipes must move left across a step');
assert.equal(sim.view(1).y, sim.y / (1 << 20));

console.log(`Flappy checks pass. Royale after 60s: ${a.match.alive()} bots left, best bot ${scores[scores.length - 1]}.`);
