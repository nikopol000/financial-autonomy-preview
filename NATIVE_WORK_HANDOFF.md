# Native Work Handoff

Status: IN_PROGRESS
Owner: ChatGPT native iOS parity
Updated UTC: 2026-11-22T22:13:59.377Z
Lease expires UTC: 2026-11-22T22:58:59.377Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: f2a94daae572e5aede5e86ca8923d5bab8beabbb
Latest implementation commit: f2a94daae572e5aede5e86ca8923d5bab8beabbb
Latest app branch commit: f2a94daae572e5aede5e86ca8923d5bab8beabbb
App feature ahead/behind stable main: 624/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: d4a7bedb0f289a7c94eedce1c2ffcc63f90cc31e

## Work in progress

- Reconciled live HEADs and exact-HEAD Native iOS CI for `f2a94daae572e5aede5e86ca8923d5bab8beabbb`. Run 45070711046 / job 137356794746 is FAILURE with runner_id 0 and an empty step list; do not retry this pre-runner infrastructure failure.
- Implement the queued deterministic WEB v18.20 NFKC password-equivalence fixtures and v2/v3 encrypted migration coverage through BackupRestorePreparation, explicit restore confirmation and Codable reload.
- Preserve the existing WEB v18.20 PBKDF2/AES-GCM/AAD contract and native .fabackup contract. No financial formula changes.

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