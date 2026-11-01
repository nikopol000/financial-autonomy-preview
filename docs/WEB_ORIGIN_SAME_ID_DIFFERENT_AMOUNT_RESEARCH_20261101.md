# P1 origin handoff — same transaction ID, different financial content (2026-11-01)

**Research-only test, not a cutover implementation.** WEB 18.67 is unchanged. No user data, encrypted backup, formulas, iOS, migration, deletion or restore are touched.

## Why this additional adversarial case matters

[Earlier two-origin experiment](WEB_READONLY_ORIGIN_CUTOVER_PREVIEW_CONTRACT_20261101.md) showed that two identical synthetic checkpoints can diverge when an archived v18.33 tab writes on the old origin after the new origin is initialized. The new case strengthens this: **both histories retain the exact same transaction ID** while the old-origin amount changes. Comparing ID sets, counts, timestamps or an encrypted-file name cannot establish equal financial content or source freshness.

## Disposable Chromium fixture

- Two independent loopback origins, actual archived WEB 18.33 AES-GCM vault modules, same browser context.
- Both begin with one synthetic expense, ID `same-transaction-id`, amount **125 RON**.
- The archived old-origin writer saves the same ID with amount **175 RON**. The new origin retains **125 RON**.
- Read-only decryption on each origin compares `{id, amount}`, then verifies that neither KEY nor PAYLOAD bytes changed during inspection.
- The old origin's encrypted envelope must have changed on the write; the new origin's encrypted envelope must remain byte-identical. This is an isolated experiment, **not** an encrypted-file handoff, a merge algorithm, or a production verification.

Test: `tests/browser-distinct-origin-legacy-isolation-research.cjs`. CI status must be verified independently; do not interpret a green characterization test as a shipped mitigation.

## Decision implications

1. **Never declare histories equivalent using transaction IDs alone.** The same ID can represent different financial content after independent edits.
2. Even comparing all decrypted fields at one instant does **not** prove freshness. The old tab may write again after comparison.
3. An authenticated backup proves its ciphertext can be decrypted, not that the file is newer than every still-open tab.
4. A future *read-only* comparison may display an explicit difference without deciding which entry wins. The comparison must not mutate either origin.
5. A production cutover still requires explicit approval of the separate HTTPS origin, user-visible source/freshness uncertainty, retention, conflict handling, crash-safe target commit and rollback. No automatic merge, deletion, reset, rekey or replay.

## Acceptance gaps

The test does not cover Safari/VoiceOver, user-selected encrypted-file parsing, duplicate IDs in a real ledger, cryptographic content hashes, a crash during comparison, or a legacy writer saving again after a read-only comparison. These remain unverified. The product should not imply synchronization, a most-recent source, or safe old-origin deletion.

Related: [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35). #14 and #25 remain financial-contract discovery only.
