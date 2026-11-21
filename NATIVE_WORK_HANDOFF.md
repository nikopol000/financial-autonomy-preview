# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T06:03:41Z
Lease expires UTC: 2026-11-21T06:35:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: e10f224d13ca9bf0daf3bd28339b5904cf4dfa4f
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before lease: 04ace193b9de938b992750d90e49b03a6d91cb3c
Feature comparison: 454 ahead / 0 behind; app/main remains unchanged.
PROJECT_STATE.md checkpoint commit: f1e172ba7bae6fcb1968eb2d335fb07c6ed16cc9.
IMPLEMENTATION_QUEUE.md checkpoint commit: 670d982674a448a0b62a71699e7650c9ada7fdd3.

## Active stage — monthly review projection parity

- Reconciled the queue's first unfinished action against the current feature branch: audit monthlyReviewProgress ↔ retained WEB reviews using MonthlyReviewEngine, LedgerStore.updateMonthlyReviewProgress, and archived v18.20 parseReviews.
- Current runtime precedence is retained WEB reviews first, then native monthlyReviewProgress overrides the same month. LedgerStore.updateMonthlyReviewProgress currently repeats that merge inline and writes the merged dictionary back to both persisted copies when metadata exists.
- Archived WEB parseReviews accepts only a four-digit-year/month key (YYYY-MM, month 01...12), integer stage 0...4, and at most 100,000 entries. The current export preflight does not validate the native monthly-review dictionary or the effective merged dictionary.
- Planned bounded change: centralize the exact existing merge precedence in MonthlyReviewEngine, reuse it in pending-month selection and the store write path, and make the read-only export preflight reject invalid review keys/stages and >100,000 effective entries with exact field paths. Add regression tests proving native-over-WEB precedence and fail-closed validation. Do not alter review unlock/stage semantics or financial calculations.
- Native iOS CI for current docs HEAD e10f224d13ca9bf0daf3bd28339b5904cf4dfa4f has zero combined status contexts and no commit-associated PR workflow runs. Last code HEAD 2ae11e973ab088f5b85efcd6d3cc7afa1061d2bd also has zero combined contexts and no PR workflow runs. Workflow is push-path-filtered to NativeiOS Swift/XcodeGen/workflow files. Previous exact run 44865773341 failed before runner allocation; do not retry the same failure.
- Keep WEB JSON export disabled; .fabackup remains the only writable export. No formula, Models.swift, wholesale LedgerStore.swift, app/main, or user data changes.

## Exact next action

Implement the monthly-review merge helper and export-preflight validation/tests on the feature branch only; run the available isolated Swift verification, then update PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with the exact resulting commit and limitations. Release this handoff to READY_FOR_NEXT_RUN with the next paid-month native-union/replay action.
