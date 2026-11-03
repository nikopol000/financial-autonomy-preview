# P1 research: archived-client browser fixture specification (2026-11-03)

Status: **RESEARCH / NOT IMPLEMENTED / NO PRODUCT RELEASE**. Starting main HEAD: `7ab756be15ca7e66f7d3355543dc214fc814fe66`. Product metadata: WEB 18.74.

## Verified prerequisite and evidence boundary

The isolated-store synthetic workflow [run 41587299594](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41587299594) was independently inspected in the prior checkpoint: five named mock PASS results. This is **not** proof for archived real bundles or browser storage. The mock's legacy reset leaves candidate ciphertext authenticatable; **authenticatable does not mean authorized to resume after a reset**.

## Proposed next fixture: actual cached legacy code, not another mock

1. Identify the exact immutable archived bundle and corresponding HTML that implement the v1 `financial-autonomy.preview.key.v1` and `financial-autonomy.preview.payload.v1` contract. Record SHA-256 and module paths. Do not silently substitute current v18.74 for the archived writer.
2. Use a **fresh isolated Chromium browser context** per test, with synthetic ledger and same-origin storage only. No production preview origin, real backup or real user data.
3. Tab A loads the archived bundle; tab B loads a candidate *test-only* isolated-store reader. Capture storage bytes/hashes and authenticated ledger before and after each step. Do not wire the candidate into production.
4. Run a deterministic interleaving: A loads S0; B commits S1 to a separate test record; A writes stale S0+X to its original record; reload B. Record whether S1 survives, whether any legacy record changed, and what source is selected.
5. Repeat with legacy reset instead of stale write, then with interrupted key/payload deletion, missing selection witness, ciphertext corruption, blocked localStorage write, offline reload and a third tab. Report **separately**: raw bytes preserved, cryptographic authentication, source selection, user-visible state, and whether writes are disabled.
6. Preserve all fixtures and logs in CI artifacts with synthetic values only. A green test of the current unsafe behavior is characterization, **not a resolved P1**.

## Contract questions that block a production migration

- **Reset intent:** If an old tab deletes only v1 records while a v2 encrypted record survives, should v2 remain recoverable but inaccessible pending explicit user decision? The conservative research recommendation is **do not auto-resurrect or auto-delete**; this is not an approved product rule.
- **Selection authority:** What durable witness authorizes a chosen source when v1/v2 coexist, and what happens if that witness is absent or corrupt? Never infer from modification time alone.
- **Recovery UX:** How to explain an ambiguous state without saying “deleted” or “safe” when neither is proven? Keep encrypted bytes unchanged until an explicitly specified recovery operation.
- **Compatibility:** Backup export/import, multi-tab reload and old cached clients need dedicated tests before any source switch.

## Nonurgent discovery checkpoint

Issue [#14](https://github.com/nikopol000/financial-autonomy-preview/issues/14) remains analysis-only. Its budget examples distinguish owned cash from available credit, card spending from settlement transfers, and unexplained checks from actual expenses. No budget modes or financial formula changes are authorized. After P1 browser characterization, compare the proposed optional budget references against #14's numeric fixtures and seek explicit contract approval.

## Exact next action

Locate archived v1 bundle/HTML paths and establish a reproducible Chromium harness with storage snapshots; run the first **stale write** case and record observed results, then the **legacy reset** case. If actual archived code cannot be executed in the harness, report that limitation rather than treating synthetic tests as equivalent.

Related: [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35).
