# WEB 18.73 — reset failure feedback, P1 #4/#29/#35 (2026-11-03)

## Evidence and scope

The prior real WEB 18.72 Chromium gate [PR #487](https://github.com/nikopol000/financial-autonomy-preview/pull/487) demonstrated that an async Web Locks request denial preserves the synthetic authenticated vault but leaves the destructive reset confirmation open above an error in the app shell. This is a discoverability/accessibility issue, not a proven data-loss incident. [Prior investigation](WEB_P1_LOCK_DENIED_RESET_UI_GATE_20261102.md).

[Candidate PR #489](https://github.com/nikopol000/financial-autonomy-preview/pull/489) creates an immutable WEB 18.73 bundle and updates the active HTML and diagnostic metadata. The ONLY behavioral change is in the **failed** reset handler: dismiss confirmation, show a prominent assertive alert in the normal shell, restore keyboard focus to that alert, and explain that reset completion and stored-data integrity are uncertain. The success path is preserved. The alert is not a retry button; there is no automatic reset, restore, key deletion, data replay or backup alteration.

Exact Romanian copy: “Ștergerea nu a fost confirmată. Starea datelor poate fi incertă. Nu șterge datele site-ului și nu reîncerca înainte să verifici starea datelor. Păstrează backupul criptat.” Followed by the actual error detail. This is deliberately **not** “Datele au rămas intacte”: #29's synthetic fault can delete payload but fail to delete key.

## Alternatives considered

1. Keep the modal and show the error inside it: would require another modal-local state/focus trap and could imply the destructive confirmation is still actionable. Not selected.
2. Close the modal and show a global alert: selected as the smallest UX-only change. Avoids changing the underlying vault protocol and supports keyboard/screen-reader discoverability.
3. Auto-retry, restore orphan key, or rebuild encrypted state: rejected without a reviewed financial/security contract; could silently destroy or resurrect financial data.

## Verification gates

- Syntax, `scripts/check_release.py`, immutable bundle diff from 18.72, diagnostic version/filename and active HTML must pass.
- Chromium: async denied Web Lock request during actual Settings reset must close confirmation, surface alert with `role=alert`, `aria-live=assertive`, focus it, make **zero** protected writes and preserve authenticated synthetic ledger after reload.
- Ordinary successful reset must still clear synthetic key/payload and show success.
- Injected partial deletion must show the **uncertainty** warning without falsely claiming intact data; no automatic repair.
- Browser, 320/390px light/dark, Safari/VoiceOver and public served-bundle checks remain separate acceptance gates; a GitHub CI green status alone is not a full iPhone accessibility certification.

## Non-goals / residual risk

Five cached legacy WEB 18.27/18.33/18.34 writers remain **KNOWN UNSAFE** (two lost updates and three reset resurrections). No same-origin modern UI can fence a noncooperating old tab. #29 split-store deletion and #35 KEY-only provenance remain P1 OPEN. Independent origin with user-selected encrypted handoff requires explicit user approval. #14/#25/#2 financial semantics remain DISCOVERY only. No iOS, formulas, real financial data, backups, backend, telemetry or banking connection changed.

**State when written:** candidate code and regression committed on branch, PR #489 OPEN; CI results and deployment must be checked independently before merge/publication claims.
