/**
 * Shared security helpers for the chat endpoint.
 * Imported by api/chat.js (Vercel) and server/chat.js (Express).
 */

// ─── Limits ────────────────────────────────────────────────
export const MAX_MESSAGE_CHARS = 1000;
export const MAX_MESSAGES = 20;
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const RATE_LIMIT_MAX = 10;           // requests / window / IP
export const VALID_ROLES = new Set(['user', 'assistant']);

// ─── Input validation ──────────────────────────────────────
export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'messages array required';
  }
  if (messages.length > MAX_MESSAGES) {
    return `too many messages (max ${MAX_MESSAGES})`;
  }
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'invalid message format';
    if (typeof m.content !== 'string') return 'message content must be a string';
    if (!VALID_ROLES.has(m.role)) return 'invalid message role';
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return `message too long (max ${MAX_MESSAGE_CHARS} chars)`;
    }
    if (m.content.trim().length === 0) return 'empty message';
  }
  return null; // valid
}

// ─── Rate limiting (in-memory, per IP, sliding window) ─────
// Note: in-memory state resets on serverless cold start.
// For a portfolio this is enough — bots get throttled, real users never hit it.
const buckets = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  const arr = (buckets.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((arr[0] + RATE_LIMIT_WINDOW_MS - now) / 1000) };
  }
  arr.push(now);
  buckets.set(ip, arr);
  // Cheap GC — prune cold entries every 100 inserts
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) {
      if (v[v.length - 1] < now - RATE_LIMIT_WINDOW_MS) buckets.delete(k);
    }
  }
  return { ok: true };
}

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  if (req.headers['x-real-ip']) return String(req.headers['x-real-ip']);
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

// ─── Security headers ──────────────────────────────────────
export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

// ─── CORS ──────────────────────────────────────────────────
// Allowed origins — explicit allowlist. Add yours via env var:
//   ALLOWED_ORIGIN=https://you.github.io,https://you-preview.vercel.app
export function getAllowedOrigin(reqOrigin) {
  const raw = process.env.ALLOWED_ORIGIN || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return '*'; // dev fallback
  if (list.includes(reqOrigin)) return reqOrigin;
  return list[0]; // safe default — first allowed origin
}
