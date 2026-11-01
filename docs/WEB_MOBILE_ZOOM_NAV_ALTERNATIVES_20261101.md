# WEB mobile enlarged-text navigation — alternatives and acceptance (2026-11-01)

**Scope:** P2 UX DISCOVERY [#85](https://github.com/nikopol000/financial-autonomy-preview/issues/85). Read-only design research, not an approved layout or a shipped fix. WEB 18.72 is the current source version at this checkpoint. No financial formula, encrypted storage, backup, real ledger or iOS change.

## Evidence and important distinctions

- [#85](https://github.com/nikopol000/financial-autonomy-preview/issues/85) documents **actual synthetic Chromium** screenshots at 320/390px with `document.documentElement.style.zoom='200%'`: labels overlap, the brand/header wraps and the DEMO banner dominates the screen. At the same time `document.documentElement.scrollWidth` did not exceed the viewport, so **zero horizontal overflow does not establish usability**. This is a CSS zoom stress approximation, **not** browser zoom, iOS Dynamic Type, Safari or WCAG certification.
- WEB 18.67 introduced short-height outer scrolling; WEB 18.71 introduced a visible Dashboard keyboard focus shadow. [PR #414](https://github.com/nikopol000/financial-autonomy-preview/pull/414) / WEB 18.72 adds a `Highlight` outline in forced-colors because Chromium dark forced-colors suppresses shadows. This **does not** repair the 200% navigation-label overlap.
- W3C [WCAG 2.2 1.4.4 Resize Text](https://www.w3.org/TR/WCAG22/#resize-text) requires up to 200% text resizing without loss of content/functionality; [1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow) describes 320 CSS px equivalent width and a separate two-dimensional-scrolling requirement. **Do not infer a WCAG failure/pass solely from a 320px mobile viewport with an additional CSS 200% zoom**; that combined viewport may be narrower than the 1.4.10 reference width. [W3C Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) explicitly distinguishes these situations.
- [MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors) explains why box shadows disappear in forced-colors. Treat high contrast, text enlargement, browser zoom, keyboard and screen readers as **different test axes**, not interchangeable proxies.

## Alternatives — do not implement without geometry evidence

| Option | Benefit | Risk / required evidence |
| --- | --- | --- |
| A. Force five fixed tabs into one row with shorter labels / ellipsis | Minimal layout change at 100% | At 200% the visible labels can become unreadable or indistinguishable; accessible names alone do not help sighted low-vision users. **Do not select solely to pass no-overflow assertions.** |
| B. Responsive two-row tab navigation at enlarged text | Keeps all five destinations visibly labeled without hiding any | Increases fixed footer height; can occlude last budget controls, DEMO exit, keyboard focus, or reduce usable viewport. Must test content reachability and safe-area insets. |
| C. Horizontally scrollable, visibly signposted tab strip | Keeps full labels at larger sizes; can auto-scroll the focused tab into view | Discoverability, focus order and scroll indicators become essential. Avoid making users scroll the entire page in two dimensions; test keyboard/touch access to **all five** destinations. |
| D. Collapse some destinations into a clearly labeled “Mai mult” menu | Reduces immediate width pressure | Hides frequent destinations, changes navigation semantics and adds taps. May contradict the premium simplicity goal; must not remove accessible routes or the DEMO exit. |

**Provisional research recommendation:** compare **B** and **C** in reversible CSS-only disposable Chromium prototypes. Keep the five accessible names and actual actions; measure whether every label remains legible and every target is reachable, including after switching pages. Choose no production layout until evidence is captured at 100% and enlarged text, including native Safari when possible. Do not silently substitute icons-only navigation or remove the DEMO warning.

## Acceptance matrix for a future candidate

1. Test 320px and 390px, light/dark, 100% baseline and 200% CSS zoom stress **separately**. Record browser version, `innerWidth`, zoom mechanism and actual bounding boxes. Add real desktop browser zoom/text-only enlargement and iPhone Safari/Dynamic Type as distinct pending checks, not inferred from Chromium.
2. For **Acasă / Finanțe / Adaugă / Istoric / Mai mult**, assert five unique accessible tabs, actual visible text, no pairwise text overlap, no overlapping hit targets, no label clipped outside its hit target, visible keyboard focus and successful activation with keyboard and touch. If the strip scrolls, verify focus auto-scroll and visible affordance.
3. Keep `DEMO · DATE FICTIVE` and `Ieși din demo` discoverable, visible/reachable and unambiguous; never trade away the synthetic-data warning to gain height.
4. On a populated synthetic Bugete page, focus and activate the last interactive budget control and scroll to the last period detail; prove neither is behind a fixed footer, including after changing filters and returning from another tab.
5. Check 200% text scaling **without** horizontal page scrolling for ordinary content when the relevant WCAG reference viewport is met. Test reduced motion and forced-colors independently; use system-color focus indicators when shadows are suppressed.
6. Use only disposable DEMO contexts; verify encrypted vault KEY/PAYLOAD/RESET remain absent. Preserve local-only, unchanged formulas, diagnostic export and immutable archived bundles.
7. A production fix requires a new immutable bundle/HTML/diagnostic version, release/syntax checks, green GitHub CI, exact Vercel production commit + alias and independently served browser verification. **READY alone is not mobile acceptance.**

## Decision / next action

No financial contract decision is involved in this layout research. Next safe engineering step: run reversible B/C prototypes in the existing `tests/browser-populated-budget-audit.cjs` harness and compare screenshots + text/hit-target/last-control geometry; then choose the smallest supported incremental layout fix. Native Safari/VoiceOver remain separately unverified. Keep #85 OPEN.
