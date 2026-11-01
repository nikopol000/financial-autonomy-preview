# P1 #4/#29/#35 — independent-origin isolation probe (1 November 2026)

**DISCOVERY / TEST ONLY. No production migration, origin change, reset, restore, deletion, or backup-format change.** WEB 18.67 remains the active repository product. The existing cached WEB 18.33 writer can modify same-origin v1 ciphertext after a modern final reinspection; Web Locks cannot retroactively bind that code.

## Question tested

Can a previously loaded, noncooperating archived writer directly modify a proposed *separate-origin* primary ledger through ordinary localStorage or IndexedDB APIs? The experiment uses the **real archived 18.33 AES-GCM vault modules** and disposable synthetic states in one Chromium browser profile.

The new test `tests/browser-distinct-origin-legacy-isolation-research.cjs` creates two HTTP loopback origins with the same hostname but **different ports**. This is a valid origin boundary (scheme, host, port) for the browser experiment; it is **not** a production domain proposal. It also opens two paths on the old origin as a negative control.

**Verified in PR Chromium CI** (synthetic Chromium, not production):

1. Two paths on the **same** origin see the same archived v1 AES-GCM ledger; a versioned URL path alone does not isolate storage.
2. The independent origin initially has neither the old KEY nor PAYLOAD, even though the old origin has saved a ledger.
3. A separate synthetic AES-GCM ledger can be written at the independent origin with the same localStorage key *names*. A later archived write on the old origin changes only the old-origin ciphertext, not the new-origin KEY/PAYLOAD bytes.
4. Two IndexedDB databases with the same name on different origins retain different values. A database created at the old origin is not listed at the new origin before its own creation.

The test runs in a **disposable local browser context**. It does not use the user's browser profile, real transactions, encrypted backups, production Vercel storage, or iOS code.

## What a passing test would NOT establish

- **No cutover or backup handoff is implemented.** The synthetic new-origin ledger is independently initialized, not transferred from the old origin. This test does not prove that a selected backup is authentic, complete, recent, or the latest history.
- An old tab may continue to accept edits **on its own origin** after export, creating two divergent histories. Isolation protects new-origin storage from direct old-origin Web Storage/IDB writes, but does not prevent user-visible divergence or mistaken source selection.
- A distinct origin is not a guarantee against browser-profile loss, storage eviction, compromised same-origin scripts at the new host, deliberately implemented cross-origin messaging, or an unsafe import/restore operation.
- No claim of crash-safe v2 atomic commits, consent, stale-new-tab serialization, Safari iPhone, VoiceOver, offline PWA, production HTTPS hosting, or automatic migration follows from this experiment.
- A passing test does not authorize resetting, clearing, merging, replaying, rekeying, or silently overwriting either history.

## Alternatives and product decision

| Option | Benefit | Main unresolved risk |
| --- | --- | --- |
| Keep same-origin v1 + locks/checks | No hosting or import change | Cached noncooperating writer remains able to mutate v1 after recheck. **Not a destructive authority.** |
| Same-origin v2 primary | New code can ignore v1 changes | Old-origin data may silently diverge; user can still edit old tab. |
| Distinct HTTPS origin + explicit encrypted-file handoff | Browser origin boundary prevents direct v1 Web Storage/IDB mutation of new ledger | Requires a *user-approved* new address, import/freshness/consent contract, clear two-history UX, and separate atomic commit design. |

**Provisional recommendation for review only:** retain the distinct-origin handoff as the most defensible isolation candidate, while keeping existing data untouched. This is not an implementation decision.

## Acceptance gate before any production cutover

User approval must cover the proposed HTTPS origin, manual encrypted-file handoff, backup compatibility, handling of a newer edit made in the old tab, both-origin retention and rollback, and how to distinguish `blocked`, `unknown`, `committed`, and `unchanged`. Then test two real browser origins, user-selected authenticated backup import, wrong password, cancel, stale edit after export, interrupted/denied IDB commit, restart, simultaneous tabs, storage eviction and Safari iPhone. No automatic delete of old data. The user must be able to see that the two histories do **not** sync.

Relevant browser platform references: [MDN same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

## Execution evidence

[PR #390](https://github.com/nikopol000/financial-autonomy-preview/pull/390) merged as `841713cb1fce20919476f914b450bf74b529495c`. PR-head `609b67dbd04b30dc330fa067411020bc4449fb1e`: [Chromium #41267843565](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41267843565) **SUCCESS**, including the named independent-origin test step, and [Release CI #41267843522](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41267843522) **SUCCESS**. Earlier Chromium run [#41267685464](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41267685464) **FAILED** because the disposable pages omitted `?fa_real=1` and the actual archived vault correctly refused saving before demo/real-mode selection; the harness was corrected before merge. Do not misreport that initial attempt as passing. Merged-main [Chromium #41268026945](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41268026945), [Release #41268026951](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41268026951), [Pages #41268026909](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41268026909) and [Pages build #41268026453](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41268026453) are **SUCCESS**; the merged-main Chromium job also reports the named origin-isolation step **SUCCESS**. A green test characterizes only browser isolation, not recovery safety. Issues #4/#29/#35 remain OPEN.
