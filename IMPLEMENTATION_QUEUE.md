# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle `index-v01820-history-back-navigation-20261014.js` (blob `be453db2699273a194543de4532db6ea4b2e1cf2`). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. On the next run, re-read both repository HEADs and inspect Native iOS CI for the exact current app feature HEAD. If a macOS runner actually starts, run XcodeGen, the full iOS Simulator build, all unit/UI tests, and inspect the exact `.xcresult` and screenshots. If the run again has zero steps / pre-runner `BlobNotFound`, do not retry the same failure.
2. While runner allocation is blocked, add a deterministic synthetic WEB v18.20 cross-platform test for NFKC password equivalence and drive v2/v3 legacy encrypted fixtures through `BackupRestorePreparation`, explicit confirmation and Codable reload. Preserve the WEB v18.20 and native `.fabackup` cryptographic contracts.
3. Execute the new prepared-WEB → native `.fabackup` → restore/reload → mapper/re-import test and existing source-only audit/opaque-extension tests on macOS. Then verify real Files-provider import/export on a device.
4. Finish archived v18.20 screen-by-screen comparison in Light/Dark and VoiceOver, and reconcile all financial formulas and edge cases against the archived bundle.

## Completed in latest app stage

- App commit `f2a94daae572e5aede5e86ca8923d5bab8beabbb` adds an integration XCTest for WEB file preparation, no mutation before confirmation, native `.fabackup` export/prepare/confirm, Codable reload, mapper source preservation and WEB re-import.
- Swift 6.2.1 isolated parse/typecheck of the new test method with minimal stubs: PASS; full app target and XCTest remain unexecuted.
- Exact CI run `45070711046` for that commit failed before runner steps: empty steps, zero artifacts, log 404 `BlobNotFound`, no combined status contexts. No retry.

## Release gates / invariants

- No merge or push to `financial-autonomy-app:main` without explicit approval.
- No wholesale Models.swift/LedgerStore.swift rewrite and no unapproved financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native `.fabackup` remains the only writable backup. WEB JSON export and year-zero import remain disabled until full restore/re-export and Apple validation pass.
- 100% parity requires functional, financial, data-preservation, build/test, Files-provider and visual/accessibility evidence; no partial checklist can be reported as complete.