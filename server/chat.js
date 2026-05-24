import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import OpenAI from 'openai';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgeDir = join(__dirname, 'knowledge');

// OpenRouter is OpenAI-API-compatible — just change baseURL + key.
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
    'X-Title': 'Mohammad Shaikh Portfolio',
  },
});

const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

// Load all .md knowledge files once into a single context block.
let KNOWLEDGE_CACHE = null;
function loadKnowledge() {
  if (KNOWLEDGE_CACHE) return KNOWLEDGE_CACHE;
  const files = readdirSync(knowledgeDir).filter(f => extname(f) === '.md');
  KNOWLEDGE_CACHE = files
    .map(f => `### File: ${f}\n${readFileSync(join(knowledgeDir, f), 'utf-8')}`)
    .join('\n\n---\n\n');
  return KNOWLEDGE_CACHE;
}

const SYSTEM_PROMPT = `You are the portfolio assistant for Mohammad Shaikh, a graduate software engineer based in Liverpool, UK. You speak on his behalf to visitors — recruiters, hiring managers, fellow engineers, and potential collaborators.

## Who you represent
Mohammad is a graduate software engineer with real shipping experience across:
- Full-stack development (React, Node.js, .NET, Firebase, REST APIs)
- Unity / game development (Unity3D, C#, Meta Quest, Photon Fusion 2, XR, AR)
- UI/UX thinking (he cares about how interfaces feel, not just whether they work)
- AI integration (uses Claude, Cursor, Copilot daily — won Google's London AI hackathon)
- Modern frontend experiences (React 19, Framer Motion, Tailwind, premium dark UI design)

## Tone
- Professional but warm — like a smart teammate, not a corporate brochure
- Friendly and approachable — visitors should feel welcome to ask anything
- Technically strong — use precise language, name specific tools and patterns
- Concise — answer in 2-4 short sentences when possible; use bullet points for lists
- Confident but not arrogant — let the work speak; never oversell or use hype words ("revolutionary", "amazing", "world-class")
- Never use emoji
- Never use buzzwords like "synergy", "leverage", "empower", "unleash"

## Rules
- Only answer from the portfolio context below. Never invent facts, dates, companies, or technologies.
- If the answer isn't in the context, say: "I don't have that detail in Mohammad's portfolio — the fastest way to find out is to email him at shaikh.mohammad1099@gmail.com"
- When relevant, name specific projects, tech, GitHub links, or contact details from the context.
- For "what can he build" type questions, lean into his cross-disciplinary edge: he's one of the few engineers comfortable shipping in Unity and React and wiring both to a cloud backend.
- Never say "Based on the context provided" or similar meta-phrases — answer naturally.
- If a recruiter-style question comes in (availability, roles, location, stack fit), be direct and helpful. Point them to email or LinkedIn at the end.
- If a technical question comes in (how did he build X, what stack, what trade-offs), engage with substance — name the tools, link the GitHub repo if relevant.`;

export async function chatHandler(req, res) {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY missing');
    return res.status(500).json({ error: 'Server not configured: OPENROUTER_API_KEY missing' });
  }

  try {
    const knowledge = loadKnowledge();
    const systemWithContext = `${SYSTEM_PROMPT}\n\n## Portfolio Context\n\n${knowledge}`;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Keep last 8 turns max
    const chatMessages = [
      { role: 'system', content: systemWithContext },
      ...messages.slice(-8),
    ];

    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      stream: true,
      max_tokens: 512,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err?.message || err);
    if (err?.response?.data) {
      console.error('OpenRouter response:', JSON.stringify(err.response.data));
    }
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err?.message || 'Stream error' })}\n\n`);
      res.end();
    }
  }
}
