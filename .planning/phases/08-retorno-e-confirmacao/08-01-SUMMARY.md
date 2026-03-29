---
phase: 08-retorno-e-confirmacao
plan: 01
subsystem: payments
tags: [stripe, webhooks, credits, onboarding]

# Dependency graph
requires:
  - phase: 07-stripe-checkout
    provides: checkout.ts sets client_reference_id=userId and metadata.plan_id in Stripe session
  - phase: 02-admin-planos-e-stripe
    provides: stripe_products table with credits column

provides:
  - normalizeStripe extracts client_reference_id as user_id from Stripe webhook payload
  - processPurchase accepts direct user_id to skip expensive listUsers scan
  - processPurchase grants credits from stripe_products.credits after plan enrollment

affects:
  - stripe-webhook-testing
  - credit-balance-display
  - onboarding-flow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - dynamic import for creditService in onboardingService to avoid circular dependency
    - user_id direct path vs email-based fallback for multi-provider webhook normalization

key-files:
  created: []
  modified:
    - backend/src/routes/webhooks.ts
    - backend/src/services/onboardingService.ts

key-decisions:
  - "Dynamic import of grantCredits inside processPurchase avoids potential circular dependency between onboardingService and creditService"
  - "client_reference_id as primary, metadata.user_id as fallback — both set in checkout.ts for redundancy"
  - "Email-based listUsers scan preserved as fallback for Hotmart/Kiwify webhooks that don't have a user_id"
  - "Credits granted after plan_entitlements block — enrollment comes first, then credits as a separate atomic step"

patterns-established:
  - "Multi-source user_id resolution: prefer direct ID over email scan for performance"
  - "Dynamic import pattern for service cross-calls prone to circular deps"

requirements-completed:
  - CHKT-04

# Metrics
duration: 8min
completed: 2026-03-29
---

# Phase 08 Plan 01: Stripe Webhook Credit Granting Summary

**normalizeStripe extracts client_reference_id as userId, processPurchase uses direct user lookup and grants credits from stripe_products.credits after plan enrollment**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-29T05:12:00Z
- **Completed:** 2026-03-29T05:20:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- NormalizedEvent interface now carries user_id extracted from Stripe's client_reference_id (set by checkout.ts)
- processPurchase skips the costly listUsers() admin scan when user_id is present in the event
- After applying plan_entitlements, processPurchase queries stripe_products.credits and calls grantCredits to allocate credits from the purchased plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance normalizeStripe to extract client_reference_id as user_id** - `f693774` (feat)
2. **Task 2: Add credit granting to processPurchase and accept user_id for direct lookup** - `0f05c10` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `backend/src/routes/webhooks.ts` - Added user_id to NormalizedEvent interface; extract data.client_reference_id (with metadata.user_id fallback) in normalizeStripe; pass user_id in purchasePayload
- `backend/src/services/onboardingService.ts` - Added user_id to PurchaseEvent; direct userId path when event.user_id present; credit granting via dynamic import of grantCredits after plan entitlements

## Decisions Made
- Dynamic import of `grantCredits` inside `processPurchase` avoids potential circular dependency between `onboardingService` and `creditService`
- `client_reference_id` is the primary source; `metadata.user_id` is the fallback — both set in `checkout.ts` for redundancy
- Email-based `listUsers` scan preserved as fallback path for Hotmart/Kiwify webhooks that do not carry a platform user_id
- Credits granted after `plan_entitlements` block so enrollment state is correct before credit allocation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Stripe webhook now fully wires payment to user access + credit allocation
- checkout.session.completed events will: find user by ID, apply enrollments, grant credits
- Idempotency preserved via webhook_events.status = 'processed' check in webhooks.ts
- Ready for end-to-end testing of full checkout flow

---
*Phase: 08-retorno-e-confirmacao*
*Completed: 2026-03-29*

## Self-Check: PASSED
- backend/src/routes/webhooks.ts: FOUND
- backend/src/services/onboardingService.ts: FOUND
- Commit f693774: FOUND
- Commit 0f05c10: FOUND
