# WEB 18.64 — read-only restore acknowledgment classifier, test-only (2026-10-30)

**Status: PROTOTYPE / ANALIZĂ, NOT SHIPPED.** Related to P1 #4, #29, #35. No product bundle, version, financial formula, backup format, real data or iOS change. Only disposable synthetic encrypted vaults are exercised.

## Why this is needed

The actual WEB 18.64 confirmed-backup restore can report an error **after** the encrypted payload has been committed (see #284/#286/#290). Conversely, a refused payload write on an empty target can leave KEY without PAYLOAD (#284/#35). Treating any thrown error as proof of rollback would risk automatically repeating a destructive restore. AES-GCM authenticity proves a particular encrypted payload was created by a holder of the key, **not** that it is the newest ledger or that this specific attempt wrote it.

## Implemented, strictly test-only

`tests/support/restore-acknowledgment.cjs` reads the protected KEY, PAYLOAD and RESET bytes. `classifyRestoreAcknowledgment` returns only a status and a non-sensitive reason, never the key, ciphertext or financial state, and performs **zero writes**:

- `verified_unchanged`: two consecutive complete reads match the trusted pre-attempt footprint byte-for-byte. This is a bounded observation, not global anti-rollback.
- `verified_target_present`: protected bytes changed, RESET epoch did not change, the real WEB 18.64 AES-GCM vault successfully authenticates to the **explicitly expected synthetic state**, and a second footprint read matches the first. This deliberately does **not** say `committed`: an identical state could have existed before or been written by a non-cooperating tab.
- `unknown`: denied reads, failed authentication, KEY-only/PAYLOAD-only fragments, reset epoch change, unexpected authenticated state or changes during verification. No automatic retry, delete, merge or success toast may follow from `unknown`.

The caller must separately hold the same exclusive origin Web Lock used by cooperating writers. This helper does not acquire a lock, make localStorage transactional, persist a journal, recover ciphertext, defend against a cached legacy writer or detect an origin-wide rollback. Even double-read stability is not a security guarantee against a non-cooperating writer between checks.

## Acceptance examples (new regression cases)

1. Existing authenticated vault, no mutation -> `verified_unchanged`; zero writes.
2. Newer two-transaction vault explicitly replaced by a valid older one-transaction vault -> `verified_target_present`, **not** proof of freshness; zero readback writes.
3. An authenticated third state appears -> `unknown`.
4. KEY remains but PAYLOAD disappears -> `unknown`, preserve surviving bytes.
5. RESET read denied -> `unknown`, never assume empty.
6. RESET epoch changes -> `unknown`, even if the target state matches.
7. A synthetic non-cooperating writer changes PAYLOAD between authentication and the second footprint read -> `unknown`.

All tests use the real immutable WEB 18.64 module 310/311 AES-GCM implementation through `tests/vault-real-crypto-regression.cjs`. The expected suite grows from 66 to 73. **CI result must be checked before calling any test passed.** This is Node VM integration, not an interactive Chromium, Safari or VoiceOver result.

## Alternatives and decision

| Alternative | Advantage | Residual problem |
| --- | --- | --- |
| Trust exception/success toast | Simplest UI | Incorrect after write-then-throw; can prompt destructive replay |
| Compare KEY/PAYLOAD bytes alone | Fast, read-only | Cannot authenticate financial state or prove freshness |
| Authenticate expected state and double-read under cooperating-tab lock (this prototype) | Conservative `unknown` result and no writes | Not a durable commit record; cached tabs and origin rollback remain |
| Atomic IndexedDB record plus migration and explicit restore transaction | Potentially atomic key/payload/authority update | Needs migration, crash/eviction/legacy-writer tests; origin rollback still possible |
| External trusted recency witness | Stronger rollback detection | Violates current local-only/no-backend contract; not authorized |

**Recommendation:** retain the shipped fail-closed UI until a durable storage/restore transaction contract and nondestructive KEY-only recovery path are reviewed and exercised in actual browsers. Do not label `verified_target_present` as a proven successful commit without a unique authenticated operation witness and atomic authority. No formula or #14 budget perspective decision is implied.

## Next exact P1 work

Verify exact candidate Release CI and the seven named Node tests; add an actual Chromium fault-injection gate around the **real restore UI** that distinguishes unchanged/target-present/unknown without changing production storage. Then design a versioned, backward-compatible atomic authority envelope or IndexedDB transaction and test interrupted first-save/restore, old cached-v1 late write, full-origin rollback and Safari. Keep #4/#29/#35 open. WEB 18.65 PR #270 remains a separate release candidate requiring exact Vercel/served-preview acceptance.
