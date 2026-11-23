# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle index-v01820-history-back-navigation-20261014.js (blob be453db2699273a194543de4532db6ea4b2e1cf2). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. Execute the canonicalizer proof on the actual iOS test target: `testLegacyV2V3CanonicalV4TemplateReimportPreservesCompleteMappedFingerprint` and `testCanonicalTemplatePreservesFalseyLegacyDefaultsAndRejectsTampering`. Also run the new Coverage stable-order/first-deficit tests, DashboardOrderTests and the full unit/UI suites on a functioning macOS runner. Inspect the exact .xcresult and screenshots.
2. Current exact app HEAD `b0142b3969709be500ee74f2733e7b9618b30ffb` CI run [45094392665](https://github.com/nikopol000/financial-autonomy-app/actions/runs/45094392665), job 137430857103, failed before runner allocation (runner_id=0, empty steps, no logs/404 BlobNotFound, zero artifacts, no combined status contexts). This repeats the same infrastructure failure. Do not manually retry it or prior identical pre-runner runs.
3. If macOS runner allocation remains blocked, continue independent source-level parity audits and keep the canonicalizer proof explicitly unverified. Do not add production canonical metadata or enable WEB JSON export.
4. After the proof passes, implement provenance-aware canonical-template persistence and native .fabackup restore/reload tests, then verify Files-provider restore/export on device.
5. Complete archived v18.20 financial calculations and Light/Dark/VoiceOver screen-by-screen comparison. Keep year-zero import disabled until every date consumer and Apple validation gate passes.

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
- Current app feature branch is 632 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. Stable app main remains untouched.
- No app build, XCTest, Simulator, Files-provider or visual test was run. WEB JSON export and year-zero import remain disabled; native .fabackup remains the only writable backup.

## Completed in latest app stage — canonical proof seam and Coverage dashboard parity (2026-11-23)

- App commit [14e6d917](https://github.com/nikopol000/financial-autonomy-app/commit/14e6d9178ab4321c885ec7849062f71ccf716a1f) adds a DEBUG-only seam that decrypts the fixed v2/v3 fixtures and invokes the existing normalizeLegacyState with an explicit migration day to produce sorted-key v4 JSON. Two XCTest cases cover complete mappedFingerprint import/re-import equivalence, stable bytes, sourceStateJSON nil for original legacy snapshots, names/IDs, per-day transaction order, audit-before images, falsey/missing legacy values, null/default semantics, migration-day sensitivity and tampering. This is authored test coverage, not an executed proof.
- App commits [ac8db32f](https://github.com/nikopol000/financial-autonomy-app/commit/ac8db32f48ecd33d6f6d9223c0264c9766100f29), [1b92d286](https://github.com/nikopol000/financial-autonomy-app/commit/1b92d2863eb4b536cc740db2c7c50fb0acd8b77b), [e6cd4276](https://github.com/nikopol000/financial-autonomy-app/commit/e6cd4276d38817ec122c8da929da6b8992da40ed), [37369ee3](https://github.com/nikopol000/financial-autonomy-app/commit/37369ee336a57b8601161d9cc5b3fe884eb7fbd0), [9cdb954f](https://github.com/nikopol000/financial-autonomy-app/commit/9cdb954f86ad58a28b8c7531dbc88f13e3af6b5b) and [b0142b39](https://github.com/nikopol000/financial-autonomy-app/commit/b0142b3969709be500ee74f2733e7b9618b30ffb) restore the WEB v18.20 Coverage module and diagnostics: first uncovered date, deficit, stable outer and debt-schedule ordering, horizon end, visible dashboard slot/card and arrangement label. The native dashboard default order now includes coverage in the WEB slot between budget and money.
- Coverage test fixtures cover three same-day fixed obligations and three same-day debt schedule rows; the stable WEB order yields a 7,000 minor-unit deficit against 10,000 cash after 3,000 and 6,000 obligations. Aggregate obligations remain 17,000. Tests were authored but not run in XCTest.
- Archived bundle reference: `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. The WEB coverage routine returns `firstUncoveredDate` and `deficit`, uses stable date sorting, and the dashboard includes the coverage module. Source-level comparison only; no screenshot/UI validation.
- Isolated checks: Swift 6.2.1 canonical seam typecheck PASS; canonical XCTest syntax parser PASS; coverage stable-sort typecheck PASS; same-day regression harness PASS; coverage UI/test parser PASS; dashboard order harness PASS; DashboardCoverageView parser PASS; debt-schedule stable-sort typecheck PASS; debt-schedule XCTest parser PASS. A first chained sort expression exceeded Swift type-checker complexity; explicit loops replaced it and passed. None of these is an app-target build or XCTest result.
- Native iOS CI exact HEAD `b0142b3969709be500ee74f2733e7b9618b30ffb`: run 45094392665 / job 137430857103 failed before runner allocation (runner_id=0, empty steps, no logs/404 BlobNotFound, zero artifacts, no combined status contexts). No manual rerun. XcodeGen/xcodebuild/macOS runner unavailable; no full build, XCTest, Simulator, .xcresult, Files-provider or visual comparison executed.
- App feature HEAD `b0142b3969709be500ee74f2733e7b9618b30ffb`, 639 ahead / 0 behind stable app main `a9b30be147abecea45a63bf7dd8d0a3eb3370366`. Stable app main untouched. No Models.swift/LedgerStore.swift rewrite, no production canonical metadata, no financial formula change, no preview product bundle change. Credit remains excluded from owned cash. WEB JSON export and year-zero import remain disabled; native .fabackup remains the only writable backup.


