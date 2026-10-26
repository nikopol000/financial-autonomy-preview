# WEB 18.52 — KEY-only after reload: provenance decision and non-destructive recovery contract

**Date:** 2026-10-26 · **Issue:** #35 · **Status:** DISCOVERY + deterministic regression, not a production recovery feature.

## Observation and safety proof

The existing local-only vault uses a KEY, an authenticated AES-GCM PAYLOAD, and a reset journal. The live-tab first-save retry introduced in WEB 18.51/18.52 retains the exact ciphertext only in volatile memory, for at most 120 seconds and subject to page lifecycle, storage events, exclusive Web Lock and reset-epoch fencing. A reload loses this authority.

Two distinct histories can produce the **same** persistent state:

| History | Before interruption | Final persistent state after reload |
| --- | --- | --- |
| A — first save interrupted | KEY committed; first PAYLOAD write throws before commit | KEY present; PAYLOAD absent; same reset marker |
| B — successful save, later external loss | KEY and valid authenticated PAYLOAD committed; PAYLOAD later removed outside the app | **The same KEY** present; PAYLOAD absent; **the same reset marker** |

A deterministic regression against the **actual active WEB 18.52 bundled modules 309/310/311**, not a synthetic replacement crypto function, constructs both histories **using the same key bytes**. After A, the original live tab uses its bounded retry to commit an authenticated payload. The test then removes that payload to create B and checks byte-for-byte equality with A's orphan state. A fresh tab must refuse load, save and retry in both histories with **zero writes**. Test: `tests/vault-first-save-retry-production.cjs`, case `KEY-only reload cannot distinguish failed first save from deleted authenticated ciphertext`. All financial fixtures are synthetic; no real browser profile or financial data is accessed.

**Consequence:** with only these three persistent fields, an automatic post-reload decision to delete the orphan key or initialize a new vault cannot distinguish A from B. In B it could destroy the last usable recovery clue and/or replace a user's real ledger. This is an information limitation, not merely a missing `try/catch`. The application must **fail closed** in both histories. No claim is made that external ciphertext deletion has occurred to an actual user.

## Options and decision

1. **Preserve KEY-only quarantine (current and recommended for WEB 18.52).** Refuse writes and automatic reset. Offer clear, neutral information and a user-initiated path to investigate local browser storage or an existing encrypted backup. Do not suggest a backup is guaranteed. The UI must not imply a zero balance or a new account.
2. **Extend same-tab bounded retry (already shipped).** Valid only while the original tab holds the exact volatile envelope, its expiry has not elapsed, page remains eligible, and lock/reset/key/payload checks still match. This does **not** recover after reload and must not be described as doing so.
3. **Single-record authenticated vault for *new* installs, with migration research.** Potentially removes the two-write first-initialization window, but introduces migration/versioning, rollback, reset compatibility and legacy-tab concerns. Requires a separate design and extensive fault-injection; **not approved or implemented**.
4. **Durable staged envelope/journal.** Could support crash recovery but creates an additional durable authority and potential reset resurrection. Must prove authenticity, generation ownership, replay resistance, rollback and legacy compatibility; **not approved or implemented**.
5. **Automatic orphan-key deletion or silent fresh-vault creation. Rejected.** The two histories are observationally identical.

## Proposed UX contract (copy/design only; NOT shipped)

- Heading: **„Datele locale nu pot fi deschise”**.
- Explanation: **„Am găsit o cheie de criptare, dar datele criptate asociate lipsesc. Nu putem stabili dacă salvarea a fost întreruptă sau dacă datele au fost eliminate ulterior. Nu vom modifica automat informațiile existente.”**
- Only offer actions that are actually safe and implemented. A read-only diagnostic may state which components are present, without revealing the key or plaintext; do not add a deceptive “Recuperează” button.
- A user-directed encrypted-backup import must validate authenticity and compatibility **before** any replacement and must require explicit confirmation; preferably stage in an isolated context. Do not overwrite the blocked origin or modify the backup automatically.
- Accessibility: screen-reader announcement of blocked state, no countdown/false progress; 320/390 CSS-px light/dark and Safari iPhone VoiceOver need actual testing.

## Required acceptance before any future post-reload recovery release

- Reproduce A and B with **identical** persistent state; verify no write, delete or reset on fresh-tab load/save/retry.
- Inject storage read/write failures, write-then-throw, unknown/pending reset markers, stale/legacy tabs, hidden/pagehide lifecycle, and exclusive-lock delays.
- Prove recovery source authenticity and binding to the correct generation/epoch; reject unknown provenance and stale ciphertext; never resurrect a committed reset.
- Validate backup format and rollback; no plaintext persistence, new backend, telemetry, bank sync, account, financial formula or iOS change.
- New immutable WEB bundle, synchronized HTML/build/diagnostic version, release CI, Chromium browser tests, Pages/Vercel READY and **independent served browser check**. Safari iPhone requires separate evidence.

## Next executable action

Confirm the new 11-case Node/VM regression passes in PR CI, inspect the exact log and merge only after successful checks. Update #35 and checkpoint. Keep WEB 18.52 unchanged because this is research/test-only. For future product work, first audit the existing blocked-vault UI against this UX contract, then consider **copy-only** improvements with a separate immutable release and visual accessibility verification. Issue #14 budget perspectives remain DISCOVERY and need explicit financial-contract approval before implementation.
