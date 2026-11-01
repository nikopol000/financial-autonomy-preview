# WEB 18.67 — scoped short-height mobile scroll fallback (#85)

Date: 2026-11-01. **Merged to preview main; Vercel production publication is not yet verified.** This is not a blanket 200% zoom, Safari iPhone or VoiceOver accessibility pass.

## Problem and minimal change

At simultaneous half-width/half-height 160×422 and 195×422 Chromium viewports, the WEB 18.66 nested budget scroll viewport collapsed to 0–7px. The last populated budget detail and some navigation destinations were inaccessible even after manual nested scrolling. The previously proven disposable outer-scroll override made the page content reachable.

[PR #383](https://github.com/nikopol000/financial-autonomy-preview/pull/383) merged as `58c03bcf5c7e03c36ec2546c6a16305f0144b624` and introduces a **scoped CSS media rule** at **max-width 430px AND max-height 540px**: `html,body` can scroll vertically and `#root` can expand to content height. The normal-height shell is unchanged. The existing five navigation destinations, DEMO warning and exit are not removed. No new backend, account, bank sync, telemetry or data access is added.

Immutable WEB bundle `_expo/static/js/web/index-v01867-short-height-scroll-20261101.js` is a copy of the 18.66 bundle with **only** diagnostic `version:"18.67"` and diagnostic download filename updated; HTML metadata/script/build are synchronized. Financial formulas, persisted vault, AES-GCM, backup format and iOS remain untouched.

## Verification

- [PR #382](https://github.com/nikopol000/financial-autonomy-preview/pull/382) merged as `149bddd03c2d2057eff7ea11260e9c0dcd4303d2`. Disposable Chromium strict controls: independent DEMO warning and exit scroll/hit probes (exit never activated), keyboard-modality focus ring, two budget filter clicks, all five tab **click activations** and return to the same synthetic 2,000 RON budget. Tests cover 160/195×422 and 320/390×422 in light/dark. [Chromium #41260009117](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260009117) and [Release #41260009115](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260009115) **SUCCESS**.
- WEB 18.67 product test exercises the **real scoped stylesheet without injected CSS** in those four viewport classes, checks normal-height `overflow-y:hidden` at 844px, and retains disposable vault no-write assertions. [PR Chromium #41260342317](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260342317) **SUCCESS**, [PR Release #41260342265](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260342265) **SUCCESS**. Four named 320/390 light/dark audits each report `product:true` and `productReduced:true`; the 4/4 populated budget suite passes.
- The first product PR release workflow [#41260255499](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260255499) failed because an old 18.66 historical test incorrectly pinned the **active** HTML version. Its immutable 18.66 diff check was retained while the stale active-version assertions were removed; the next release workflow passed. This was a test maintenance correction, not a financial or product rollback.
- Merged-main [Release #41260749918](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260749918) **SUCCESS**, [Pages #41260749888](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260749888) **SUCCESS**, [Pages build #41260749274](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260749274) **SUCCESS**. Merged-main [Chromium #41260749924](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41260749924) was still in progress when this document was drafted; verify its terminal result before calling the merged commit fully CI-verified.

## Publication gate and limits

At the time of drafting, the Vercel primary alias `financial-autonomy-preview.vercel.app` still points to **READY** deployment `dpl_BeEKaMKdP2fU8bSKUaHwyguCyrLB` at old commit `66fe1ebc` (WEB 18.66). The Vercel deployments list has no confirmed production entry for `58c03bcf`. One authorized exact-SHA production create-deployment attempt was **rejected with HTTP 403: no permission to create a Production Deployment**; no retry, scope bypass or forced deployment was performed. Therefore **do not tell the user that WEB 18.67 is live on the primary preview**. GitHub Pages success is not proof of Vercel publication or interactive served-browser acceptance.

The separate 200% root CSS zoom proxy is still a known limitation; native Safari iPhone, Dynamic Type, VoiceOver and real touch/keyboard acceptance have not been checked. Keep issue #85 open and continue incremental responsive/focus work. No real user financial data was touched.

## Next exact action

1. Confirm merged-main Chromium #41260749924 terminal status and final HEAD; verify the HTML and immutable bundle SHAs.
2. Resolve authorized Vercel production publishing permissions/limits **without bypassing access controls**; deploy the exact verified WEB 18.67 artifact, confirm READY + primary alias + served HTML/bundle/header and browser interaction. Until then label **merged / not primary-live**.
3. Independently test 200% text enlargement and Safari iPhone/VoiceOver with populated synthetic data, both themes. Do not close #85 prematurely.
4. Keep P1 #4/#29/#35 crash-safe legacy-writer isolation blocked pending explicit operation-specific consent/authority. #14 budget perspectives remain DISCOVERY ONLY; no formulas or modes without a numeric contract and user approval.
