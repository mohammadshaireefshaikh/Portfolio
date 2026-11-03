import assert from 'node:assert/strict';
import { FlappySim } from '../src/components/flappySim.js';
import { addToHall, checkSubmission, cleanName, HALL_SIZE, signEntry, verifyEntry } from '../api/_hall.js';
import { createHandler } from '../api/scores.js';

// Run: node scripts/check-hall.mjs
// Uses a fake store and captures the alert: nothing leaves this machine.
function pilotRun(seed, target) {
  const sim = new FlappySim(seed);
  sim.flap();
  while (sim.state !== 'over') {
    if (sim.steps > 0 && sim.score < target && sim.wantsFlap()) sim.flap();
    sim.step();
  }
  return sim;
}

const SECRET = 'test-secret';
process.env.HALL_SECRET = SECRET;
process.env.NTFY_TOPIC = 'test-topic';

const run = pilotRun(9n, 3);
assert.ok(run.score >= 1);
const body = { name: 'Zen Swan', seed: '9', flaps: run.flaps };

// Names: nicknames pass; markup, addresses and links do not.
assert.equal(cleanName('  Zen   Swan '), 'Zen Swan');
assert.equal(cleanName('Zoë_99'), 'Zoë_99');
for (const bad of ['', ' ', null, 7, '<b>x</b>', 'a@b.com', 'https://x.io', 'x'.repeat(25), '-x']) {
  assert.equal(cleanName(bad), null, `Must reject name: ${bad}`);
}

// The score comes from the replay. A claimed score is ignored.
const checked = checkSubmission({ ...body, score: 99999 }, 1000);
assert.equal(checked.entry.score, run.score, 'Server must compute the score itself');
for (const bad of [
  { ...body, seed: 9 },
  { ...body, seed: 'abc' },
  { ...body, seed: '1'.repeat(17) },
  { ...body, flaps: [] },
  { ...body, flaps: 'x' },
  { ...body, flaps: [0, 5, 5] },
  { ...body, flaps: [0, 2, 1] },
  { ...body, flaps: [0, 1.5] },
  { ...body, flaps: Array.from({ length: 20001 }, (_, i) => i) },
  { ...body, flaps: [5, 10] },
  { ...body, flaps: [0] },
]) {
  assert.ok(checkSubmission(bad).error, `Must reject run: ${JSON.stringify(bad).slice(0, 60)}`);
}

// Signed buttons: tampering with the entry or signature fails.
const token = signEntry(checked.entry, SECRET);
assert.deepEqual(verifyEntry(token, SECRET), checked.entry);
const [payload, sig] = token.split('.');
const forged = Buffer.from(JSON.stringify({ ...checked.entry, score: 99999 })).toString('base64url');
for (const bad of [`${forged}.${sig}`, `${payload}.x`, payload, '', null, `${payload}.${sig}.x`]) {
  assert.equal(verifyEntry(bad, SECRET), null, `Must reject token: ${String(bad).slice(0, 20)}`);
}
assert.equal(verifyEntry(token, 'other-secret'), null);

// Hall order and size.
const many = Array.from({ length: HALL_SIZE + 5 }, (_, i) => ({ id: `r${i}`, name: 'n', score: i, at: i }));
const full = many.reduce(addToHall, []);
assert.equal(full.length, HALL_SIZE);
assert.equal(full[0].score, HALL_SIZE + 4);
assert.equal(addToHall(addToHall([], many[1]), many[1]).length, 1, 'Approving twice adds one entry');

// The endpoint from submit to approval.
let stored = [];
const alerts = [];
let reads = 0;
const handler = createHandler({
  read: async () => { reads += 1; return stored; },
  write: async (hall) => { stored = hall; },
  alert: async (a) => { alerts.push(a); },
});
async function call({ method = 'POST', query = {}, body: reqBody, ip = '1.1.1.1' }) {
  const out = { headers: {} };
  const res = {
    setHeader: (k, v) => { out.headers[k] = v; },
    status(code) { out.code = code; return this; },
    json(v) { out.json = v; return this; },
    end() { return this; },
  };
  await handler({ method, query, body: reqBody, headers: { host: 'api.test', 'x-forwarded-for': ip } }, res);
  return out;
}

const sent = await call({ body });
assert.equal(sent.code, 202);
assert.equal(sent.json.score, run.score);
assert.deepEqual(stored, [], 'Nothing is stored before approval');
assert.equal(reads, 0, 'Submitting never touches the store');
assert.equal(alerts.length, 1, 'Every submission alerts the owner');
const alert = alerts[0];
assert.equal(alert.topic, 'test-topic');
assert.match(alert.title, /Zen Swan scored/);
assert.deepEqual(alert.actions.map((a) => [a.action, a.label, a.method]), [['http', 'Approve', 'POST'], ['http', 'Reject', 'POST']]);

const queryOf = (button) => Object.fromEntries(new URL(button.url).searchParams);
assert.ok(alert.actions[0].url.startsWith('https://api.test/api/scores?'));

const rejected = await call({ query: queryOf(alert.actions[1]) });
assert.equal(rejected.code, 200);
assert.deepEqual(stored, [], 'Reject stores nothing');

const hidden = await call({ method: 'GET' });
assert.deepEqual(hidden.json.entries, [], 'Hall shows nothing until approved');

const approved = await call({ query: queryOf(alert.actions[0]) });
assert.equal(approved.code, 200);
assert.equal(stored.length, 1);
await call({ query: queryOf(alert.actions[0]) });
assert.equal(stored.length, 1, 'A repeat tap changes nothing');

const shown = await call({ method: 'GET' });
assert.equal(shown.code, 200);
assert.equal(shown.json.entries[0].name, 'Zen Swan');
assert.deepEqual(Object.keys(shown.json.entries[0]).sort(), ['at', 'name', 'score'], 'Public list holds no run data');

await call({ query: queryOf(alert.actions[1]) });
assert.deepEqual(stored, [], 'Reject on an old alert takes the name back out');

assert.equal((await call({ query: { action: 'approve', token: 'nope' } })).code, 403);
assert.equal((await call({ query: { action: 'approve', token: `${forged}.${sig}` } })).code, 403);
assert.deepEqual(stored, [], 'A forged approval stores nothing');
assert.equal((await call({ method: 'DELETE' })).code, 405);
assert.equal((await call({ body: { name: 'x', seed: '9', flaps: [0] } })).code, 400);
assert.equal(alerts.length, 1, 'Invalid submissions never alert');

// Flooding from one address stops at the limit.
const codes = [];
for (let i = 0; i < 12; i++) codes.push((await call({ body, ip: '2.2.2.2' })).code);
assert.deepEqual(codes.slice(0, 10), Array(10).fill(202));
assert.equal(codes[10], 429);
assert.equal(alerts.length, 11);

// Provider outage: a clear error, nothing kept.
const down = createHandler({ read: async () => [], write: async () => {}, alert: async () => { throw new Error('ntfy down'); } });
const quiet = console.error;
console.error = () => {};
const failed = {};
await down({ method: 'POST', query: {}, body, headers: { host: 'api.test', 'x-forwarded-for': '3.3.3.3' } }, {
  setHeader() {},
  status(c) { failed.code = c; return this; },
  json(v) { failed.json = v; return this; },
  end() { return this; },
});
console.error = quiet;
assert.equal(failed.code, 502);
assert.doesNotMatch(failed.json.error, /ntfy/, 'Errors must not leak internals');

console.log('Hall checks pass: names, replay scoring, signed buttons, review flow, rate limit.');
