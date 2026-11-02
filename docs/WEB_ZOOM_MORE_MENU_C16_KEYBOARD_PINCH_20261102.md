# WEB #85 — C16 real-app keyboard, focus, pinch and DEMO-exit characterization (2026-11-02)

**Research only, not a WEB product change.** Base `main` `850ccf0ec34ebde9bb44aa61153e7bcbcc5fcb67`, WEB 18.72. No immutable bundle, HTML, financial formula, vault, backup, iOS or actual user data is changed.

## Why this experiment

C14 identified a foreground recap modal as the real pointer occluder. C15 dismissed it using genuine pointer clicks and found original More/Bugete pointer interactions working 8/8 at 320/390 × 422/844 light/dark with root text stress. C15 did **not** test keyboard-only navigation, focus return, a real DEMO exit, or native viewport magnification.

## C16 method and acceptance boundaries

`tests/browser-web85-c16-keyboard-pinch-research.cjs` runs the **original** WEB 18.72 bundle against a disposable localhost DEMO in eight combinations: 320/390 CSS px × 422/844 px × light/dark.

1. Dismiss all four recap steps by actual Playwright pointer actions; never bypass the modal.
2. Start from the document and use **Tab only** to reach the original `Mai mult` tab, press **Enter**, use Tab to reach `Bugete`, then press Enter. Record failures as negatives, not fake successes.
3. Reopen More with real pointer, press **Escape**, record actual focused element (focus return is a candidate expectation, not an established feature).
4. Use Chromium CDP `Emulation.setPageScaleFactor(2)` and record visual viewport scale, warning/exit geometry, tab overlap and screenshots. **This is native mobile pinch/page-scale emulation, not desktop browser Ctrl+ zoom, Safari Dynamic Type or WCAG conformance.** Do not conflate the measurements.
5. Return to scale 1, reopen More, and **actually click** `Ieși din demo` on a disposable session. This replaces C15's non-activating `trial:true`. Capture post-click state.
6. Assert no encrypted vault key/payload/reset marker was created. Store JSON and screenshots in a seven-day GitHub Actions artifact.

Green CI means the eight cases ran, the immutable release guard matched, and no real encrypted vault keys were created. **It does not imply all keyboard, focus, pinch, exit or mobile accessibility outcomes passed.** Inspect the named `C16 WEB85` and `C16 COMPLETE` logs before drawing conclusions. A blocked keyboard target, missing focus return or visually occluded safety control is a negative finding and must remain visible.

## Decision gate / next

If real WEB controls fail after legitimate recap dismissal, isolate the minimal failing DOM behavior before changing the product. Any product correction requires a **new immutable WEB version**, exact bundle diff guard, release/syntax/functional checks, successful GitHub CI, Vercel READY for exact commit, and served-browser verification. Physical iPhone Safari/VoiceOver and true browser zoom remain separate outstanding checks. Do not ship rejected C13 CSS.

**P1:** #4/#29/#35 cached legacy writers still KNOWN UNSAFE; do not trigger restore/reset/migration or infer safety from green research tests. **DISCOVERY:** #14/#25/#2 remain approval-gated; no financial semantics implemented. **Nonurgent:** #400 dashboard reset-order copy/touch remains a browser-acceptance follow-up, not a reason to change financial code.

## Verified PR-head outcome — 2026-11-02

Exact C16 test head `78ce8c0e244b41e7bc64224e80babedaa3d16351`. [Chromium #41487252445](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41487252445) **SUCCESS**, [Release #41487252455](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41487252455) **SUCCESS**. Inspected all eight named `C16 WEB85` lines and the `C16 COMPLETE` summary in job `125420741192`:

- Recap dismissed with real pointer **8/8**.
- Original `Mai mult` reached by Tab and activated with Enter **8/8** (20 Tabs from document focus in this synthetic session).
- Original `Bugete` reached by Tab and activated with Enter **8/8** (4 Tabs after opening More).
- Escape returned actual focus to `Mai mult` **8/8**.
- Actual `Ieși din demo` pointer click accepted **8/8**; the warning was visible again afterward. This proves click acceptance, not a complete persisted-session/logout audit.
- Five original tabs showed **zero pairwise rectangular overlap** in these baseline/pinch geometry measurements; pinch visualViewport.scale reported **2** in **8/8**. No encrypted-vault keys written.
- **Important short-height observation:** after the menu was closed and focus returned to the bottom tab, the DEMO heading and exit were offscreen at 320/390 × 422 in **4/4** cases during pinch. At 844 they were center-hit-testable **4/4**. This is a **closed-menu scroll-position observation**, not evidence of occlusion *inside the open More menu*. Do not ship a fixed header based on it. C17 should inspect the open menu at native pinch and distinguish normal document scrolling from a genuinely inaccessible control.

**Remaining limits:** CDP pinch != desktop browser zoom, Safari Dynamic Type or VoiceOver; test has no screen-reader semantics audit or physical iPhone. C16 is characterization, **not** a shipped fix. WEB 18.72 remains unchanged.
