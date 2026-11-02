# P1 #4/#29/#35 — H05/H06 selected encrypted-file authentication in Chromium (2026-11-02)

**RESEARCH ONLY — PR-head CI VERIFIED.** Start main `6b8e81379f80cda86c74ac53fac597c261bb0016`; active product WEB 18.72. No actual import, new origin, financial formulas, encrypted backup format, production storage or iOS change.

## Test scope and evidence boundary

`tests/browser-origin-handoff-selected-file-auth-research.cjs` runs a disposable Chromium localhost profile with the **actual active immutable WEB Metro modules 311 (PBKDF2/AES-256-GCM backup/restore) and 205 (financial state validation)**. A test-created `<input type=file>` receives a synthetic JSON file via Playwright `setInputFiles`; the browser reads `File.text()`. The operation has write-forbidden hooks on Web Storage and IndexedDB open/delete, plus before/after SHA-256 fingerprints of **all** localStorage values and IndexedDB database names/versions. Neither ciphertext nor passwords are printed.

H05: authenticate a valid encrypted **older** synthetic ledger with one transaction, while an independent in-memory newer hypothetical ledger has two. The selected file must restore exactly its one recorded transaction; successful authentication **cannot** establish that the file contains the latest history.

H06: reject wrong password, modified ciphertext, unsupported backup version, unsupported KDF, malformed JSON, and an **authentic** AES-GCM file containing an invalid financial schema (independently sealed with Node OpenSSL, the actual PBKDF2 settings and backup AAD). Each rejection must leave destination storage unchanged with zero attempted writes.

This is an isolated File API + crypto/schema acceptance **test**, not a user-facing file import. It does not test full Safari iPhone, origin cutover, atomic destination commit, cross-origin provenance, divergence, stale tabs, recovery of missing ciphertext or the age of a backup. Browser localhost secure context is not independent HTTPS-origin deployment evidence. It cannot resolve five archived legacy writer KNOWN UNSAFE scenarios or #29/#35 partial reset.

## Verified CI evidence

[PR #452](https://github.com/nikopol000/financial-autonomy-preview/pull/452) merged at `bcea73192e23af728188b4b6ff361006ec1bf5f1`; exact PR head `e837f77aaae3d33d476ad89ada69e17a2435ac8b`. [Release #41391633466](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41391633466) SUCCESS; [Chromium #41391633359](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41391633359) SUCCESS. Chromium job `125104097843` logs seven named PASS lines, each with zero destination writes: H05 valid older backup authenticated; H06 wrong password, tampered ciphertext, unsupported backup version, unsupported KDF, authentic invalid schema, malformed JSON all BLOCKED_READ_ONLY. No source plaintext/ciphertext/password in logs. Vercel PR-head combined status reports build-rate-limit, not a product regression. Merged-main CI pending independent confirmation.

## Decision and next step

Keep independent-origin cutover, manual encrypted import, existing-destination conflict and recency wording **approval gated** per `docs/WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md`. Do not ship an importer or change formulas. **Next:** verify merged-main Release/Chromium/Pages CI, update issue #4, then investigate a stronger IndexedDB transaction no-write gate and user-facing selected-file UX separately. Do not ship import without approved contract. #85 mobile zoom/Safari remains open; #14/#25/#2 require explicit financial-contract approval.
