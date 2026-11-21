# Native Work Handoff

## Active lease — archived WEB validator / round-trip audit

- Prior recurrence/Coverage lease was released with Status READY_FOR_NEXT_RUN and is complete.
- Current app feature HEAD at claim: `b9cbe597cef4d96066e4c2a798a0eaf5289b997d`; stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.
- Exact first unfinished action from IMPLEMENTATION_QUEUE: audit the archived WEB v18.20 validator and prove populated, lossless native → WEB JSON → native round-trip using synthetic fixtures. Keep WEB JSON export disabled until both validator acceptance and reverse-import field preservation are demonstrated.

## Latest completed stage — recurrence / cancellation / Coverage parity

- App commits: [577bf0bb7b80da54158084ac51cca582ffca24a1](https://github.com/nikopol000/financial-autonomy-app/commit/577bf0bb7b80da54158084ac51cca582ffca24a1), [5fd5eb4e13d2d2dfeb3819b007f8d12bc6bd44b6](https://github.com/nikopol000/financial-autonomy-app/commit/5fd5eb4e13d2d2dfeb3819b007f8d12bc6bd44b6), [b9cbe597cef4d96066e4c2a798a0eaf5289b997d](https://github.com/nikopol000/financial-autonomy-app/commit/b9cbe597cef4d96066e4c2a798a0eaf5289b997d).
- Verified against archived WEB v18.20 modules 210 (recurring dates), 204 (cancelled/endDate semantics) and 205 (empty month-plan fallback). Corrected exclusive cancellation boundary/status behavior and missing-plan Coverage projection. Added 15 recurrence fixtures including both 2026 DST transition dates, two due-date clamps, local Bucharest round-trip coverage, and source XCTest regressions.
- Isolated checks: Swift 6.2.1 recurrence/lifecycle harness PASS; Bucharest local date round-trip PASS; optional-plan harness PASS; Node 22 WEB reference recurrence/ended harness PASS. These are not app-target XCTest.
- Exact Native iOS CI for current HEAD [44898972709](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44898972709), job `136830595347`: pre-runner failure (`steps=[]`, `logs_url=null`, log 404 BlobNotFound, artifacts 0, combined statuses 0). No retry. xcodebuild/xcodegen unavailable; app build and XCTest remain unverified.
- Preview checkpoint: [f0f34693803bb0360e1d1c424a3ec0e219734eed](https://github.com/nikopol000/financial-autonomy-preview/commit/f0f34693803bb0360e1d1c424a3ec0e219734eed) updates PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md. The prior lease is now released.

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T11:29:00Z
Lease expires UTC: 2026-11-21T12:15:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: b9cbe597cef4d96066e4c2a798a0eaf5289b997d
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before lease: 11a1f22b91b65acbf3e8739359d3fe020993cbab
Feature comparison: 473 ahead / 0 behind; app/main remains unchanged.
PROJECT_STATE.md checkpoint commit: f0f34693803bb0360e1d1c424a3ec0e219734eed (current checkpoint).
IMPLEMENTATION_QUEUE.md checkpoint commit: f0f34693803bb0360e1d1c424a3ec0e219734eed (current checkpoint).

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

Audit the archived WEB v18.20 validator and prove a populated, lossless native → WEB JSON → native round-trip with synthetic fixtures. Cover IDs/order, null-vs-empty collections, recurring status/endDate/history/reminder, fixed month-plan rows, paid declarations and unknown metadata. Keep WEB JSON export disabled until the archived validator accepts the payload and reverse import preserves every field. Then exercise Files import/export and populated Light/Dark screen comparisons. At the first Native iOS CI run exposing real macOS runner steps, run XcodeGen, inspect generated UTI, build Simulator, run all unit/UI tests and inspect the exact .xcresult. Do not repeat pre-runner failures.
