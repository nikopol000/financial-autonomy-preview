# Financial Autonomy — Project State

Last updated: 2026-10-06
Source of truth: this file plus IMPLEMENTATION_QUEUE.md and the current main commit history.

## Resume protocol
At the start of a new chat/session, read in this order:
1. AGENTS.md
2. PROJECT_STATE.md
3. IMPLEMENTATION_QUEUE.md
4. DEVELOPMENT_WORKFLOW.md
5. latest commits on main

Do not infer the current task only from chat memory. Repository state wins when there is a conflict.

## Current checkpoint
Latest active preview change confirmed in main:
- commit c76a9ac1b743bac877c7eb25814677dfc1b7e70a — `preview: activate debt balance updates`
- preceding publish commit c0bcd3ff745447a9cde0b1cd38b5dff6f00216a2 — `preview: publish debt balance updates`

Current product state:
- Finance items that carry a mutable balance must allow that balance to be updated later.
- This applies to debt/credit products too, not only normal bank accounts.
- Credit card is the concrete case that prompted the change: it must expose `Actualizează soldul`.
- The rule should be applied consistently to every relevant Finance item with a mutable balance.

Immediately preceding completed changes:
- Donations and Subscriptions added as expense types and available when explaining unexplained money.
- Encrypted backup has password confirmation and show/hide password support.
- Daily Budget/Safe pace can use selected budgets, with visibility into which budgets contribute.
- Transfers between own accounts/credit products are supported and are not income/expense.

## Architecture/product constraints
- Local-only product: no backend/account/sync/analytics/telemetry for financial data.
- Preview data is browser-local; persistence follows browser storage behavior.
- Financial truth must not be falsified for privacy presentation.
- Credit availability is not income/owned money.
- Keep business/calculation changes separate from UI-only changes where practical.

## Continuity requirement
Every completed user-testable product change must update this checkpoint in the same development cycle. The checkpoint must name:
- what changed;
- whether it is implemented/published/activated/tested;
- active preview version or identifying commit/bundle when known;
- the next unresolved user request.

If implementation stops mid-task, record the exact first unfinished step in IMPLEMENTATION_QUEUE.md before stopping.
