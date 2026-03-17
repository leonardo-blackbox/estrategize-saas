import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  listConsultanciesWithStats,
  getConsultancy,
  createConsultancy,
  updateConsultancy,
  softDeleteConsultancy,
} from '../services/consultancyService.js';
import {
  createDiagnosis,
  getDiagnosisByConsultancy,
  updateDiagnosis,
  getDiagnosisHistory,
} from '../services/diagnosisService.js';
import { getOrCreateProfile, upsertProfile } from '../services/consultancyProfileService.js';
import { getOrCreateStages, updateStage } from '../services/consultancyStageService.js';
import {
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../services/meetingService.js';
import {
  listActionItems,
  getActionItem,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from '../services/actionItemService.js';
import {
  listDeliverables,
  getDeliverable,
  createManualDeliverable,
  updateDeliverable,
  deleteDeliverable,
  DELIVERABLE_CREDIT_COSTS,
} from '../services/deliverableService.js';
import {
  chatWithAI,
  generateMeetingSummary,
  generateActionPlan,
  generateStrategicDiagnosis,
  addAIMemory,
  listAIMemory,
  deleteAIMemory,
} from '../services/consultancyAIService.js';
import { getInsightCards } from '../services/consultancyContextService.js';
import { withCreditCharge } from '../services/creditService.js';

const router = Router();
router.use(requireAuth);

function paramId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

// ============================================================
// CONSULTANCIES CRUD
// ============================================================

const createSchema = z.object({
  title: z.string().min(1).max(255),
  client_name: z.string().max(255).optional(),
  status: z.enum(['active', 'archived']).optional(),
  phase: z.enum(['onboarding','diagnosis','delivery','implementation','support','closed']).optional(),
  instagram: z.string().max(100).optional(),
  niche: z.string().max(150).optional(),
  start_date: z.string().optional(),
  end_date_estimated: z.string().optional(),
  template: z.enum(['none','positioning','educational_product','local_business','full_restructure']).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  client_name: z.string().max(255).optional(),
  status: z.enum(['active', 'archived']).optional(),
  phase: z.enum(['onboarding','diagnosis','delivery','implementation','support','closed']).optional(),
  instagram: z.string().max(100).optional(),
  niche: z.string().max(150).optional(),
  start_date: z.string().nullable().optional(),
  end_date_estimated: z.string().nullable().optional(),
  template: z.enum(['none','positioning','educational_product','local_business','full_restructure']).optional(),
  implementation_score: z.number().min(0).max(100).optional(),
  strategic_summary: z.string().nullable().optional(),
  real_bottleneck: z.string().nullable().optional(),
  next_meeting_at: z.string().nullable().optional(),
  priority: z.enum(['low','normal','high','at_risk']).optional(),
});

// GET /api/consultancies
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { consultancies, stats } = await listConsultanciesWithStats(req.userId!);
    res.json({ data: consultancies, stats });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/consultancies/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const consultancy = await getConsultancy(req.userId!, paramId(req));
    if (!consultancy) { res.status(404).json({ error: 'Consultancy not found' }); return; }
    res.json({ data: consultancy });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/consultancies
router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const consultancy = await createConsultancy(req.userId!, parsed.data);
    res.status(201).json({ data: consultancy });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// PUT /api/consultancies/:id
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const consultancy = await updateConsultancy(req.userId!, paramId(req), parsed.data);
    if (!consultancy) { res.status(404).json({ error: 'Consultancy not found' }); return; }
    res.json({ data: consultancy });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// DELETE /api/consultancies/:id
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await softDeleteConsultancy(req.userId!, paramId(req));
    if (!deleted) { res.status(404).json({ error: 'Consultancy not found' }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================
// DIAGNOSIS (existing — preserved)
// ============================================================

const DIAGNOSIS_CREDIT_COST = 1;

const diagnosisUpdateSchema = z.object({
  content: z.object({
    executiveSummary: z.string().min(1),
    sections: z.array(z.object({ name: z.string().min(1), insights: z.array(z.string()) })),
  }),
});

router.post('/:id/diagnose', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);
    const consultancy = await getConsultancy(userId, consultancyId);
    if (!consultancy) { res.status(404).json({ error: 'Consultancy not found' }); return; }
    const existing = await getDiagnosisByConsultancy(userId, consultancyId);
    if (existing) { res.status(409).json({ error: 'Diagnosis already exists. Use PUT to update.' }); return; }
    const diagnosis = await withCreditCharge(userId, DIAGNOSIS_CREDIT_COST, async () =>
      createDiagnosis(userId, consultancyId, consultancy.title, consultancy.client_name),
      { idempotencyKey: `diagnosis:${consultancyId}:v1`, referenceId: consultancyId, description: `AI diagnosis for "${consultancy.title}"` },
    );
    res.status(201).json({ data: diagnosis });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    if (error.statusCode === 402 || error.message?.includes('Insufficient credits')) {
      res.status(402).json({ error: 'Insufficient credits' });
    } else {
      res.status(500).json({ error: error.message ?? 'Unknown error' });
    }
  }
});

router.get('/:id/diagnose', async (req: AuthenticatedRequest, res) => {
  try {
    const diagnosis = await getDiagnosisByConsultancy(req.userId!, paramId(req));
    if (!diagnosis) { res.status(404).json({ error: 'No diagnosis found' }); return; }
    res.json({ data: diagnosis });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.put('/:id/diagnose', async (req: AuthenticatedRequest, res) => {
  const parsed = diagnosisUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid content', details: parsed.error.issues }); return; }
  try {
    const updated = await updateDiagnosis(req.userId!, paramId(req), parsed.data.content);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.get('/:id/diagnose/history', async (req: AuthenticatedRequest, res) => {
  try {
    const history = await getDiagnosisHistory(req.userId!, paramId(req));
    res.json({ data: history });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================
// PROFILE
// ============================================================

router.get('/:id/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await getOrCreateProfile(req.userId!, paramId(req));
    res.json({ data: profile });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.put('/:id/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await upsertProfile(req.userId!, paramId(req), req.body);
    res.json({ data: profile });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================
// STAGES
// ============================================================

router.get('/:id/stages', async (req: AuthenticatedRequest, res) => {
  try {
    const stages = await getOrCreateStages(req.userId!, paramId(req));
    res.json({ data: stages });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.put('/:id/stages/:sid', async (req: AuthenticatedRequest, res) => {
  try {
    const stage = await updateStage(req.userId!, paramId(req), String(req.params.sid), req.body);
    res.json({ data: stage });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================
// MEETINGS
// ============================================================

const createMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  scheduled_at: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  meeting_url: z.string().url().optional(),
  participants: z.array(z.string()).optional(),
  agenda: z.string().optional(),
});

router.get('/:id/meetings', async (req: AuthenticatedRequest, res) => {
  try {
    const meetings = await listMeetings(req.userId!, paramId(req));
    res.json({ data: meetings });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.post('/:id/meetings', async (req: AuthenticatedRequest, res) => {
  const parsed = createMeetingSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const meeting = await createMeeting(req.userId!, paramId(req), parsed.data);
    res.status(201).json({ data: meeting });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.put('/:id/meetings/:mid', async (req: AuthenticatedRequest, res) => {
  try {
    const meeting = await updateMeeting(req.userId!, paramId(req), String(req.params.mid), req.body);
    if (!meeting) { res.status(404).json({ error: 'Meeting not found' }); return; }
    res.json({ data: meeting });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.delete('/:id/meetings/:mid', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteMeeting(req.userId!, paramId(req), String(req.params.mid));
    if (!deleted) { res.status(404).json({ error: 'Meeting not found' }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/consultancies/:id/meetings/:mid/summarize — 2 credits
router.post('/:id/meetings/:mid/summarize', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);
    const meeting = await getMeeting(userId, consultancyId, String(req.params.mid));
    if (!meeting) { res.status(404).json({ error: 'Meeting not found' }); return; }
    if (!meeting.transcript && !meeting.agenda) {
      res.status(400).json({ error: 'Meeting needs transcript or agenda to be summarized' });
      return;
    }
    const consultancy = await getConsultancy(userId, consultancyId);
    if (!consultancy) { res.status(404).json({ error: 'Consultancy not found' }); return; }

    const output = await withCreditCharge(userId, 2, async () =>
      generateMeetingSummary(userId, consultancyId, consultancy.title, meeting.title, meeting.transcript ?? meeting.agenda ?? '', meeting.agenda),
      { idempotencyKey: `meeting-summary:${String(req.params.mid)}`, referenceId: String(req.params.mid), description: `Meeting summary: ${meeting.title}` },
    );

    // Save summary back to meeting
    await updateMeeting(userId, consultancyId, String(req.params.mid), {
      summary: (output.content as { summary?: string }).summary ?? '',
      decisions: (output.content as { decisions?: string[] }).decisions ?? [],
      next_steps: (output.content as { next_steps?: string[] }).next_steps ?? [],
      open_questions: (output.content as { open_questions?: string[] }).open_questions ?? [],
    });

    res.json({ data: output });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    if (error.statusCode === 402) { res.status(402).json({ error: 'Insufficient credits' }); return; }
    res.status(500).json({ error: error.message ?? 'Unknown error' });
  }
});

// ============================================================
// ACTION ITEMS
// ============================================================

const createActionItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low','medium','high','critical']).optional(),
  responsible: z.string().optional(),
  due_date: z.string().optional(),
  expected_impact: z.string().optional(),
  meeting_id: z.string().uuid().optional(),
  origin: z.enum(['manual','meeting_ai','diagnosis_ai']).optional(),
});

router.get('/:id/actions', async (req: AuthenticatedRequest, res) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
    };
    const items = await listActionItems(req.userId!, paramId(req), filters as Parameters<typeof listActionItems>[2]);
    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.post('/:id/actions', async (req: AuthenticatedRequest, res) => {
  const parsed = createActionItemSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const item = await createActionItem(req.userId!, paramId(req), parsed.data);
    res.status(201).json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.put('/:id/actions/:aid', async (req: AuthenticatedRequest, res) => {
  try {
    const item = await updateActionItem(req.userId!, paramId(req), String(req.params.aid), req.body);
    if (!item) { res.status(404).json({ error: 'Action item not found' }); return; }
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.delete('/:id/actions/:aid', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteActionItem(req.userId!, paramId(req), String(req.params.aid));
    if (!deleted) { res.status(404).json({ error: 'Action item not found' }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================
// DELIVERABLES
// ============================================================

const createDeliverableSchema = z.object({
  type: z.enum(['executive_summary','action_plan','strategic_diagnosis','competition_analysis','positioning_doc','content_bank','offer_structure','contract','client_manual','presentation','meeting_summary','custom']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  file_url: z.string().url().optional(),
});

const generateDeliverableSchema = z.object({
  type: z.enum(['executive_summary','action_plan','strategic_diagnosis','competition_analysis','positioning_doc','content_bank','meeting_summary']),
});

router.get('/:id/deliverables', async (req: AuthenticatedRequest, res) => {
  try {
    const deliverables = await listDeliverables(req.userId!, paramId(req));
    res.json({ data: deliverables });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.post('/:id/deliverables', async (req: AuthenticatedRequest, res) => {
  const parsed = createDeliverableSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const deliverable = await createManualDeliverable(req.userId!, paramId(req), parsed.data);
    res.status(201).json({ data: deliverable });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/consultancies/:id/deliverables/generate — AI generation (costs credits)
router.post('/:id/deliverables/generate', async (req: AuthenticatedRequest, res) => {
  const parsed = generateDeliverableSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);
    const { type } = parsed.data;
    const creditCost = DELIVERABLE_CREDIT_COSTS[type];

    const consultancy = await getConsultancy(userId, consultancyId);
    if (!consultancy) { res.status(404).json({ error: 'Consultancy not found' }); return; }

    const output = await withCreditCharge(userId, creditCost, async () => {
      if (type === 'action_plan') return generateActionPlan(userId, consultancyId, consultancy.title);
      if (type === 'strategic_diagnosis') return generateStrategicDiagnosis(userId, consultancyId, consultancy.title);
      throw new Error(`Generation for type "${type}" not implemented yet`);
    }, {
      idempotencyKey: `deliverable:${consultancyId}:${type}:${Date.now()}`,
      referenceId: consultancyId,
      description: `AI deliverable: ${type} for "${consultancy.title}"`,
    });

    res.json({ data: output });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    if (error.statusCode === 402) { res.status(402).json({ error: 'Insufficient credits' }); return; }
    res.status(500).json({ error: error.message ?? 'Unknown error' });
  }
});

router.put('/:id/deliverables/:did', async (req: AuthenticatedRequest, res) => {
  try {
    const deliverable = await updateDeliverable(req.userId!, paramId(req), String(req.params.did), req.body);
    if (!deliverable) { res.status(404).json({ error: 'Deliverable not found' }); return; }
    res.json({ data: deliverable });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.delete('/:id/deliverables/:did', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteDeliverable(req.userId!, paramId(req), String(req.params.did));
    if (!deleted) { res.status(404).json({ error: 'Deliverable not found' }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ============================================================
// AI DEDICATED
// ============================================================

// GET /api/consultancies/:id/ai/context
router.get('/:id/ai/context', async (req: AuthenticatedRequest, res) => {
  try {
    const cards = await getInsightCards(req.userId!, paramId(req));
    res.json({ data: cards });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/consultancies/:id/ai/chat — 1 credit per message
router.post('/:id/ai/chat', async (req: AuthenticatedRequest, res) => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) { res.status(400).json({ error: 'message is required' }); return; }
  try {
    const userId = req.userId!;
    const consultancyId = paramId(req);
    const consultancy = await getConsultancy(userId, consultancyId);
    if (!consultancy) { res.status(404).json({ error: 'Consultancy not found' }); return; }

    const result = await withCreditCharge(userId, 1, async () =>
      chatWithAI(userId, consultancyId, consultancy.title, message.trim()),
      { idempotencyKey: `ai-chat:${consultancyId}:${Date.now()}`, referenceId: consultancyId, description: `AI chat for "${consultancy.title}"` },
    );

    res.json({ data: result });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    if (error.statusCode === 402) { res.status(402).json({ error: 'Insufficient credits' }); return; }
    res.status(500).json({ error: error.message ?? 'Unknown error' });
  }
});

// GET /api/consultancies/:id/ai/memory
router.get('/:id/ai/memory', async (req: AuthenticatedRequest, res) => {
  try {
    const memories = await listAIMemory(req.userId!, paramId(req));
    res.json({ data: memories });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/consultancies/:id/ai/memory
router.post('/:id/ai/memory', async (req: AuthenticatedRequest, res) => {
  const { memory_type, content, importance, source } = req.body as {
    memory_type?: string; content?: string; importance?: number; source?: string;
  };
  if (!memory_type || !content) { res.status(400).json({ error: 'memory_type and content are required' }); return; }
  try {
    await addAIMemory(req.userId!, paramId(req), memory_type, content, importance ?? 3, source);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// DELETE /api/consultancies/:id/ai/memory/:mid
router.delete('/:id/ai/memory/:mid', async (req: AuthenticatedRequest, res) => {
  try {
    await deleteAIMemory(req.userId!, paramId(req), String(req.params.mid));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
