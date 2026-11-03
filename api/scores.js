/**
 * Vercel Serverless Function: /api/scores
 *
 *   GET                            approved Hall of Fame entries
 *   POST { name, seed, flaps }     replay the run, then alert the owner
 *   POST ?action=approve&token=    add a signed entry to the Hall
 *   POST ?action=reject&token=     keep it out, or take it back out
 *
 * Required env:
 *   BLOB_READ_WRITE_TOKEN  set by Vercel when the Blob store is connected
 *   NTFY_TOPIC             private ntfy.sh topic the owner's phone subscribes to
 *   HALL_SECRET            long random string that signs the alert's buttons
 */
import { list, put } from '@vercel/blob';
import { addToHall, checkSubmission, removeFromHall, reviewAlert, signEntry, verifyEntry } from './_hall.js';
import { checkRateLimit, getAllowedOrigin, getClientIp, setSecurityHeaders } from './_security.js';

const HALL_FILE = 'hall.json';

async function readHall() {
  const { blobs } = await list({ prefix: HALL_FILE, limit: 1 });
  if (blobs.length === 0) return [];
  // The query skips the CDN, so an approval never builds on a stale copy.
  const res = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`hall read failed: ${res.status}`);
  return res.json();
}

async function writeHall(hall) {
  await put(HALL_FILE, JSON.stringify(hall), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}

export async function sendAlert(alert) {
  const res = await fetch('https://ntfy.sh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  if (!res.ok) throw new Error(`alert failed: ${res.status}`);
}

export function createHandler({ read, write, alert }) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(req.headers.origin || ''));
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    setSecurityHeaders(res);

    if (req.method === 'OPTIONS') return res.status(204).end();

    try {
      if (req.method === 'GET') {
        const entries = (await read()).map(({ name, score, at }) => ({ name, score, at }));
        res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
        return res.status(200).json({ entries });
      }
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

      const { HALL_SECRET, NTFY_TOPIC } = process.env;
      if (!HALL_SECRET || !NTFY_TOPIC) {
        console.error('HALL_SECRET or NTFY_TOPIC missing');
        return res.status(500).json({ error: 'Server misconfigured' });
      }

      const { action, token } = req.query ?? {};
      if (action === 'approve' || action === 'reject') {
        const entry = verifyEntry(token, HALL_SECRET);
        if (!entry) return res.status(403).json({ error: 'Invalid link' });
        const hall = await read();
        await write(action === 'approve' ? addToHall(hall, entry) : removeFromHall(hall, entry.id));
        return res.status(200).json({ ok: true, action, name: entry.name });
      }

      // Its own bucket, so chat use and score submissions don't share a limit.
      const rate = checkRateLimit(`hall:${getClientIp(req)}`);
      if (!rate.ok) {
        res.setHeader('Retry-After', String(rate.retryAfter));
        return res.status(429).json({ error: 'Too many submissions. Try again shortly.' });
      }

      const { entry, error } = checkSubmission(req.body);
      if (error) return res.status(400).json({ error });
      const baseUrl = `https://${req.headers.host}`;
      await alert(reviewAlert(entry, baseUrl, signEntry(entry, HALL_SECRET), NTFY_TOPIC));
      return res.status(202).json({ status: 'pending', score: entry.score });
    } catch (err) {
      console.error('Scores error:', err);
      return res.status(502).json({ error: 'Could not reach the Hall. Please try again.' });
    }
  };
}

export default createHandler({ read: readHall, write: writeHall, alert: sendAlert });

export const config = {
  maxDuration: 10,
};
