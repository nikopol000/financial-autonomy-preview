# Financial Autonomy — Implementation Queue

Last updated: 2026-10-10

## Status vocabulary
- READY FOR IMPLEMENTATION — explicitly approved and not started.
- IN PROGRESS — work has started; include exact next unchecked step.
- READY FOR USER TEST — implemented and active in preview, awaiting user confirmation.
- DONE — user-confirmed or otherwise explicitly accepted.
- BLOCKED — cannot continue without a named dependency.

## Current item — Compact first-screen Dashboard (2026-10-10)
Status: READY FOR USER TEST — corrected v17.84 reactivated; browser/deployment verification pending

Approved requirement:
- Preserve the existing visual theme and all existing lower Dashboard sections.
- First-screen order: Autonomie; Spațiu; Cheltuit nebugetat; Buget; quick actions Cheltuială and Venit.
- Autonomie and Spațiu are two separate compact, independently expandable cards, label left and prominent value right; collapsed by default.
- Cheltuit nebugetat displays actual computed unbudgeted spending, not a fabricated progress percentage.
- Keep existing Budget azi / Sigur azi / primary budget bar and expand controls; preserve all financial formulas, storage and other features.
- Fit the five blocks and actions on an iPhone initial viewport without scrolling in collapsed state; avoid covering the bottom navigation.
- Publish an actual new version to the active Vercel preview and verify it before claiming ready.

Completed:
1. Confirmed currently active preview HTML references v01783, newer than the v01767 continuity checkpoint.
2. Read repository AGENTS.md, PROJECT_STATE.md, IMPLEMENTATION_QUEUE.md, DEVELOPMENT_WORKFLOW.md.
3. Published v17.84 bundle commit 7d16c6b87792411c3a7cef11badd0a2e05af16fb and activated index.html commit 8c43fdb04e15bc78f32e3f2fbd851599c57c9039. Initial v17.84 had syntax error and was rolled back. Fixed and syntax-validated using JavaScript compilation (new Function), commit 9a4f32c765793a49d3a1ca4023194e52d1040f56; reactivated by commit 65cbfca0a6a7babc180eaf9140910ace82941916. Runtime/Vercel deployment not independently verified.

Exact next unchecked step:
1. User tests corrected v17.84 on iPhone, especially that it loads and the first-screen layout fits.
2. Confirm Vercel deployment and browser runtime, which were not independently verifiable here.
3. Reconcile preview-only changes into source before a source rebuild.

## Previous item — Dashboard design polish v017.67
Status: READY FOR USER TEST

Requirement:
- Independent expansion and card heights for Cheltuit and Următorul venit.
- Consistent surrounding borders and better theme contrast.
- Clearer Budget card separation, compact primary-first view, extra pinned windows behind a toggle.
- Preserve financial calculations and browser-local data.

Evidence:
- v017.66 already contained independent `useState` expansion and hidden-by-default supplemental budget windows.
- v017.67 surgical visual refinement bundle commit `72d958a17485051f29a24e79a6bcf25b71d215cf`.
- Activated through preview commit `0fd5b4fe7d35dc32c02e673b96aa8739d29d4bff`, Vercel check success.
- Bundle syntax verified, user interaction not yet confirmed.

Exact next step:
1. User tests v017.67 at https://financial-autonomy-preview.vercel.app/ on phone.
2. Collect specific UI defects if observed.
3. Reconcile private source repository (behind web preview) before any full rebuild; preserve active version and avoid regression.
4. After user approval, mark DONE and continue next READY item.

## Previous item — Debt / credit balance updates

### Debt / credit balance updates
Status: READY FOR USER TEST

Requirement:
All Finance entities that have a balance which can change over time must allow the user to update that balance later. This includes debt/credit products. Credit Card was the reported missing case.

Evidence in preview repository:
- c0bcd3ff745447a9cde0b1cd38b5dff6f00216a2 — preview: publish debt balance updates
- c76a9ac1b743bac877c7eb25814677dfc1b7e70a — preview: activate debt balance updates

Next step:
- User tests the active preview, especially Credit Card and the other Finance balance-bearing types.
- If a type still lacks `Actualizează soldul`, fix that type and update this queue/checkpoint in the same cycle.

## Recently completed
- Donations and Subscriptions expense types: published and activated 2026-10-05.
- Backup password confirmation/show-hide: published and activated 2026-10-05.
- Selectable budgets for daily budget/safe pace: published and activated 2026-10-04.

## Queue discipline
Do not implement an item merely because it is mentioned in historical chat. Only implement items marked READY FOR IMPLEMENTATION or continue the exact unchecked step of an IN PROGRESS item.
After publishing/activating a change, immediately update PROJECT_STATE.md and this file before declaring the iteration complete.
