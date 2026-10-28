# WEB P1 #4 — v2 authority and cached v1 tabs: research gate (2026-10-28)

**Status: PROTOTYPE / NOT A PRODUCT MIGRATION.** Product WEB 18.62, its active bundle, vault, backup and financial formulas remain unchanged. Do not ship this storage protocol from this document alone.

## Observed evidence

- `tests/vault-cached-legacy-cross-version.cjs` runs immutable WEB 18.33, 18.49 and current 18.62 Metro modules against real AES-GCM and synthetic localStorage. The pre-existing three tests reproduce **KNOWN UNSAFE** 18.33 stale overwrite and post-reset resurrection; 18.49 fails closed on an unknown modern reset marker. Green tests do not make v1 safe.
- Two **research-only** additional scenarios redirect the current WEB 18.62 vault interface to separate synthetic v2 keys, without changing the production module. A cached real WEB 18.33 writer can still modify the v1 ciphertext, but cannot change v2 ciphertext. After v2 reset, cached 18.33 save/reset cannot recreate v2 data or remove the v2 reset epoch.
- This proves only **namespace isolation in a deterministic Node VM**. The adapter does **not** migrate a ledger, preserve the original key, resolve concurrent v1 edits, authenticate a v1→v2 handoff, handle quota errors or certify browser/Safari behavior. A v1-only edit can become invisible to the v2 user unless surfaced as a conflict.

## Candidate authority contract — requires separate design review

1. **Authority is explicit and monotonic.** Once a durable, validated v2 commit record exists, normal current-version loads must use v2 exclusively; they must never infer that later v1 writes are newer or silently re-import v1. v1 remains quarantined for recovery/inspection, not a fallback live ledger.
2. **No silent loss of post-cutover v1 edits.** Record an authenticated or otherwise integrity-checked baseline fingerprint of the v1 KEY/PAYLOAD/RESET tuple at cutover. On future current-version loads, compare the tuple to the baseline and surface a non-destructive *legacy divergence* warning. Fingerprint changes can be caused by stale writes, resets, or other mutations and do not prove user intent. Never silently merge, overwrite v2, or delete v1.
3. **Reset is durable in the authoritative namespace.** A v2 reset must commit a durable tombstone/epoch that blocks reimport from v1 even if old JS recreates v1 ciphertext. Any backup restore after reset is a separate explicit user operation, never an automatic resurrection.
4. **No split-brain authority.** A half-written v2 staging record cannot be mistaken for a committed v2 ledger. Unknown/malformed authority records, missing keys, unverified ciphertext, or ambiguous provenance must fail closed, preserving all bytes and offering a non-destructive recovery path.
5. **Crash-safe staging before cutover.** Design a staged, authenticated v2 envelope and a single atomic authority pointer/commit write, then verify round-trip and fingerprints before activation. `localStorage.setItem` is atomic for an individual key but a multi-key sequence is not transactional. If any step fails, never delete v1 or claim migration complete. This is a *proposed state machine*, not proof of atomic migration across old tabs.
6. **Cross-version race remains at cutover.** An 18.33 tab ignores new locks/markers and can change v1 after the last fingerprint check. The v2 authority must not follow those writes. To avoid silent omission, detect and expose subsequent v1 drift; an edit that occurs in the final cutover interval is a conflict to reconcile, not an automatically valid v2 transaction.
7. **Recovery/backup compatibility is a release blocker.** Define explicit restore behavior for pre-v2 encrypted backups, key-only and payload-only remnants, failed staging, v1 divergence and post-reset tombstones. Never regenerate keys or erase ciphertext automatically. Backups remain encrypted and local-only.

## Proposed state machine (NOT IMPLEMENTED)

| State | Authoritative reads | Allowed writes | Failure behavior |
| --- | --- | --- | --- |
| V1_ONLY | verified v1 | current v1 only under existing lock | preserve v1, fail closed on ambiguous KEY/PAYLOAD |
| V2_STAGING | verified v1 | v2 staging bytes, no v1 deletion | discard/ignore incomplete staging only after proven safe; preserve v1 |
| V2_COMMITTED | verified v2 only | v2 under exclusive lock and revision check | preserve v2; quarantine and signal any v1 divergence |
| V2_RESET | empty v2 with durable tombstone | explicit new v2 save only | never promote reappearing v1 |
| CONFLICT/UNKNOWN | no automatic ledger selection | no financial mutations | show diagnostic and explicit non-destructive recovery options |

**Open design questions:** which authority pointer format is authenticated; whether a single authenticated v2 envelope can carry both ledger and reset epoch; how a current tab detects v1 drift without exposing decrypted data; how to safely compare legacy revisions while old writers ignore locks; what explicit conflict UI and export semantics users can understand; how to avoid a stale v2 tab overwriting a newer v2 revision.

## Required acceptance before any product release

- Actual immutable 18.27, 18.33, 18.34, 18.49 and current bundles: load/save/reset interleavings, including old-tab writes *during* staging, after commit and after reset.
- Real AES-GCM, synthetic ledgers with distinguishable transactions; fail-inject **every** persistent write/read/remove and write-then-throw, quota/security denial, reload, tab close, missing KEY/PAYLOAD, unknown marker, altered ciphertext and stale snapshot.
- Assert zero writes on rejected conflicts, durable v2 reset, no automatic v1 reimport, and explicit detection of divergent v1 (including v1 deletion) without destructive cleanup. Include backup round-trip and recovery UI tests.
- Two real HTTPS browser tabs (Chromium and Safari iPhone where available), cache-pinned old JS, reload and storage events; actual rendered warning/accessibility and privacy review.
- Only after protocol review: new immutable bundle, synchronized HTML/version/diagnostic, release checks, full CI, Vercel production READY **plus served browser verification**. No backend, account, telemetry, bank sync, unencrypted data, real ledger mutation or iOS work.

## Separate financial discovery

Issue #14 (planned vs owned money vs remaining days), #25 (card overpayment) and #2 (historical reconciliation) remain DISCOVERY. None of these authorize changing formulas or budget modes. The storage isolation prototype makes no financial semantics decision.

Related: [legacy cached-tab evidence](WEB_LEGACY_CACHED_TAB_COMPATIBILITY_20261028.md), issues #4/#29/#35 and `tests/vault-cached-legacy-cross-version.cjs`.
