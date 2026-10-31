# Full-origin rollback: authenticated but stale ledger (P1 research, NOT a product fix)

**Date:** 2026-10-31. **Scope:** issues #4, #29, #35. Isolated Chromium synthetic fixture only. No actual ledger, production vault, restore, reset, or backup format changed.

## Threat and reproducible test

The current research inspector compares a legacy localStorage KEY/PAYLOAD pair against a SHA-256 fingerprint stored in an AES-GCM-authenticated IndexedDB primary authority record. It can reject a **partial** replay (one layer older than the other), corrupted authority, missing schema, and several stale-tab races. This does **not** establish that a fully consistent pair is the newest pair ever written.

The Chromium test in `tests/browser-v2-conflict-readonly-ui-research.cjs` creates an internally authenticated synthetic v1/v2 pair at revision 1; advances the legacy payload and authenticated v2 authority to revision 2; then simulates an **external full-origin rollback** by restoring *both* localStorage and IndexedDB to the exact earlier revision-1 snapshot. After reload, the inspector receives the same bytes as before the advancement and cannot distinguish the replayed older snapshot from a legitimate origin that never advanced. The screen stays `UNAPPROVED_AUTHORITY` with zero inspector writes. **The PASS means the test correctly demonstrates a security limitation; it does not mean rollback detection works.**

The fixture's writes to advance/restore synthetic snapshots are intentional and **must not** be conflated with inspector writes. No production app APIs or user data are invoked. The test does not simulate disk-sector power loss, actual browser storage-eviction policies, or Safari.

## Security consequence

AES-GCM proves ciphertext authenticity under a key; a SHA-256 fingerprint binds a particular legacy pair to a particular v2 record. Neither supplies a monotonic counter **outside the rolled-back origin**. Revision numbers, operation IDs, timestamps, a second IndexedDB store, or extra localStorage markers can all be replayed together. A browser profile backup/restore, filesystem rollback, or origin-level restore can therefore present a valid older ledger and witness.

A local-only product cannot claim detection of *all* full-origin rollbacks using only replayable origin storage. Avoid implying that revision 2 is necessarily newer if the app only sees revision 1. Without a trusted non-rollbackable anchor, the application must explicitly acknowledge this freshness limit.

## Alternatives and disposition

| Option | Benefit | Limitation / decision |
| --- | --- | --- |
| A. More same-origin witness copies, hashes or timestamps | Detects some partial corruption or mismatches | **Not** complete rollback protection; all copies replay together. Do not market as anti-rollback. |
| B. External server/device synchronization or bank integration | Could offer an independent freshness anchor | **Reject for this project:** violates the local-only/no-backend/no-bank-connect contract. |
| C. User-controlled encrypted file backup, explicitly chosen restore | Supports deliberate recovery and user ownership | Existing encrypted backup must remain unchanged. File itself can be old; label its date/contents as *unverified freshness*, never auto-select a winner. |
| D. Read-only blocked state on detectable partial conflicts, with explicit user reset/restore consent | Prevents automatic destructive resolution of known ambiguity | **Recommended incremental contract**; cannot detect undetectable full-origin replay. Must not block a valid local ledger solely because a theoretical rollback is possible. |
| E. Browser/device monotonic secure counter | Would help only if genuinely non-rollbackable and accessible | No cross-browser guaranteed API identified for this web-only local-origin architecture; **do not assume one**. |

## Production gate / next tests

1. Define which exact observable storage states cause read-only quarantine in **actual** WEB 18.64, and preserve ordinary startup when storage is valid. Do not blindly import the research inspector's always-blocked `UNAPPROVED_AUTHORITY` result.
2. Prove all mutation paths (save, reset, import/restore, stale cached tabs) cannot silently overwrite a known newer snapshot. Existing archived v1 cached writers cannot be retroactively fenced by new JS alone.
3. For incomplete/missing/denied storage, show neutral explanations and **read-only** retry; do not create an empty vault, delete a key, silently rekey, merge, replay, resurrect, or choose the “latest” ledger.
4. Define explicit, authenticated user consent for destructive reset or manual restore; show what is known vs unknown, and retain backup export semantics. **No automatic repair.**
5. Validate real browser Safari iPhone/VoiceOver, 320/390 light/dark and zoom, and test failure injection with synthetic data. Chromium green alone is insufficient.
6. Maintain the security claim: *partial inconsistencies may be detected; full-origin replay of all local state cannot be reliably detected without an independent freshness anchor*.

**Release:** research-only tests/docs, so WEB 18.64 immutable index, bundle, diagnostic, and financial formulas remain unchanged; no product version bump. This finding does not authorize issue #14 budget semantics.
