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

## Verified outcomes — 2026-11-02

Exact C18 PR head `5187913edd83872e75edb0c9eb7e6799965b7322`: [Chromium run #41506690516](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41506690516) **SUCCESS**, [Release run #41506690402](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41506690402) **SUCCESS**. Eight named `C18 WEB85` log lines and summary inspected in job `125487688926`; [PR #480](https://github.com/nikopol000/financial-autonomy-preview/pull/480) squash-merged at `9782533542fc093637b9538b3677d443812eec15`. Green CI means research completed, not full touch accessibility.

- Legitimate recap dismissal **8/8**; original More opened **8/8**; no encrypted vault keys **8/8**.
- **Scale 1, 422px:** 320/390 light/dark **4/4** reached both original warning and exit after **three CDP touch swipes**, with no keyboard/focus-induced scrolling. Example 320px: initial warning y=−739, exit y=−630, document scrollY=816; after touch warning y=77–99 and exit y=186–234, both fully visible and center-hit-testable. **Actual touch exit succeeded 4/4**. This disproves a blanket claim of touch-only unreachability at normal scale in these synthetic Chromium configurations, although initial discoverability remains poor.
- **Scale 2 CDP pinch, 422px:** strict simultaneous full-visibility/hit-test gate **0/4** after 12 touch swipes. Document was scrolled to its top (warning y=77–99, exit y=186–234), but visual viewport is approximately half-height and half-width; the warning/exit widths (292/362 CSS px) exceed the narrowed visual viewport, and exit bottom is beyond it. The test deliberately skipped exit tap in these four cases. **This is NOT proof that panning or separately scrolling to the exit is impossible.** The strict test requires both controls to be fully visible at once and does not attempt horizontal/vertical visual-viewport panning. Do not call this a verified iPhone/Safari accessibility failure.
- The test used simulated Chromium touch/CDP page scale, not a physical iPhone, Safari, VoiceOver, native Dynamic Type or desktop Ctrl+ zoom. No product code or version changed; WEB 18.72 remains current.

**Decision:** retain original More; no C13 structural fix. If #85 is revisited, test independent reachability of exit under pinch (not simultaneous full visibility), visual viewport panning, and physical Safari. **Priority next:** P1 #4/#29/#35 cached legacy writer and recovery integrity contract; no destructive cutover. #14/#25/#2 financial semantics remain approval-gated. Nonurgent #400 static WEB 18.72 recheck confirms Romanian label and declared 44px minHeight, but physical touch/VoiceOver acceptance remains open. Merged-main CI, exact Vercel deployment and served-browser verification are separate gates.
