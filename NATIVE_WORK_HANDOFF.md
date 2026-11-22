# Native Work Handoff

Status: IN_PROGRESS
Owner: ChatGPT native parity run
Updated UTC: 2026-11-22T23:12:10Z
Lease expires UTC: 2026-11-22T23:32:10Z
Current task: audit normalized WEB v2/v3 mapper/re-export eligibility and fail-closed preflight
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 9f5b3f2e35af4b43862375dc43133c62b1811ed5
Latest implementation commit: 9f5b3f2e35af4b43862375dc43133c62b1811ed5
Latest app branch commit: 9f5b3f2e35af4b43862375dc43133c62b1811ed5
App feature ahead/behind stable main: 626/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: ea2c4913b759ca153500bfbc9e5f161f0844aa46

## Completed this run

- App commits de15d37b64a4e048bd514c0c3d529208a8242340 and 9f5b3f2e35af4b43862375dc43133c62b1811ed5 add deterministic NFKC-equivalent encrypted WEB v2/v3 fixtures and preparation → explicit confirmation → Codable reload tests, including wrong-password/tamper fail-closed paths.
- Existing WEB v18.20 KDF/AAD contract was rechecked against archived bundle blob be453db2699273a194543de4532db6ea4b2e1cf2: NFKC, PBKDF2-SHA256/600,000, AES-GCM and FinancialAutonomy/backup/1. No crypto behavior changed.
- Python cryptography fixture verification, Swift 6.2.1 NFKC normalization, isolated test-source parse, and minimal signature/tamper typechecks passed. Full app build and XCTest were not executed.
- Exact CI run 45076780207 / job 137375666086 for app HEAD 9f5b3f2e35af4b43862375dc43133c62b1811ed5 failed before runner allocation: runner_id 0, empty steps, zero artifacts and zero combined status contexts. No retry.
- Legacy v2/v3 migration retains no original v4 sourceStateJSON; mapper/re-export remains fail-closed. WEB JSON export stays disabled.
- Linux Swift 6.2.1 is available; XcodeGen/xcodebuild and a macOS runner are unavailable. Full build/tests, Simulator, .xcresult, Files-provider device test and visual parity remain unverified.

## FIRST NEXT

1. Reconcile live refs and exact-HEAD Native iOS CI. If a macOS runner actually starts, run XcodeGen, Simulator build, full unit/UI suite and inspect .xcresult plus screenshots. Do not retry a pre-runner zero-step failure.
2. On macOS, execute the new NFKC/v2/v3 restore test, prepared v4 WEB-to-native .fabackup integration test and existing audit/opaque-extension tests, then test Files import/export on device.
3. If CI remains pre-runner blocked, continue the source-level legacy mapper/re-export audit without enabling WEB JSON export or synthesizing source bytes.
4. Finish archived v18.20 Light/Dark/VoiceOver screen-by-screen and financial calculation parity.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; app stable main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes without explicit approval.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export and year-zero import remain disabled.
