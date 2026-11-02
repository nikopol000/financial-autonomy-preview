# WEB 18.72 — H09 preflight race characterization (2026-11-02)

**TEST-ONLY RESEARCH / NO PRODUCT RELEASE / NO IMPORT AUTHORIZATION.** Base main `2f2f24464d5a9e676db82306835299d55585b7f8`. Related issues: #4, #29, #35. The destination-origin transfer contract remains unapproved; no production origin, vault, backup, iOS or financial formula changes.

## Specific gap

The previous H07–H15 Chromium preflight [evidence](WEB_ORIGIN_HANDOFF_PREFLIGHT_H07_H15_20261102.md) classified destination storage once. An observed empty destination is not a durable precondition. Another same-origin tab can create a KEY-only footprint, unknown localStorage entry, or IndexedDB database **after** the first read. A later import that trusts only the first observation risks overwriting existing data.

## New test-only Chromium characterization

The existing `tests/browser-origin-handoff-preflight-research.cjs` now runs three additional H09 two-tab scenarios. Both pages use a disposable `https://new-vault.example.test` origin fulfilled by Playwright (no external DNS or user data). The inspector first reports `REVIEW_ONLY` with zero writes. A **separate synthetic test writer** then creates one of:

| External change after first inspection | Required second inspection |
| --- | --- |
| Unknown localStorage key | `BLOCKED_UNKNOWN` |
| Orphan vault KEY without PAYLOAD | `BLOCKED_PARTIAL` |
| New IndexedDB database | `BLOCKED_UNKNOWN` |

For each case the inspector's own write counter must stay zero and the destination footprint must remain byte-identical **between** the external writer's change and the second inspection. The writer's intentional test mutations are **not** counted as no-write; the distinction is explicit. If any assertion fails, the Chromium test exits nonzero.

**Interpretation:** a second read detects these three synthetic intervening changes. This does **not** prove an atomic check-and-commit protocol: another writer could still race immediately **after** the second read. A production design needs an approved destination lock, exclusive transaction/commit protocol and revalidation, including fail-closed behavior when Web Locks are unavailable, and cannot fence cached legacy writers on their old origin.

## H05/H06 current evidence and next gap

`tests/vault-real-crypto-regression.cjs` already exercises actual bundled module 311's password-encrypted `crypt.backup`/`crypt.restore` on synthetic data. It demonstrates that an authentic older file can be decrypted without proving recency (H05), and wrong password, tampered ciphertext, unsupported format/version, truncated JSON and oversized backup are rejected (H06). These are **Node VM synthetic tests**, not an actual browser file picker, new-origin import, or guaranteed destination write isolation. Avoid duplicating them under new names without adding a real boundary.

**Next H05/H06 test:** a disposable Chromium selected-file/read-only authentication harness against the actual immutable crypto module, with a zero-write destination guard and malformed-file matrix; document whether the File API interaction is simulated or real. Do not implement an import or alter the backup format. No claim of user approval.

## CI and release interpretation

This change modifies only the research test, this document and checkpoint files. No `index.html` or immutable bundle change; version stays WEB **18.72**. PR-head Chromium + Release CI must pass, followed by merged-main CI. If CI cannot be confirmed, mark this test **unverified** and leave the PR open. Browser/Safari/VoiceOver, Vercel exact-HEAD publication and the five known unsafe legacy-writer scenarios remain unresolved.

See [handoff decision gate](WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md) for explicit approval questions.