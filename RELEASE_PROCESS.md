# Release procedure — Financial Autonomy

For **every** change to the application:
1. Apply the requested change in a **new versioned JavaScript bundle**. Never overwrite the previous release bundle.
2. Increase the version in `index.html` metadata, the referenced bundle filename and build query, and the diagnostic export version/name. The UI header reads its version from the HTML metadata automatically: do **not** hardcode a version in the header.
3. Run `python3 scripts/check_release.py` and `node --check <bundle path>` before publishing.
4. Commit the bundle and `index.html`; confirm the GitHub Actions validation passes.
5. Confirm Vercel deployment status is **success**, then verify the public preview serves the new HTML/bundle and that the displayed header version matches. Test the changed functionality, including export when affected.
6. Only then report completion to the user, stating exactly what was verified. If any step is not verifiable, say so explicitly and do not claim the release is fully tested.

Important: automated checks prevent version mismatch and syntax errors; they do not replace functional browser testing.
