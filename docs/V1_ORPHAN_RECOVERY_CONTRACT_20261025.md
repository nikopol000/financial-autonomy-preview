# WEB v18.45 — v1 blocked-vault recovery contract, evidence and decision gate
Date: 2026-10-25. Status: **DISCOVERY ONLY / NOT IMPLEMENTED**. Issue #35 (P1); related #29 and #4.

## Observed active-code behavior (not a real-user incident)

Inspected immutable `_expo/static/js/web/index-v01845-blocked-vault-guidance-20261025.js`, modules 309–311, and the current Settings backup component (module 328).

- v1 persists `financial-autonomy.preview.key.v1` and `financial-autonomy.preview.payload.v1` separately. First save writes KEY before PAYLOAD. A denied second write can strand KEY-only. The same bytes can result from external deletion of an existing PAYLOAD; **the app cannot infer which history happened**.
- KEY-only, PAYLOAD-only, invalid KEY, corrupt authenticated PAYLOAD and an unknown RESET marker fail closed. An existing complete pair is AES-GCM-authenticated before a replacement save. The committed reset journal has separate destructive semantics; it is **not** a recovery marker.
- On a load failure the main app state stays null. The Settings backup import is not mounted. The blocked screen in v18.45 offers only a non-mutating retry and explicitly warns against clearing site data. `saveWebVault` rejects a replacement state on KEY-only.
- The portable backup uses `FinancialAutonomy` format v1, PBKDF2-SHA256 (600,000 iterations), password of at least 12 characters on export, AES-GCM and state validation on restore. A decrypted backup state is **not** a license to overwrite a blocked same-origin vault. Password-protected portable backups and the v1 local vault are distinct formats.
- A clean browser profile has a distinct origin storage partition. This is a *possible user-controlled isolation path*, not a repair of the blocked original profile or proof of browser acceptance.

## Non-destructive contract recommended for the next increment

**Preservation first:** no automatic orphan deletion, reset, key export, migration, backup overwrite, or silent creation of a new ledger when any v1 footprint exists. Do not make a successful retry depend on deleting original evidence.

**Truthful blocked-state decision tree:**
1. Storage temporarily unavailable / permission denied: retain data and offer retry after restoring browser storage access. No state writes from the blocked screen.
2. KEY-only or PAYLOAD-only: identify incomplete local storage *without claiming whether it is a failed first save or a lost prior record*. Tell the user that the current screen cannot restore/import. Do not suggest that deleting the KEY is safe.
3. Complete but unreadable pair / invalid marker: preserve all bytes. Do not treat a backup as proof that the current encrypted data is disposable.
4. If a separately held **password-protected** backup exists, propose a **separate, empty browser profile** for restoring it via the existing normal Settings flow, *after the user verifies the correct application origin*. Keep the blocked profile untouched. A private/incognito session is not a durable replacement because storage can be discarded; do not recommend it as the only copy.
5. If no backup exists, preserve the blocked profile and stop; neither the UI nor an automated recovery can reconstruct absent ciphertext. Do not promise that a backup can be exported from a blocked vault.

**User-controlled same-profile replacement is NOT approved:** a future implementation would need explicit confirmation after decrypting and validating the backup, a safe rollback/escrow protocol for all existing v1 footprints, a strategy for cached older tabs, quota/permission failure tests, and no accidental resurrection after reset. A naive `clearWebVault(); saveWebVault(restored)` can irreversibly destroy the last local copy and is forbidden. Retaining the existing KEY+PAYLOAD under a second localStorage key is not sufficient on its own: write failures, reset semantics, privacy and old-tab writers still require proof.

## Decision table (no automatic mutation)

| Current footprint | Current load | Allowed now | Forbidden automatically |
| --- | --- | --- | --- |
| No KEY, no PAYLOAD, no RESET | empty state / demo according to existing policy | normal onboarding or verified-backup restore in this *clean* profile | infer a missing previous ledger |
| KEY only | blocked | preserve; retry; separately restore an existing backup in a **clean profile** | delete KEY, replace same-origin state, claim first-save provenance |
| PAYLOAD only | blocked | preserve; retry; clean-profile backup restore | discard ciphertext, invent KEY |
| Complete pair, invalid tag/key | blocked | preserve; retry if access changes | overwrite corrupt record |
| Unknown RESET marker | blocked | preserve; investigate | treat marker as committed or clear it |
| Committed RESET marker | platform resumes explicit deletion | existing reset-journal logic only | restore an unknown staged/v2 record |
| Storage access denied | blocked/error | retry after permission restored | use denial as evidence of empty storage |

## Acceptance matrix before a product recovery flow

- Fault injection on **every** get/set/remove for KEY, PAYLOAD and RESET, including quota and SecurityError, plus repeated load, retry and power/interruption *simulation*; assert zero writes in blocked state.
- Validate the encrypted backup independently (wrong password, tamper, wrong format, empty/oversized input, v2/v3/v4 state migration, and original profile unchanged); test on a **disposable clean profile** with synthetic financial data only.
- Two actual browser tabs with Web Locks: one blocked profile and one independent clean profile; verify stale tab rejection, reset journal and no cross-profile storage access. Also test no-Web-Locks behavior (must fail closed for real mutations).
- Verify iPhone-sized light/dark blocked guidance, keyboard/screen reader, long Romanian strings, storage-disabled errors, reload and an actual password-protected backup round-trip. **Node VM tests do not constitute these browser tests.**
- For any same-profile replacement proposal, demand explicit consent/semantics, durable rollback across write failures, zero silent data loss, and safe interaction with older cached clients. If unprovable, do not ship that feature.

## Alternatives and recommendation

- **A — preserve + retry + clean-profile restore of a verified external backup:** recommended interim UX/documentation path; no mutation of the blocked origin. Cost: inconvenient; the original profile remains blocked and user must retain the external backup/password.
- **B — in-place destructive reset/restore:** rejected as a default; destroys potentially recoverable original data.
- **C — automatic v2 atomic envelope migration:** rejected for now. Prior research proves an old-tab reset can leave stage-only bytes indistinguishable from an interrupted first save, risking intentional-deletion resurrection.
- **D — in-place encrypted escrow/replacement:** investigate only behind an explicit, reviewed protocol; two localStorage keys and Web Locks alone are not a transaction or a cross-version safety guarantee.

**Recommendation:** retain v1 production storage. Improve guidance only if independently verified; validate clean-profile recovery with synthetic backup and real browser. Do not call issue #35 fixed until the availability problem has an accepted recovery contract and actual browser evidence. Do not modify budget issue #14 or financial formulas, iOS, real data, backend, telemetry or encrypted backup format.

## Test added in this research batch

`tests/vault-real-crypto-regression.cjs`: an additional Node-VM synthetic characterization exercises a blocked KEY-only original and an independent clean storage instance with the real platform/vault code, asserting the clean instance can persist the validated synthetic state and the original remains byte-for-byte untouched. This **does not** test the password-based backup restore UI, actual browser profiles or in-place recovery. Record exact CI result before claiming it passed.

## Next exact action

Run release guard, JavaScript syntax and the full synthetic suite in CI; verify merged HEAD. Then perform disposable-profile real-browser restore/blocked-state checks when interactive browser tooling is available. Keep issue #35 OPEN and version 18.45 unchanged (research-only).

## 2026-10-25 verified synthetic password-backup round-trip (research continuation)

[PR #53](https://github.com/nikopol000/financial-autonomy-preview/pull/53) merged at `4dba64e8d07bcc118a8965cac5a0ed690619caa8`. A new Node-VM test runs the **actual active v18.45 bundled** password backup code (PBKDF2-SHA256 600,000 rounds + AES-GCM), not a fake already-decrypted backup. It exports synthetic v4 financial data, checks the portable envelope and absence of plaintext, rejects a wrong password and ciphertext tampering, restores with the correct password, and saves/reloads the validated ledger through the real platform/vault code into independent clean synthetic storage. The blocked KEY-only original retains identical bytes and zero writes. Candidate [CI 40178837777](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40178837777) SUCCESS with **43/43** bundled tests PASS; initial candidate 40178803520 failed on test-harness syntax and was fixed before merge.

**Boundary:** this validates the actual crypto implementation and synthetic storage separation, **not** real browser profile isolation, file-picker UI, password entry in the Settings screen, storage permissions, or iPhone light/dark. No automatic in-place restore or deletion is safe to infer. Next acceptance remains a real-browser disposable-profile flow with a synthetic encrypted backup, plus blocked original-profile retry/permission/two-tab tests. #35 stays OPEN and WEB 18.45 unchanged.
