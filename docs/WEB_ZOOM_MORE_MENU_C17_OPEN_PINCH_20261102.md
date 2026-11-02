# WEB #85 — C17 original open-menu safety during native mobile pinch (2026-11-02)

**Status:** Research characterization only; **no product fix or release**. Base main `19eb1a0604d8897bb317b18c0824c122d549f321`, WEB 18.72.

## Question and why C17 is necessary

C16 demonstrated that, **after the menu had been closed** and keyboard focus returned to the bottom tab, DEMO warning/exit were offscreen in all four 422px cases during CDP pinch. That observation must not be interpreted as a safety defect **inside the open menu**. C14/C15 also established that an undismissed recap overlay had confounded earlier pointer failures. C17 dismisses recap legitimately and tests the original open More UI, without experimental C13 layout.

## Method / reproducibility

`tests/browser-web85-c17-open-menu-pinch-research.cjs` executes the original immutable WEB 18.72 with a disposable local HTTP origin and memory-only DEMO, for eight configurations (320/390 × 422/844 × light/dark).

1. Dismiss the recap with real pointer interactions; open original `Mai mult` by pointer.
2. Record DEMO warning, `Ieși din demo`, focus, five navigation tabs, and geometry **with the menu open**.
3. Apply CDP `Emulation.setPageScaleFactor(2)` without closing More. Capture visualViewport scale, warning/exit rectangle, center hit test and screenshot.
4. Navigate via Tab to the actual DEMO exit, record focused geometry; attempt a **non-activating Playwright pointer trial while still pinched**. Trial failure is recorded, not hidden or forced.
5. Restore scale 1, perform an **actual** exit click on disposable DEMO; assert no encrypted vault key/payload/reset marker is created. Preserve JSON and screenshots as CI artifact.

**Limits:** CDP page scale is not Safari Dynamic Type, real iPhone pinch or desktop Ctrl+ zoom. `getBoundingClientRect`/center hit-testing are observations, not WCAG/VoiceOver certification. Playwright `trial:true` is an actionability probe, not actual touch activation. A green test means eight runs completed and no encrypted vault keys were created; the reported outcome counts must be read separately.

## Decision gate

Do not introduce a sticky demo banner, scroll locking, or C13 CSS solely from C16 closed-menu geometry. Only propose a minimal WEB fix if C17 establishes a repeatable **open-menu** failure after recap dismissal. If it does, capture a minimal reproduction and test in browser zoom and Safari/VoiceOver where available before declaring acceptance.

**P1:** #4/#29/#35 five cached legacy writers remain known unsafe; no restore/reset/cutover. **Financial DISCOVERY:** #14/#25/#2 remain approval-gated, with no changes to formulas or budget modes. Nonurgent #400 remains pending actual mobile touch verification. No backend, login, telemetry, bank connection, real financial data, encrypted backup, or iOS changes.

## Verification

**Verified exact PR head** `818931d5a72a9187557a41abd0e06e308e502dfd`: [Chromium #41497693005](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41497693005) **SUCCESS** (C17 step and artifact upload successful), [Release #41497692743](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41497692743) **SUCCESS**. All eight named `C17 WEB85` lines and summary inspected in job `125456828229`. [PR #478](https://github.com/nikopol000/financial-autonomy-preview/pull/478) squash-merged `e2cad7f0bd791283fbc9580eee65b42b30bbd35f`.

- Recap dismissed by real pointer **8/8**; original More opened **8/8**; CDP pinch visualViewport scale 2 **8/8**.
- **422px open-menu initial state:** DEMO warning and exit were **above the viewport in 4/4** configurations, both before and during pinch (e.g., 320px warning y=−739 and exit y=−630). This is now an **open-menu** observation, unlike C16; do not call them permanently inaccessible.
- **844px open-menu initial state:** warning and exit were fully visible and center-hit-testable **4/4** before/during pinch.
- After keyboard Tab reached `Ieși din demo` **8/8**, focus scrolling brought warning and exit into view and center hit-testable **8/8**; the pointer `trial:true` succeeded **8/8** at pinch scale 2 **after** that focus scroll. Actual exit after returning scale to 1 succeeded **8/8**; no encrypted vault keys created.
- **Interpretation:** C17 demonstrates a short-height **discoverability/initial scroll-position issue** in the real open More menu, but does **not** prove that touch-only users cannot scroll to the exit. A successful pointer trial **after keyboard focus scroll** is not proof of touch-only discovery or direct initial-state hit-testing. Green CI is not accessibility acceptance.

**First unfinished step:** C18 characterize original **touch-only** scroll/exit discovery from the initial 422px open-menu position, including whether the DEMO warning and exit can be reached without keyboard-induced scroll, with synthetic DEMO only. Inspect touch action, scroll container, visible focus and no vault writes; test real browser zoom and Safari/VoiceOver when possible. Do not ship a sticky warning or C13 based solely on C17. Separately return to P1 #4/#29/#35 safe-vault design; five cached legacy writer scenarios remain known unsafe. WEB 18.72 unchanged. Merged-main CI, exact Vercel SHA and served-browser verification are separate and not yet confirmed.
