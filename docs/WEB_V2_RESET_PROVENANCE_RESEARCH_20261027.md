# WEB v2 reset provenance — research checkpoint (2026-10-27)

Status: **RESEARCH ONLY / NOT A PRODUCT FIX**. WEB 18.54, local-only encrypted storage, financial formulas, iOS and encrypted backups remain unchanged.

## Observed hazard and candidate guard

The Chromium synthetic harness `tests/browser-v2-locks-research.cjs` previously showed that a reset accepting any well-formed UUID generation marker can delete an otherwise authenticated v2 ciphertext after a foreign writer replaces that marker. The browser test intentionally labeled **KNOWN UNSAFE** remains in place.

[PR #152](https://github.com/nikopol000/financial-autonomy-preview/pull/152) adds `epochResetChecked(expectedEpoch, expectedRaw)` to the **hypothetical research harness only**. While holding the same exclusive origin Web Lock, it requires:

1. A readable, valid, unchanged generation marker matching the caller's observed generation.
2. No legacy v1 key or payload footprint.
3. An unchanged ciphertext revision matching the caller's observed bytes.
4. For nonempty ciphertext, successful AES-GCM authentication and an embedded generation equal to the current marker.
5. Only after all checks pass, rotate the marker before deleting the ciphertext.

The tests distinguish a foreign valid UUID, a stale snapshot with newer committed transactions, a legitimate authenticated reset followed by stale retry, and corrupt ciphertext. Failure must not remove the last encrypted record. A missing/corrupt marker, denied storage access or interrupted marker write must not be interpreted as clean first-run state.

## Important limits

- The current research envelope stores its AES key **in the same record** as the ciphertext. AES-GCM detects accidental alteration but **does not establish trusted reset provenance against a malicious or coordinated writer that can replace the key, ciphertext and marker together**. Do not describe this as a cryptographic authorization boundary.
- An empty record has no ciphertext generation binding. An empty-state reset requires an explicit separately reviewed initialization/epoch contract.
- A cached legacy v1 client does not know about the v2 marker or new Web Lock protocol; it can write or reset old keys independently. The proposed guard **does not solve mixed-version migration**.
- localStorage writes and deletes are not a multi-key transaction. A marker-write acknowledgement failure can leave old ciphertext quarantined. Browser crash/durability and Safari behavior are not established by the Chromium harness.
- Do not auto-delete KEY-only states, auto-promote stage-only data, resurrect a completed reset or silently overwrite financial transactions.

## Options before a production design decision

**A. Defer v2 migration (currently safest):** retain v1 while building an explicit, user-visible backup/recovery path and testing v1 risk mitigations. Known v1 first-write and partial-reset failure cases remain open and must not be mislabeled fixed.

**B. Versioned cutover with an enforceable old-client boundary:** design and test a mechanism that prevents every cached old writer/reset from operating on the same ledger during migration. A new v2-only Web Lock/marker is insufficient because old bundles ignore it. A static asset deployment alone does not invalidate already open tabs.

**C. Explicit user-mediated migration with an authenticated encrypted backup and restart requirement:** may reduce risk but still cannot guarantee no cached legacy tab writes. Needs an explicit compatibility/failure contract, no automatic deletion, and synthetic multi-tab crash matrix.

**Research recommendation:** keep v2 activation **BLOCKED** until the mixed-version write/reset boundary and reset provenance are enforceable. Treat checked reset as a useful *prototype safety condition*, not approval to ship.

## Evidence and acceptance

The four new named Chromium tests are in PR #152. CI evidence must be recorded only after the exact SHA's browser and release jobs succeed. Before any product release, additionally test interrupted migration at every boundary, legacy tab open across deployment, reload, eviction, denied get/set/remove, reset while another tab saves, backup/restore interoperability, and Safari/iPhone behavior. Release only under `RELEASE_PROCESS.md` with immutable bundle, synchronized metadata/diagnostics, exact-SHA CI and Vercel/served-browser checks.


## 2026-10-27 continuation — cached v1 reset and empty-vault provenance

Test candidate: `tests/browser-v2-locks-research.cjs`, branch `research/web-v2-legacy-reset-reappearance-20261027`. These are **synthetic Chromium characterizations only**, not a production fix. [PR #153](https://github.com/nikopol000/financial-autonomy-preview/pull/153) merged as `8c6a4b2eed1dc284317e324cf25c044391c2f849`. Candidate [Chromium CI 40470510224](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40470510224) and [Release CI 40470510456](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40470510456) **SUCCESS**, with all three named browser PASS lines inspected. Exact merged-main [Chromium 40470643049](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40470643049), [Release 40470642931](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40470642931), [Pages 40470643048](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40470643048), [Pages build 40470642737](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40470642737) **SUCCESS**; named PASS lines also inspected in merged-main Chromium job log. Vercel production alias still points to older `0edabd3` at verification, with exact merge commit Vercel status `build-rate-limit`; served-browser and Safari iPhone not verified.

- **KNOWN UNSAFE mixed-version reset:** a v2 ledger is saved; a cached-v1-like tab writes legacy key/payload; v2 reader correctly quarantines while the legacy footprint exists. When the old tab removes its own keys and commits a legacy reset marker, the v2 reader currently ignores that marker and **reopens the unchanged v2 ciphertext**. This is a demonstration of potential resurrection after intentional legacy reset, not evidence of any real incident.
- **Guarded reset acknowledgement ambiguity:** if writing the new epoch succeeds but the API then throws, the old encrypted bytes can remain. The checked guard should reject the old epoch on retry and the reader should quarantine those bytes rather than silently replay them.
- **KNOWN UNSAFE empty-vault provenance:** a valid-looking foreign epoch marker with no ciphertext passes the current checked reset guard. This does not by itself lose money, but proves that the empty-state authorization/provenance contract remains incomplete.

**Consequence:** a marker recognized only by new clients cannot fence already-open or cached legacy writers/resetters. Do not activate v2 or claim checked reset is a safe migration; no automatically inferred first-run/reset state. A future contract must explicitly define how a committed v1 reset affects all v2 data, even after the legacy keys disappear, and how to handle marker loss, denial, stale tabs, and reset acknowledgement uncertainty. Keep both old and new ciphertext untouched when provenance cannot be established. Research alternative: defer v2 and focus on v1 safe error handling while investigating enforceable legacy-client cutover; browser cache eviction alone is not a guarantee for an already-open tab.

Nonurgent UX cross-check: issue #17's exact English budget-editor literals from v18.41 are absent from the active v18.54 bundle; localized copy is present. This is a static finding, not a Safari/zoom acceptance. Issue #14 remains analysis only pending explicit financial-contract approval.
