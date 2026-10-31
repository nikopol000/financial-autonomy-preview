# Read-only quarantine under an archived late writer — isolated research (2026-10-31)

**Status: candidate, CI/browser run not yet verified at creation. NOT a product fix.** Related: #4, #29, #35, #85. Main baseline: `bce911c8694ca3b7c5a91d7bd915864cbc1e0797`. Product remains immutable WEB 18.64.

## Why this test exists

The existing experimental IndexedDB authority and reset witness can be authenticated, but a cached legacy WEB 18.27/18.33/18.34 tab may still write the old v1 `localStorage` payload. A completed or pending experimental marker does not make those old clients cooperate. Earlier browser tests proved that a late writer can create divergence; the missing user-facing gate was whether a *blocked read-only screen* would detect the change on explicit reinspection without silently repairing or unlocking.

## Synthetic scenario and acceptance

`tests/browser-v2-conflict-readonly-ui-research.cjs` now supports a synthetic `pending` reset-intent fixture (`status: reset`, `state: null`, explicitly **not authenticated user consent**). The isolated screen first renders a blocked `UNAPPROVED_AUTHORITY` state. A second actual Chromium tab on the same disposable origin then writes a different synthetic v1 payload, simulating a cached non-cooperating writer. The first tab must:

1. Detect `LEGACY_DIVERGED` and remain blocked.
2. Show a neutral explanation after **Verifică din nou**; never claim reset success, data loss, recoverability, or latest version.
3. Execute **zero** `localStorage.setItem`, `localStorage.removeItem`, or IndexedDB `readwrite` transactions while reinspecting. Verify exact v1/IDB snapshot equality before and after reinspection.
4. Remain blocked after a real page reload, with the same synthetic v1/IDB bytes and no editable financial inputs.
5. Preserve prior 320/390 CSS-pixel, light/dark, 200% CSS zoom stress checks, keyboard focus and no-overlap assertions. These are Chromium layout proxies, **not Safari/Dynamic Type/VoiceOver certification**.

The fixture writer is intentionally outside the screen; no product code, encrypted production ledger or real financial data is accessed. A PASS shows only the isolated UI contract, not a production lock, full-origin rollback protection, global reset, or actual browser persistence guarantees.

## Alternatives and recommendation

- **Auto-dismiss when witness authenticates:** rejected. A valid witness cannot exclude cached legacy writes or full-origin rollback.
- **Automatically repair the v1/v2 mismatch:** rejected. It may resurrect intentionally erased data or overwrite newer transactions.
- **Block without explanation:** prevents mutation but offers poor usability and accessibility.
- **Read-only quarantine with explicit reinspection and neutral details:** preferred candidate. It must remain blocked even if the evidence looks internally consistent but freshness or reset consent cannot be proven.

A later production implementation requires a formal reset-consent protocol, tested no-Web-Locks behavior, safe migration/fencing of cached legacy tabs, non-destructive fault recovery, and explicit UX acceptance. It must not introduce silent write/delete/replay/merge/rekey.

## Verification boundary and next step

Run the Chromium workflow and inspect the named PASS line for the late-writer scenario, plus the existing blocked-state, storage-denial and 200% zoom cases. Run Release CI, inspect exact PR head, then merge only if both workflows are green. Independently verify merged-main checks. Update #4/#29/#35 and continuity checkpoints with exact evidence. Safari iPhone/VoiceOver and served public preview remain unverified.

No `index.html`, immutable JS bundle, version, diagnostic, financial formulas, backup format, iOS repository, cloud services, accounts, telemetry or bank connections are changed.
