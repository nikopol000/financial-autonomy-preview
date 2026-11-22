# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-22T16:24:05.306Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: fb0f37ddc132152ca7220d9d4e03121fbf995210
Latest implementation commit: fb0f37ddc132152ca7220d9d4e03121fbf995210
Latest app branch commit: fb0f37ddc132152ca7220d9d4e03121fbf995210
App feature ahead/behind stable main: 602/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff release: 558f4e709dd8a51cdbc40f2c6d64a4aabf3a0a71

## Completed this run — per-record WEB/native date provenance

- App commits: 56811ceeca0f9477b5f8d3ee7d809c829499637a, 58f252cc10b1fa49974571e80f0e1db84e707b09, 1d527a1a27a7a3ea2bbc06d95630f17b39fbed4e, b0dbec89a2090a2ace4afe1a3d7898afc68fa281, fb0f37ddc132152ca7220d9d4e03121fbf995210.
- Added optional Codable `webSourceDay` to Operation and BalanceObservation. WEB importer stamps exact source days; legacy/native nil markers preserve local-calendar behavior.
- LoanEventOrder and LoanLedgerEngine use the per-record resolver; LoanPrincipalReconciliation inherits it. LedgerStore clears markers on native creation, preserves on same-Date correction, clears on Date edit; audit before-images retain original markers.
- SnapshotValidator validates markers in active records and operation/balance audit images. Legacy WEB balance checks without markers retain their prior UTC fallback. Mapper/fingerprint use the same resolver. Year-zero import remains disabled.
- Added mixed-origin UTC+14 ordering/replay, encrypted backup/restore/reload, date-edit, audit, Codable, importer and mapper test sources.
- Local verification: Swift 6.2.1 isolated provenance harness passed (`LEDGER_PER_RECORD_DATE_PROVENANCE_PASS`); added mixed-origin restore/date-edit XCTest source passed `swiftc -frontend -parse`. Neither result is an app-target build or XCTest run.
- Native iOS CI exact HEAD: run 45043439711, job 137272714070, failure before runner allocation; zero steps, logs 404 BlobNotFound, zero artifacts, no combined status contexts. No retry.
- Full Xcode build/tests, Simulator, Files restore and visual comparison remain unverified.

## FIRST NEXT — FinancialCalendarEngine and report date grouping

1. Audit FinancialCalendarEngine, ReportsEngine and MonthlyReviewEngine for Date-backed operation/observation grouping. Resolve imported source-day markers per record while keeping unmarked native records local; add positive-year mixed-origin tests.
2. Then audit WebBudgetWindowEngine, WebDailyPaceEngine, WebAutonomyEngine and WebDashboardSpaceEngine against archived WEB v18.20 positive-year outputs.
3. Continue backup/mapper/fingerprint tests for old snapshots without markers and source-only audit history. Keep year-zero import disabled until every consumer and Apple validation passes.
4. At the first macOS runner, run XcodeGen, full Simulator build, all unit/UI tests, inspect .xcresult, exercise Files restore and compare Light/Dark screens.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes and no user-data mutation.
- Local-only: no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export remains disabled.
