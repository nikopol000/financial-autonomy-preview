# Native Work Handoff

## Current task — archived WEB v18.20 serializer / round-trip audit

- Previous lease was released with Status READY_FOR_NEXT_RUN.
- Current app feature HEAD at this lease claim: `cd951ebaa204e1de6a7beab6f058a3c60a6d37a1`; stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.
- Current preview main at this lease claim: `3874ab2220154191b83cd8bea1a6b6c33d410abd`.
- Exact first unfinished action: implement a pure WEB v4 serializer that rebuilds known fields and reattaches retained opaque extension fields to records by stable identity; validate output against archived WEB v18.20 module 205, re-import it and compare every field. Keep WEB JSON export disabled until full validator acceptance and reverse-import preservation are demonstrated.

## Latest completed stage — opaque WEB extension retention

- App commit: [cd951ebaa204e1de6a7beab6f058a3c60a6d37a1](https://github.com/nikopol000/financial-autonomy-app/commit/cd951ebaa204e1de6a7beab6f058a3c60a6d37a1).
- Unknown v18.20 v4 properties are archived by `WebOpaqueExtensions` in `WebImportMetadata.opaqueExtensionsJSON`, retained inside encrypted native `.fabackup`, and validated by `SnapshotValidator`.
- Export preflight blocks opaque extensions until stable-identity reattachment is implemented. No WEB exporter or writable JSON type is enabled.
- Exact Native iOS CI run [44918164654](https://github.com/nikopol000/financial-autonomy-app/actions/runs/44918164654) for cd951eb: job 136888165739 failed before runner steps; steps null, logs URL null, artifacts 0, log fetch 404 BlobNotFound, combined status contexts 0. No retry.
- No Apple build, app-target XCTest, Simulator, Files-provider or visual parity verification is claimed.

Status: IN_PROGRESS
Owner: ChatGPT iOS parity automation
Updated UTC: 2026-11-21T16:12:00Z
Lease expires UTC: 2026-11-21T16:55:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: cd951ebaa204e1de6a7beab6f058a3c60a6d37a1
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD: 3874ab2220154191b83cd8bea1a6b6c33d410abd
Feature comparison: 487 ahead / 0 behind; app/main remains unchanged.
Current action: implement and test the pure WEB v4 serializer and opaque-extension reattachment; keep WEB JSON export disabled.
Lease expires at the stated UTC time; a later execution may resume if this run is interrupted.
