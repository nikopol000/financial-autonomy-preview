# WEB 18.66 — reversible short-height layout candidates (#85)

Date: 2026-11-01. **Experiment only; not a shipped layout fix or accessibility certification.**

## Reproduction and scope

Previous disposable Chromium checks at 160×422 and 195×422 CSS pixels (100% CSS zoom, synthetic RON 2,000 budget, light/dark) found a zero/7px nested budget scroll viewport. This is a severe layout-space proxy, not proof of iPhone Safari browser zoom or VoiceOver behavior. See [prior measured baseline](WEB_HALF_VIEWPORT_BUDGET_RESEARCH_20261101.md).

The real immutable WEB 18.66 bundle and `index.html` remain untouched. The extended `tests/browser-populated-budget-audit.cjs` runs **two CSS overrides only inside disposable Playwright demo pages**, removing each injected style before the normal navigation regression. Both retain the five tabs, DEMO warning and exit, and require the encrypted vault keys to stay absent. No real ledger, backup, formula, iOS, backend or telemetry is accessed.

## Candidates to compare (not yet proven)

1. **Outer scroll:** allow body/document vertical scrolling; remove the fixed root height, preserve minimum viewport height.
2. **Shell flow:** same outer scroll plus remove fixed heights/overflow on the first two root descendants, aiming to prevent a zero-height nested scroll.

Each probe records the last budget detail's viewport position and hit test after `scrollIntoView`, all five tab centers and keyboard focus after scrolling, the DEMO warning/exit presence, document scroll height, horizontal overflow and a `fullyReachable` **diagnostic boolean**. These observations are printed under `REVERSIBLE SHORT HEIGHT CANDIDATE #85`; a green workflow only means the test executed and the safety guards passed. A candidate with `fullyReachable:false` is not a fix. The probe currently does **not** establish all touch targets' 44px size, tab click activation, or Safari/VoiceOver behavior at 160/195px.

## Decision gate

Review actual CI JSON/screenshots and compare to the baseline before selecting a product implementation. Reject candidate if last detail remains occluded, focus is trapped, navigation cannot be reached, DEMO warning/exit disappears, or horizontal scrolling is introduced. For a successful candidate, implement a scoped responsive shell (not a permanent global body overflow change without regression tests), then add strict automated reachability/keyboard checks and test normal 320/390 light/dark. Only then make a new immutable WEB release with synchronized metadata/diagnostic, GitHub CI, Vercel and served-browser checks. Real Safari iPhone, native text enlargement and VoiceOver remain separately unverified.

## Independent P1 / financial constraints

#4/#29/#35 remain open: cached noncooperating v1 writers bypass modern same-origin locks; no destructive reset/restore, origin cutover, migration, deletion or recovery without an approved crash-safe authority and consent contract. #14/#25/#2 remain financial-contract discovery; no new budget modes, credit-as-cash or formula changes.
