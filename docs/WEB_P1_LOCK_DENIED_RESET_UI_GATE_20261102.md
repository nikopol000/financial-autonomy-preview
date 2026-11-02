# P1 #4/#29/#35 — actual WEB 18.72 denied-lock reset confirmation UI (2026-11-02)

**TEST-ONLY CHARACTERIZATION; NO PRODUCT FIX.** [PR #487](https://github.com/nikopol000/financial-autonomy-preview/pull/487) merged as `064fd659864dd7ed8e91f35e802bef3bc5297b49`; exact tested head `0f49cdafd3317106cc30b6508e5e48c8696f5690`. [Chromium #41533316261](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41533316261) **SUCCESS**, [Release #41533316007](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41533316007) **SUCCESS**. Chromium job `125578799993` contains the named actual-UI PASS.

## Reproduction

On disposable loopback Chromium `?fa_real=1`, the test saves a synthetic AES-GCM ledger, reloads it, opens **Setări de aspect → Șterge toate datele → Da, șterge toate datele**, and replaces `navigator.locks.request` with an async `SecurityError` rejection. No real user data, backup, iOS or production storage are accessed.

**Observed in the actual WEB 18.72 DOM:**

- One denied lock request; **zero** KEY/PAYLOAD/RESET protected writes.
- Protected ciphertext digest byte-identical before/after; original synthetic transaction authenticates after reload.
- Error alert exists in the DOM and passes a basic CSS-visibility check.
- **The destructive reset confirmation remains visible after the failed request.** The alert is rendered in the application shell while the confirmation is still open. This is a **potentially obscured/unreachable error message**; CSS visibility does not establish actual hit-test reachability, accessibility-tree exposure or screen-reader announcement.
- `canWriteReal()` still returns true when the request method exists but rejects, so the initial read-only banner is not shown. This is a **UI availability false-positive candidate**, not a data-loss incident.

## Safe proposed UX-only correction (not implemented)

On a **failed** destructive reset request, dismiss only the confirmation modal and show a prominent accessible error in the normal application shell. Use truthful copy: *„Ștergerea nu a fost confirmată. Nu șterge datele site-ului și nu reîncerca înainte să verifici starea datelor. Păstrează backupul criptat.”* Do **not** assert that data are unchanged for every possible reset failure: #29 has a known partial-deletion fault. Do not auto-retry, delete an orphan key, restore or merge anything. Keep existing exclusive Web Lock, revision and reset-epoch gates.

**Before shipping:** add an actual-UI Chromium assertion that the confirmation is dismissed, the error is visibly and programmatically accessible, no protected writes occur for the denied-lock case, and the authenticated ledger survives reload; separately cover ordinary successful reset, injected partial-delete failure (no false “unchanged” claim), 320/390px light/dark and keyboard focus. Run release/syntax/CI and exact Vercel/served-browser verification for a **new immutable bundle**; Safari/VoiceOver remain separate. No formula or backup format changes.

**Still OPEN:** five archived WEB 18.27/18.33/18.34 noncooperating writers (two stale overwrites, three reset resurrections); #29 split-key deletion and #35 KEY-only provenance. No same-origin modern UI fix fences those old writers. Independent HTTPS origin + user-selected encrypted-file handoff remains explicit approval-gated. #14 remains DISCOVERY-only.
