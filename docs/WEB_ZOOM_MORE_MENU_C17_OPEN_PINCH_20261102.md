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

PR-head Chromium/Release outcomes: **pending**. No browser/device or Vercel publication is claimed. Next action after CI: inspect eight `C17 WEB85` lines, classify open-menu hit-test and focus behavior, update issue #85 and continuity checkpoints with exact SHA/results; only then consider merging research.
