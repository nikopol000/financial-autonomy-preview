# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle index-v01820-history-back-navigation-20261014.js (blob be453db2699273a194543de4532db6ea4b2e1cf2). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. Reconcile live refs and inspect Native iOS CI for exact app feature HEAD `21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec`. The commit workflow lookup returned no run and combined status returned no contexts; do not infer a CI pass. Parent HEAD `9f5b3f2e35af4b43862375dc43133c62b1811ed5` run [45076780207](https://github.com/nikopol000/financial-autonomy-app/actions/runs/45076780207) failed before runner allocation (`steps: null`, no artifacts, log 404 `BlobNotFound`); do not retry that failure. If a macOS runner starts for the current HEAD, run XcodeGen, full Simulator build, all unit/UI tests and inspect exact `.xcresult`/screenshots.
2. Continue the source-level v2/v3 mapper design: enumerate every field/default/order/name-upgrade/audit transformation in `normalizeLegacyState`; specify a separate canonical-v4 template representation (not original `sourceStateJSON`) and prove archived WEB v18.20 import/re-import fingerprint equivalence before implementation. Do not fabricate original v4 bytes or enable WEB JSON export.
3. On the first functioning macOS runner, execute the NFKC/v2/v3 prepared restore test, prepared v4 WEB → native `.fabackup` → restore/reload test, legacy audit/opaque-extension tests and the complete unit/UI suite; then verify Files-provider import/export on device.
4. Complete the archived v18.20 financial calculation matrix and Light/Dark/VoiceOver screen-by-screen comparison. Keep year-zero import disabled until every Date-backed consumer, backup/restore path and Apple validation gate passes.

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
