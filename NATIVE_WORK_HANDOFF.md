# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T09:20:02Z
Lease expires UTC: not leased
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 808cdc65a2a13febcf0bc2a7e20f18e30f4fb646
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before handoff release: a692890cb52d79f87748275cd01c69b14d1131f7
Feature comparison: 466 ahead / 0 behind; app/main remains unchanged.
PROJECT_STATE.md checkpoint commit: a692890cb52d79f87748275cd01c69b14d1131f7.
IMPLEMENTATION_QUEUE.md checkpoint commit: a692890cb52d79f87748275cd01c69b14d1131f7.

## Completed stage — paid-month native projection/replay audit

- Commit [323d2191717dc77383985109bfeb8567a2663b7e](https://github.com/nikopol000/financial-autonomy-app/commit/323d2191717dc77383985109bfeb8567a2663b7e) precomputes opposite-domain paid-ID sets per month, avoiding quadratic Set reconstruction at the 100,000-ID limit.
- Added source tests for raw native ID count >100,000, cross-domain catalog collision and empty native year-zero bucket. The native empty year-zero bucket remains blocked because ScheduledDueEngine validates the month key before checking IDs; an empty retained WEB bucket remains preservable.
- Added ScheduleBook/LedgerStore due-only invariant test: paid declaration changes the current due projection only; cash, operations, loan principal and LoanEventOrder remain unchanged.
- Expanded the archived WEB importer fixture with a recurring subscription. The retained WEB array preserves all four IDs/order; ScheduleBook receives the fixed month-plan expense + recurring IDs; LoanBook receives only the loan ID; card remains unprojected. Native backup round-trip assertions remain.
- Reconciled the stale previous handoff claim: the empty-native-union early-return fix already existed at 9403c23 via eca00d7 and was covered by testPaidMonthProjectionRequiresNativeDestinationsForEveryRetainedWEBID. It was not duplicated.
- Isolated Swift 6.2.1 checks passed: Set/count harness type-check + run; recurring JSON fixture/split harness type-check + run; new XCTest snippets swiftc -parse. These are not app-target XCTest.
- Exact Native iOS CI run [44884220273](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44884220273), job 136785883931, failed before runner steps: steps null/empty, logs_url null, log fetch 404 BlobNotFound, artifacts 0, combined contexts 0. The preceding run 44879967769 had the same failure. No retry; no compiler diagnostic.
- xcodebuild/xcodegen unavailable on Linux. No app build, app XCTest/UI, Simulator, Files-provider, xcresult or screenshot comparison. WEB JSON remains import-only; native .fabackup remains the only writable export. No Models/LedgerStore/formula/main/privacy changes.

## Completed stage — recurring + fixed-expense projection audit

- App commits: [249516ac2e3609d756a9668f87cc6f5ebf9a3e8f](https://github.com/nikopol000/financial-autonomy-app/commit/249516ac2e3609d756a9668f87cc6f5ebf9a3e8f) and [808cdc65a2a13febcf0bc2a7e20f18e30f4fb646](https://github.com/nikopol000/financial-autonomy-app/commit/808cdc65a2a13febcf0bc2a7e20f18e30f4fb646).
- Read-only preflight now checks recurring native-vs-WEB field/order parity, recurring ScheduleBook projection, fixed month-plan rows and boundaries, latest fixed catalog, missing/extra/duplicate items, and 100,000 limits. Three focused source XCTest cases added. Existing generic mapping blockers remain; JSON export remains disabled.
- Verified WEB v18.20 \`dayKnown\` difference: archived WEB timeline suppresses the date when false; native ScheduledItemsView currently displays ScheduledDue.day. Retained metadata keeps the original flag, but iPhone visual parity is incomplete.
- Isolated Swift 6.2.1 checks PASS: reduced projection harness type-check + run; XCTest snippets parse and type-check with explicit stubs. These are not app-target tests.
- Native iOS CI exact push runs [44888612798](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44888612798) and [44888979504](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44888979504) both failed before macOS runner steps: \`steps=null\`, \`logs_url=null\`, artifacts 0. No compiler output and no reruns. xcodebuild/xcodegen unavailable.
- No Models/LedgerStore wholesale changes, importer/formula/replay changes, app/main changes, real user data, backend, mandatory account, bank sync or telemetry. WEB JSON remains import-only; native \`.fabackup\` remains the only writable export.

## Exact next action

Implement iPhone parity for WEB v18.20 fixed-expense \`dayKnown\` without changing financial formulas: trace all timeline/due consumers; carry the flag backward-compatibly or derive it from retained monthPlans; do not display a concrete due date when WEB marks it unknown; add importer, native-backup round-trip and UI/model tests. Then audit weekly/monthly/quarterly/yearly recurrence and coveredByBudget role-effective dates against the archived bundle. At the first Native iOS CI run with real macOS runner steps, execute XcodeGen, Simulator build, full unit/UI tests and inspect the exact \`.xcresult\`; do not repeat pre-runner failures.
Privacy and financial invariants: local-only storage; no backend, mandatory account, bank sync or telemetry; available credit is not owned money. Never modify or merge app/main. No 100% parity claim until functional, financial, data, build/test and visual gates all pass.
