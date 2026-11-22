# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-22T19:22:47Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: ce6b9e8ec035a430898a1ffaba2470a1e5a2330a
Latest implementation commit: ce6b9e8ec035a430898a1ffaba2470a1e5a2330a
Latest app branch commit: ce6b9e8ec035a430898a1ffaba2470a1e5a2330a
App feature ahead/behind stable main: 622/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: 6c747011fb9539a55d1392c3bd20c5a332ee420c

## Completed this run

- App commit ce6b9e8ec035a430898a1ffaba2470a1e5a2330a adds three focused opaque-extension tests: nested stable-identity reorder coverage; duplicate/ambiguous/missing identity fail-closed coverage; and parent-plan-scoped step pruning when IDs repeat across plans.
- Audited existing tests for template pruning, step pruning, no-ID transaction-detail ambiguity, legacy v1 array-path rejection and payoff-deletion rejection. No production change was needed in this stage.
- Swift 6.2.1 parser passed on an isolated mirror of the new methods only. No app-target typecheck or XCTest execution.
- Exact CI run 45060097734 / job 137323869138 failed before runner steps: zero steps, no artifacts, log 404 BlobNotFound and empty combined status. No retry. XcodeGen/xcodebuild/macOS runner unavailable.

- App commit e4e2861e57634f103aaa7aafa590055586b4d8e8 corrects the end-to-end restore fixture to use a valid voided original plus a new native replacement/check ID. The current validator does not permit a correction audit to change an observation timestamp.
- Two new XCTest methods in NativeiOS/Tests/PortableBackupTests.swift cover old WEB v4 payloads with missing source-day markers, encrypted .fabackup restore through LedgerStore.restoreBackup, Codable persistence reload, source-only operation/check audit history, opaque extension retention, fingerprint/raw source bytes, mapper projection/reattachment/re-import and UTC+14 before/current days.
- Swift 6.2.1 swiftc -frontend -parse passed on the corrected test-class/method source snippet. No app-target XCTest/typecheck/build was executed.
- Native iOS CI exact HEAD run 45055383928 / job 137309359089 failed with no steps, no artifacts and no combined status contexts; prior source-test run 45054830804 failed the same way. No compiler diagnostics; no retry. Linux has Swift 6.2.1 but no XcodeGen/xcodebuild/macOS runner.
- Targeted date-only UI audit found no remaining direct Date-to-day conversion defect in schedule/loan/goal/plan/month-plan screens; date-only values remain strings and timestamps remain instants.

## FIRST NEXT

1. Add identity/reorder tests for debt.schedule, names/nameChanges, balanceChecks, checkAudit/audit before-images, appearance and template opaque fields.
2. Audit malformed/oversized v1/v2 archives and path/segment consistency; keep v1 array-index paths unsupported.
3. At the first functioning macOS runner, run XcodeGen, Simulator build, all unit/UI tests and inspect .xcresult. Do not retry a pre-runner BlobNotFound failure.
4. Keep year-zero import and WEB JSON export disabled until encrypted restore/re-export and Apple validation pass.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export remains disabled.