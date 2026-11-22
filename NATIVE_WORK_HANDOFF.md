# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-22T21:14:01.445Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: f2a94daae572e5aede5e86ca8923d5bab8beabbb
Latest implementation commit: f2a94daae572e5aede5e86ca8923d5bab8beabbb
Latest app branch commit: f2a94daae572e5aede5e86ca8923d5bab8beabbb
App feature ahead/behind stable main: 624/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: d4a7bedb0f289a7c94eedce1c2ffcc63f90cc31e

## Completed this run

- App commit f2a94daae572e5aede5e86ca8923d5bab8beabbb adds a prepared WEB import → explicit confirmation → native `.fabackup` export/prepare/confirm → Codable reload → mapper/re-import integration XCTest.
- Audited existing legacy v1 summary, v2/v3 migration, encrypted native backup, security-scope read, wrong-password/tamper, source-only audit and opaque extension restore coverage. Compared WEB v18.20 KDF/NFKC/AAD parameters with the archived bundle; no crypto change was needed.
- Swift 6.2.1 isolated parse and typecheck of the new test method with minimal stubs passed. This is not an app build or XCTest execution.
- Exact Native iOS CI run 45070711046 / job 137356794746 for the verified app HEAD failed before runner steps: empty steps, zero artifacts, log retrieval 404 BlobNotFound, combined status contexts empty. No retry.
- XcodeGen/xcodebuild and macOS runner are unavailable in the current Linux environment. Full app build/tests, Simulator, `.xcresult`, Files-provider device test and visual parity remain unverified.

## FIRST NEXT

1. Reconcile live refs and exact-HEAD Native iOS CI. Run XcodeGen/build/full unit+UI suite only if a macOS runner actually starts; do not retry a pre-runner empty-step/BlobNotFound failure.
2. If still blocked, add a deterministic synthetic WEB v18.20 NFKC password-equivalence fixture and exercise v2/v3 legacy encrypted migration through preparation, explicit confirmation and Codable reload.
3. On macOS, run the new integration test and existing legacy audit/opaque restore tests, inspect `.xcresult`, then test Files import/export on device.
4. Complete archived v18.20 Light/Dark/VoiceOver screen-by-screen and financial parity matrix. Keep year-zero import and WEB JSON export disabled until all gates pass.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; app stable main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes without explicit approval.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native `.fabackup` remains the only writable backup; WEB JSON export and year-zero import remain disabled.