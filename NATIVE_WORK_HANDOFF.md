# Native Work Handoff

Status: IN_PROGRESS
Owner: native parity automation
Updated UTC: 2026-11-22T16:37:29.117Z
Lease expires UTC: 2026-11-22T17:07:29.117Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 38d19bb38c7a0fa6002fc2d663bfac537f003199
Latest implementation commit: 38d19bb38c7a0fa6002fc2d663bfac537f003199
Latest app branch commit: 38d19bb38c7a0fa6002fc2d663bfac537f003199
App feature ahead/behind stable main: 604/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff release: 871a32c271d80841497fa0ca9b0b9b101361c2c4

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
