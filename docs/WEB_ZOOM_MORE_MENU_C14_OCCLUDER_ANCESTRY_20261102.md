# WEB #85 — C14 original-control hit-test occluder ancestry (2026-11-02)

**Research-only / disposable localhost DEMO. NOT a WEB 18.72 product fix.**

## Why C14

C13 (PR #471, exact-head Chromium #41469588069) rejected bounded CSS after real pointer activation failed for **Mai mult, Ieși din demo and Bugete in 16/16 stress cases**. Its screenshots and text-leaf visibility cannot establish what actually intercepted the original buttons. C14 isolates the first unfinished question: **which element and ancestor stack owns the hit-test point?**

## Method

- Clone the C13 real-DOM setup without altering the immutable JS, HTML, formulas, vault or React handlers.
- Inspect the **original** semantic tab/button ancestor for `Mai mult`, `Ieși din demo` and `Bugete` before opening, after opening and before/after the reversible C13 bounded CSS and focus.
- Capture `document.elementsFromPoint` at the original button center, full covering ancestor chain, position/z-index/pointer-events/overflow/transform/contain/isolation, target chain, scroll offsets, viewport and clipped-center hit for offscreen elements.
- Record **real Playwright pointer outcomes separately** from the programmatic `Mai mult` click used **only** for diagnostic setup. A blocked real pointer is a failure even when the DOM inspection completes.
- Stress **8** configurations at 200% root font size: 320/390 px × 422/844 px × light/dark. C13 already characterized the full 16-case 100/200% grid.
- Preserve five original navigation tabs, original DEMO warning and exit, and verify all three encrypted-vault keys remain absent.
- Retain per-case screenshot and `artifacts/web85-c14-real-dom/topology.json` in CI for inspectable evidence.

## Decision gate

A green C14 workflow confirms the diagnostic executed, **not** that navigation is accessible. Inspect the hit-test ancestry before choosing the next smallest reversible change. Do not set arbitrary `pointer-events:none` or large z-index on production without proving which overlay intercepts and that it is not an interactive or safety-critical element.

**P1 #4/#29/#35:** five cached legacy writers remain KNOWN UNSAFE; no reset, restore, origin migration or backup changes. **#14/#25/#2:** DISCOVERY only; no new financial modes or formulas without explicit numeric contract approval. Safari/VoiceOver and public browser acceptance remain unverified.

## First unfinished step

Wait for exact PR-head Chromium and Release CI; inspect **all eight named C14 logs** and the ancestry JSON, identify the actual covering element(s) and whether the same ancestor recurs across viewports. Then decide whether a safe minimal test-only fix is possible. Update issue #85 and both continuity checkpoints with exact evidence and next step. Do not publish a new product version for diagnostic-only work.
