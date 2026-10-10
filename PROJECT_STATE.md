# Financial Autonomy — Project State

Last updated: 2026-10-10
Source of truth: this file plus IMPLEMENTATION_QUEUE.md and the current main commit history.

## Resume protocol
At the start of a new chat/session, read in this order:
1. AGENTS.md
2. PROJECT_STATE.md
3. IMPLEMENTATION_QUEUE.md
4. DEVELOPMENT_WORKFLOW.md
5. latest commits on main

Do not infer the current task only from chat memory. Repository state wins when there is a conflict.

## Latest checkpoint — v17.84 (2026-10-10)

- Preview bundle: `_expo/static/js/web/index-v01784-compact-dashboard-20261010.js`.
- Bundle commit: `7d16c6b87792411c3a7cef11badd0a2e05af16fb`.
- Active index reference changed by commit `8c43fdb04e15bc78f32e3f2fbd851599c57c9039`.
- Changes: compact Autonomie and Spațiu, insert monthly Cheltuit nebugetat amount after Spațiu, reorder Buget and quick actions ahead of snapshots, retain snapshots further down.
- Existing custom Dashboard order is temporarily overridden for the four primary sections to satisfy the first-screen requirement.
- No intended change to existing finance formulas or local storage; unbudgeted total is derived from existing transaction amounts/roles.
- **Verification limitation:** bundle was patched and activated via GitHub; automated syntax, deployed Vercel status and interactive iPhone browser behavior were not verified in this session. Do not claim deployment success until checked.
- Next: user tests on iPhone, inspect any issues; reconcile the bundle changes into source before rebuilding.

## Prior checkpoint — v017.67 (2026-10-10)

Active web preview: https://financial-autonomy-preview.vercel.app/
- Active preview repository main: `nikopol000/financial-autonomy-preview`.
- Activated bundle: `_expo/static/js/web/index-v01767-dashboard-polish-20261010.js`.
- Bundle commit: `72d958a17485051f29a24e79a6bcf25b71d215cf`.
- Activation commit: `0fd5b4fe7d35dc32c02e673b96aa8739d29d4bff`.
- Vercel check on activation commit: **success**.
- Verification: entire JavaScript bundle passed syntax compilation; checked key replacement counts and fetched published file. No end-to-end user test yet.
- Changes since v017.66: full-contrast borders around Spending / Next Income / Budget cards; independent top-alignment and self-alignment for expanding snapshot cards; tighter consistent 22–24px corners, padding, and gaps; theme-aware label contrast. Existing v017.66 budget collapse behavior preserved.
- **No financial formula or storage/data model changes**.

IMPORTANT provenance / next build:
- v017.67 is a small surgical polish of the known-working v017.66 WEB bundle, not an Expo rebuild from the private source repository.
- The private source repo `nikopol000/financial-autonomy-app` main is behind the current live preview. Reconcile modern preview changes back into source before starting a full source rebuild to avoid regression.
- Do not overwrite active v017.67 with stale source code.
- Next step: user tests v017.67 on Vercel on phone, particularly independent card expansion and the Budget card in light/dark mode.

## Prior checkpoint — 2026-10-06
Latest active preview change confirmed in main:
- commit c76a9ac1b743bac877c7eb25814677dfc1b7e70a — `preview: activate debt balance updates`
- preceding publish commit c0bcd3ff745447a9cde0b1cd38b5dff6f00216a2 — `preview: publish debt balance updates`

Current product state:
- Finance items that carry a mutable balance must allow that balance to be updated later.
- This applies to debt/credit products too, not only normal bank accounts.
- Credit card is the concrete case that prompted the change: it must expose `Actualizează soldul`.
- The rule should be applied consistently to every relevant Finance item with a mutable balance.

Immediately preceding completed changes:
- Donations and Subscriptions added as expense types and available when explaining unexplained money.
- Encrypted backup has password confirmation and show/hide password support.
- Daily Budget/Safe pace can use selected budgets, with visibility into which budgets contribute.
- Transfers between own accounts/credit products are supported and are not income/expense.

## Architecture/product constraints
- Local-only product: no backend/account/sync/analytics/telemetry for financial data.
- Preview data is browser-local; persistence follows browser storage behavior.
- Financial truth must not be falsified for privacy presentation.
- Credit availability is not income/owned money.
- Keep business/calculation changes separate from UI-only changes where practical.

## Continuity requirement
Every completed user-testable product change must update this checkpoint in the same development cycle. The checkpoint must name:
- what changed;
- whether it is implemented/published/activated/tested;
- active preview version or identifying commit/bundle when known;
- the next unresolved user request.

If implementation stops mid-task, record the exact first unfinished step in IMPLEMENTATION_QUEUE.md before stopping.

## v17.87 — 2026-10-11
- Published bundle `_expo/static/js/web/index-v01787-spending-row-20261011.js` commit `f9d29de8a2fd44cf71b51b0cbba938a855b0b844`; activated index commit `d7af61fdab3fd8417dd83604c1dfe0fa0cdbb118`.
- ReorderableStack renders adjacent spending and nextIncome modules in a horizontal equal-width row outside arrangement mode, with top alignment; independent component states retained. Arrangement mode unchanged.
- Deployment/runtime/device testing not yet independently verified. Next: test v17.87 on iPhone and reconcile preview changes into source.
