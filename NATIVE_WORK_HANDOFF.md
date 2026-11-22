# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-22T15:26:00Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: a3532f9718324966b57e08a1a270848b2e5936d4
Latest implementation commit: a3532f9718324966b57e08a1a270848b2e5936d4
Latest app branch commit: a3532f9718324966b57e08a1a270848b2e5936d4
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff release: 13ad4b68201da7c71454eb50205dcc0c14b021e8

## Completed this run — schedule/debt context and restore/replay test sources

- Reconciled the five commits after the previous handoff. They add explicit LedgerDateContract parameters with native defaults across ScheduledDueEngine, FixedExpenseMonthPlans, DebtScheduleEngine, LoanEventOrder, LoanLedgerEngine and LoanPrincipalReconciliation, with WEB behavior and positive-year parity XCTest source.
- App commits in this run: 94340684832b8b0076cf206894a6853cac6e3f00 (initial SnapshotValidator context propagation); 43a0148be08cb4bddac23a3994d2d94f06668290 and eaccf50ca587720dbf9179b5f8767a2b7e359bf3 (native/WEB restore-replay tests and key-path correction); 8006c2e9ece77fb83bf5fe8ae7080f7dada54288 (safe correction retaining native Date semantics at snapshot boundary); a3532f9718324966b57e08a1a270848b2e5936d4 (year-zero schedule/loan gate regression).
- SnapshotValidator continues using native staging semantics for its projected schedule/loan graph. Applying WEB UTC conversion to every Date-backed event would reinterpret native-created local-noon operations in a mixed WEB/native snapshot. Operation and BalanceObservation have no per-record source-day provenance yet. Year-zero import remains disabled.
- Added XCTest sources for native snapshots without WEB metadata and WEB v4 positive-year snapshots: encrypted PortableBackup seal/open, LedgerStore restore/reload, scheduled due, debt due and loan principal replay. Added explicit rejection of year-zero schedule/loan projections.
- Executed swiftc -frontend -parse on the new XCTest source block and gate test. Syntax only; XCTest target was not typechecked or executed.
- Native iOS CI for exact HEAD a3532f9718324966b57e08a1a270848b2e5936d4: no workflow run surfaced through the commit-workflow-runs endpoint; combined status has zero contexts. Earlier runs 45033071755 and 45033271427 failed before runner allocation (zero steps, 404 BlobNotFound, zero artifacts); no retry. Linux has Swift 6.2.1 but no xcodebuild/xcodegen.
- PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md updated and committed on preview main. The queue remains append-only.

## FIRST NEXT — per-record date provenance

1. Add a backward-compatible source-day marker/resolver for imported WEB operations and balance observations; legacy/native records must keep local-calendar semantics. Handle date edits and audit before-images without changing existing persisted data.
2. Route LoanEventOrder, LoanLedgerEngine and LoanPrincipalReconciliation through that per-record resolver, then add mixed WEB-imported + native-created operation/observation tests through encrypted .fabackup restore/reload.
3. Only then pass metadata-derived WEB context through SnapshotValidator/PortableBackup, with explicit staging checks for projected schedule, loan, observation and audit fields. Keep year-zero import disabled until all consumers and Apple validation pass.
4. Continue FinancialCalendarEngine, ReportsEngine/MonthlyReviewEngine, WEB budget/daily-pace/autonomy/space engines, mapper/fingerprint and UI; compare positive-year behavior with archived WEB v18.20.
5. At the first real macOS runner, execute XcodeGen, full Simulator build, all unit/UI tests, .xcresult and Files restore. Keep WEB JSON export disabled until all parity gates pass.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios. Stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no financial formula change, no global RecurrenceCalendar change and no user-data mutation.
- Local-only: no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export stays disabled.
