# Read-only IndexedDB enumeration/open race — 2026-10-31

**Status: isolated research only, not a production vault fix.** Related #4, #29, #35 and accessibility #85. Baseline main `02cb584c8ff9c332e9758d1cbb6aeb418a3e56d0`, WEB 18.64. All data and cryptographic fixtures are synthetic.

## Threat and discovered unsafe behavior

The experimental blocked-vault inspector calls `indexedDB.databases()` to avoid creating a database on a missing origin, then calls `indexedDB.open(name)`. This is a **time-of-check/time-of-use race**: a second tab, eviction, or a reset can delete the database between the two calls. An unguarded `open()` on a now-missing name fires `upgradeneeded` and creates an empty database. That is a storage mutation by a screen whose stated contract is strictly read-only, even if it never opens a `readwrite` transaction explicitly. A missing/empty authority must not be mistaken for a valid new ledger.

## Test and containment

`tests/browser-v2-conflict-readonly-ui-research.cjs` now adds an actual Chromium test: seed a disposable synthetic v1 localStorage pair plus IDB authority; close the fixture DB; delete that DB; deliberately return a stale `indexedDB.databases()` list; invoke the inspector. The test requires the `upgradeneeded` path to occur, the UI to remain blocked as `STORAGE_UNREADABLE`, the deleted database to remain absent, the synthetic v1 bytes to remain unchanged, and no editable inputs. A `request.onupgradeneeded = () => request.transaction.abort()` guard is added to the **isolated research inspector**. This aborts accidental creation instead of silently installing an empty authority.

This is an intentionally adversarial simulation of stale enumeration, not evidence that a real user experienced database eviction or deletion. It also does not prove a race-free snapshot: an existing DB can be modified during or after inspection, `databases()` may be unsupported, and full-origin rollback remains undetectable without external authority.

## Alternatives and decision

1. **Only check `databases()` then `open()`: rejected**, because existence is not atomic across the two calls.
2. **Create missing DB and mark it empty: rejected**, because this could erase evidence of missing authority and mislead the user.
3. **Always block without inspecting: safe but unhelpful**, prevents even non-destructive classification.
4. **Abort `upgradeneeded` and remain blocked: preferred for research**, with neutral text and no repair or selection. A production implementation must additionally review version upgrades, blocked open requests, permission errors and close/reload behavior on Safari.

## Acceptance and boundaries

Verify the named ghost-DB PASS in Chromium, existing late-writer/overlapping-inspection and 320/390 light/dark CSS-zoom cases, and Release CI on the exact PR head. Merge only after green; separately verify merged main. This test does not modify WEB 18.64 index, immutable bundle, diagnostic, financial formulas, encrypted backup, iOS, or any real ledger. It does not authorize automatic reset, merge, rekey, replay, deletion, recovery or unblocking. The actual production blocked-vault contract and reset consent remain unapproved; #4/#29/#35 remain open.

Accessibility note: the blocked message is nonjudgmental and retains keyboard reinspection, but Chromium CSS zoom is not Safari iPhone Dynamic Type or VoiceOver verification.
