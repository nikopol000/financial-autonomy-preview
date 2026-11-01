# WEB #85 — More-menu natural pointer geometry at 200% CSS zoom (2026-11-01)

**DISCOVERY / TEST ONLY; not shipped.** The actual immutable WEB 18.72 product HTML and bundle are unchanged. Evidence is from disposable populated-DEMO Chromium at 320/390 CSS px, light/dark, with `document.documentElement.style.zoom='200%'`. This is a stress proxy, **not** native iPhone Safari, browser zoom, Dynamic Type, VoiceOver or WCAG certification. No real vault or backup was accessed.

## Reproduction and verification

- [PR #428](https://github.com/nikopol000/financial-autonomy-preview/pull/428) merged as `bbb4a00c6f091b8e785bafd6bba00aafd84a415d`, adding geometry around the **actual** Bugete row of the **Mai mult** menu after C2's natural keyboard Enter activation.
- [PR-head Release CI #41334855669](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41334855669) **SUCCESS**.
- [PR-head Chromium #41334855673](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41334855673) **SUCCESS**; browser job `124932399266` emitted four `MORE MENU POINTER GEOMETRY #85` JSON records. A successful diagnostic job **does not mean** the 320px pointer path passed.
- Probe measures row center hit testing, actual occluding element, scrollable ancestor dimensions and a Playwright `click({trial:true,timeout:1600})`. Trial click attempts normal pointer actionability/scroll but **does not activate** the row. Existing DOM click for returning to Bugete is explicitly **harness-only**, not acceptance evidence.

## Measured geometry

| CSS viewport / theme | Bugete before trial | Bugete after trial | Hit at center after trial | Natural pointer trial |
| --- | --- | --- | --- | --- |
| 320 light | y=930, h=112 | y=644, h=112 | Bottom navigation, y=700–844 | **BLOCKED** |
| 320 dark | y=930, h=112 | y=644, h=112 | Bottom navigation, y=700–844 | **BLOCKED** |
| 390 light | y=798, h=56 | y=607, h=56 | Bugete row itself | **ACTIONABLE** |
| 390 dark | y=798, h=56 | y=607, h=56 | Bugete row itself | **ACTIONABLE** |

At **320px**, the closest vertically scrollable menu ancestor reported `overflow-y:auto`, `scrollHeight=2014`, **`clientHeight=0`**, `scrollTop=142`, with a zero-height rectangle at **y=700**. The Bugete row extends through the bottom navigation and cannot be naturally hit at its center after the trial's scroll attempt. The center hit-test returns the bottom navigation containing Acasă/Finanțe/Adaugă/Istoric/Mai mult. This is stronger evidence than a mere text overlap and suggests a collapsed menu scroll viewport in the 200% proxy.

At **390px**, the menu's scrollable ancestor has `clientHeight=65`, `scrollHeight=1391`, rectangle y=570–700 (CSS zoom changes reported box dimensions), and `scrollTop=95.5` after trial. The initial row center is covered by the Mai mult tab, but the natural trial scroll exposes the Bugete row and succeeds. Therefore it would be incorrect to say **all** 200%-zoom viewports are pointer-blocked.

## Decision and next experiment

1. **Do not ship C2 or treat #85 as resolved.** C2 fixes focused tab visibility in the temporary test, but does not fix a menu whose usable scroll viewport collapses at 320px. Do not replace this with a scripted DOM click.
2. In a reversible test-only candidate, investigate the **vertical shell height allocation** between header, DEMO warning/exit, main content, menu scroll viewport and bottom navigation at 320px. Compare the current fixed shell with a scrollable-document / compact-overlay variant; require a **positive-height menu viewport**, visible DEMO exit, and natural Bugete pointer/keyboard activation at both widths and themes.
3. Then test 100% CSS zoom, actual browser zoom, selected-tab exposure, C2 touch overflow cue and physical Safari iPhone/VoiceOver separately. Do not infer user preferences or ship a UI change from this diagnostic alone.
4. Keep P1 integrity #4/#29/#35 ahead of cosmetic changes; no reset/rekey/legacy migration or automatic KEY-only recovery without a safe reviewed contract. Keep #14/#25/#2 financial semantics in DISCOVERY pending explicit approval.

**Invariants:** WEB product 18.72, local-only, no backend/accounts/telemetry/bank link, no formula or encrypted-vault/backup changes, no iOS edits.
