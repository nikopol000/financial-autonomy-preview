# Native Work Handoff

Status: IN_PROGRESS
Owner: ChatGPT native iOS automation
Updated UTC: 2026-11-22T17:39:30Z
Lease expires UTC: 2026-11-22T18:09:30Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 4338785513e1582c7119cc0c123cd76af82afe9e
Latest implementation commit: 82762b4215cb2755e6d2b08ec85def7fa727a2e2
Latest app branch commit: 4338785513e1582c7119cc0c123cd76af82afe9e
App feature ahead/behind stable main: 616/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff release: 26f6af9a5ebe279d3ded3d4cd810e86f972bfdc3

## Completed this run — Financial calendar and report date grouping

- App commits: 4c9e43e8af6b0cd3e3b00583209203699f451fc4, 38d19bb38c7a0fa6002fc2d663bfac537f003199.
- ScheduledDueEngine now uses per-record operation source days; FinancialCalendarEngine inherits this for due/paid calculations. ReportsEngine uses the resolver for transaction grouping, inferred start-day and balance-check observation rows. MonthlyReviewEngine inherits the corrected start-day. Current/as-of dates remain native local.
- Added mixed-origin positive-year test sources for scheduled due suppression, report transaction/balance-check grouping and monthly-review start inference.
- `swiftc -frontend -parse` passed on the new calendar/report test snippets. This is syntax only; no app-target typecheck or XCTest execution.
- Native iOS CI exact HEAD: run 45043899650, job 137274138430, failure before runner allocation; zero steps, logs 404 BlobNotFound, zero artifacts, no combined status contexts. No retry.
- Full iOS build/tests, Simulator, Files restore and visual comparison remain unverified.

## FIRST NEXT — WEB budget, daily-pace, autonomy and space consumers

1. Audit WebBudgetWindowEngine, WebDailyPaceEngine, WebAutonomyEngine and WebDashboardSpaceEngine for Date-backed operation/observation conversions. Use the per-record resolver; keep as-of/current dates native local.
2. Add mixed-origin positive-year tests for budget windows, daily pace, autonomy days and dashboard space. Compare with archived WEB v18.20 modules 204–210, including timezone boundaries.
3. Continue remaining Date-backed reports/calendar/UI and old-backup no-marker compatibility. Keep year-zero import disabled.
4. At the first macOS runner, run XcodeGen, full Simulator build, all unit/UI tests, inspect .xcresult, exercise Files restore and compare Light/Dark screens.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change and no financial formula changes.
- Local-only: no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export remains disabled.


## Completed this run — WEB budget, daily-pace, autonomy and space date provenance

- App code checkpoint: `82762b4215cb2755e6d2b08ec85def7fa727a2e2`; final feature HEAD including parity documentation: `4338785513e1582c7119cc0c123cd76af82afe9e`.
- WebBudgetWindowEngine, WebDailyPaceEngine, WebAutonomyEngine and WebDashboardSpaceEngine now use per-record source-day resolution. WEB-marked operations keep the exact source day; unmarked native/legacy operations use local calendar. Current/as-of dates remain native local.
- Added 9 mixed-origin/timezone-boundary and malformed-source-day XCTest cases. The new XCTest source fragments passed parser validation only; no app-target XCTest ran.
- Archived WEB v18.20 modules 204–210 and an isolated Swift 6.2.1 date/arithmetic harness were executed. Budget period 10/15: 31,000 / 1,000 / 30,000; 10/16 spent 3,000. WEB summary: daily 1,764, cash 49,000, space 19,000. Fixed obligation 500 on 10/15 and 0 on 10/16; coverage after obligations 9,000. Swift harness: source day 10/15 vs native local day 10/16 under UTC+14; autonomy 19 covered days, stop 2026-11-03, deficit 52; coverage 9,000; space 19,000.
- Exact final app HEAD `4338785513e1582c7119cc0c123cd76af82afe9e`: no workflow run surfaced; combined status empty. Parent code run 45043899650 failed before runner allocation (zero steps, no logs/artifacts); no retry. Linux Swift 6.2.1 is available; xcodebuild/xcodegen and a macOS runner are not.
- Full iOS build, app-target XCTest, Simulator, .xcresult, Files restore and Light/Dark comparison remain unverified. Year-zero import remains disabled.
- Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched. Local-only/no backend/no mandatory account/no bank sync/no telemetry; available credit is not owned money; .fabackup only writable export; WEB JSON export disabled.

## FIRST NEXT — remaining date presentation, mapper and legacy backup compatibility

1. Audit remaining SwiftUI/history/calendar date presentation and mapper/fingerprint consumers for direct Date-to-day conversions. WEB source days must remain exact; unmarked native dates remain local.
2. Verify old .fabackup snapshots without webSourceDay decode and replay unchanged. Add mixed WEB/native restore/reload tests for operation and balance-observation provenance and audit before-images.
3. Verify mapper/fingerprint and encrypted backup round trips preserve source markers, source-only history and unknown JSON extensions without loss.
4. Keep year-zero import disabled until every Date-backed consumer, round trip, app-target XCTest and Apple build is validated. At the first macOS runner, run XcodeGen, Simulator build, all unit/UI tests, inspect .xcresult, exercise Files restore and compare Light/Dark screens.

## Invariants

- Work only on `financial-autonomy-app:feat/sync-preview-v18-20-ios`; stable app main is untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change and no financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable export; WEB JSON export remains disabled.


## Current lease — provenance-safe legacy backfill

This run reconciled live app feature HEAD `ca26e8dbaa2e0cec8f21aae1375878922461f3ab` and found two commits after the previous 43387855 handoff. Commit `d998727` adds date presentation, legacy WEB v4 provenance backfill and round-trip test sources; `ca26e8d` avoids unnecessary scans and fails closed on invalid dates. The first unfinished safety check is to ensure legacy backfill only restores a source-day marker when the persisted Date still equals the verified WEB source-day instant, and to distinguish balance-check audit before/after source days. Do not alter financial formulas, enable year-zero import, or modify stable app main. CI run `45050187171` for exact HEAD failed before runner allocation (runner_id 0, zero steps, log 404 BlobNotFound); do not retry the same failure.
