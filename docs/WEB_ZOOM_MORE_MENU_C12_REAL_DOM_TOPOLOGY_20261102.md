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
