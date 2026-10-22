# Release procedure — Financial Autonomy

For **every** change to the application:
1. Apply the requested change in a **new versioned JavaScript bundle**. Never overwrite the previous release bundle.
2. Increase the version in `index.html` metadata, the referenced bundle filename and build query, and the diagnostic export version/name. The UI header reads its version from the HTML metadata automatically: do **not** hardcode a version in the header.
3. Run `python3 scripts/check_release.py` and `node --check <bundle path>` before publishing.
4. Commit the bundle and `index.html`; confirm the GitHub Actions validation passes.
5. Confirm Vercel deployment status is **success**, then verify the public preview serves the new HTML/bundle and that the displayed header version matches. Test the changed functionality, including export when affected.
6. Only then report completion to the user, stating exactly what was verified. If any step is not verifiable, say so explicitly and do not claim the release is fully tested.

Important: automated checks prevent version mismatch and syntax errors; they do not replace functional browser testing.


## Verified voice-to-preview workflow (2026-10-22, v18.23–v18.25)

This section documents what **actually succeeded** using GitHub and Vercel connector tools from a voice conversation. It supplements, but does not waive, the mandatory checks above.

1. Read `AGENTS.md`, `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md`, `DEVELOPMENT_WORKFLOW.md`, this file, and current `index.html`. Treat older checkpoints as historical when GitHub main and the live preview have advanced.
2. Locate the *repository-relative* JS path by removing the public deployment prefix `/financial-autonomy-preview/` from the script URL in `index.html`. For example, `/financial-autonomy-preview/_expo/static/js/web/index-v01825-purple-quick-actions-20261022.js?build=18.25.1` corresponds to repository file `_expo/static/js/web/index-v01825-purple-quick-actions-20261022.js`. Supplying the deployment prefix to GitHub `fetch_file` caused a misleading 404.
3. Use the GitHub connector `fetch_file` on that real JS file (approximately 784k UTF-8 characters). Locate the exact relevant code and make a targeted replacement, checking its occurrence count. For v18.25, `QuickActionsHome` contained the two `expense`/`income` buttons; their distinct `backgroundColor` expressions were replaced with the same literal `#AD83E8`. This changed both actual buttons visibly; a prior change to the generic night palette in v18.24 had not changed those buttons because their colors were hardcoded locally.
4. Replace the diagnostic `version:"OLD"` with the new version; retain the header's metadata-driven version logic and all unrelated financial code. Create a **new immutable full-sized JS file** via GitHub connector `create_file`, using the repo-relative `_expo/static/js/web/index-v0...js` path. Do not overwrite prior bundles. Successful examples: v18.23 `c110a804731101a1b85382655280aaeaad76d476`, v18.24 `7a95a0080cc648479afc6cf97abbf9ac3788a579`, v18.25 `354034d2f39b42ff62067ebc5bd072cdaef7034c`.
5. Fetch `index.html` and its current blob SHA via `fetch_file`; use GitHub `update_file` with that SHA to update version metadata, script filename and `?build=` cache key. Successful v18.25 activation commit: `7e7fd7224204a9ba529a8a8968ae7973e45f274a`. If an API call fails, inspect the current file/HEAD before a permitted ordinary retry; never assume the write succeeded.
6. Fetch both committed files again and assert metadata version, referenced bundle path, bundle diagnostic version, and exact intended code change. Run `python3 scripts/check_release.py`, `node --check <bundle>`, relevant tests and confirm GitHub Actions **before** calling a release fully verified. GitHub connector write success alone does not prove these tests ran.
7. Inspect Vercel deployment using `list_deployments` / `get_deployment`. Confirm `READY`, exact GitHub commit SHA, production target and primary alias `financial-autonomy-preview.vercel.app`. For v18.25, deployment `dpl_97K8SoYdyUbBwms7FTifXuT3VxCw` reached `READY` for commit `7e7fd7224204a9ba529a8a8968ae7973e45f274a`.
8. Verify the served HTML/bundle/header and changed behavior in an actual browser, preferably with the user. In the 2026-10-22 voice session the user explicitly confirmed seeing v18.23, v18.24 and v18.25, and **visibly confirmed both purple expense/income buttons on v18.25**. This user observation is valuable evidence but does not substitute for automated checks or independent browser inspection.
9. Update `PROJECT_STATE.md` and `IMPLEMENTATION_QUEUE.md` in the same release cycle with version, commits, verified vs unverified checks, and first unfinished action. Do not change the separate iOS/source repository without explicit instruction and approval.

**Why earlier attempts failed:** an incorrect GitHub file path with the public URL prefix returned 404; some earlier large-file writes were blocked by safety checks. In this session ordinary GitHub `create_file` and `update_file` operations on the actual full-size JS bundle succeeded. Do not assume these tools will always succeed; verify each operation. Voice requests can drive these same connector actions; a separate text chat or Work browser is not inherently required for repository edits.

**Important verification debt at this checkpoint:** v18.23–v18.25 were written and Vercel READY was confirmed, but the mandatory local syntax/release checks, GitHub Actions result, and independent served-browser verification were not confirmed by the assistant during those releases. Do not retroactively claim they passed.
