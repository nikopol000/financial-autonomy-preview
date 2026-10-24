# WEB v18.44 — reset journal contract (P1 #29)

Date: 2026-10-25. Scope: **web preview only**. This is a committed-reset **completion journal**, not a recoverable copy of a ledger after the user intentionally requests deletion.

## Existing problem
v18.43 deleted the AES-GCM ciphertext and then its key using two localStorage removes. If the second remove fails, the original ciphertext is already gone. Web Locks serialize tabs but do not provide transactions across localStorage keys.

## v18.44 protocol
- Storage keys remain `financial-autonomy.preview.payload.v1` and `financial-autonomy.preview.key.v1`; ciphertext, key format and encrypted backups are unchanged.
- Add `financial-autonomy.preview.reset.v1`, value `committed-v1`. Under the existing exclusive Web Lock, after stale-revision check, write this marker **before deleting** either vault key. This is the logical reset commit point.
- Remove ciphertext, remove key, remove marker **last**. Only after all removals return successfully may UI report completion.
- If marker creation fails, both existing values remain and reset has **not** committed. If any later operation fails, marker remains and signals an intentional reset in progress. A reload in real mode acquires the Web Lock, resumes removals and only then loads an empty vault. It **never reconstructs** the intentionally deleted ledger.
- While the marker exists, direct vault reads and saves fail closed; platform revision includes the marker so a stale tab cannot overwrite an interrupted reset even if the ciphertext/key pair has not yet changed. An unknown marker value blocks recovery rather than guessing. No Web Locks = no automatic cleanup.
- Demo eligibility remains conservative: any pending marker is an unknown nonempty localStorage footprint and blocks demo startup.

## Fault matrix / evidence
Synthetic AES-GCM test harness injects exceptions on marker write, ciphertext removal, key removal, marker removal, and repeated cleanup; verifies stale tabs, unknown markers, no-Web-Locks, new-vault-after-reset, and existing encryption interop. These are deterministic Node/browser-like tests, **not** an interactive browser or actual storage crash/power-loss certification.

## Boundaries
A reset marker represents **explicit user deletion intent**. After marker commit, the original ledger is not promised recoverable, even if ciphertext remains physically until cleanup. If cleanup repeatedly fails, the UI must not claim physical erasure; the user must restore browser storage permission and reload. Browser storage durability, eviction and private-mode behavior cannot be guaranteed by localStorage/Web Locks. This change does not fix the separate two-write **initial vault creation** failure (orphan key), which remains fail-closed and merits future review. No changes to financial formulas, budget perspectives #14, real user data, backup format, source-stable repository or iOS.

## Additional fault-injection evidence — 2026-10-25

Test-only [PR #34](https://github.com/nikopol000/financial-autonomy-preview/pull/34), merged as `746436185caed92c23b4705900c660bdb29cc880`, expanded the real bundled AES-GCM/platform suite from 31 to **36** tests. [Candidate CI 40140940605](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40140940605) succeeded; logs explicitly show all five new cases PASS. Marker read denial before load, permission revocation after load, committed marker with denied read, and an unknown marker inserted after a previous load all **fail closed without additional writes** in the synthetic harness. A later permission-restored load can finish a committed reset. This is not browser/OS crash certification.

The fifth test is explicitly **KNOWN UNSAFE**: if the *first vault creation* writes the key but the payload write fails, an orphan key remains. This is a separate investigation [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35); no fix is claimed. Never auto-delete an orphan key, which may also indicate missing existing ciphertext. Browser storage denial, physical durability and real two-tab acceptance remain unverified.
