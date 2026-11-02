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

## Verified C14 finding — actual occluder is a recap overlay, not the More menu

**Exact test head:** `4f12f235c27dc2ee0d3ff567effc6934d27b3a37`. [Chromium #41477979881](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41477979881) **SUCCESS** and [Release #41477979820](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41477979820) **SUCCESS**. Inspected **all eight named C14 logs**, 320/390 × 422/844 × light/dark at root-font 200%.

**Key discovery:** The `document.elementsFromPoint` top stack at original `Mai mult`, `Ieși din demo` and `Bugete` centers consistently belongs to a foreground **`RECAPITULARE · octombrie 2026 · 1 DIN 4` overlay** (e.g. its `Am văzut · continuă` button, `Venituri primite 2.500,00 RON` and recap scroll container). The recap container spans the viewport, has `pointer-events:auto` and occupies the hit-test surface. At 320×422 the first button is x20..300/y345..393 and the recap content height is 437px; at 390×422 its recap container spans x0..390/y0..395. This is **not evidence that a z-index change is needed in the More menu**.

- Before any More action, real `Mai mult` center was covered in **8/8**. A programmatic click then opened the underlying More screen **behind the recap overlay**; this is a harness artifact, not a normal user flow.
- After reversible C13 bounded CSS, the original DEMO exit and Bugete button centers remained covered by recap content **8/8**. Real pointer trials: More 0/8, exit 0/8, Bugete 0/8; strict accessibility acceptance 0/8 **with recap still present**.
- All eight tests ran, five original tabs were preserved, encrypted vault keys stayed absent; the test did **not** interact with or dismiss the recap.
- **Correction to interpretation of C12/C13:** their 0/16 blocked-pointer results **cannot be attributed to the More component itself** until the intentionally foreground recap is dismissed through its legitimate controls. Do not label this a production menu bug on the basis of those blocked clicks. The 422px warning-offscreen/layout concerns remain separate research findings requiring a modal-free retest.

**Next exact C15:** In disposable DEMO, dismiss the recap using its **actual visible button(s)**, not a DOM click or blanket `pointer-events:none`. Record each step and whether recap truly closes. Only then retest real `Mai mult` pointer, original DEMO exit trial and original Bugete click at 320/390 × 422/844, light/dark and 100/200% text; retain focus/return and 422px warning geometry. If recap cannot be dismissed, report that separately as an onboarding accessibility issue. Do not ship CSS from C13 or alter production overlay layering based on this diagnostic.
