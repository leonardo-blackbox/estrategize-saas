---
phase: 18-wizard-de-criacao
plan: 02
status: completed
commit: 452431d
files_changed: 3
---

# Summary — Phase 18 Plan 02

## What was done

- **StepBasicData.tsx**: adicionados campos `ticket` (number, opcional) e `start_date` (date, opcional) após `instagram`. Arquivo: 42 linhas.
- **StepContext.tsx**: labels renomeadas ("Dores relatadas", "Objetivo principal"), adicionado `current_stage` textarea e dois checkboxes lado a lado (`has_team`, `has_website`). Arquivo: 67 linhas.
- **CreateConsultancyWizard.tsx**: mutation payload atualizado com 7 novos campos — `ticket` (parseInt), `start_date`, `strategic_summary` (de `form.goal90`), `real_bottleneck` (de `form.problem`), `current_stage`, `has_team`, `has_website`. Arquivo: 97 linhas.

## Decisions

- `goal90` → `strategic_summary` e `problem` → `real_bottleneck` no payload: colunas já existiam no banco
- `has_team` e `has_website` enviados sempre (não opcionais no payload) pois têm `DEFAULT FALSE` no banco
- `ticket` e `start_date` enviados condicionalmente (omitidos se vazios)

## Verification

- TypeScript `--noEmit`: passou sem erros
- StepBasicData ≤80L ✓ (42L)
- StepContext ≤80L ✓ (67L)
- CreateConsultancyWizard ≤200L ✓ (97L)
- Mutation contém: `parseInt(form.ticket)`, `strategic_summary`, `real_bottleneck`, `current_stage`, `has_team`, `has_website`
