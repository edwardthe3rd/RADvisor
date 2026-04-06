#!/usr/bin/env python3
"""Rewrite index.html data-api-base when WAITLIST_API_BASE is set (Amplify CI). Lives next to index.html."""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path


def main() -> None:
    base = os.environ.get("WAITLIST_API_BASE", "").strip()
    path = Path(__file__).resolve().parent / "index.html"
    if not path.is_file():
        print(f"inject_api_base: missing {path}", file=sys.stderr)
        sys.exit(1)
    if not base:
        print("inject_api_base: WAITLIST_API_BASE unset; leaving data-api-base unchanged")
        return
    if '"' in base or "<" in base:
        print("inject_api_base: refusing base URL with quotes or '<'", file=sys.stderr)
        sys.exit(1)
    text = path.read_text(encoding="utf-8")
    text_new, n = re.subn(
        r'data-api-base="[^"]*"',
        f'data-api-base="{base}"',
        text,
        count=1,
    )
    if n != 1:
        print("inject_api_base: expected exactly one data-api-base on <body>", file=sys.stderr)
        sys.exit(1)
    path.write_text(text_new, encoding="utf-8")
    print(f"inject_api_base: set data-api-base to {base!r}")


if __name__ == "__main__":
    main()
