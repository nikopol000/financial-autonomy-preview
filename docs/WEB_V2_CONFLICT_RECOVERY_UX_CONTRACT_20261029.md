# WEB #4 — nondestructive conflict and recovery UX contract (research, 2026-10-29)

**Status: proposed contract, NOT an implemented screen or approved production migration.** WEB 18.62 remains unchanged. This note describes safe behavior for a future IndexedDB-authoritative vault; it does not change financial formulas, backup format, iOS or real data. No automatic reconciliation of two encrypted ledgers is permitted.

## Trigger and evidence

The isolated Chromium IndexedDB experiment has an observed inter-store race: a cached WEB 18.27/18.33/18.34 tab can write to v1 `localStorage` after the last fingerprint check but before an IndexedDB reset commits. The reset can report success, although the old encrypted pair now differs. Later reads/writes detect `LEGACY_DIVERGED` and reject destructive operations. This is **KNOWN UNSAFE** for the candidate; passing the characterization test does not imply prevention. The additional browser test verifies that a reload preserves the divergent v1 payload and IDB record and still blocks another reset with zero writes. CI evidence must be verified independently.

The test-only fingerprint is an equality witness, not a cryptographic statement of which ledger is newest. A valid old complete IDB record, both stores rolled back together, or an identical old v1 pair can defeat local freshness detection. A local-only browser cannot promise trusted monotonic history across origin-wide rollback.

## Proposed screen states and exact factual language

| Observed state | User-facing Romanian draft | Allowed behavior | Never infer |
| --- | --- | --- | --- |
| IDB record decrypts; v1 fingerprint differs | **„Datele locale nu coincid”** — „O filă mai veche ar fi putut modifica o copie a datelor. Am blocat salvarea pentru a evita suprascrierea. Datele existente nu sunt combinate automat.” | Read-only conflict information; explain that a prior reset may already have committed; inspect/reload without writing; validated encrypted backup options after review. | Which version is newest, that the reset was rolled back, or that no prior writes occurred. |
| IDB record missing after previously recorded authority | **„Registrul local nu poate fi verificat”** — „Nu vom crea automat un registru gol. Verifică o copie de rezervă înainte de orice restaurare.” | No auto-initialize, import or delete. Explicit recovery in isolated context only. | Empty account or zero balance. |
| IDB ciphertext unreadable or storage denied | **„Datele nu pot fi citite în siguranță”** — „Nu am încercat să le înlocuim.” | Keep last recoverable bytes; report blocked status; do not expose secrets. | Corruption cause, recoverability, or absence of data. |
| Reset tombstone readable and no divergence | **„Registrul a fost resetat”** (only if provenance and reset contract independently verified) | Read-only status, no v1 reimport. | That an older cached tab cannot subsequently write. |
| Key-only/payload-only v1 pair (#35/#29) | **„Datele salvate sunt incomplete”** — „Nu vom șterge sau reface automat informațiile rămase.” | Block destructive operations and preserve both fragments. | That a key-only footprint is an empty account or that a payload-only footprint is recoverable. |

**Copy caveat:** All wording is provisional until tested in real screen context. Avoid blame, unsupported reassurance or financial coaching. Do not show `0,00` when data cannot be authenticated.

## Interaction and recovery decisions

1. **Default: quarantine, no mutation.** Disable save, reset, import-into-current, automatic migration and background retries. Keep both original encrypted representations byte-for-byte; no silent merge, delete, re-key or overwrite. Show the reason and that automatic recovery is unavailable.
2. **Reload / inspect** is a non-mutating action; a reload is not proof of resolution. If the fingerprint still differs, remain blocked. Do not automatically switch to the other ledger.
3. **Encrypted backup export** must be offered only when the chosen source is authenticated, the existing backup writer can create a validated password-protected portable file, and the user explicitly selects that source. Never export raw AES key/ciphertext pairs as a substitute for a secure backup; do not label an unverified file „backup valid”.
4. **Restore** is a separate explicit user decision after validating a user-supplied encrypted backup with the existing parser and password. Prefer a disposable/isolated browser profile for comparison before changing the original. Do not overwrite the current origin while authority is ambiguous. A backup import is not a decision about which of two live ledgers is newest.
5. **Technical details** may show sanitized codes (`LEGACY_DIVERGED`, `MISSING_AUTHORITY`, etc.), current version, and non-sensitive revision indicators; never reveal encryption keys, plaintext transactions or passwords.
6. **Accessibility:** modal or dedicated blocked screen must retain visible focus, accessible heading/status, 44×44 CSS-pixel minimum touch targets where applicable, text wrapping at 320px/200% zoom, and tested VoiceOver navigation in Safari iPhone. These are acceptance criteria, not verified observations.

## Acceptance matrix before production

- Two actual cached tabs and a new tab after reload; old write before/after final check; reset before/after interrupted IDB transaction; verify no silent data promotion and no misleading success message.
- IDB absent/evicted/denied, corrupted authenticated envelope, full-record rollback, same-revision tamper, v1 key-only/payload-only faults (#29/#35), private mode and quota errors; never auto-create or delete.
- Actual immutable WEB 18.62 module-311 PBKDF2/AES-GCM portable backup export and restore, wrong password/tamper/unsupported schema, no writes on failed validation. Existing synthetic Node research already exercises some of these; real browser/UX and key provenance remain open.
- Explicit selection of recovery source; confirm source identity, conflict explanation, destructive consequences and ability to cancel without writes; no unsupported promise of local rollback resistance.
- iPhone Safari light/dark, zoom and VoiceOver with populated synthetic data. Browser CI on Chromium alone is not Safari evidence.

## Alternatives

**A — fingerprint-only and auto-accept last writer:** reject; a late legacy write can follow the final check and the digest cannot prove freshness. **B — IDB-authoritative after explicit, recoverable cutover + quarantine on v1 divergence:** provisional preferred direction; simpler cooperating transaction boundary, but still needs old-tab handling, backup/key provenance and actual UX acceptance. **C — dual-store automatic merge:** reject; financial operations, reset semantics and unexplained balances cannot be reconciled safely from ciphertext timestamps alone.

**Decision pending:** define a safe user-confirmed cutover and recovery source selection, and explicitly accept the origin-wide rollback limitation before production migration. No change to issue #14 budget perspectives or financial calculations is authorized.

Related: [issue #4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35), [IDB research](WEB_V2_IDB_PRIMARY_TRANSACTION_RESEARCH_20261029.md), [existing read-only recovery oracle](../tests/vault-recovery-conflict-contract.cjs).
