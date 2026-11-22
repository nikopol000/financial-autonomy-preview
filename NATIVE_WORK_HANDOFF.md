# Native Work Handoff

Status: IN_PROGRESS
Owner: native iOS parity automation
Updated UTC: 2026-11-22T15:10:00Z
Lease expires UTC: 2026-11-22T16:10:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 913de60ab32385d84b7fc07c69d6d6830aceee91
Latest implementation commit: 913de60ab32385d84b7fc07c69d6d6830aceee91
Latest app branch commit: 913de60ab32385d84b7fc07c69d6d6830aceee91
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before lease claim: 4025e0f0a8d173dcbeba97aa2d6c3c3550f84c7e

## Reconciled work found after the previous READY checkpoint

- The prior handoff stopped at app HEAD 4b15b628452252ef26c4d76e4bf51d8900df2aa7 and requested date-context propagation through schedules and debt/loan engines.
- The live feature branch is now five commits ahead at 913de60ab32385d84b7fc07c69d6d6830aceee91 (592 ahead / 0 behind stable app main). The five commits modify ScheduledItems, FixedExpenseMonthPlans, DebtScheduleEngine, LoanEventOrder, LoanLedger, LoanPrincipalReconciliation and add LedgerDateContextPropagationTests. They implement explicit LedgerDateContract parameters with native defaults and WEB v18.20 tests for recurring/fixed dues, debt due dates, loan balance/event ordering and positive-year parity.
- Stable app main remains a9b30be147abecea45a63bf7dd8d0a3eb3370366 and is not modified.
- Startup read AGENTS.md, PROJECT_STATE.md, IMPLEMENTATION_QUEUE.md (full Git blob), DEVELOPMENT_WORKFLOW.md and this handoff from preview main. IMPLEMENTATION_QUEUE.md is 1,089,712 characters; its complete blob was fetched and its latest tail reviewed.

## Current implementation — snapshot validation propagation and restore/replay coverage

- Code inspection found SnapshotValidator derives the correct LedgerDateContract but does not pass it into ScheduledDueEngine.validate, LoanLedgerEngine.validate or LoanEventOrder.validate. These calls still use native defaults, so the newly propagated WEB context is not yet carried through backup validation/replay.
- First code action: pass the metadata-derived dateContract into all three validation calls, retaining .native when no WEB v4 metadata exists and keeping the year-zero import gate closed.
- Add XCTest coverage for encrypted PortableBackup seal/open and LedgerStore restore/reload for (a) a native snapshot with no WEB metadata and (b) a WEB v4 positive-year snapshot containing scheduled items, loan schedule and a linked principal-payment operation. Verify schedule rows and loan principal outputs remain equal to native positive-year behavior. Do not enable year-zero import.
- Run only feasible Linux isolated/parser checks; no xcodebuild/xcodegen is installed. Native CI for exact 913de60 has no surfaced PR-triggered workflow run and no combined statuses. Do not retry prior pre-runner failures.

## Safety and next gate

- No Models/LedgerStore wholesale rewrite, no financial formula or principal/interest changes, no global RecurrenceCalendar changes, no user data mutation, and no WEB JSON export enablement.
- Preserve local-only operation, no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- After this batch, update PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with exact commits, checks and remaining gaps; then set this file to READY_FOR_NEXT_RUN with the exact next task and no lease.
