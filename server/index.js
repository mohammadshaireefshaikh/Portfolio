import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { chatHandler } from './chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', chatHandler);

app.listen(PORT, () => {
  console.log(`Portfolio chatbot server running on http://localhost:${PORT}`);
});
