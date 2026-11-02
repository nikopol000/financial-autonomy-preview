# WEB P1 #4/#29/#35 — read-only handoff conflict UX after destination drift

**2 November 2026 · RESEARCH / TEST ONLY · NOT SHIPPED.** Product WEB 18.72 unchanged. No import, migration, new origin, actual vault/backup, financial formulas, iOS, backend or telemetry. This document is a proposal, not user approval of a handoff.

## Question and existing evidence

After a user-selected encrypted file is authenticated, how should the interface behave if the destination changes before any hypothetical import? [H05/H06](WEB_ORIGIN_HANDOFF_H05_H06_EXISTING_IDB_GUARD_20261102.md) authenticates selected files read-only, including wrong-password and tampering cases; it **does not prove freshness**. [Queued other-tab IDB research](WEB_CROSS_TAB_QUEUED_IDB_RACE_20261102.md) proves a writer can commit after an inspector-only preflight without changing IndexedDB database names/versions. Five cached WEB 18.27/18.33/18.34 writer scenarios remain KNOWN UNSAFE. A check, even repeated, is not an atomic commit fence.

The existing **isolated** `tests/browser-v2-conflict-readonly-ui-research.cjs` is not imported by the application. This change adds a separate *handoff-mode research state* to that synthetic screen. Its `authenticated: true` value is an **injected test flag**, not an actual File API/PBKDF2/AES-GCM verification. The separate H05/H06 test covers real selected-file authentication. Do not combine these two independent results into a claim of a secure production importer.

## Read-only state and copy contract (proposed, no approval)

| State | Trigger | Romanian heading | Explanation / permitted action |
| --- | --- | --- | --- |
| `HANDOFF_FILE_UNVERIFIED` | File not authenticated | **Fișierul nu a fost verificat** | Explain that the file must be authenticated; no destination writes. |
| `HANDOFF_DESTINATION_UNINSPECTED` | Missing trustworthy baseline | **Datele existente nu au fost verificate** | Never infer that the destination is empty; no writes. |
| `HANDOFF_DESTINATION_UNREADABLE` | Denied/timed-out destination read | **Datele existente nu pot fi verificate** | Preserve bytes; do not interpret as a new empty ledger. |
| `HANDOFF_DESTINATION_CHANGED` | Other tab changes destination after baseline | **Datele locale s-au modificat** | Do not import/overwrite/merge. Explain that histories must be reviewed separately. |
| `HANDOFF_UNAPPROVED` | File flag authenticated and snapshot unchanged | **Importul nu este disponibil** | Even an unchanged snapshot does not prove freshness or fence future writes. No import action. |

The isolated prototype exposes only **Verifică din nou**, **Detalii tehnice**, and **Anulează**. Recheck retains the same handoff baseline; it cannot silently clear a conflict by replacing the baseline. Cancel does not unlock writes. Heading receives focus; explanation is an alert. Do not show balances or transaction details while authority is unresolved. Do not label an authenticated backup “cel mai recent”.

## Synthetic browser acceptance cases

1. A snapshot matches and file-authentication flag is true: still **BLOCKED** (`HANDOFF_UNAPPROVED`), not “ready to import”.
2. File flag false or baseline missing: explicit blocked states, no import controls.
3. A second Chromium tab writes an IndexedDB **record** after the snapshot: database names, versions and localStorage pair stay unchanged, but the revision changes; the isolated screen shows `HANDOFF_DESTINATION_CHANGED`.
4. Recheck and reload with the original baseline preserve the conflict and the exact destination footprint; inspector performs zero `localStorage.setItem/removeItem` and zero IndexedDB `readwrite` transactions.
5. Denied IndexedDB enumeration: `HANDOFF_DESTINATION_UNREADABLE`, never a fresh empty ledger.

**Interpretation:** a green Chromium run means only that this *isolated no-import screen* displays fail-closed messages under these synthetic conditions. It does **not** establish safe handoff, atomic destination writes, a true cross-origin transfer, crash durability, full-origin rollback detection, newest-file provenance, Safari/VoiceOver or product accessibility.

## Alternatives and decision boundary

- **Auto-continue after matching snapshot:** reject; queued or later independent writes can still win.
- **Auto-merge / overwrite when destination changes:** reject; cannot establish which financial history is authoritative.
- **Block with explicit conflict and preserve both copies:** preferred future behavior; requires explicit approval of origin, handoff, retention, conflict resolution and user confirmation in [origin handoff decision gate](WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md).
- **Same-origin Web Lock:** only serializes cooperating tabs; archived cached writers may ignore it. An independent HTTPS origin is a containment candidate, not an approved deployment.

## Next

Verify exact PR-head Chromium **named PASS** and Release checks; merge only if green. After merging, check merged-main CI, update #4 and checkpoints. For #85, inspect the existing C3–C5 failure geometry and test a **bounded structural** menu above fixed navigation, with DEMO warning/exit preserved, 320/390 px light/dark, natural Tab/Shift+Tab/Enter and pointer activation. Do not ship a CSS padding workaround or claim Safari support from Chromium CSS zoom. #14 budget perspectives remain research-only pending a user-approved numerical financial contract.
