#!/usr/bin/env python3
"""Bump the displayed app version by 0.1 (1.0 → 1.1 → … → 1.9 → 2.0)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION_PATH = ROOT / "VERSION"
HTML_PATH = ROOT / "index.html"
SW_PATH = ROOT / "sw.js"


def parse_version(raw: str) -> tuple[int, int]:
    m = re.fullmatch(r"v?(\d+)\.(\d+)", raw.strip())
    if not m:
        raise SystemExit(f"Bad VERSION: {raw!r}")
    return int(m[1]), int(m[2])


def next_version(major: int, minor: int) -> str:
    minor += 1
    if minor >= 10:
        major += 1
        minor = 0
    return f"{major}.{minor}"


def replace_once(path: Path, pattern: str, repl: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    new, n = re.subn(pattern, repl, text, count=1)
    if n != 1:
        raise SystemExit(f"Could not update {label} in {path.name}")
    path.write_text(new, encoding="utf-8")


def main() -> None:
    raw = VERSION_PATH.read_text(encoding="utf-8") if VERSION_PATH.exists() else "1.0"
    new = next_version(*parse_version(raw))

    VERSION_PATH.write_text(new + "\n", encoding="utf-8")
    replace_once(
        HTML_PATH,
        r'(<span id="app-version"[^>]*>)v[\d.]+(</span>)',
        rf"\1v{new}\2",
        "#app-version",
    )
    replace_once(
        SW_PATH,
        r"const STATIC = 'cube-static-v[^']+'",
        f"const STATIC = 'cube-static-v{new}'",
        "STATIC cache",
    )
    replace_once(
        SW_PATH,
        r"const RUNTIME = 'cube-runtime-v[^']+'",
        f"const RUNTIME = 'cube-runtime-v{new}'",
        "RUNTIME cache",
    )
    sys.stdout.write(new)


if __name__ == "__main__":
    main()
