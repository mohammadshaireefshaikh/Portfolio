import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { chatHandler } from './chat.js';
import { createHandler, sendAlert } from '../api/scores.js';
import { setSecurityHeaders, getAllowedOrigin } from '../api/_security.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Tell Express to trust X-Forwarded-For from reverse proxies (Vite dev proxy, etc.)
// so rate-limit sees the real client IP.
app.set('trust proxy', true);

app.use((req, res, next) => {
  setSecurityHeaders(res);
  next();
});

app.use(cors({
  origin: (origin, cb) => cb(null, getAllowedOrigin(origin || '')),
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Local dev keeps the Hall in memory, so test names never reach the public store.
// Alerts are real, but their buttons point at this machine and won't work from a phone.
let localHall = [];
const scoresHandler = createHandler({
  read: async () => localHall,
  write: async (hall) => { localHall = hall; },
  alert: sendAlert,
});

// A long run's flap list is far bigger than a chat message
app.all('/api/scores', express.json({ limit: '256kb' }), scoresHandler);

// Hard cap payload size — prevent huge JSON bodies
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', chatHandler);

app.listen(PORT, () => {
  console.log(`Portfolio chatbot server running on http://localhost:${PORT}`);
});
