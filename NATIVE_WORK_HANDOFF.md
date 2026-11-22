# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-22T23:17:00Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec
Latest implementation commit: 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec
Latest app branch commit: 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec
App feature ahead/behind stable main: 629/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: d5cd13e41fd61c37e63dffccc56f6f0fdf9fbb56

## Completed this run

- Re-read all required preview continuity files and reconciled actual refs. The handoff lease was claimed and is now released.
- App commits 5a5a8542e10a5b8b485d77ef7ba94e8df7d153c3 and 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec add source-baseline preflight blockers and regression coverage for normalized WEB v2/v3 snapshots. Missing original v4 bytes, baseline fingerprint or SHA-256 now prevents `isEligibleForMapping`; the test verifies both mapper APIs fail closed before and after encrypted native .fabackup restore.
- Audited the exact legacy normalizer: it defaults missing v4 metadata, assigns transaction order, upgrades transaction/audit-before names and IDs/financialRole, and changes version 2/3 to 4. It does not retain original v4 bytes; no synthetic source document was created.
- Swift 6.2.1 isolated parser passed for the changed source/test fragments. A `-warnings-as-errors` isolated preflight harness passed. Full application typecheck, XCTest, build and Simulator were not run.
- Exact current app HEAD 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec: commit workflow lookup returned no run and combined status returned no contexts. Parent run 45076780207 / job 137375666086 failed before runner allocation (steps null, no artifacts, log 404 BlobNotFound); no retry.
- Feature branch is 629 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366; app main remains untouched. Preview main remains documentation-only.
- WEB JSON export and year-zero import remain disabled; native .fabackup remains the only writable backup. Local-only/no backend/no mandatory account/no bank sync/no telemetry; available credit is not owned money.

## FIRST NEXT

1. Reconcile live refs and exact-HEAD Native iOS CI. If a macOS runner starts, run XcodeGen, full Simulator build, all unit/UI tests, and inspect the exact .xcresult/screenshots. Do not retry the parent pre-runner BlobNotFound failure.
2. Continue the v2/v3 canonical-template design by enumerating every normalized field/default/order/name/audit transformation and proving a separate canonical-v4 template can re-import with an identical mapped fingerprint. Do not relabel synthetic bytes as original `sourceStateJSON` or enable export before proof.
3. On the first functioning macOS runner, run NFKC/v2/v3 restore, prepared v4 WEB-to-native-backup round trip, legacy audit/opaque-extension tests and the complete suite; then verify Files-provider import/export on device.
4. Finish archived v18.20 financial calculation and Light/Dark/VoiceOver screen-by-screen parity. Keep year-zero import disabled until every Date-backed consumer and Apple validation gate passes.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no unapproved financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export and year-zero import remain disabled.
