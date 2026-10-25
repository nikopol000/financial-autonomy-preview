# WEB v18.45 — blocked v1 vault UX and recovery boundaries (2026-10-25)

## Evidence from active v18.44 before this change

- Metro module 310 `loadWebVault` fails closed for KEY-only, PAYLOAD-only, invalid key, tampered ciphertext and unknown reset marker. First save writes KEY before PAYLOAD; a denied PAYLOAD write can strand a KEY-only footprint (#35). This is synthetic fault injection, **not** an observed browser incident.
- Metro module 309 `load` only refreshes the tab revision after a successful vault read. On load failure the app controller's `Ae` never calls `P(state)`; the root remains `e === null`.
- The `e === null` UI showed generic “Un spațiu pentru claritate”, “Deschide seiful” and a retry. The error banner could be dismissed; **Settings and its backup import were not rendered** because the full navigation is behind `e ? ... : ...`. A message suggesting “restore a backup” therefore did not imply that restoration was available on the blocked screen.
- Calling `saveWebVault` with a valid synthetic backup state when KEY-only storage exists fails closed without writes. Do **not** bypass this guard by deleting a key: KEY-only may be a failed first save **or** an existing vault whose ciphertext was externally lost.

## Change in this candidate (copy/UX only)

- The blocked landing now shows a specific heading when the load error is present, an explicit warning **not to clear site storage or reset**, and a truthful statement that the blocked page cannot restore data.
- The existing button becomes “Reîncearcă deschiderea” in the error state. It only reattempts the existing load path. The error banner's dismiss button is suppressed while the vault is not open, so an unresolved error is not cosmetically hidden.
- No new destructive recovery action, bypass, data migration, storage key, backend, telemetry, or backup format is introduced. No formula changes, #14 modes, or iOS changes. Header version remains metadata-driven; immutable bundle and diagnostic increment to 18.45.

## Alternatives considered

1. **Automatically delete orphan KEY and create a new ledger:** rejected; the same footprint can mean loss of a pre-existing PAYLOAD. Silent deletion could reduce recovery options.
2. **Offer “restore backup” from the blocked screen immediately:** not implemented; current `saveWebVault` rejects incomplete v1 footprints, so a truthful restore flow needs an explicit, reviewed conflict/replacement contract and safety tests.
3. **Export KEY and PAYLOAD to a single unprotected JSON file:** rejected; placing decryptable key material beside ciphertext in a portable file is not an acceptable substitute for the password-protected backup format.
4. **Conservative visible guidance + retry:** chosen for this incremental candidate. It improves error visibility without claiming that recovery is solved.

## Acceptance and outstanding work

- Regression: synthetic AES-GCM/orphan and blocked UI-copy tests; release guard; JS syntax; immutable-bundle version/diagnostic; CI and deployment exact SHA.
- Browser acceptance still needed: real key-only and payload-only synthetic storage in a disposable origin/profile, error persistence, retry after storage permission recovery, iPhone light/dark wrap and keyboard, two-tab stale state, and accessibility screen reader. **Do not manipulate real financial data** to test.
- #35 remains OPEN: design a **non-destructive** explicit v1 recovery/backup replacement path that preserves orphan evidence, explains irreversible actions, and requires reviewed state transitions; no auto-v2 migration or silent reset. #29/#4 browser tests remain open.
