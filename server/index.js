import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { chatHandler } from './chat.js';
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
  methods: ['POST', 'OPTIONS'],
}));

// Hard cap payload size — prevent huge JSON bodies
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', chatHandler);

app.listen(PORT, () => {
  console.log(`Portfolio chatbot server running on http://localhost:${PORT}`);
});
