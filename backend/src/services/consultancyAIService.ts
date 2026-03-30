import OpenAI from 'openai';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { buildFullContext, type ConsultancyContextBlock } from './consultancyContextService.js';
import { retrieveRAGContext, type RAGChunk } from './ragService.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// Iris Methodology — injected into every system prompt
// ============================================================
const IRIS_METHODOLOGY = `
METODOLOGIA IRIS DE CONSULTORIA ESTRATÉGICA:

A Iris é uma consultora estratégica especializada em negócios de serviços, profissionais criativos, educadores e empreendedores. Sua metodologia central separa sintoma de gargalo real e transforma contexto solto em direção estratégica clara.

PRINCÍPIOS FUNDAMENTAIS:
1. Diagnóstico antes de solução — nunca recomendar sem entender o problema real
2. Separar sintoma de gargalo — o que a cliente relata não é o problema real; investigar fundo
3. Transformação "de → para" — toda consultoria tem um estado atual e um estado desejado claros
4. Diferenciais reais — identificar o que é genuinamente único naquele negócio
5. Priorização rigorosa — máximo 3 prioridades por semana; foco gera resultado
6. Acompanhamento de implementação — entrega sem acompanhamento é desperdício
7. Contexto específico — nunca usar conselhos genéricos; tudo é baseado na realidade daquela cliente

FRAMEWORK DE DIAGNÓSTICO IRIS:
- Problema relatado vs. gargalo real
- Análise crítica (o que a consultora enxerga além do que a cliente vê)
- Diferenciais reais (não percebidos pela cliente)
- Público ideal vs. público atual
- Objeções do mercado
- Crenças erradas que sabotam o negócio
- Prioridades estratégicas ordenadas por impacto

TOM E POSTURA:
- Firme, clara, direta — nunca vaga
- Baseada em dados e evidências reais, não em opiniões
- Humana e presente — não robótica
- Estratégica primeiro, tática depois
- Sempre conectar insights ao plano de ação
`;

// ============================================================
// Types
// ============================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  message: string;
  credits_spent: number;
  conversation_id: string;
}

export interface GeneratedOutput {
  type: string;
  title: string;
  content: Record<string, unknown>;
  credits_spent: number;
}

// ============================================================
// Helpers
// ============================================================

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

function buildSystemPrompt(context: ConsultancyContextBlock, consultancyTitle: string): string {
  const contextLines: string[] = [];

  if (context.client_name) contextLines.push(`Nome da cliente: ${context.client_name}`);
  if (context.brand && context.brand !== context.client_name) contextLines.push(`Marca/negócio: ${context.brand}`);
  if (context.niche) contextLines.push(`Nicho: ${context.niche}`);
  if (context.instagram) contextLines.push(`Instagram: @${context.instagram}`);
  if (context.city) contextLines.push(`Localização: ${context.city}${context.state ? `, ${context.state}` : ''}`);
  if (context.phase) contextLines.push(`Fase atual da consultoria: ${context.phase}`);
  if (context.current_stage_name) contextLines.push(`Etapa atual: ${context.current_stage_name}`);
  if (context.implementation_score > 0) contextLines.push(`Score de implementação: ${context.implementation_score}/100`);
  if (context.main_objective) contextLines.push(`Objetivo principal: ${context.main_objective}`);
  if (context.real_bottleneck) contextLines.push(`Gargalo real identificado: ${context.real_bottleneck}`);
  if (context.strategic_summary) contextLines.push(`Resumo estratégico: ${context.strategic_summary}`);
  if (context.diagnosis_summary) contextLines.push(`Diagnóstico (sumário): ${context.diagnosis_summary}`);
  if (context.main_offer) contextLines.push(`Oferta principal: ${context.main_offer}`);
  if (context.business_type) contextLines.push(`Tipo de negócio: ${context.business_type}`);
  if (context.reported_pains.length > 0) contextLines.push(`Dores relatadas: ${context.reported_pains.join('; ')}`);
  if (context.current_audience) contextLines.push(`Público atual: ${context.current_audience}`);
  if (context.desired_audience) contextLines.push(`Público desejado: ${context.desired_audience}`);
  if (context.open_action_items_count > 0) contextLines.push(`Tarefas em aberto: ${context.open_action_items_count}`);

  if (context.recent_meeting_summaries.length > 0) {
    contextLines.push(`\nReuniões recentes:\n${context.recent_meeting_summaries.map((s) => `- ${s}`).join('\n')}`);
  }

  if (context.deliverables_summary.length > 0) {
    contextLines.push(`\nEntregáveis produzidos:\n${context.deliverables_summary.map((d) => `- ${d}`).join('\n')}`);
  }

  if (context.critical_memories.length > 0) {
    contextLines.push(`\nMemórias críticas:\n${context.critical_memories.map((m) => `- [${m.type}] ${m.content}`).join('\n')}`);
  }

  return `Você é a IA Dedicada da consultoria "${consultancyTitle}".

Você foi treinada com a metodologia Iris de consultoria estratégica e tem acesso completo ao contexto desta cliente específica. Seu papel é agir como copiloto estratégico da consultora — com memória viva desta consultoria.

${IRIS_METHODOLOGY}

CONTEXTO DESTA CONSULTORIA:
${contextLines.length > 0 ? contextLines.join('\n') : 'Consultoria recém-criada — contexto ainda sendo construído.'}

INSTRUÇÕES OPERACIONAIS:
- Responda sempre com base no contexto real desta cliente, não com conselhos genéricos
- Quando não tiver informação suficiente, diga o que precisa saber antes de recomendar
- Mantenha o foco estratégico: diagnóstico → prioridade → ação
- Use linguagem direta, clara e profissional em português
- Nunca invente dados sobre a cliente — use apenas o contexto fornecido`;
}

function buildRAGContextBlock(chunks: RAGChunk[]): string {
  if (chunks.length === 0) return '';

  const lines: string[] = [
    'DOCUMENTOS DE REFERENCIA (Base de Conhecimento):',
    'Os trechos abaixo foram recuperados da base de conhecimento e sao relevantes para a pergunta da consultora. Use-os como referencia para fundamentar sua resposta.',
    '',
  ];

  chunks.forEach((chunk, index) => {
    lines.push('---');
    lines.push(`[Documento ${index + 1}] (relevancia: ${Math.round(chunk.similarity * 100)}%)`);
    lines.push(chunk.content);
    lines.push('');
  });

  return lines.join('\n');
}

async function getOrCreateConversation(
  userId: string,
  consultancyId: string,
): Promise<{ id: string; messages: ChatMessage[] }> {
  const db = ensureAdmin();

  const { data: existing } = await db
    .from('consultancy_ai_conversations')
    .select('id,messages')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return { id: existing.id, messages: existing.messages as ChatMessage[] };

  const { data: created, error } = await db
    .from('consultancy_ai_conversations')
    .insert({ consultancy_id: consultancyId, user_id: userId, messages: [] })
    .select('id,messages')
    .single();

  if (error || !created) throw new Error('Failed to create conversation');
  return { id: created.id, messages: [] };
}

async function saveConversation(
  conversationId: string,
  messages: ChatMessage[],
  creditsSpent: number,
): Promise<void> {
  const db = ensureAdmin();
  await db
    .from('consultancy_ai_conversations')
    .update({
      messages,
      credits_spent: creditsSpent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
}

// ============================================================
// Public API
// ============================================================

export async function chatWithAI(
  userId: string,
  consultancyId: string,
  consultancyTitle: string,
  userMessage: string,
): Promise<ChatResponse> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const [context, conversation, ragChunks] = await Promise.all([
    buildFullContext(userId, consultancyId),
    getOrCreateConversation(userId, consultancyId),
    retrieveRAGContext(userMessage, consultancyId),
  ]);

  const systemPrompt = buildSystemPrompt(context, consultancyTitle);
  const ragBlock = buildRAGContextBlock(ragChunks);
  const finalSystemPrompt = ragBlock ? ragBlock + '\n\n' + systemPrompt : systemPrompt;

  const newUserMsg: ChatMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  };

  const messagesForAPI: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: finalSystemPrompt },
    ...conversation.messages.slice(-20).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messagesForAPI,
    temperature: 0.7,
    max_tokens: 1500,
  });

  const aiContent = response.choices[0]?.message?.content ?? '';
  const tokensUsed = (response.usage?.total_tokens ?? 0);

  const aiMsg: ChatMessage = {
    role: 'assistant',
    content: aiContent,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [...conversation.messages, newUserMsg, aiMsg];
  // 1 credit per message (charged at route level via creditService)
  await saveConversation(conversation.id, updatedMessages, 1);

  return {
    message: aiContent,
    credits_spent: 1,
    conversation_id: conversation.id,
  };
}

export async function generateMeetingSummary(
  userId: string,
  consultancyId: string,
  consultancyTitle: string,
  meetingTitle: string,
  transcript: string,
  agenda: string | null,
): Promise<GeneratedOutput> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const context = await buildFullContext(userId, consultancyId);
  const systemPrompt = buildSystemPrompt(context, consultancyTitle);

  const prompt = `Gere um resumo executivo desta reunião de consultoria.

Reunião: ${meetingTitle}
${agenda ? `Pauta: ${agenda}` : ''}
Transcrição: ${transcript}

Retorne um JSON com esta estrutura:
{
  "summary": "resumo executivo em 2-3 parágrafos",
  "decisions": ["decisão 1", "decisão 2"],
  "next_steps": ["próximo passo 1", "próximo passo 2"],
  "open_questions": ["pergunta em aberto 1"],
  "insights": ["insight estratégico importante"]
}

Responda APENAS com JSON válido.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = JSON.parse(response.choices[0]?.message?.content ?? '{}') as Record<string, unknown>;

  return {
    type: 'meeting_summary',
    title: `Resumo: ${meetingTitle}`,
    content,
    credits_spent: 2,
  };
}

export async function generateActionPlan(
  userId: string,
  consultancyId: string,
  consultancyTitle: string,
): Promise<GeneratedOutput> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const context = await buildFullContext(userId, consultancyId);
  const systemPrompt = buildSystemPrompt(context, consultancyTitle);

  const prompt = `Com base no contexto completo desta consultoria, gere um plano de ação estratégico estruturado.

Retorne um JSON com esta estrutura:
{
  "overview": "visão geral do plano em 1 parágrafo",
  "items": [
    {
      "title": "título da tarefa",
      "description": "descrição clara",
      "priority": "high|medium|low",
      "responsible": "consultora|cliente",
      "expected_impact": "impacto esperado",
      "timeframe": "esta semana|próximas 2 semanas|próximo mês"
    }
  ]
}

Máximo 10 itens, priorizados por impacto. Responda APENAS com JSON válido.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = JSON.parse(response.choices[0]?.message?.content ?? '{}') as Record<string, unknown>;

  return {
    type: 'action_plan',
    title: `Plano de Ação — ${context.client_name ?? consultancyTitle}`,
    content,
    credits_spent: 4,
  };
}

export async function generateStrategicDiagnosis(
  userId: string,
  consultancyId: string,
  consultancyTitle: string,
): Promise<GeneratedOutput> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const context = await buildFullContext(userId, consultancyId);
  const systemPrompt = buildSystemPrompt(context, consultancyTitle);

  const prompt = `Gere um diagnóstico estratégico completo desta consultoria usando a metodologia Iris.

Retorne um JSON com esta estrutura:
{
  "executiveSummary": "sumário executivo em 2-3 parágrafos",
  "realBottleneck": "o gargalo real identificado (não o sintoma)",
  "transformation": {
    "from": "estado atual detalhado",
    "to": "estado desejado com a consultoria"
  },
  "sections": [
    {
      "name": "Diagnóstico Interno",
      "insights": ["insight 1", "insight 2"]
    },
    {
      "name": "Realidade de Mercado",
      "insights": ["insight 1", "insight 2"]
    },
    {
      "name": "Diferenciais Reais",
      "insights": ["insight 1", "insight 2"]
    },
    {
      "name": "Objeções e Crenças",
      "insights": ["insight 1", "insight 2"]
    },
    {
      "name": "Prioridades Estratégicas",
      "insights": ["prioridade 1", "prioridade 2", "prioridade 3"]
    }
  ]
}

Responda APENAS com JSON válido.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const content = JSON.parse(response.choices[0]?.message?.content ?? '{}') as Record<string, unknown>;

  // Auto-save real bottleneck to consultancy if found
  if (content.realBottleneck && supabaseAdmin) {
    await supabaseAdmin
      .from('consultancies')
      .update({ real_bottleneck: content.realBottleneck })
      .eq('id', consultancyId)
      .eq('user_id', userId);
  }

  return {
    type: 'strategic_diagnosis',
    title: `Diagnóstico Estratégico — ${context.client_name ?? consultancyTitle}`,
    content,
    credits_spent: 6,
  };
}

export async function addAIMemory(
  userId: string,
  consultancyId: string,
  memoryType: string,
  content: string,
  importance: number = 3,
  source?: string,
): Promise<void> {
  const db = ensureAdmin();
  await db.from('consultancy_ai_memory').insert({
    consultancy_id: consultancyId,
    user_id: userId,
    memory_type: memoryType,
    content,
    importance,
    source: source ?? 'manual',
  });
}

export async function listAIMemory(
  userId: string,
  consultancyId: string,
): Promise<Array<{ id: string; memory_type: string; content: string; importance: number; is_active: boolean; source: string | null; created_at: string }>> {
  const db = ensureAdmin();
  const { data, error } = await db
    .from('consultancy_ai_memory')
    .select('id,memory_type,content,importance,is_active,source,created_at')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('importance', { ascending: false });

  if (error) throw new Error(`Failed to list memories: ${error.message}`);
  return data ?? [];
}

export async function deleteAIMemory(
  userId: string,
  consultancyId: string,
  memoryId: string,
): Promise<void> {
  const db = ensureAdmin();
  await db
    .from('consultancy_ai_memory')
    .delete()
    .eq('id', memoryId)
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId);
}
