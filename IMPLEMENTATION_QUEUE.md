# Native iOS implementation queue — archived WEB v18.20 parity

Status: IN PROGRESS
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Reference: archived WEB v18.20 bundle index-v01820-history-back-navigation-20261014.js (blob be453db2699273a194543de4532db6ea4b2e1cf2). The preview's current index is v18.74; it is not the parity target.

## First unfinished action

1. Execute the canonicalizer proof on the actual iOS test target: testLegacyV2V3CanonicalV4TemplateReimportPreservesCompleteMappedFingerprint and testCanonicalTemplatePreservesFalseyLegacyDefaultsAndRejectsTampering. Also run Coverage stable-order/first-deficit/dayKnown tests, DashboardOrderTests, the Coverage default-visibility UI test, dailyBudget legacy-role/rounding/no-plan regressions, DashboardBudgetDetailEngine legacy today/window regressions and the complete unit/UI suites on a functioning macOS runner. Inspect the exact .xcresult and screenshots.
2. Current exact app HEAD ec031681436e7024af19b428bb034ac27b5c6fb3 has Native iOS CI run 45110649708: failure before runner work; job 137481997285 has steps null, zero artifacts, log 404 BlobNotFound, and no combined status contexts. Do not retry this or earlier identical pre-runner failures.
3. If macOS runner allocation remains blocked, next independent source-level task is the DashboardSnapshotEngine spending classification and empty Budget-card behavior against archived WEB modules 205/206/219/221. Preserve the existing unclassified treatment for legacy budgeted records without a budget ID unless the source and data contract prove a safe equivalent; do not guess or alter the financial contract.
4. After the canonical proof passes on the actual iOS target, implement provenance-aware canonical-template persistence and native .fabackup restore/reload tests, then verify Files-provider restore/export on device. Keep WEB JSON export disabled until all gates pass.
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

## Completed in latest app stage — Dashboard budget-detail and no-plan dailyBudget parity (2026-11-23T04:18Z)

- App commit [c732facd](https://github.com/nikopol000/financial-autonomy-app/commit/c732facd3647a5c79c072a68f76cf31a016e263c) changes NativeiOS/DashboardView.swift: DashboardBudgetDetailEngine.todayOperations and windowOperations now use BudgetAllocationEngine.isBudgetedExpense, matching WEB module 206's missing-role categoryId fallback. Both still require expense kind and exclude voided/out-of-range rows; today details still require a budget with includeInDailyPace != false.
- App commit [4468fcea](https://github.com/nikopol000/financial-autonomy-app/commit/4468fcea0a81e81a2f89008b251b9a91c8429e65) changes NativeiOS/WebDailyPaceEngine.swift: when no month plan exists, allowance/spent remain zero and calculationAvailable remains false, but outsidePaceMinor now includes all today's category-linked budgeted expenses and outsideBudgetMinor includes today's non-budgeted/fixed expenses, matching WEB modules 205/221's empty-plan behavior. Malformed operation dates still fail closed.
- App commits [9170566d](https://github.com/nikopol000/financial-autonomy-app/commit/9170566d5952c426fee6ea735fd1d5ac77df60cc) and [ec031681](https://github.com/nikopol000/financial-autonomy-app/commit/ec031681436e7024af19b428bb034ac27b5c6fb3) add targeted Dashboard today/window legacy detail and no-month-plan breakdown regressions.
- Archived source reference: _expo/static/js/web/index-v01820-history-back-navigation-20261014.js, blob be453db2699273a194543de4532db6ea4b2e1cf2; modules 205/206/219/220/221 inspected. No formula redesign or product UI change was made.
- Executed Swift 6.2.1 isolated harness with -warnings-as-errors using the changed detail methods and complete changed dailyBudget method with unrelated app types stubbed: PASS (NATIVE_BUDGET_DETAIL_PARITY_HARNESS_PASS). New XCTest fragments parsed with swiftc -frontend -parse: PASS. No app-target XCTest/build was run.
- Exact current HEAD ec031681436e7024af19b428bb034ac27b5c6fb3 CI run 45110649708 failed before runner work: job 137481997285 steps null, no artifacts, logs 404 BlobNotFound, no combined status contexts. No retry. xcodebuild/xcodegen unavailable; full build, XCTest, Simulator, .xcresult, Files-provider and visual/accessibility validation remain unverified.
- Current app feature HEAD ec031681436e7024af19b428bb034ac27b5c6fb3, 649 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. Stable app main untouched. Local-only/no backend/no mandatory account/no bank sync/no telemetry; available credit is not owned money. Native .fabackup remains the only writable backup.
## Completed in latest native iOS stage — Dashboard snapshot and empty Budget card parity (2026-11-23)

- App commit 2d172fec296acd028bf5d5e4068ab66e5cddadd8 fixes the WEB v18.20 roleOf fallback for valid legacy budgetID DashboardSnapshotEngine.spending records. The new path counts non-empty category/budget-linked expenses as budgeted even when financialRole is nil; malformed empty/whitespace IDs stay fail-closed. Ambiguous native legacy budgeted == true without a budgetID remains unclassified rather than being guessed.
- App commits b494156ea9e57628375e05d5ab800975646405e1, 7e1568fe7b27d93d31851310c202c4beaf6f5d27, and 345cdcde5b650cdc56edfb938fe38d3ecb1f76c3 add the matching regression and malformed-ID protection.
- Archived WEB v18.20 module 217 showed the whole empty Budget card is clickable. Native previously exposed only the subtitle as a link and used default typography/system secondary color. App commit 74c3de4cb4f8059185129e2e5cc2ba601e115233 aligns whole-card navigation, h2/note typography, palette and card geometry. Commits fbc41f6b1fc47eac687f0a94e8110a7b1e9145fc, a6457b93a79895e27a56da8eb8f7d5acaa448fde, c59e5aae8f66fccaff70f6a23f20d138986efc55, and b9a0afbd26960e0dfdb14f431dbafdb0e899eecf add accessibility and Light/Dark UI navigation assertions.
- Executed: Linux Swift 6.2.1 isolated -warnings-as-errors spending harness PASS (DASHBOARD_SNAPSHOT_WEB_ROLE_FALLBACK_PASS); standalone parser checks PASS. Not executed: app-target build/XCTest/UI test, Simulator, .xcresult, actual screenshots/VoiceOver, Files Provider device tests.
- Exact current app HEAD b9a0afbd26960e0dfdb14f431dbafdb0e899eecf: Native iOS CI run 45116880325, job 137501630872, failed before runner allocation (runner_id 0, no steps, no artifacts, no combined status contexts). Do not retry this repeated infrastructure failure.
- App feature is 658 ahead / 0 behind stable main a9b30be147abecea45a63bf7dd8d0a3eb3370366; stable main untouched. No Models.swift/LedgerStore.swift wholesale rewrite. Local-only and credit exclusion invariants preserved.

## FIRST NEXT

1. On a functioning macOS runner, execute XcodeGen/full iOS Simulator build, canonicalizer/Coverage/Dashboard/dailyBudget regressions, all DashboardSnapshot tests and testEmptyLedgerScreensInLightAndDark; inspect exact .xcresult and screenshots.
2. Do not retry run 45116880325 or the repeated pre-runner failure pattern. If runner allocation remains blocked, next independent audit is DashboardSnapshotEngine.nextIncome versus archived WEB v18.20 module 303 (dayKnown, month-end clamping, first-due/cancellation and same-day ordering), with no speculative financial-semantics changes.
3. After actual iOS canonicalizer proof passes, implement provenance-aware canonical-template persistence and .fabackup restore/reload, then validate Files Provider on device. WEB JSON export/year-zero import remain disabled until lossless Apple-target validation.
## Completed in latest native iOS stage — WEB income-template Dashboard forecast (2026-11-23)

- Archived WEB v18.20 module 303 reads state.incomes. Native WebImportMetadata retains those rows as incomeTemplates, and WebV18_20StateMapper explicitly treats them as presets rather than ScheduleBook income schedules. The prior Dashboard call used only ScheduleBook, so imported WEB income forecasts were missing.
- App commit 267ec70f8e359c70d48900c5d1ae9f1c763cedb9 adds a snapshot-aware source selector and WEB-compatible template forecast. Present incomeTemplates (including []) is authoritative; ScheduleBook is used only when the WEB catalog is absent. App commit e1c67c8b679aa47973e84df0ba3bd3e939b2872a wires DashboardSnapshotsView to the snapshot. App commit 311582fa59cd32d7b5ac8ea9a6bbf750910302f8 adds dayKnown, month-end/leap-year, stable-tie, empty-catalog and native-only fallback regressions.
- Executed: Linux Swift 6.2.1 isolated -warnings-as-errors harness PASS (DASHBOARD_WEB_INCOME_TEMPLATE_PARITY_PASS); standalone parser checks PASS. Not executed: app-target build/XCTest/UI test, Simulator, .xcresult, actual screenshots/VoiceOver, Files Provider device tests.
- Exact current app HEAD 311582fa59cd32d7b5ac8ea9a6bbf750910302f8: Native iOS CI run 45117719580, job 137504260207, failed before runner allocation (runner_id 0, no steps, no artifacts, no combined status contexts). Do not retry this repeated infrastructure failure.
- App feature is 661 ahead / 0 behind stable main a9b30be147abecea45a63bf7dd8d0a3eb3370366; stable main untouched. No Models.swift/LedgerStore.swift wholesale rewrite. Local-only and credit exclusion invariants preserved.

## FIRST NEXT

1. On a functioning macOS runner, execute XcodeGen/full iOS Simulator build, canonicalizer/Coverage/Dashboard/dailyBudget regressions, all DashboardSnapshot tests including WEB income-template selection, and the full unit/UI suites; inspect exact .xcresult and screenshots.
2. Do not retry run 45117719580 or the repeated pre-runner failure pattern. If runner allocation remains blocked, next independent audit is DashboardSnapshotModuleView typography, note line-height, month labels, spacing and border geometry versus archived WEB v18.20 module 303. Patch only proven visual differences and add a UI smoke assertion; do not claim visual runtime verification without screenshots.
3. After actual iOS canonicalizer proof passes, implement provenance-aware canonical-template persistence and .fabackup restore/reload, then validate Files Provider on device. WEB JSON export/year-zero import remain disabled until lossless Apple-target validation.
## Completed in latest native iOS stage — Dashboard snapshot visual parity (2026-11-23)

- Archived WEB v18.20 module 303 uses 13pt/21 line-height notes, 10.5pt eyebrow with 17pt line-height, 5pt card gaps, 22pt radius, 14x13 padding, and a full-width 2pt top border with 1pt remaining edges. Native palette values already matched.
- App commit 44531ea53324b1521f50398a3dbb0ffa67c3b12d aligns DashboardSnapshotModuleView note/detail typography, eyebrow line box and full-width top accent clipped to the card radius.
- Executed: Swift 6.2.1 parser check on representative SwiftUI styling fragment PASS. Not executed: full SwiftUI typecheck/build, app-target XCTest/UI test, Simulator, .xcresult, actual screenshots/VoiceOver, Files Provider device tests.
- Exact current app HEAD 44531ea53324b1521f50398a3dbb0ffa67c3b12d: Native iOS CI run 45118198559, job 137505754088, failed before runner allocation (runner_id 0, no steps, no artifacts, no combined status contexts). Do not retry.
- App feature is 662 ahead / 0 behind stable main a9b30be147abecea45a63bf7dd8d0a3eb3370366; stable main untouched. Local-only and credit exclusion invariants preserved.

## FIRST NEXT

1. On a functioning macOS runner, execute XcodeGen/full iOS Simulator build, canonicalizer/Coverage/Dashboard/dailyBudget/DashboardSnapshot regressions and the full unit/UI suites; inspect exact .xcresult and Light/Dark screenshots.
2. Do not retry run 45118198559 or the repeated pre-runner failure pattern. If runner allocation remains blocked, next independent audit is DashboardHomeHeader and DashboardQuickActions versus archived WEB v18.20 modules 304/303 (date localization/weekday casing, heading geometry, action labels, colors, hit targets and accessibility names). Patch only source-confirmed differences.
3. After actual iOS canonicalizer proof passes, implement provenance-aware canonical-template persistence and .fabackup restore/reload, then validate Files Provider on device. WEB JSON export/year-zero import remain disabled until lossless Apple-target validation.

## Completed in latest native iOS stage — Dashboard selected accent parity (2026-11-23T07:14Z)

- Reconciled the prior HomeHeader/Quick Actions stage from app commits `9fe63aa37c3c55bfb49bff9c8af064bfbd71e55e`, `9cd8d84284838c2545db4beb14cb41dbd3066204` and `afba371575ea4b5fcbb37ec0bbe06c2dcdae267b`. Source-level comparison with archived WEB v18.20 confirmed the HomeHeader typography/date capitalization and Quick Actions glyphs, fixed fill colors, 44pt minimum height and pressed opacity. UI assertions are authored but not run on Simulator.
- Found and fixed a theme parity gap: WEB HomeHeader and Spending/NextIncome detail links use the selected `useUI().colors.accent`; native DashboardSnapshotPalette previously always used Iris violet even when local appearance selected Cyan or Ocean.
- App commits: `eed163c0e3487211a83994aee14580eec41baf02` (dynamic palette + snapshot-card accent source), `2f3f2ff64881abd719d4cd3e60cfb2b01c1e21f8` (selected accent into HomeHeader), `aac5f791286ad35b24fef9a90ff670e33aaaa48b` (Light/Dark tests for Cyan/Ocean/Iris and fallback).
- Executed: isolated Swift 6.2.1 `-warnings-as-errors` palette harness PASS (`DASHBOARD_SELECTED_ACCENT_PARITY_PASS`); parser checks for representative SwiftUI integration and XCTest fragments PASS. Not executed: full iOS build, app-target XCTest/UI tests, Simulator, `.xcresult`, screenshots, Files Provider or VoiceOver.
- Exact app HEAD `aac5f791286ad35b24fef9a90ff670e33aaaa48b`: no PR-triggered workflow runs or combined status contexts surfaced. Last known CI run 45118198559 for parent code HEAD 44531ea failed before runner allocation (job 137505754088, empty steps, no artifacts, log 404 BlobNotFound); do not retry the repeated pre-runner failure.
- App feature HEAD `aac5f791286ad35b24fef9a90ff670e33aaaa48b`, 670 ahead / 0 behind stable app main `a9b30be147abecea45a63bf7dd8d0a3eb3370366`. Stable app main untouched; no Models.swift/LedgerStore.swift rewrite; no formula or backup-format change. Local-only/no backend/no mandatory account/no bank sync/no telemetry; credit is not owned money. `.fabackup` remains the only writable backup; WEB JSON export/year-zero import remain disabled.
- Preview continuity commit recording this stage: PROJECT_STATE `a8fb18e3dac9f77f5865a1a9d4a239c35a70da01`.

### FIRST NEXT — Apple-target validation, then remaining theme audit

1. On the first functioning macOS runner, run XcodeGen/full iOS Simulator build, canonicalizer proof, Coverage, Dashboard order/snapshot, dailyBudget, header/Quick Actions and selected-accent regressions, then all unit/UI tests. Inspect the exact `.xcresult` and Light/Dark screenshots.
2. Do not retry run 45118198559 or the identical pre-runner failure. If macOS runner allocation remains blocked, audit selected-accent propagation across the remaining Dashboard modules/theme surfaces without speculative financial formula changes.
3. After canonicalizer proof passes in the actual iOS test target, implement provenance-aware canonical-template persistence and `.fabackup` restore/reload, then validate Files Provider on device. Keep WEB JSON export and year-zero import disabled until all lossless Apple-target gates pass.


## Completed 2026-11-23T08:13Z — Dashboard semantic accent audit and Space card parity

- App commits: 8d219f08b7e832a53b00a74ff92a03632efc3faf and 4966139a3643d219ec1f8d378f7aa4291d97b6c1.
- Compared archived WEB v18.20 theme module 208 and Dashboard module 303. Selected accent is appropriate only for HomeHeader and Spending/NextIncome snapshot accents/detail links; global native tint follows the saved accent. Autonomy, Space, Budget, Quick Actions, Coverage and Money use semantic/fixed WEB color tokens, so no broad selected-accent recoloring was made.
- Fixed SpaceHome's confirmed native mismatch: positive value uses text, negative uses danger, status dot uses free/danger, disclosure is a trailing 44x36 arrow button with WEB accessibility labels, and expanded details use WEB formula copy and budgetSurface panel geometry. Added Light/Dark palette unit assertions and populated UI disclosure/screenshot assertions.
- Local Swift 6.2.1 isolated palette harness PASS (DASHBOARD_SPACE_WEB_SEMANTIC_PALETTE_PASS); complete changed DashboardSpaceView source parser PASS; representative XCTest/UI fragments parser PASS. No app-target XCTest, full build, UI test, Simulator or screenshot comparison was executed.
- Exact CI run 45136534601 for HEAD 4966139a3643d219ec1f8d378f7aa4291d97b6c1: FAILURE before runner allocation, job 137564044520, runner_id 0, empty runner name, steps empty, no logs/artifacts, combined status zero contexts. No retry.
- App feature HEAD 4966139a3643d219ec1f8d378f7aa4291d97b6c1, 672 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. Stable main untouched; no Models/LedgerStore rewrite, formula change, backup/export enablement or data migration.

### FIRST NEXT — Apple-target validation, then remaining Dashboard audit

1. On a functioning macOS runner, run XcodeGen/full iOS Simulator build, all existing canonicalizer/Coverage/Dashboard/dailyBudget/header/Quick Actions/accent tests plus Space palette/disclosure tests, and the full unit/UI suites; inspect exact .xcresult and Light/Dark screenshots.
2. Do not retry run 45136534601 or the repeated pre-runner failure. If runner allocation remains blocked, audit DashboardAutonomyView disclosure parity and native moneyModule/Budget content against WEB v18.20 module 303, without speculative financial formula changes.
3. After actual iOS canonicalizer proof passes, continue provenance-aware canonical-template persistence, .fabackup restore/reload and Files Provider device validation. WEB JSON export and year-zero import remain disabled.


## Completed latest native iOS stage — Dashboard Autonomy and Budget visual parity (2026-11-23T09:26Z)

- App feature HEAD: `de75d308577cf55b6f9235d41ab3506564ee0b44`; stable app main: `a9b30be147abecea45a63bf7dd8d0a3eb3370366`; feature is `682 ahead / 0 behind`.
- Autonomy module 303: app commits `1dfbb55e`, `5a213a1f`, `bff4aa72`, `15bc1616`, `de75d308` separate the non-interactive card from the 44×36 disclosure button, add the WEB budgetSurface detail panel, and lock Light/Dark geometry/colors/line-height in tests.
- Budget module 218: app commits `a70931eb`, `98392373`, `8b63b516`, `0dd0967f`, `bd8c94e9` align compact Dashboard row typography, selected accent, danger/warning semantics and Light/Dark palette regressions. Budget engines and financial formulas are unchanged.
- MoneyHome audit found a remaining functional/visual gap: WEB has Disponibil, Economii, Datorez, Credit and an unexplained-balance card; native Dashboard currently has only Disponibil propriu and Credit disponibil. A second source-confirmed financial discrepancy is that WEB excludes accounts with `available === false` from Disponibil, while native `LedgerSafeTotals.ownedMoneyMinor` does not filter `availableForSpending != false`. No financial formula change was made; explicit user approval is required after presenting a testable proposal.
- Executed: Swift 6.2.1 `-warnings-as-errors` isolated Autonomy and Budget palette harnesses PASS; `swiftc -frontend -parse` on complete changed Autonomy source, changed Budget fragment and representative XCTest/UI fragments PASS. These are isolated checks only. Not executed: Xcode build, app-target XCTest/UI tests, Simulator, `.xcresult`, screenshots, Files Provider or VoiceOver.
- Exact final HEAD CI lookup returned no PR-triggered workflow runs and no combined status contexts. Parent run `45136534601` failed before runner allocation (job `137564044520`, runner_id 0, no steps/artifacts/logs). No retry. `xcodebuild`/`xcodegen` unavailable in the current Linux environment.
- App stable main remains untouched. No wholesale Models.swift/LedgerStore.swift rewrite, no backup-format change, no migration, no backend/account/bank sync/telemetry. Available credit remains excluded from owned money.

### FIRST NEXT

1. On the first functioning macOS runner, run XcodeGen, the full iOS Simulator build, canonicalizer proof, Coverage, Dashboard/dailyBudget/Snapshot, Autonomy disclosure and Budget palette tests, then the full unit/UI suites; inspect the exact `.xcresult` and Light/Dark screenshots.
2. Do not retry `45136534601` or the repeated pre-runner failure pattern. If runner allocation remains blocked, audit `DashboardCoverageView` against archived WEB module 303, limited to source-confirmed presentation/interaction and no financial formula changes.
3. MoneyHome expansion and the `availableForSpending` calculation semantics remain pending a testable proposal and explicit user approval.
4. After canonicalizer proof passes on the actual iOS test target, continue provenance-aware canonical-template persistence, `.fabackup` restore/reload and Files Provider device validation. WEB JSON export/year-zero import remain disabled.


## Completed latest native iOS stage — Dashboard Coverage presentation parity (2026-11-23)

- App commit 23916326147de8837da8d30babaa299639754362 aligns DashboardCoverageView with archived WEB v18.20 module 303: 11pt bold eyebrow, 1.7 tracking, centered header/detail rows and 16pt row gap. Regression expectations updated in AppearanceSettingsTests.testDashboardCoverageTokensMatchWEBv1820.
- The audit confirmed the existing 22pt card radius, 17pt padding, 5pt card gap, 44x36 disclosure, 8pt disclosure gap, 18pt/18pt/12pt expanded panel, copy, conditional rows and semantic colors already match the archived source at code level.
- Executed Swift 6.2.1 swiftc -frontend -parse on representative changed SwiftUI and XCTest fragments: PASS (COVERAGE_PARITY_SWIFT_PARSER_PASS). No full app-source parse, SwiftUI typecheck, Xcode build, XCTest/UI, Simulator, .xcresult, screenshot comparison, Files Provider or VoiceOver run.
- Exact HEAD CI run 45162748132, job 137651987572, failed before runner allocation: runner_id=0, empty runner name, steps=[], no artifacts, no combined status contexts. Do not retry the repeated pre-runner failure.
- Feature HEAD 23916326147de8837da8d30babaa299639754362, 687/0 vs stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366. Stable main untouched. Local-only and credit-exclusion invariants preserved.

### FIRST NEXT

1. First functioning macOS runner: XcodeGen, full iOS Simulator build, canonicalizer proof, accumulated financial/Dashboard regressions, full unit/UI suites and .xcresult plus populated Light/Dark screenshot review.
2. Do not retry run 45162748132. If runner allocation remains blocked, audit trackedBudgets, obligations and attention Dashboard presentation against archived WEB v18.20 without changing financial formulas.
3. MoneyHome group expansion and the availableForSpending owned-money filter require a testable proposal and explicit user approval before changing financial semantics. Credit remains excluded from owned money.
4. After Apple-target canonicalizer proof, continue canonical-template persistence, .fabackup restore/reload and Files Provider device validation; WEB JSON export and year-zero import remain disabled.

## Native iOS — completed Dashboard Attention / Financial Calendar audit (2026-11-23T13:08Z)

- Reconciled app feature HEAD 1c42a0c4676ae3be9fa4167fbebdd1e14ebef52c (695 ahead / 0 behind stable app main a9b30be147abecea45a63bf7dd8d0a3eb3370366). Preview main at reconciliation start: 5ff0ab49259aaf8a95a178174e6d99fbb9e04381.
- Existing app commits complete this stage: a82fd463b2916caaadc86cc6fca27e33503bec10, d0eeca8f19b7d29046d30ba53462d0064c4dd426, dd4c76361f101fc008e58d7c4ad8c5198d7f9a79, 66abd2cd1c88f400ce95fc393b8560175405e772, f1b7d40cc716aee200f36d6bc234ceb46757c495, 36649b9fa9758d7867f54c70f21854b004a39ed9, 251b952f581a1919b49d18a07e41f484f315a937, 1c42a0c4676ae3be9fa4167fbebdd1e14ebef52c.
- Archived WEB v18.20 bundle blob be453db2699273a194543de4532db6ea4b2e1cf2 confirms trackedBudgets is declared but maps to null; native correctly preserves it in the stored order while keeping it unavailable/hidden. obligations now uses the 3-item Financial Calendar plus expand behavior. attention appears only for pending monthly reviews or legacy data. Source-level colors, typography, spacing, card geometry and control behavior align with the archive.
- Executed: exact fetched DashboardLayout.swift copy parsed with Swift 6.2.1; isolated -warnings-as-errors harness with app-model stubs passed order/hidden-slot/reorder/Attention visibility assertions (DASHBOARD_LAYOUT_AND_ATTENTION_HARNESS_PASS). Not executed: full Xcode build, app-target XCTest/UI, Simulator, xcresult, actual screenshot review, Files Provider or VoiceOver.
- Exact CI for app HEAD: run 45172582256, Native iOS CI push run FAILURE after ~4 seconds; job 137685586856, zero steps, no artifacts, log download 404 BlobNotFound, no combined status contexts. Do not retry the same pre-runner failure.
- No app source change in this reconciliation. Stable app main untouched. Local-only and credit-exclusion invariants preserved.

### FIRST NEXT — MoneyHome 1:1 proposal (requires explicit financial-contract approval)

WEB v18.20 MoneyHome has five expandable groups; native currently has only two metrics. Proposed contract to approve before implementation:

1. Disponibil: sum of account balances where availableForSpending != false; legacy nil is treated as available, matching WEB available !== false.
2. Economii: sum of every savings account, regardless of the availability flag. This is a separate view that can overlap Disponibil; do not add it again.
3. Datorez: sum all debt balances, with a verified one-time mapping so credit card/overdraft are not double-counted across account and debt representations.
4. Credit: card/overdraft only, max(0, limit - max(0, debtBalance)); never part of owned money.
5. Neexplicat: sum absolute latest non-zero valid balance-check differences for accounts and debts, retaining per-item “Explică diferența” actions.

Test fixture: checking 10,000 + savings 5,000 (both available), cash 1,000 (unavailable), loan 20,000, card debt 3,000/limit 10,000, overdraft 1,000/limit 5,000, unexplained differences +1,000 and -500. Expected: Disponibil 15,000; Economii 5,000 (overlapping subset); Datorez 24,000; Credit 11,000 (separate from owned money); Neexplicat 1,500 RON. All sums use checked Int64 arithmetic and fail closed on overflow.

Gate: this changes displayed owned-money inclusion and debt semantics. Per AGENTS.md, do not alter LedgerSafeTotals, account filters or debt/credit formulas until the user explicitly approves this calculation contract. Once approved, implement the five groups and add the synthetic regression matrix. If approval is not yet given, do not substitute guessed values.

After MoneyHome, resume Apple-target validation on a functioning macOS runner (XcodeGen, Simulator build, canonicalizer, accumulated unit/UI suite, xcresult, Light/Dark screenshots). Keep WEB JSON export/year-zero import disabled until lossless Apple-target proof; .fabackup remains the only writable backup.
