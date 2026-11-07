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
