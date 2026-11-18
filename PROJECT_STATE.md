# Financial Autonomy — current project state

## Operating mode (2026-11-07)

**WEB development is user-directed.** The hourly Web Premium automation was paused at the user's request; no autonomous WEB product work is authorized until the user selects it. Keep the independent iOS automation and repository untouched. Continue in the same GitHub repositories, preserving AGENTS.md, RELEASE_PROCESS.md, DEVELOPMENT_WORKFLOW.md, IMPLEMENTATION_QUEUE.md, GitHub issues and prior history.

## Verified handoff baseline

- WEB preview repository: `nikopol000/financial-autonomy-preview`, branch `main`.
- Active version in `index.html` at handoff: **18.74**. This is a version observation, not a claim that every feature is end-to-end verified.
- Public preview: https://financial-autonomy-preview.vercel.app/ . Last inspected production deployment was READY for WEB 18.74; browser/Safari interaction was not independently verified in this handoff.
- Existing unresolved issues: **#29** reset integrity (critical, four separate safety gates; acceptance test not confirmed green), **#35** encrypted first-save recovery, **#4** stale-tab/data integrity, **#14** budget perspectives (DISCOVERY ONLY; financial contract not approved), **#85** mobile accessibility/zoom. Consult live issues and queue for current details.
- `IMPLEMENTATION_QUEUE.md` contains extensive chronological checkpoints and must be preserved, not replaced or summarized destructively.
- No application bundle, financial formula, financial data, diagnostic export, release metadata or iOS code was changed during this operating-mode handoff. Documentation-only commits do not trigger a version bump.

## First unfinished action / next user decision

The operating-mode handoff is complete after the documentation updates are committed and verified. **Wait for the user to choose the next WEB work item** (e.g. dashboard premium design, budget perspectives analysis, or a critical safety issue). On the next development request, read current GitHub HEAD and all continuity files; reconcile any changes since this checkpoint. For new financial budget semantics, obtain explicit approval of the calculation contract before coding. Do not automatically resume #29 just because it was the former automation's top priority; flag its safety implications when planning any change.

## Release and approval invariants

Follow RELEASE_PROCESS.md for every product change: immutable versioned bundle, synchronized metadata/diagnostics, checks, GitHub CI, deployed artifact verification and browser validation when possible. Never claim full verification without evidence. Preview `main` is not the stable source `financial-autonomy-app/main`; promoting to the latter requires explicit user approval of the exact build.

## 2026-11-07 — user-directed bugfix resumed, #29 candidate (NOT RELEASED)

- User explicitly requested to continue from the former WEB task and fix existing bugs, prioritizing data integrity. WEB automation remains paused.
- Inspected active WEB 18.74 reset implementation and `tests/acceptance-reset-no-false-idle.cjs`. Identified unverified `removeItem` calls followed by `idle-v2` and automatic destructive reset continuation on reload.
- Created isolated branch `fix/reset-fail-closed-1875-candidate` and **draft PR #495**: https://github.com/nikopol000/financial-autonomy-preview/pull/495 . Candidate WEB 18.75 adds read-back guards after KEY/PAYLOAD removal and stops automatic deletion on ambiguous reload. Candidate commits: `81f3e9a` bundle, `85bf1df` branch HTML activation. **Not merged to main, not promoted to production, not a complete #29 fix.**
- Critical unresolved: deleting one of two records before failure can still lose the vault's decryptability; need atomic/staged recovery design, stale-tab/privacy acceptance, and disposable browser tests before release.
- Local checkout failed due to unavailable DNS for github.com. At initial check PR Chromium workflow was queued; no test success claimed. Vercel status on branch does not establish production deployment.
- **FIRST NEXT:** inspect PR #495 CI, run/inspect reset acceptance on exact candidate and browser synthetic scenarios; do not merge until all four #29 safety gates and release checks are satisfied. Then continue #35/#4 and other open bugs. Keep #14 financial semantics gated on explicit approval.

## 2026-11-07 — PR #495 CI results (BLOCKED; no release)

- Retrieved actual GitHub Actions for candidate head `85bf1df`: release validation run `42366268072` **FAILURE**; Chromium WEB vault run `42366268004` **FAILURE**. Logs inspected, not inferred.
- Release failure: historical `tests/web-v1874-dashboard-arrange-target-regression.cjs` asserts active HTML remains exactly 18.74; candidate activates 18.75. This test needs separation between archived immutable 18.74 behavior and current active version; do not delete its historical bundle assertions.
- Chromium failure: browser test reaches `e.load` after a pending reset and now receives the candidate's deliberate fail-closed error. Existing smoke expects old automatic completion; acceptance needs an explicit safe interrupted-reset recovery contract and revised scenario, not a blind catch or silent deletion.
- PR remains **DRAFT**, unmerged, production remains WEB 18.74; candidate is **NOT ACCEPTED**. No full #29 recovery or regression pass claimed.
- **FIRST NEXT:** design/test explicit recovery handling for pending marker and partial KEY/PAYLOAD (with user-visible choices and no silent deletion), update version-independent historical test assertions, add scenario-specific acceptance tests, then rerun both workflows before any promotion.

## 2026-11-07 — PR #495 browser and immutable regression corrections (candidate still NOT RELEASED)

- On `fix/reset-fail-closed-1875-candidate`, corrected `tests/web-v1874-dashboard-arrange-target-regression.cjs` to verify archived 18.74 immutable behavior while accepting a matching future active HTML/bundle version. Commit `0d558a55`.
- Updated `tests/browser-vault-recovery-smoke.cjs` to assert no further deletion on interrupted KEY or PAYLOAD removal and reload. Test-only manual completion is confined to disposable synthetic Chromium profiles for existing stale-tab/idempotence coverage. Commits `5deca988`, `fb49dc47`.
- Verified candidate JS bundle and both edited test scripts parse successfully with V8 syntax compilation via GitHub-fetched exact content; this is **not** a substitute for Node/Chromium CI.
- Original CI runs `42366268072` and `42366268004` failed on old version-pinned assertion and old auto-delete expectations. No completed workflow result was yet available for the latest branch commit `fb49dc47`; do not claim tests green.
- **FIRST NEXT:** inspect GitHub Actions on `fb49dc47` for additional failures; ensure acceptance and browser fault matrix pass; design durable safe recovery for partial deletion (atomic/envelope strategy), stale-tab fence and privacy/retention, then release only when all safety gates pass. PR #495 remains DRAFT, production WEB 18.74.

## 2026-11-07 — latest CI failure triage and synthetic smoke correction

- Candidate `fb49dc47` CI completed **FAILURE** in both runs: release `42366626489` and Chromium `42366626553`.
- Release failures are primarily in `tests/vault-real-crypto-regression.cjs`, which asserts legacy automatic recovery for multiple pending/invalid reset cases. This is a substantive safety contract conflict, **not** a harmless version-pinned test. Do not blanket-update expected messages or suppress assertions. Explicit recovery must be designed and proven before promotion.
- Chromium failure was at `tests/browser-vault-recovery-smoke.cjs:603`: test manually changed synthetic storage to idle but called reset from a tab holding a stale revision, correctly triggering a cross-tab conflict. Updated test to reload/reload vault after test-only synthetic completion, commit `d2ec4cd`; await fresh CI result.
- PR #495 remains draft/unmerged. Production WEB 18.74 unchanged. **NEXT:** inspect CI at `d2ec4cd`, implement a recoverable interrupted-reset state machine with non-destructive access when KEY+PAYLOAD intact, explicit user authorization for irreversible deletion, safe handling when only one record survives, stale-tab fences, and privacy retention semantics. Extend Node/Chromium acceptance before merge. Do not modify real user storage.


## Native iOS parity checkpoint — 2026-11-18, v18.20 build57

The independent native candidate remains on `nikopol000/financial-autonomy-app:feat/sync-preview-v18-20-ios`; source `main` is still the stable approved baseline and was not changed.

- Exact native candidate: [build57 commit `b1e8a47`](https://github.com/nikopol000/financial-autonomy-app/commit/b1e8a47b1820da97a70589c350314c71f49cf03f).
- Diagnostic privacy gate: full plaintext diagnostic export now has a separate destructive confirmation with an explicit unencrypted-data warning; redacted summary remains one-tap. Accessibility identifiers/hints and a focused UI consent test were added.
- Static verification: Swift parser passed for the two changed Swift files; seven static privacy/consent assertions and the XcodeGen YAML parse passed. **Xcode build, 297 unit tests and 4 UI tests remain NOT RUN**; this environment has Swift on Linux but no Xcode.
- Exact-commit CI has no reported combined statuses. The previously observed run failed before runner allocation, with zero steps; no repeated retry was made.
- **Next action:** Apple validation on exact build57, then correct any real build/test/runtime differences and finish populated-data, light/dark, accessibility and screen-by-screen parity checks. No 1:1 completion claim is made.


## Native iOS parity checkpoint — 2026-11-18, build57 compiler recovery

- Re-read all five required preview continuity files from `main`. Startup refs: preview main `61be93cc4ea75458e3f51d1a1521840d12f3da0d`; app feature `b1e8a47b1820da97a70589c350314c71f49cf03f`; app stable main `a9b30be147abecea45a63bf7dd8d0a3eb3370366`. Handoff was READY with expired lease; this run claimed a finite lease in preview commit `60557a58e32390aefeeb47f2534d58f0daffe875`.
- Native iOS CI exposed real compiler failures on a macOS runner (not the earlier pre-runner infrastructure failure):
  - Run [44367248801](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44367248801), exact build57 `b1e8a47`: Xcode selection, XcodeGen install and project generation passed; simulator build failed (exit 65) because `AutonomyScenariosView.swift:182,184` passed `Locale` as the first `String(format:)` argument.
  - Fixed in app commit [`a2cf9c2`](https://github.com/nikopol000/financial-autonomy-app/commit/a2cf9c2c4282b5b6ebf3a8555a96db5a8bf861c0) using the Foundation `String(format:locale:arguments:)` signature. Exact CI run [44377176043](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44377176043) then exposed two further compiler errors: a redundant second optional binding in `WebBackupV18_20.swift:1154`, and local `obligations` shadowing the helper in `WebDailyPaceEngine.swift:148` (with a dependent key-path inference error at 153).
  - Fixed the backup optional binding in app commit [`8e81c3c`](https://github.com/nikopol000/financial-autonomy-app/commit/8e81c3cd6ee2613c28f079526bdf4a1a66622eff) and renamed the local collection to `scheduledObligations` in [`b9de235`](https://github.com/nikopol000/financial-autonomy-app/commit/b9de235a5918cd45f4a151815908175d81922515). Intermediate run [44377428587](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44377428587) for the intermediate commit was cancelled by the next push; this is not a test result.
- Local Linux Swift 6.2.1 compiled and ran a focused Foundation regression snippet for the corrected format initializer, optional binding and helper/local-name pattern. This is not a native app build or XCTest.
- Exact current app feature HEAD: `b9de235a5918cd45f4a151815908175d81922515`. App stable `main` remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`. No `Models`/`LedgerStore`, financial formulas, or app/main files were changed.
- Exact current CI run [44377435836](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44377435836) targets `b9de235a5918cd45f4a151815908175d81922515` and was QUEUED at checkpoint time. **No build, unit-test or UI-test success is claimed.**
- **FIRST NEXT:** inspect run 44377435836 for this exact HEAD. If build passes, let its 297 unit and 4 UI tests complete and inspect results/artifacts. If build fails, inspect exact compiler diagnostics and fix only evidence-backed issues on the feature branch. Then continue populated backup/restore, diagnostic export, Dashboard order, Light/Dark, VoiceOver and archived v18.20 screen-by-screen comparison. Do not merge to app/main; 1:1 is not established.
