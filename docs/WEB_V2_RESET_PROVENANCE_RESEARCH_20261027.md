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
