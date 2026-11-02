# P1 #4/#29/#35 — H05/H06 selected encrypted-file authentication in Chromium (2026-11-02)

**RESEARCH ONLY — CI PENDING.** Start main `6b8e81379f80cda86c74ac53fac597c261bb0016`; active product WEB 18.72. No actual import, new origin, financial formulas, encrypted backup format, production storage or iOS change.

## Test scope and evidence boundary

`tests/browser-origin-handoff-selected-file-auth-research.cjs` runs a disposable Chromium localhost profile with the **actual active immutable WEB Metro modules 311 (PBKDF2/AES-256-GCM backup/restore) and 205 (financial state validation)**. A test-created `<input type=file>` receives a synthetic JSON file via Playwright `setInputFiles`; the browser reads `File.text()`. The operation has write-forbidden hooks on Web Storage and IndexedDB open/delete, plus before/after SHA-256 fingerprints of **all** localStorage values and IndexedDB database names/versions. Neither ciphertext nor passwords are printed.

H05: authenticate a valid encrypted **older** synthetic ledger with one transaction, while an independent in-memory newer hypothetical ledger has two. The selected file must restore exactly its one recorded transaction; successful authentication **cannot** establish that the file contains the latest history.

H06: reject wrong password, modified ciphertext, unsupported backup version, unsupported KDF, malformed JSON, and an **authentic** AES-GCM file containing an invalid financial schema (independently sealed with Node OpenSSL, the actual PBKDF2 settings and backup AAD). Each rejection must leave destination storage unchanged with zero attempted writes.

This is an isolated File API + crypto/schema acceptance **test**, not a user-facing file import. It does not test full Safari iPhone, origin cutover, atomic destination commit, cross-origin provenance, divergence, stale tabs, recovery of missing ciphertext or the age of a backup. Browser localhost secure context is not independent HTTPS-origin deployment evidence. It cannot resolve five archived legacy writer KNOWN UNSAFE scenarios or #29/#35 partial reset.

## Decision and next step

Keep independent-origin cutover, manual encrypted import, existing-destination conflict and recency wording **approval gated** per `docs/WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md`. Do not ship an importer or change formulas. **Next:** verify exact PR-head Chromium named H05/H06 PASS and Release CI, fix failures without weakening zero-write assertions, merge only after green, verify merged-main CI, update issue #4 and checkpoint. #85 mobile zoom/Safari remains open; #14/#25/#2 require explicit financial-contract approval.
