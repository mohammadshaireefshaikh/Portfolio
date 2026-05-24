/**
 * build-embeddings.js
 * Reads all .md files from server/knowledge/, chunks them,
 * embeds each chunk with text-embedding-3-small, and writes
 * server/embeddings.json for the RAG pipeline.
 *
 * Run: node scripts/build-embeddings.js
 * Requires: OPENAI_API_KEY in .env
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import OpenAI from 'openai';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgeDir = join(__dirname, '../server/knowledge');
const outputPath = join(__dirname, '../server/embeddings.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Split text into overlapping word-based chunks.
 * chunkSize = words per chunk, overlap = words shared between adjacent chunks.
 */
function chunkText(text, source, chunkSize = 350, overlap = 70) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push({
      text: words.slice(start, end).join(' '),
      source,
    });
    if (end === words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not set in .env');
    process.exit(1);
  }

  const files = readdirSync(knowledgeDir).filter(f => extname(f) === '.md');

  if (files.length === 0) {
    console.error('No .md files found in server/knowledge/');
    process.exit(1);
  }

  const allChunks = [];

  for (const file of files) {
    const content = readFileSync(join(knowledgeDir, file), 'utf-8');
    const chunks = chunkText(content, file);
    allChunks.push(...chunks);
    console.log(`  ${file}: ${chunks.length} chunks`);
  }

  console.log(`\nEmbedding ${allChunks.length} chunks from ${files.length} files...\n`);

  const results = [];

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    process.stdout.write(`\r[${i + 1}/${allChunks.length}] ${chunk.source.padEnd(30)}`);

    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk.text,
    });

    results.push({
      text: chunk.text,
      source: chunk.source,
      embedding: res.data[0].embedding,
    });

    // Throttle to avoid rate limits
    if (i < allChunks.length - 1) await sleep(80);
  }

  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n\nDone! Wrote ${results.length} embedded chunks to:\n  ${outputPath}`);
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
