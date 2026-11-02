# WEB #85 — C7 structural More document-flow experiment (2026-11-02)

**RESEARCH / TEST ONLY — NOT A PRODUCT FIX.** Base main `d9764e110311589bc62d2634e826c0371bb5fbd7`, WEB **18.72**. C6 found only **4 rendered pixels** between DEMO exit and fixed footer at 320px / 200% root CSS zoom, so a bounded panel cannot be reliable. C3–C5 scroll padding and C6 bounded region were rejected.

## C7 hypothesis

Test a **structural, full-document vertical flow** for the existing More page rather than squeezing a menu into the current shell. The disposable Chromium harness temporarily relaxes height/max-height/overflow on the actual menu-to-root ancestor chain and on the document/root, retaining the actual React controls, warning, exit and five tabs. No cloned/fake buttons, product CSS, bundle or stored financial data. Original inline styles and injected CSS are restored. This is a *counterexample probe*, not a design commitment.

At each 320/390px light/dark case with root CSS zoom 200%, collect:
- natural Tab from the real “Mai mult” tab to the real “Bugete” row; `:focus-visible` and center hit test;
- Shift+Tab back out of the row and Tab forward again; Enter activation of the actual Bugete screen;
- Playwright pointer *trial* click (not counted as activation);
- DEMO warning/exit presence, viewport visibility and independent center hit tests **after** focusing the row;
- real document scroll height and scrollTop, all five tab destinations;
- screenshot and unchanged encrypted-vault key footprint.

The **strict C7 acceptance** requires all conditions, especially simultaneous safety warning/exit hit-test exposure after focus. A PASS workflow can contain an **accepted=false** negative research result; it must not be reported as accessibility success. If document flow makes warning/exit scroll offscreen, reject C7 as the final UX even if Bugete becomes reachable. A future sheet would need a persistent safety region and explicit focus management.

## Safety / limitations

The harness only uses disposable memory-only DEMO, restores styles, and falls back to a DOM click solely to restore the test page after a failed candidate. The fallback is never counted as a natural interaction pass. Root `style.zoom=200%` is a Chromium stress proxy, not Safari Dynamic Type, browser zoom, VoiceOver, or WCAG certification. A product release would additionally require 320/390 light/dark, normal/enlarged text, actual touch, keyboard, focus, persistent safety header, exact bundle version, CI, Vercel and independent served-browser/Safari evidence.


## C8 follow-up — persistent real DEMO safety controls (pending CI)

C7's first exact-head Chromium job [#41425826981](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41425826981) passed the test runner but its **strict candidate acceptance was 2/4**: natural Tab, reverse Tab, focus-visible, center exposure, pointer trial and Enter succeeded 4/4, while at **320px** the actual DEMO warning scrolled above the viewport (top **−320px**, bottom **−232px**). Exit remained exposed at **92–188px**; Bugete was exposed at **436–548px**. At **390px**, warning/exit/Bugete were all exposed, but this is still a Chromium proxy, not Safari.

C8 keeps C7's real document flow and **temporarily positions the original DEMO warning and original exit button** as a fixed safety header (no clones), above the actual More menu. It checks the same 4 combinations, pointer trial, forward/reverse keyboard, Enter and hit tests, and restores original inline styles. This is **not a shipped solution**; a future production sheet must also ensure the safety header does not overlap text, remains legible, preserves memory-only disclosure and passes actual iPhone testing. **C8 CI and acceptance pending.**

## Status

**PENDING CI:** test-only candidate on `research/web85-c7-flow-more-20261102-1202`. Record exact CI run IDs and 4/4 C7 diagnostics after execution. Do not publish any UI change based on unverified results. #4/#29/#35 P1 integrity issues remain open (five cached old-writer scenarios known unsafe); #14/#25/#2 financial contracts remain approval-gated. No iOS, ledger, encrypted backup, formula, server, account, telemetry or WEB version change.
