# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle index-v01820-history-back-navigation-20261014.js (blob be453db2699273a194543de4532db6ea4b2e1cf2). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. Execute the canonicalizer proof on the actual iOS test target: `testLegacyV2V3CanonicalV4TemplateReimportPreservesCompleteMappedFingerprint` and `testCanonicalTemplatePreservesFalseyLegacyDefaultsAndRejectsTampering`. Also run Coverage stable-order/first-deficit/dayKnown tests, DashboardOrderTests, the Coverage default-visibility UI test, the new dailyBudget legacy-role/rounding regressions and the complete unit/UI suites on a functioning macOS runner. Inspect the exact .xcresult and screenshots.
2. Current exact app HEAD `f171f4b4492f6a077a5b000f7536c3e8592c253c`: the available commit-specific workflow-run endpoint returned no runs and combined status returned no contexts. Do not infer a passing or failing build for this commit.
3. Latest known Native iOS CI for parent HEAD `cb553dc236d53b6974908bde34329adfc88e223e` is run [45099721014](https://github.com/nikopol000/financial-autonomy-app/actions/runs/45099721014), job 137447514072, failed before runner allocation (runner_id=0, empty steps, no artifacts, log 404 BlobNotFound). Do not retry this or earlier identical pre-runner failures.
4. If macOS runner allocation remains blocked, next independent source-level task is DashboardBudgetDetailEngine today/window detail filtering and empty/no-month-plan dailyBudget state against archived WEB modules 205/206/219/220. Only patch source-confirmed mismatches with targeted regression tests.
4. After the canonical proof passes, implement provenance-aware canonical-template persistence and native .fabackup restore/reload tests, then verify Files-provider restore/export on device. Keep WEB JSON export disabled until all gates pass.
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



## Completed in latest app stage — WEB Coverage default-detail and palette parity (2026-11-23T02:14Z)

- App commit [7064ca7d](https://github.com/nikopol000/financial-autonomy-app/commit/7064ca7d263045a9e7d94b0cb5fed9bae08e1e0e) changes NativeiOS/DashboardCoverageView.swift, NativeiOS/DashboardView.swift and NativeiOS/UITests/NativeScreenSmokeTests.swift.
- Archived WEB v18.20 CoverageHome always displays the cash/obligations/detail rows and explanatory note and is not a pressable disclosure. Native now matches: all applicable rows are visible by default, no button/expand state, no extra border, exact raised card geometry and archived secondaryAccent/danger/text/muted colors for Light/Dark. Credit remains explicitly excluded from owned cash.
- The UI regression uses -uiTestPopulatedAutonomy in both Light and Dark and asserts the cash, obligations and explanatory note are hittable without tapping, with screenshot attachments. Authored only; not run in XCTest.
- Executed: Swift 6.2.1 parser for the rewritten Coverage view PASS; parser for the new UI test interaction fragment PASS; isolated palette helper -warnings-as-errors -typecheck PASS. No full app build or test run.
- Exact Native iOS CI run [45098891593](https://github.com/nikopol000/financial-autonomy-app/actions/runs/45098891593), job 137444875610, failed before runner allocation: runner_id 0, empty steps, zero artifacts, log 404 BlobNotFound, empty combined statuses. No retry.
- App feature HEAD 7064ca7d263045a9e7d94b0cb5fed9bae08e1e0e, 640 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. No app/main, financial formula, Models.swift or LedgerStore.swift change. Full iOS build/XCTest/Simulator/Files-provider/visual validation remain pending.

## Completed in latest app stage — Coverage expense dayKnown parity (2026-11-23T02:22Z)

- App commit [cb553dc2](https://github.com/nikopol000/financial-autonomy-app/commit/cb553dc236d53b6974908bde34329adfc88e223e) changes NativeiOS/WebDailyPaceEngine.swift and NativeiOS/Tests/WebBudgetWindowEngineTests.swift.
- Fixed a source-confirmed mismatch: WEB v18.20 checks all top-level state.expenses dayKnown flags globally; native now checks metadata.expenseTemplates globally instead of only month-plan expenses inside the current horizon. Added regressions for both the false-negative and false-positive cases.
- Audited WEB availableMoney/checkedBalance against native current account balance maintenance, operation mutation and balance observation paths. No current-day cash-source mismatch was established; no change to cash or credit formulas.
- Executed Swift 6.2.1 parser for the changed guard fragment PASS and parser for both new XCTest methods PASS. Tests are authored only; actual XCTest/build not executed.
- Exact Native iOS CI run [45099721014](https://github.com/nikopol000/financial-autonomy-app/actions/runs/45099721014), job 137447514072, failed before runner allocation: runner_id 0, empty steps, zero artifacts, log 404 BlobNotFound, empty combined statuses. No retry.
- App feature HEAD cb553dc236d53b6974908bde34329adfc88e223e, 641 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. No app/main, Models.swift or LedgerStore.swift change. Full build/XCTest/Simulator/Files-provider/visual validation remain pending.


## Completed in latest app stage — archived dailyBudget role fallback and rounding (2026-11-23T03:16:39.420Z)

- App commits: [b2a9b8b4](https://github.com/nikopol000/financial-autonomy-app/commit/b2a9b8b441ad3be54f6c799301a2c9d11482b1a1) adds the shared legacy budget-role fallback; [d8dd9763](https://github.com/nikopol000/financial-autonomy-app/commit/d8dd9763a580217e9750bd4bf648bac358bb622e) applies it to historical budget-window spend; [d5875d19](https://github.com/nikopol000/financial-autonomy-app/commit/d5875d195b763019bd2e9bff3a7ae0dac67ed0b5) applies it to daily spent/outside-pace/outside-budget classification; [f171f4b4](https://github.com/nikopol000/financial-autonomy-app/commit/f171f4b4492f6a077a5b000f7536c3e8592c253c) adds two regression tests.
- Archived WEB v18.20 module 206 `roleOf` falls back to `categoryId => budgeted` when financialRole is missing. Native Operation Codable retains an optional nil role and budgetID, and the WEB mapper already uses the same fallback. The old native dailyBudget/window paths ignored such legacy operations; they could inflate remaining/allowance and misclassify today's spend as outside-budget. The helper preserves explicit financialRole precedence and only applies the category/budget-ID fallback when the role is nil.
- Regression covers a 31,000 minor-unit monthly budget, 30,500 legacy spend yesterday, 1,000 legacy spend today, 500 spend in a non-paced budget and 250 unbudgeted spend. Expected: primary spent 31,500 / remaining -500; allowance 500; included spend 1,000; outside pace 500; outside budget 250. A second regression locks positive 500.5 → 501 parity with WEB Math.round. Period boundaries and includeInDailyPace candidate filtering were source-compared with modules 219/220; no other mismatch was established in this pass.
- Executed: Swift 6.2.1 isolated harness compiled with warnings-as-errors and ran PASS; isolated XCTest method fragment parsed PASS. No app-target XCTest/full build/Simulator was executed.
- Exact current HEAD f171f4b4492f6a077a5b000f7536c3e8592c253c has no workflow run or combined status context surfaced by available commit-specific endpoints. Parent cb553dc CI run 45099721014 failed before runner allocation with runner_id 0, empty steps, no artifacts and log 404 BlobNotFound; no retry.
- Current app feature HEAD f171f4b4492f6a077a5b000f7536c3e8592c253c, 645 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. Stable main unchanged. Full XcodeGen/build/XCTest/.xcresult/Files-provider and visual/accessibility validation remain pending. WEB JSON export and year-zero import remain disabled; .fabackup remains the only writable backup. No Models.swift/LedgerStore.swift rewrite.
