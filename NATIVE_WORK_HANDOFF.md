# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T08:10:04Z
Lease expires UTC: 2026-11-21T08:55:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 9403c23fb8a54446215bd7f4c301e6c7135bc90b
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main: c29db81e9ed5d76df9da6546b5590ba2bd87330c
Feature comparison: 463 ahead / 0 behind; app/main remains unchanged.
PROJECT_STATE.md checkpoint commit: 043f30f3140bbea82330f67753f628e86efa5461.
IMPLEMENTATION_QUEUE.md checkpoint commit: ed3cf57370a004339d0cca47e085e6620c177e75.

## Active stage — paid-month native projection audit

The first unfinished queue item remains the ScheduleBook.paidMonths + LoanBook.paidMonths projection/replay audit. The previous handoff description of an early return on an empty native union is stale: current HEAD 9403c23 contains the full retained-WEB destination loop introduced by eca00d7, and the regression test testPaidMonthProjectionRequiresNativeDestinationsForEveryRetainedWEBID exercises a missing native projection. Do not reimplement that fix.

Verified current behavior:
- Archived v18.20 parsePaidMonths validates exact WEB month keys, duplicate raw strings, payable catalog membership and 100,000 ID bound. The importer splits markers into ScheduleBook only for non-income recurring/fixed month-plan items and LoanBook only for loan-kind debts, while retaining the original WEB dictionary in webImportMetadata.paidMonths.
- Card/overdraft debts and expense templates absent from monthPlans are accepted by the WEB parser but have no native paid-month destination; the current preflight blocks them.
- Current preflight checks both native collections independently, duplicates, wrong catalog membership, cross-domain collisions, raw counts, missing retained/native membership, and preserves retained WEB order/empty buckets. Comparison is set-based because both due engines use membership checks.
- Existing LoanEventOrderTests prove a loan paid marker changes debt due projection but does not post an operation, alter principal replay, or advance event order. A matching ScheduleBook/LedgerStore invariant test is still missing.
- Importer round-trip coverage exists in testPaidMonthsAndDashboardOrderRetainDeclarationsAndNativeFlags; inspect whether its fixture covers recurring, fixed month-plan expense, loan, card and retained raw ordering before treating import splitting as fully covered.
- Exact current app feature HEAD: 9403c23fb8a54446215bd7f4c301e6c7135bc90b; stable app main: a9b30be147abecea45a63bf7dd8d0a3eb3370366; feature comparison: 463 ahead / 0 behind.
- Exact HEAD Native iOS CI run 44879967769 failed in 2 seconds before runner allocation: job 136772879949, steps null/empty, logs_url null, log fetch 404 BlobNotFound, artifacts 0, combined status contexts 0. This is infrastructure failure, not compiler/test evidence. Do not retry it.

Next steps:
1. Inspect the existing importer split fixture and current schedule due/store APIs.
2. Add a focused XCTest proving setScheduledPaid changes only current-month due projection, does not post or mutate operations/account cash, and does not affect LoanEventOrder.next; add a cross-domain catalog-collision regression only if current tests do not already assert it.
3. Resolve the empty native year-zero bucket edge consistently with the documented rule that empty month buckets have no due-state semantics; preserve non-empty year-zero blockers.
4. Run swiftc parse/type-check and an isolated harness where possible; label stubs distinctly. Do not claim app-target XCTest without macOS.
5. Commit code/tests only on feat/sync-preview-v18-20-ios. Update preview PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with exact commit, real checks, CI evidence, blockers and exact next action. Release this handoff to READY_FOR_NEXT_RUN using current blob SHA and non-force expected-SHA ref update.

Privacy and financial invariants: local-only storage; no backend, mandatory account, bank sync or telemetry; available credit is not owned money. Never modify or merge app/main. No 100% parity claim until all functional, financial, data, build/test and visual gates pass.
