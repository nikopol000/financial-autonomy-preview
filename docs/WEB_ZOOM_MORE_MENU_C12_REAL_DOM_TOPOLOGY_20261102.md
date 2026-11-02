# WEB #85 — C12 actual More DOM topology gate (2026-11-02)

**Status: research only; not a shipped fix.** Base main `1941af2de5d73edba5d5467da64481f967a5706a`; product remains immutable WEB **18.72**. C11 proved an isolated semantic HTML sheet could pass 16/16 cases, but that is **not** evidence of equivalent React Native Web layout or Safari accessibility.

## Question and method

Before changing the real navigation component, determine the actual DOM ancestry, layout/overflow constraints and viewport geometry of the existing **DEMO warning, complete safety copy, exit control, Bugete destination and bottom navigation**. C12 uses the real active `index.html` and immutable bundle on a disposable localhost Chromium origin. It opens the actual More screen, captures DOM ancestry and computed styles, focuses Bugete, measures center hit-testing and full visibility, and records screenshots. The 16-case matrix is 320/390px width × 422/844px height × light/dark × 100/200% **root font size**. This is a text-enlargement proxy, not actual browser zoom or iOS Dynamic Type.

`tests/browser-web85-real-dom-topology-research.cjs` verifies that the five original tabs, real warning, real exit and Bugete destination exist, and that the encrypted-vault localStorage keys remain absent. The output is `artifacts/web85-c12-real-dom/topology.json`, screenshots and named CI logs. **A green workflow means the topology audit executed; it does not imply all controls were reachable or that C11 was integrated.** The test records negative geometry rather than converting it to a false pass.

## Alternatives / design constraints

- **A — preferred next candidate:** preserve actual React event handlers and original complete DEMO disclosure/exit while arranging them in a bounded, full-viewport More sheet with a separate scrollable destination region. Do not clone or replace the original controls. Keyboard focus entry, trap, Escape/close restoration and pointer activation must be verified on the *actual* app.
- **B — overlay original More page using only fixed CSS:** previous C10 showed 0/4 strict acceptance at 422px/200% CSS zoom because Bugete occluded the safety controls. Do not ship without proving no collisions at short height.
- **C — hide or abbreviate DEMO notice/exit to create space:** rejected. Fictional data must remain explicitly identified, with a reachable exit.
- **D — full document scrolling:** prior C7 loses the warning from view at 320px; not accepted.

## Gates

1. Inspect exact C12 PR-head Chromium logs and artifact; document the actual ancestor/container layout and negative cases. **No acceptance ratio has been observed yet at memo creation.**
2. Use the topology to implement a reversible, test-only **real-app DOM** C13 candidate. Verify all five destinations, actual warning and exit, touch, keyboard focus wrap/return, pointer activation and vault absence across 320/390 × 422/844 × light/dark × text enlargement and browser zoom.
3. Safari/VoiceOver on a physical iPhone remains unverified unless actual evidence is obtained. CSS text/zoom proxies are not WCAG certification.
4. Only after strict acceptance may an immutable product bundle, synchronized version/diagnostic/metadata, CI, exact Vercel deployment and independently served browser test be considered.

## Safety boundaries

No financial formulas, #14 budget perspectives, ledger, vault, backup, origin cutover, iOS, backend or telemetry change. P1 #4/#29/#35, including five cached legacy-writer cases, remain **KNOWN UNSAFE**. #14/#25/#2 remain financial-contract DISCOVERY awaiting explicit approval.

## Exact PR-head evidence and interpretation (2026-11-02)

[PR #469](https://github.com/nikopol000/financial-autonomy-preview/pull/469) squash-merged as `bb86cc0bc986f311009ae6ea222a958f016cac63`. The first C12 Chromium run [#41461756469](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41461756469) **FAILED**: the first real `Mai mult` pointer click was intercepted by other RN Web elements for 30 seconds. This is a genuine negative finding in disposable Chromium, not proof of a physical iPhone failure. The harness was corrected to **record** the blocked real pointer (1.5-second timeout) and use an explicitly labeled programmatic `element.click()` **only to inspect** the real More DOM; bypass is never counted as pointer accessibility.

Final exact PR head `007ce1a7c7f1f12af16c5c86176fe4e7be131325`: [Chromium #41462442815](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41462442815) **SUCCESS**, [Release #41462442839](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41462442839) **SUCCESS**. Inspected all **16 named C12 case logs**: `realMorePointer=0/16` in the *unmodified* disposable WEB DEMO; all 16 DOM topologies captured, with zero encrypted-vault keys. At 422px after harness bypass and focusing Bugete, the warning heading was outside the viewport in **8/8** cases; at 844px the heading was fully visible in **8/8**. Exit button bounds were within the viewport in 16/16, but its center was not hit-testable in the sampled post-focus geometry (0/16). The heading's center-hit metric is a noninteractive text-leaf diagnostic, **not by itself a meaningful button-accessibility assertion**. The Bugete text-leaf center also had 0/16 hit-test results; the real interactive button is an ancestor and requires a separate test.

**Actual DOM structure discovered:** the warning heading, full fictional-data explanation and original `Ieși din demo` button share a three-child flex-column banner container. The real Bugete button is a descendant of a ten-child More destinations flex column, inside an `overflow-y:auto` RN Web content wrapper. These original nodes can anchor a reversible C13 structural experiment without fabricating duplicate controls.

**Next:** C13 must measure the *interactive button ancestors* and real pointer actionability separately from text leaves, and test a full-viewport adaptive More sheet with the original banner, exit and destination handlers. Do not turn a programmatic harness bypass into an accessibility pass. Product WEB 18.72 remains unchanged; Safari/VoiceOver, actual browser zoom and production deployment are not certified.
