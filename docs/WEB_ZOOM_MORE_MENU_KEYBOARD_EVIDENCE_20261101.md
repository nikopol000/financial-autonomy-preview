# WEB #85 — natural keyboard More-menu activation and focus exposure (2026-11-01)

**DISCOVERY / TEST ONLY.** Real product WEB **18.72** unchanged; no new CSS shipped. The tested styles exist only in disposable populated DEMO Chromium at 200% root CSS zoom, 320/390 CSS px, light/dark. This is not physical iPhone Safari, VoiceOver, Dynamic Type or actual browser zoom certification.

## Provenance

- [PR #432](https://github.com/nikopol000/financial-autonomy-preview/pull/432), merged as `83fc01da0d2491c177d2c2f656eabaea96469f40`.
- Exact corrected PR head `5a1a48a187ba77c6f97f05d0e59f180db66dba14`.
- [Release CI #41345251493](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41345251493) **SUCCESS**.
- [Chromium CI #41345251570](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41345251570) **SUCCESS**, job `124963577932`, four named `MORE MENU FLOW NATURAL KEYBOARD #85` records and populated budget audit PASS 4/4.
- Earlier uncorrected run [#41344899989](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41344899989) **must not count**: the probe incorrectly treated `document.body.contains(menuRow)` as focus on the row. Corrected before merging; the final test explicitly excludes body and reseeds the actual tab after React rerender.

## Observations

| 200% CSS zoom | Natural Tab reaches Bugete | Focus ring | Focus center exposed | Enter opens populated Bugete | Natural pointer click |
| --- | --- | --- | --- | --- | --- |
| 320 light | Yes | Yes | **No** | Yes | Yes |
| 320 dark | Yes | Yes | **No** | Yes | Yes |
| 390 light | Yes | Yes | Yes | Yes | Yes |
| 390 dark | Yes | Yes | Yes | Yes | Yes |

- Under the reversible `min-height:120px; overflow-y:auto; flex-shrink:0` flow candidate, **Enter activates the real budget page in all four cases**. The preceding pointer experiment also passed 4/4.
- **At 320 px, the focused menu row is not center-hit-test exposed even though the focus ring matches `:focus-visible`.** Keyboard activation alone does not make this candidate accessible; the user may not see the current focus target. **Do not ship it as-is.**
- The bounded natural Tab sequence first recorded body, then `Setări de aspect`, `Ieși din demo`, then the Bugete row. Investigate menu opening focus retention and whether the sequence is understandable. No claim of a complete keyboard navigation audit.
- Existing normal-size, half-width and 200% synthetic budget regressions ran in the same CI job; the new evidence is specifically the four corrected keyboard records. No encrypted KEY/PAYLOAD/RESET keys were created.

## Decision and first unfinished action

1. Keep #85 **OPEN** and both C2 horizontal navigation and flow-min-height menu as **experimental**. The fixed overlay candidate remains rejected because it covers the DEMO exit.
2. Next reversible probe: on menu-item `focusin`, scroll the **menu scroll container** to expose the active row without hiding DEMO warning/exit; verify center exposure at 320/390 light/dark and reverse Tab, then actual Enter, pointer and scroll behavior. Compare a layout-only alternative before selecting product CSS.
3. Verify real browser zoom, physical Safari iPhone/Dynamic Type/VoiceOver, visual overflow cue and selected-state feedback before product release.
4. P1 #4/#29/#35 encrypted-vault risks remain ahead of UX polish. No reset, key deletion, migration, stale-tab merge or automatic recovery is authorized. #14 budget perspectives and formulas remain DISCOVERY until an explicitly approved numeric contract.

**No product release, no iOS edits, no financial formula, vault, backup, backend, telemetry or bank connection changes.**
