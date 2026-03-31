---
status: awaiting_human_verify
trigger: "Investigate and FIX three bugs in the estrategize-saas app"
created: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:00:00Z
---

## Current Focus

hypothesis: All three fixes applied and verified locally
test: npm run build passes with zero TypeScript errors
expecting: Deploy to Railway resolves Bug 1; Bug 2 and Bug 3 fixed in code
next_action: Human verification after Railway deploy

## Symptoms

expected: /admin/ia loads document list; consultancy chat responds; Recall.ai bot joins and transcribes
actual: Bug 1 = "Erro ao carregar documentos / Not Found"; Bug 2 = chat silent failure; Bug 3 = bot not working
errors: "Not Found" (404) on /api/admin/knowledge; res.reply undefined on chat; signature invalid on Recall webhook
reproduction: Open /admin/ia; send chat message in consultancy; activate Recall bot
started: unknown

## Eliminated

- hypothesis: Route /api/admin/knowledge is not registered
  evidence: Route is registered correctly in app.ts line 125
  timestamp: 2026-03-30

- hypothesis: Bug 1 is a frontend API URL mismatch
  evidence: Frontend correctly calls /api/admin/knowledge via client.ts
  timestamp: 2026-03-30

- hypothesis: Bug 2 is a missing backend endpoint
  evidence: POST /api/consultancies/:id/ai/chat exists and works; problem is response shape
  timestamp: 2026-03-30

## Evidence

- timestamp: 2026-03-30
  checked: backend/src/services/consultancyService.ts ConsultancyTemplate type
  found: type uses 'positioning' | 'educational_product' | 'local_business' | 'full_restructure'
  implication: Mismatches the Zod schema in routes/consultancies.ts which uses 'repositioning' | 'launch' | 'scaling' | 'restructuring' | 'none'

- timestamp: 2026-03-30
  checked: npm run build output
  found: TypeScript error TS2345 in consultancies.ts — ConsultancyTemplate type mismatch prevents build
  implication: Railway deployment fails at build step; production runs stale code without /api/admin/knowledge route

- timestamp: 2026-03-30
  checked: frontend/src/api/consultancies.ts chatWithAI function
  found: sends {message, history}, expects response {reply, credits_used}
  implication: Backend returns {data: {message, credits_spent, conversation_id}} — res.reply is undefined, chat always fails silently

- timestamp: 2026-03-30
  checked: backend/src/routes/webhooks/recall.ts verifyRecallSignature
  found: uses JSON.stringify(req.body) to reconstruct raw body for HMAC verification
  implication: JSON.stringify of already-parsed object produces different byte sequence than original raw body — signature never matches in production; all Recall webhooks rejected with 401

## Resolution

root_cause: |
  Bug 1: ConsultancyTemplate type in consultancyService.ts uses stale values
  ('positioning', 'educational_product', etc.) while routes/consultancies.ts and the
  rest of the codebase use updated values ('repositioning', 'launch', 'scaling',
  'restructuring', 'none'). This TypeScript mismatch breaks npm run build, preventing
  Railway from deploying the updated backend that contains /api/admin/knowledge.

  Bug 2: Response shape mismatch between backend and frontend for the AI chat endpoint.
  Backend returns { data: { message, credits_spent, conversation_id } } but frontend
  useChatMessages.ts reads res.reply and res.credits_used. Since res.reply is undefined,
  the chat message is set to undefined and displayed as empty/broken.

  Bug 3: Recall.ai webhook signature verification uses JSON.stringify(req.body) to
  reconstruct the raw body for HMAC comparison. This produces a canonicalized JSON string
  that differs from the original raw bytes Recall.ai used to compute the signature.
  The solution is to capture the raw body buffer before JSON parsing using express.raw().

fix: |
  Bug 1: Updated ConsultancyTemplate in consultancyService.ts from stale values
  ('positioning', 'educational_product', 'local_business', 'full_restructure') to match
  what routes and frontend use: ('repositioning', 'launch', 'scaling', 'restructuring', 'none').
  Also added ticket, has_team, has_website, current_stage, priority to CreateConsultancyInput
  and UpdateConsultancyInput. npm run build now passes with zero TypeScript errors.

  Bug 2: Updated POST /api/consultancies/:id/ai/chat response from
  { data: { message, credits_spent, conversation_id } } to
  { reply, credits_used, conversation_id } to match what useChatMessages.ts reads.

  Bug 3: Moved /api/webhooks/recall route registration to BEFORE express.json() in
  app.ts, using express.raw({ type: 'application/json' }) so req.body is a raw Buffer.
  Updated recall.ts webhook handler to convert the Buffer to string for HMAC verification
  and JSON.parse for event data, instead of using JSON.stringify(req.body).

verification: npm run build passes with zero errors (confirmed locally)
files_changed:
  - backend/src/services/consultancyService.ts
  - backend/src/routes/consultancies.ts
  - backend/src/app.ts
  - backend/src/routes/webhooks/recall.ts
