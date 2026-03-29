---
phase: 09-conta-e-assinatura
plan: 01
subsystem: backend
tags: [stripe, subscriptions, webhooks, account, billing-portal]
dependency_graph:
  requires: [onboardingService, webhooks, stripe_products, plans, subscriptions tables]
  provides: [GET /api/account/subscription, POST /api/account/billing-portal, subscription record creation on purchase]
  affects: [webhooks.ts (NormalizedEvent), onboardingService.ts (PurchaseEvent)]
tech_stack:
  added: []
  patterns: [delete+insert for subscriptions (no unique constraint on user_id), Stripe billingPortal.sessions.create, live Stripe data enrichment with DB fallback]
key_files:
  created:
    - backend/src/routes/account.ts
  modified:
    - backend/src/services/onboardingService.ts
    - backend/src/routes/webhooks.ts
    - backend/src/app.ts
decisions:
  - delete+insert used instead of upsert for subscriptions table because no unique constraint exists on user_id
  - Stripe subscription data enriched at read time (live API call) with DB fallback on error
  - stripe_products.stripe_price_id used as bridge to resolve plans.id foreign key
  - Stripe type cast to unknown then interface to handle 2026-01-28.clover API version lacking current_period_end on type
metrics:
  duration: 17 min
  completed: 2026-03-29
  tasks_completed: 2
  files_changed: 4
---

# Phase 09 Plan 01: Account Subscription Endpoints Summary

Backend endpoints for subscription info and Stripe Customer Portal, plus subscription record population during webhook processing.

## What Was Built

**GET /api/account/subscription** — Returns active subscription for the authenticated user: plan name, status, current_period_end, cancel_at_period_end, credits_available, credits_per_month. Queries the `subscriptions` table joined to `plans`, then enriches with live Stripe data when a `stripe_subscription_id` is present. Falls back to DB-only data if Stripe call fails.

**POST /api/account/billing-portal** — Creates a Stripe Customer Portal session using the `stripe_customer_id` stored on the subscription. Returns the portal URL. Returns 404 if no Stripe customer is found.

**onboardingService enhancement** — `createSubscriptionRecord()` now runs at the end of `processPurchase` when a plan purchase is detected. It resolves the `plans.id` foreign key via `stripe_products.stripe_price_id`, then deletes any existing subscription for the user and inserts a fresh record with `stripe_customer_id` and `stripe_subscription_id` extracted from the Stripe webhook payload.

**webhooks.ts enhancement** — `NormalizedEvent` now includes `stripe_customer_id` and `stripe_subscription_id`. `normalizeStripe()` extracts both from the checkout session object. The webhook handler passes them through to `processPurchase`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Enhance onboardingService to populate subscriptions table | dcee84e | onboardingService.ts, webhooks.ts |
| 2 | Create account routes (subscription info + billing portal) | 6c24aaa | account.ts (new), app.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe type incompatibility with clover API version**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `stripe.subscriptions.retrieve()` returns `Response<Subscription>` in the 2026-01-28.clover API version, which does not expose `current_period_end` on the type
- **Fix:** Cast return value to `unknown` then to an inline interface with the three needed fields
- **Files modified:** `backend/src/routes/account.ts`
- **Commit:** 6c24aaa

**2. [Rule 2 - Enhancement] Passed `stripe_price_id` from existing DB query instead of second round-trip**
- **Found during:** Task 1 — `stripe_products` was already queried for `credits`
- **Fix:** Extended the existing select to also fetch `stripe_price_id`, avoiding a second query inside `createSubscriptionRecord`
- **Files modified:** `backend/src/services/onboardingService.ts`
- **Commit:** dcee84e

## Self-Check: PASSED

All files present. All commits verified in git history.
