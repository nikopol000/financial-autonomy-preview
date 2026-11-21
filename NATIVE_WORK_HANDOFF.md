# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T07:03:30Z
Lease expires UTC: 2026-11-21T08:03:30Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 0ee99fe7c6548bcebbee8a46b48c7de61b0ca052
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before release: 733fdbcbb0e9bf028cf2dc057665c0895d641776
Feature comparison: 461 ahead / 0 behind; app/main remains unchanged.
PROJECT_STATE.md checkpoint commit: 043f30f3140bbea82330f67753f628e86efa5461.
IMPLEMENTATION_QUEUE.md checkpoint commit: ed3cf57370a004339d0cca47e085e6620c177e75.

## Active stage — paid-month native projection audit

The first unfinished queue item is to audit ScheduleBook.paidMonths and LoanBook.paidMonths against retained WEB metadata paidMonths and the archived v18.20 import split. Scope is read-only preflight validation and focused regression tests only; do not alter financial formulas, event replay, import splitting, or enable WEB JSON export.

Verified starting evidence:
- The archived v18.20 importer validates paidMonths against expense, debt and recurring IDs, then splits declarations into ScheduleBook only for non-income scheduled recurring/fixed-catalog IDs and LoanBook only for loan-kind debt IDs. Card/overdraft debt IDs and expense IDs absent from monthPlans have no native paid-month destination.
- The importer retains the original WEB dictionary separately in webImportMetadata.paidMonths.
- Native scheduled and debt due engines use paid-month declarations only for obligation projection. ScheduleBook.paidMonths and LoanBook.paidMonths do not post operations or alter owned cash/principal replay; LoanEventOrder orders operations and observations, not paid declarations.
- Existing preflight merges native declarations as sets, but returns early when the native union is empty. This can fail open when WEB metadata contains paid IDs that were not projected natively. It also hides duplicate IDs and does not validate each native collection against its own catalog.
- Exact app feature HEAD is 0ee99fe7c6548bcebbee8a46b48c7de61b0ca052; app/main remains a9b30be147abecea45a63bf7dd8d0a3eb3370366. Exact HEAD has zero combined status contexts and zero Actions workflow runs. Do not retry old pre-runner failures.

Next steps:
1. Re-read exact branch HEAD and relevant files before writes; inspect native validators and archived importer details.
2. Extend only WebBackupExportPreflight with path-specific checks for native month keys, duplicate IDs, collection/catalog membership, cross-domain ID collisions, raw count limits, missing native projection, and WEB IDs that have no native destination. Preserve set-membership semantics; do not sort/rewrite retained WEB arrays.
3. Add XCTest source cases for the above and for the invariant that paid-month declarations affect due projections only, not operation/principal event replay. Do not claim XCTest executed without a macOS runner.
4. Run Swift parser/type-check and a focused isolated harness if available; report stubs distinctly from app-target verification.
5. Commit implementation/tests on the feature branch only. Update preview PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with exact commits, actual checks, blockers and the next action. Release this handoff to READY_FOR_NEXT_RUN using expected-SHA, non-force ref update.

Privacy and financial invariants: local-only storage; no backend, mandatory account, bank sync or telemetry; available credit is not owned money. Never modify or merge app/main. No 100% parity claim until all functional, financial, data, build/test and visual gates pass.
