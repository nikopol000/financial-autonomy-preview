# Financial Autonomy — Web Premium Release History

## v18.21 — 2026-10-22 — candidate, verification pending
- Baseline: v18.20 archive, source HEAD `ecc84e551208848399b71c77e821fc4b821db797`.
- Accessibility shell: Romanian document language, metadata, keyboard focus, high-contrast and reduced-motion support, localized noscript.
- Application logic: unchanged; diagnostic version/name only in new archived bundle.
- Verification: V8 syntax parse passed locally; CI, Vercel deployment, browser/Work review pending.
- Rollback: retain prior v18.20 bundle and index pointer; restore prior index.html from baseline commit if required. Do not reset local data.
- Next: verify exact deployment, capture results, then take up confirmed Work review findings.
