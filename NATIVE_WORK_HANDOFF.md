# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-22T20:17:30Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: edcd38076bbc9c0f44cd648733022caf92b5f1b8
Latest implementation commit: edcd38076bbc9c0f44cd648733022caf92b5f1b8
Latest app branch commit: edcd38076bbc9c0f44cd648733022caf92b5f1b8
App feature ahead/behind stable main: 623/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: 8bc37f595ea694af89c41626249d7a03d6f97724

## Completed this run

- App commit edcd38076bbc9c0f44cd648733022caf92b5f1b8 adds identity/reorder coverage for debt.schedule rows, names/nameChanges, balanceChecks, checkAudit/audit before-images, appearance and income/expense template extensions.
- Hardened WebOpaqueExtensions archive validation: v2 typed path/segment/schema consistency; integral non-boolean indices and format versions; nonempty identity strings; v1 root/object-only paths, rejecting array-index and malformed dotted paths.
- Added tests for mismatched v2 paths/segments, fractional index/version, boolean version, v1 object compatibility and v1 array rejection, missing parent, known-field collision and oversized v1/v2 archives.
- Isolated Swift 6.2.1 validation harness compiled with -warnings-as-errors and executed: 10 PASS. This is not a full app build.
- swiftc -frontend -parse passed on an isolated mirror of the two new XCTest methods. No app-target XCTest was run.
- Exact Native iOS CI run 45065385993 / job 137340254653 failed before runner steps: empty step list, no artifacts, log retrieval 404 BlobNotFound and no combined status contexts. No retry; no compiler diagnostic.
- Full iOS build, XCTest, Simulator, .xcresult, encrypted Files restore/re-export and visual comparison remain unverified.

## FIRST NEXT

1. At the first functioning macOS runner, run XcodeGen, the full Simulator build, all unit/UI tests and inspect the exact .xcresult/screenshots.
2. If CI again fails before runner allocation, do not retry that same failure. Continue independent legacy v1/v2 encrypted backup fixture and full WEB import → native .fabackup → restore/reload → mapper/opaque reattachment → re-export review.
3. Keep year-zero import and WEB JSON export disabled until full restore/re-export and Apple validation pass.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export remains disabled.
