#!/usr/bin/env node
/**
 * Test script: simulates a complete Recall.ai meeting pipeline
 *
 * Usage:
 *   node scripts/test-recall-pipeline.mjs [consultancy_id]
 *
 * What it does:
 *   1. Creates a fake meeting_session in Supabase
 *   2. Inserts fake transcript segments (2 speakers)
 *   3. POSTs bot.done webhook to local backend
 *   4. Polls meeting_sessions until done or error
 *   5. Prints summary + transcript + RAG status
 *
 * Requirements:
 *   - Backend running locally: npm run dev (port 3001 or PORT in .env)
 *   - Valid SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dir = dirname(fileURLToPath(import.meta.url));

// ─── Load .env ────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dir, '../.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) env[k.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = env.PORT ?? '3001';
const BACKEND_URL = `http://localhost:${PORT}`;
const WEBHOOK_SECRET = env.RECALL_WEBHOOK_SECRET ?? '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Args ─────────────────────────────────────────────────────────
const consultancyId = process.argv[2] ?? null;
if (!consultancyId) {
  console.log('Usage: node scripts/test-recall-pipeline.mjs <consultancy_id>');
  console.log('\nTo find your consultancy_id, run:');
  console.log('  node scripts/test-recall-pipeline.mjs --list');
  process.exit(0);
}

if (consultancyId === '--list') {
  const { data } = await db.from('consultancies').select('id, title, client_name').limit(10);
  console.table(data);
  process.exit(0);
}

// ─── Fake data ─────────────────────────────────────────────────────
const FAKE_BOT_ID = `test-bot-${Date.now()}`;

const FAKE_TRANSCRIPT = [
  { speaker: 'Leonardo', raw_text: 'Olá Iris, tudo bem? Vamos começar a reunião de alinhamento de estratégia.' },
  { speaker: 'Iris', raw_text: 'Olá Leonardo! Sim, estou pronta. Quais são as principais prioridades para este mês?' },
  { speaker: 'Leonardo', raw_text: 'Nossa prioridade é aumentar o ticket médio. Estamos em 800 reais e queremos chegar a 1500.' },
  { speaker: 'Iris', raw_text: 'Entendido. Para isso precisamos trabalhar o posicionamento premium e criar pacotes mais completos.' },
  { speaker: 'Leonardo', raw_text: 'Exato. Também precisamos melhorar o processo de captação no Instagram. Temos muitos seguidores mas baixa conversão.' },
  { speaker: 'Iris', raw_text: 'Vamos criar um funil de vendas no Instagram com stories estratégicos e oferta de diagnóstico gratuito.' },
  { speaker: 'Leonardo', raw_text: 'Perfeito. Próxima reunião semana que vem para revisar o plano de conteúdo.' },
];

// ─── Step 1: Find user_id from consultancy ─────────────────────────
console.log('\n🔍  Step 1: Looking up consultancy...');
const { data: consultancy, error: cErr } = await db
  .from('consultancies')
  .select('id, user_id, client_name, title')
  .eq('id', consultancyId)
  .single();

if (cErr || !consultancy) {
  console.error('❌  Consultancy not found:', cErr?.message ?? 'Not found');
  process.exit(1);
}
console.log(`✅  Found: ${consultancy.client_name} — ${consultancy.title}`);

// ─── Step 2: Create fake meeting session ───────────────────────────
console.log('\n📋  Step 2: Creating fake meeting session...');
const { data: session, error: sErr } = await db
  .from('meeting_sessions')
  .insert({
    user_id: consultancy.user_id,
    consultancy_id: consultancyId,
    recall_bot_id: FAKE_BOT_ID,
    meeting_url: 'https://meet.google.com/test-fake-meeting',
    bot_name: 'Iris AI Notetaker (TEST)',
    status: 'in_call',
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  })
  .select('id')
  .single();

if (sErr || !session) {
  console.error('❌  Failed to create session:', sErr?.message);
  process.exit(1);
}
console.log(`✅  Session created: ${session.id}`);

// ─── Step 3: Insert fake transcript segments ───────────────────────
console.log('\n📝  Step 3: Inserting transcript segments...');
const rows = FAKE_TRANSCRIPT.map((seg, i) => ({
  session_id: session.id,
  speaker: seg.speaker,
  words: [{ text: seg.raw_text, start_time: i * 15, end_time: i * 15 + 12 }],
  raw_text: seg.raw_text,
  timestamp: new Date(Date.now() - (FAKE_TRANSCRIPT.length - i) * 15000).toISOString(),
}));

const { error: tErr } = await db.from('meeting_transcripts').insert(rows);
if (tErr) {
  console.error('❌  Failed to insert transcript:', tErr.message);
  process.exit(1);
}
console.log(`✅  ${rows.length} segments inserted`);

// ─── Step 4: POST bot.done webhook to local backend ────────────────
console.log('\n🔗  Step 4: Sending bot.done webhook to', BACKEND_URL, '...');
const webhookPayload = {
  event: 'bot.done',
  data: { bot: { id: FAKE_BOT_ID } },
};

try {
  const res = await fetch(`${BACKEND_URL}/api/webhooks/recall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload),
  });
  const body = await res.json();
  console.log(`✅  Webhook response: ${res.status}`, body);
} catch (e) {
  console.error('❌  Could not reach backend at', BACKEND_URL);
  console.error('   Make sure the backend is running: npm run dev');
  process.exit(1);
}

// ─── Step 5: Poll until done ───────────────────────────────────────
console.log('\n⏳  Step 5: Polling for result (up to 60s)...');
let attempts = 0;
let result = null;

while (attempts < 30) {
  await new Promise((r) => setTimeout(r, 2000));
  const { data } = await db
    .from('meeting_sessions')
    .select('status, summary, formatted_transcript, speakers')
    .eq('id', session.id)
    .single();

  process.stdout.write(`   attempt ${++attempts}: status=${data?.status}\r`);

  if (data?.status === 'done' || data?.status === 'error') {
    result = data;
    break;
  }
}

console.log('\n');

// ─── Step 6: Print results ─────────────────────────────────────────
if (!result) {
  console.log('⏰  Timeout — pipeline did not complete in 60s');
  console.log('   Check backend logs for errors');
} else if (result.status === 'error') {
  console.log('❌  Pipeline ended with error. Check backend logs.');
} else {
  console.log('✅  Pipeline completed!\n');
  console.log('─── SUMMARY ─────────────────────────────────────────');
  console.log(result.summary ?? '(no summary)');
  console.log('\n─── SPEAKERS ────────────────────────────────────────');
  console.log(result.speakers?.join(', ') ?? '(none)');
  console.log('\n─── TRANSCRIPT (first 500 chars) ────────────────────');
  console.log(result.formatted_transcript?.slice(0, 500) ?? '(no transcript)');
}

// ─── Check RAG document ────────────────────────────────────────────
const { data: docs } = await db
  .from('knowledge_documents')
  .select('id, name, status, chunk_count')
  .eq('consultancy_id', consultancyId)
  .order('created_at', { ascending: false })
  .limit(3);

console.log('\n─── RAG DOCUMENTS (latest 3) ────────────────────────');
console.table(docs ?? []);

// ─── Cleanup ───────────────────────────────────────────────────────
console.log('\n🧹  Cleanup: delete test session? (y/N)');
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.once('data', async (key) => {
  if (key.trim().toLowerCase() === 'y') {
    await db.from('meeting_transcripts').delete().eq('session_id', session.id);
    await db.from('meeting_sessions').delete().eq('id', session.id);
    console.log('✅  Test session deleted');
  }
  process.exit(0);
});
