# WEB #85 — C6 bounded More-menu geometry experiment (2 November 2026)

**RESEARCH / TEST ONLY — NOT A PRODUCT FIX.** Starting HEAD `3c76ed56ba9724819bc7b6c5b9b31aa751d94422`, active WEB **18.72**. The prior C3–C5 scroll-padding/focus experiments left a keyboard-focused Bugete row center occluded in at least one 320px light/dark condition. In C5, 320 light had `centerExposed=false` at `scrollTop=207.5`, despite Tab→Enter activating the row; the baseline scroll ancestor had `clientHeight=0` and the first row measured 442 rendered px under 200% root CSS zoom.

## Candidate C6 — viewport-bounded menu region

The disposable Chromium audit computes the real rectangles of **DEMO · DATE FICTIVE**, **Ieși din demo**, and the five-tab footer before focusing the Bugete menu item. It only positions the menu scroll ancestor in the vertical interval **below both DEMO safety elements and above the footer**, when at least 100 rendered CSS px of space exists. Unlike C3–C5, this changes the menu's layout region rather than adding scroll padding or imperative focus scrolling. The experiment records whether the interval exists, whether it was applied, natural Tab reachability, focus-visible, center hit-test, and Enter activation. Original inline style is restored after the probe.

The candidate is **not** shipped and does not modify the WEB bundle, financial formulas, local storage, encrypted backups, or iOS. Root CSS zoom at 200% in Chromium is **not** real browser zoom, Safari Dynamic Type, VoiceOver, or a WCAG conformance test. A centered hit test is a deliberately stricter UX diagnostic than WCAG 2.4.11 AA's complete-obscuring threshold.

## Acceptance / decision gate

- Four disposable populated-DEMO combinations: 320/390px × light/dark, with a real `Bugete` row reached via Tab (not programmatically focused), natural Enter navigation, `:focus-visible`, and center exposure.
- DEMO warning and exit must remain visible and hit-test exposed before claiming any layout candidate viable; merely retaining them in the DOM is insufficient.
- Reverse Tab, pointer click, normal browser zoom and physical Safari/VoiceOver must be verified before considering a versioned product change.
- If the available interval is too short, **record the negative result**, do not cover the exit or hide the warning. A full-screen adaptive menu with a persistent safety header may be the next alternative, but requires independent testing.
- GitHub Actions passing means the research executed; it does not imply that C6 passed accessibility criteria. Do not merge a product fix without a robust 4/4 result.

## Status

C6 test branch created; **Chromium result pending**. Existing #4/#29/#35 P1 integrity risks and five cached legacy-writer cases remain unresolved. #14 budget perspectives remain DISCOVERY, pending explicit financial contract approval.
