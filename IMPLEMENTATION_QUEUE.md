# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle index-v01820-history-back-navigation-20261014.js (blob be453db2699273a194543de4532db6ea4b2e1cf2). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. At the next run, re-read both repository HEADs and inspect Native iOS CI for the exact current app feature HEAD. If a macOS runner has actual steps, run XcodeGen, the full iOS Simulator build, all unit/UI tests, and inspect the exact .xcresult and screenshots. If it again fails with runner_id 0 / zero steps before runner allocation, do not retry that infrastructure failure.
2. On the first functioning macOS runner, execute testEncryptedLegacyV2V3MigrationUsesNFKCThroughPreparedConfirmationAndCodableReload, testPreparedWebImportNativeFabackupRestoreReloadAndMapperRoundTrip, legacy source-only audit/opaque-extension restore tests, and the complete unit/UI suite. Then verify Files-provider import/export on a device.
3. While CI is pre-runner blocked, continue the source-level mapper/re-export audit for normalized v2/v3 snapshots. These imports intentionally have no original v4 source bytes; mappedSourceState currently fails closed without sourceStateJSON. Do not synthesize original bytes or enable WEB JSON export without a separately validated lossless canonicalization design.
4. Complete the archived v18.20 Light/Dark/VoiceOver screen-by-screen comparison and financial calculation matrix. Keep year-zero import disabled until every Date-backed consumer, backup/restore path and Apple validation gate passes.

## Completed in latest app stage

- App commit de15d37b64a4e048bd514c0c3d529208a8242340 adds deterministic WEB v1 encrypted fixtures with legacy v2/v3 plaintext states, full-width NFKC password and ASCII-equivalent password checks, a deterministic migration-day seam, preparation-without-mutation, explicit confirmation and Codable reload assertions.
- App commit 9f5b3f2e35af4b43862375dc43133c62b1811ed5 adds wrong-password and ciphertext-tamper failure paths, security-scope cleanup assertions and live-ledger preservation assertions.
- Python cryptography decrypted both fixed fixtures using both NFKC-equivalent password forms; Swift 6.2.1 Foundation NFKC normalization passed. Isolated Swift parser/typecheck checks passed for the new test method/signature/tamper helper. These are not app-target XCTest or build results.
- Exact CI run 45076780207 for 9f5b3f2e35af4b43862375dc43133c62b1811ed5 failed before runner allocation (job 137375666086, runner_id 0, zero steps, zero artifacts, no combined status contexts). No retry.

## Release gates / invariants

- No merge or push to financial-autonomy-app:main without explicit approval.
- No wholesale Models.swift/LedgerStore.swift rewrite and no unapproved financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup. WEB JSON export and year-zero import remain disabled until full restore/re-export and Apple validation pass.
- 100% parity requires functional, financial, data-preservation, build/test, Files-provider and visual/accessibility evidence; no partial checklist can be reported as complete.
