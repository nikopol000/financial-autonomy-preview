# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T09:05:28Z
Lease expires UTC: 2026-11-21T09:35:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 323d2191717dc77383985109bfeb8567a2663b7e
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before handoff release: ee26a3574fbcb869a5d253240076e0f1cbe38ddf
Feature comparison: 464 ahead / 0 behind; app/main remains unchanged.
PROJECT_STATE.md checkpoint commit: ee26a3574fbcb869a5d253240076e0f1cbe38ddf.
IMPLEMENTATION_QUEUE.md checkpoint commit: ee26a3574fbcb869a5d253240076e0f1cbe38ddf.

## Completed stage — paid-month native projection/replay audit

- Commit [323d2191717dc77383985109bfeb8567a2663b7e](https://github.com/nikopol000/financial-autonomy-app/commit/323d2191717dc77383985109bfeb8567a2663b7e) precomputes opposite-domain paid-ID sets per month, avoiding quadratic Set reconstruction at the 100,000-ID limit.
- Added source tests for raw native ID count >100,000, cross-domain catalog collision and empty native year-zero bucket. The native empty year-zero bucket remains blocked because ScheduledDueEngine validates the month key before checking IDs; an empty retained WEB bucket remains preservable.
- Added ScheduleBook/LedgerStore due-only invariant test: paid declaration changes the current due projection only; cash, operations, loan principal and LoanEventOrder remain unchanged.
- Expanded the archived WEB importer fixture with a recurring subscription. The retained WEB array preserves all four IDs/order; ScheduleBook receives the fixed month-plan expense + recurring IDs; LoanBook receives only the loan ID; card remains unprojected. Native backup round-trip assertions remain.
- Reconciled the stale previous handoff claim: the empty-native-union early-return fix already existed at 9403c23 via eca00d7 and was covered by testPaidMonthProjectionRequiresNativeDestinationsForEveryRetainedWEBID. It was not duplicated.
- Isolated Swift 6.2.1 checks passed: Set/count harness type-check + run; recurring JSON fixture/split harness type-check + run; new XCTest snippets swiftc -parse. These are not app-target XCTest.
- Exact Native iOS CI run [44884220273](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44884220273), job 136785883931, failed before runner steps: steps null/empty, logs_url null, log fetch 404 BlobNotFound, artifacts 0, combined contexts 0. The preceding run 44879967769 had the same failure. No retry; no compiler diagnostic.
- xcodebuild/xcodegen unavailable on Linux. No app build, app XCTest/UI, Simulator, Files-provider, xcresult or screenshot comparison. WEB JSON remains import-only; native .fabackup remains the only writable export. No Models/LedgerStore/formula/main/privacy changes.

## Exact next action

1. Inspect Native iOS CI for current exact app HEAD. Do not rerun the pre-runner failures; at the first run exposing real macOS runner steps, execute XcodeGen, generated UTI inspection, Simulator build, full unit/UI suite and exact xcresult.
2. While CI remains pre-runner blocked, audit ScheduleBook.items / fixedExpensePlans / recurringCommitments against archived WEB v18.20 recurring and monthPlans: catalog IDs, kind/frequency/status, history, cancellation/end dates, reminders, fixed-plan rows and retained-vs-native precedence. Add only read-only path-specific preflight rules/tests for proven lossless mappings; keep JSON export disabled.
3. Prove the archived WEB validator and lossless native-to-WEB-to-native round-trip before implementing/advertising JSON export; then exercise Files and populated Light/Dark screens.
4. Keep Build19-gated paidMonths/finite-installment/closedAt/refinance formula changes untouched.

Privacy and financial invariants: local-only storage; no backend, mandatory account, bank sync or telemetry; available credit is not owned money. Never modify or merge app/main. No 100% parity claim until functional, financial, data, build/test and visual gates all pass.
