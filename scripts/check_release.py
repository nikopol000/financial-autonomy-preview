#!/usr/bin/env python3
"""Release guard: prevent version mismatches before deployment."""
from pathlib import Path
import re
import sys

html = Path("index.html").read_text(encoding="utf-8")
meta = re.search(r'<meta name="financial-autonomy-version" content="(\d+\.\d+)"', html)
script = re.search(r'<script src="/financial-autonomy-preview/([^"?]+)\?build=(\d+\.\d+)\.\d+"', html)
assert meta, "Missing version metadata"
assert script, "Missing versioned JS bundle script"
version = meta.group(1)
bundle_path = Path(script.group(1))
assert script.group(2) == version, "HTML build parameter does not match version metadata"
assert bundle_path.exists(), f"Referenced bundle missing: {bundle_path}"
assert f"index-v0{version.replace('.', '')}" in bundle_path.name, "Bundle filename version does not match metadata"
bundle = bundle_path.read_text(encoding="utf-8")
assert f'version:"{version}"' in bundle, "Diagnostic version does not match HTML version"
assert 'document.querySelector(\'meta[name="financial-autonomy-version"]\')' in bundle, "Header must derive version from HTML metadata"
assert f"v0{version}" not in bundle, "Hardcoded header version found"
print(f"PASS: version {version}; bundle exists; diagnostic and UI version aligned")
