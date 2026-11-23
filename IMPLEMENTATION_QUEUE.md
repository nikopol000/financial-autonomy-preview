# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle index-v01820-history-back-navigation-20261014.js (blob be453db2699273a194543de4532db6ea4b2e1cf2). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. Add a test-only canonicalizer seam using the existing v18.20 v2/v3 normalizer with a fixed migration day. Decode original v2/v3 and canonical v4 bytes through the production importer; assert complete mappedFingerprint equality and that the original legacy snapshot still has no sourceStateJSON. Cover names/IDs, per-day order, operation-audit before images, optional/null/falsey legacy semantics, deterministic bytes and tamper rejection. Do not add persisted canonical metadata or enable production mapping/export until this proof passes on the actual iOS test target.
2. Reconcile CI on exact app feature HEAD cd90be3340ef85ce3d83f9096949a0aa908e7150 (documentation-only after code HEAD 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec). No workflow run or combined status contexts were reported for the docs-only HEAD. The last code HEAD run [45082267897](https://github.com/nikopol000/financial-autonomy-app/actions/runs/45082267897), job 137392845295, failed before runner allocation (runner_id=0, steps=null/empty, zero artifacts, log 404 BlobNotFound). Do not retry this failure.
3. On the first functioning macOS runner, run XcodeGen, full Simulator build, all unit/UI tests, inspect the exact .xcresult/screenshots, then execute Files-provider restore/export on device.
4. Complete archived v18.20 financial calculation and Light/Dark/VoiceOver screen-by-screen comparison. Keep year-zero import and WEB JSON export disabled until the canonical proof, full restore/re-export, Apple tests and visual gates pass.

## Completed in previous app stage

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

## Completed in latest app stage

- App commit [`5a5a8542e10a5b8b485d77ef7ba94e8df7d153c3`](https://github.com/nikopol000/financial-autonomy-app/commit/5a5a8542e10a5b8b485d77ef7ba94e8df7d153c3) adds source-baseline blockers for missing `sourceStateJSON`, `sourceSnapshotFingerprint` and `sourceStateSHA256`, preventing normalized legacy imports from appearing mapping-eligible.
- App commit [`21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec`](https://github.com/nikopol000/financial-autonomy-app/commit/21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec) adds v2/v3 normalized-import tests for mapper fail-closed behavior, all preflight blockers, encrypted native backup restore and continued mapping refusal after reload.
- Audited `normalizeLegacyState`: v2/v3 imports gain defaulted v4 metadata, transaction order and generated name IDs/financial roles; audit-before rows are upgraded and version changes to 4. Original v2/v3 bytes are not a v4 source template. No canonical bytes were synthesized.
- Executed Swift 6.2.1 isolated source parser and `-warnings-as-errors` preflight logic harness: PASS. Full application typecheck/XCTest/build were not run.
- Exact current HEAD `21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec`: no workflow run surfaced and no combined status contexts. Parent run 45076780207 is a pre-runner failure with null steps/no artifacts/404 logs; no retry.
- App feature is 629 ahead / 0 behind stable app main `a9b30be147abecea45a63bf7dd8d0a3eb3370366`. Stable main untouched. WEB JSON export/year-zero import remain disabled; native `.fabackup` is the only writable backup.


## Completed in latest app stage — canonical-template source audit (2026-11-23)

- App commit [50c798a9](https://github.com/nikopol000/financial-autonomy-app/commit/50c798a93fe376c4d71bd65b47a75cbbc6cb7824) adds NativeiOS/WEB_V2_V3_CANONICAL_TEMPLATE_DESIGN.md, enumerating the archived WEB migration sequence, accepted top-level schema, defaults/null semantics, transaction ordering, name/catalog/financialRole upgrades, audit-before behavior, native parser projections, and a separate canonical-v4 template proposal.
- App commit [cd90be33](https://github.com/nikopol000/financial-autonomy-app/commit/cd90be3340ef85ce3d83f9096949a0aa908e7150) corrects the exact legacy semantics: JavaScript-falsey values are retained as JSON; only truthy summaries enter v1 validation.
- Source-level comparison used archived bundle blob be453db2699273a194543de4532db6ea4b2e1cf2 and current WebBackupV18_20.swift / WebV18_20StateMapper.swift. No production source or test code changed. No canonical import/re-import fingerprint proof is claimed.
- Exact code HEAD 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec CI run 45082267897 failed before runner allocation (job 137392845295; runner ID 0; empty steps; no artifacts; log 404 BlobNotFound). Current branch HEAD is documentation-only cd90be3340ef85ce3d83f9096949a0aa908e7150; no workflow run or combined status contexts surfaced for it.
- Current app feature branch is 631 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. Stable app main remains untouched.
- No app build, XCTest, Simulator, Files-provider or visual test was run. WEB JSON export and year-zero import remain disabled; native .fabackup remains the only writable backup.
