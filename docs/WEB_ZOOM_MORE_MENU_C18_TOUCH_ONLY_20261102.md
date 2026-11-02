# WEB #85 — C18 touch-only reachability of original More safety controls (2026-11-02)

**Status:** experimental characterization, NOT a production fix. WEB 18.72 remains unchanged. Base main `f170e53dc8a25943714cb01567ed9e8d05750bfc`; C17 previously found DEMO disclosure and exit above the initial 422px viewport, but keyboard focus could scroll them into view.

## Question

Can a person using touch alone, without Tab, focus-induced scroll, JavaScript `scrollIntoView`, or DOM rearrangement, find the complete `DEMO · DATE FICTIVE` disclosure and activate the original `Ieși din demo` action in the **already-open** `Mai mult` menu on a short mobile viewport?

## Method

`tests/browser-web85-c18-touch-only-scroll-research.cjs` uses the original immutable WEB 18.72 on a disposable localhost DEMO origin, after dismissing the foreground recap with real pointer clicks. Eight configurations: 320/390 CSS px × 422 px × light/dark × CDP page scale 1/2.

- Open original More with a real pointer click, record warning/exit geometry and scrollable ancestors.
- Use only Chromium CDP `Input.dispatchTouchEvent` (touchStart, incremental touchMove, touchEnd), dragging down to discover offscreen safety controls; record each of up to 12 attempts and the scroll position. **No keyboard/focus/scrollIntoView/programmatic scrolling** in this phase.
- Record visual-viewport-aware geometry, center hit tests, and screenshots. When both warning and exit are visible and the exit is hit-testable, try an actual `page.touchscreen.tap` on the original exit.
- Assert no encrypted vault KEY/PAYLOAD/RESET values appear. Save full per-case JSON and screenshots as CI artifacts.

## Interpretation gate

A green CI run proves only that the research harness completed safely, not that all eight configurations are accessible. The per-case `touchReached`, `exitTouch`, scroll positions, and screenshots are the actual evidence. If controls remain unreachable, first distinguish incorrect gesture origin, nested scroll container, pinch coordinate mapping, and legitimate content height from a product defect; do not ship C13, hide DEMO disclosure, or claim WCAG failure from a single emulation. CDP page scale and simulated touch do not certify physical iPhone Safari, VoiceOver, browser Ctrl+ zoom or Dynamic Type.

**Next after CI:** inspect all eight named logs and artifact JSON, document positives/negatives in #85 and both checkpoints. Only propose a narrowly scoped WEB change if repeatable real original-UI failure is established, with immutable version, tests and deployment proof. Separately return to P1 #4/#29/#35 five known-unsafe cached legacy writers; no vault cutover/reset/restore. #14/#25/#2 financial contracts remain DISCOVERY, without formula changes. Periodic nonurgent #400 browser touch acceptance remains open.

No product JS/HTML, version, formula, real financial data, encrypted backup, backend, login, telemetry or iOS change.
