/**
 * Hall of Fame rules, kept free of storage and network so they can be checked
 * offline. A submission is only ever a name and a recorded run: the score comes
 * from replaying that run here, and nothing is stored until the owner approves.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { replayScore } from '../src/components/flappyModes.js';

export const HALL_SIZE = 50;
const MAX_FLAPS = 20_000;
const NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{0,23}$/u;

export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  return NAME.test(name) ? name : null;
}

// Returns { entry } or { error }.
export function checkSubmission(body, now = Date.now()) {
  const name = cleanName(body?.name);
  if (!name) return { error: 'Use a nickname of up to 24 letters, numbers or spaces.' };

  const { seed, flaps } = body;
  if (typeof seed !== 'string' || !/^\d{1,16}$/.test(seed)) return { error: 'Invalid run.' };
  if (!Array.isArray(flaps) || flaps.length === 0 || flaps.length > MAX_FLAPS) return { error: 'Invalid run.' };
  for (let i = 0; i < flaps.length; i++) {
    if (!Number.isSafeInteger(flaps[i]) || flaps[i] < 0 || (i > 0 && flaps[i] <= flaps[i - 1])) {
      return { error: 'Invalid run.' };
    }
  }

  const score = replayScore(BigInt(seed), flaps);
  if (score < 1) return { error: 'That run did not pass a pipe.' };
  const id = createHash('sha256').update(`${seed}:${flaps.join(',')}`).digest('hex').slice(0, 12);
  return { entry: { id, name, score, at: now } };
}

const mac = (payload, secret) => createHmac('sha256', secret).update(payload).digest('base64url');

// The alert's Approve and Reject buttons carry the entry itself, signed, so a
// pending name needs no storage and a rejected one is simply never written.
export function signEntry(entry, secret) {
  const payload = Buffer.from(JSON.stringify(entry)).toString('base64url');
  return `${payload}.${mac(payload, secret)}`;
}

export function verifyEntry(token, secret) {
  const [payload, sig, extra] = String(token ?? '').split('.');
  if (!payload || !sig || extra !== undefined) return null;
  const expected = Buffer.from(mac(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return JSON.parse(Buffer.from(payload, 'base64url').toString());
}

export function addToHall(hall, entry) {
  return [...hall.filter((e) => e.id !== entry.id), entry]
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, HALL_SIZE);
}

export function removeFromHall(hall, id) {
  return hall.filter((e) => e.id !== id);
}

export function reviewAlert(entry, baseUrl, token, topic) {
  const button = (label, action) => ({
    action: 'http',
    label,
    url: `${baseUrl}/api/scores?action=${action}&token=${token}`,
    method: 'POST',
    clear: true,
  });
  return {
    topic,
    title: `Flappy Hall: ${entry.name} scored ${entry.score}`,
    message: `${entry.name} wants a place in the Hall of Fame with ${entry.score}. Approve to show the name publicly.`,
    tags: ['video_game'],
    priority: 4,
    actions: [button('Approve', 'approve'), button('Reject', 'reject')],
  };
}
