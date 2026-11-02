# WEB #85 — C13 original-DOM bounded More candidate (2026-11-02)

**Research-only; NOT a product fix.** Base HEAD `749703acfd21155acfcfd9e9a6edaa8d377109ca`, active WEB 18.72. This is a disposable Chromium experiment, not a release or Safari accessibility certification.

## Problem and decision

C12 proved the actual `Mai mult` tab cannot be clicked through the real pointer in 16/16 stress cases and the DEMO warning scrolls offscreen at 422px. The isolated C11 semantic prototype passed but did not exercise the original RN Web handlers.

C13 tests a **reversible candidate** on the original WEB DOM, without copying or replacing nodes. A temporary CSS override disables the 422px document-scrolling fallback, then the test attempts a real pointer click on `Mai mult`. If that fails, a clearly labeled DOM click is used **only for research setup**, and is never counted as accessibility success.

After opening, the test temporarily bounds the **original complete DEMO banner** at the top and the **original More scrollable destination wrapper** between that banner and bottom navigation. The original `Ieși din demo` button and original `Bugete` button/React handlers remain intact. It measures the interactive button ancestor, not just the text leaf; it uses a non-activating pointer trial for DEMO exit and a genuine pointer click on Bugete. Negative results are recorded, not bypassed.

## Evidence and gates

`tests/browser-web85-c13-real-bounded-layout-research.cjs` writes `artifacts/web85-c13-real-dom/topology.json`, screenshots and named logs across 320/390 × 422/844 × light/dark × 100/200% root-font-size stress. It checks five original tabs and zero encrypted-vault keys. **A green workflow means the characterization ran, not that the layout passed accessibility.** Browser zoom, focus trapping/return and Safari/VoiceOver remain separate acceptance gates.

This test is intentionally limited: CSS injection is not a durable React component, `max-height:50vh` can force the complete DEMO notice to scroll internally, and the bottom 72px is a hypothesis, not a measured safe-area solution. Any hidden warning, intercepted exit, blocked More pointer or failed Bugete click rejects this candidate as a production fix. Do not ship by copying this CSS without strict acceptance and redesign.

## Alternatives

1. Prefer a real adaptive component with original handlers, explicit modal semantics, focus entry/trap/return, persistent fully readable DEMO warning and exit, and a measured safe-area-aware destination region.
2. Keep bounded CSS as **diagnostic only**; no production release based solely on synthetic geometry.
3. Do not abbreviate DEMO safety copy or clone exit controls.

## Product invariants

No modifications to immutable bundle, `index.html`, formulas, #14 budget perspectives, vault, encrypted backups, ledger, iOS, backend or telemetry. P1 #4/#29/#35 remain KNOWN UNSAFE (five cached legacy writers). #14/#25/#2 financial contracts remain DISCOVERY pending explicit approval.

## First unfinished step

Inspect exact PR-head Chromium C13 logs and screenshots, count **real More pointer**, **exit pointer trial**, **actual Bugete click**, and whether full warning is visible at 422px/200%. Correct only harness errors if needed; reject candidate on actual accessibility failures. Then checkpoint issue #85, PROJECT_STATE and IMPLEMENTATION_QUEUE with exact evidence. No product version bump until real-app strict acceptance and RELEASE_PROCESS.md verification.


## Verified PR-head result — REJECT candidate (2026-11-02)

[PR #471](https://github.com/nikopol000/financial-autonomy-preview/pull/471) merged at `a4a6504ab6d7ff69233f391b623d81ec641810c5`. Exact test head `b4f4a6d6b15a9dd74ee3f5df3e9ec000d6e46d6c`: [Chromium #41469588069](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41469588069) **SUCCESS** and [Release #41469588068](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41469588068) **SUCCESS**. Inspected all **16 C13 named Chromium logs**, not just workflow status.

- Reversible bounded CSS applied to original nodes: **16/16**. Original full warning copy remained in the DOM, with banner height **177px at 320px width** and **152px at 390px width**. At 422px viewport height the measured destination scroll region was **173px / 198px**, respectively.
- **Real `Mai mult` pointer: 0/16** (harness bypass only for topology).
- **Original `Ieși din demo` pointer trial: 0/16**. This trial does **not** activate exit.
- **Original `Bugete` button real pointer: 0/16**. Its measured center was not hit-testable in **16/16**. The candidate did **not** solve the interactive occlusion.
- Warning heading geometric visibility was restored (16/16), but its text-leaf center hit-test is not a meaningful accessibility proof; the original exit button center remained blocked. **Strict accessibility acceptance: 0/16.**

**DECISION: REJECT C13 bounded CSS as a product solution.** Green CI means the 16 negative-characterization cases ran successfully. Do not copy fixed `z-index`/72px bottom guesses into production. The real hit-test obstruction must be identified before changing the actual React component.

**First unfinished step (C14):** instrument `document.elementFromPoint` at the centers of the original `Mai mult`, `Ieși din demo` and `Bugete` **button elements**, record the covering element's ancestor chain, computed `pointer-events`, `position`, `z-index`, and stacking/overflow context before/after bounded layout. Test a *minimal reversible occluder fix* on disposable DEMO, with real pointer and keyboard focus. Do not infer from text-leaf geometry or bypassed clicks. Keep P1 #4/#29/#35 and #14 approval gates intact. Physical Safari/VoiceOver and exact Vercel deployment remain unverified; WEB 18.72 product unchanged.
