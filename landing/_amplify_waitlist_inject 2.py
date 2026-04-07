#!/usr/bin/env python3
"""CI: set data-api-base from RADV_INJECT_BASE on RADV_INJECT_HTML (Amplify)."""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path


def main() -> None:
    base = os.environ.get("RADV_INJECT_BASE", "").strip()
    path_s = os.environ.get("RADV_INJECT_HTML", "").strip()
    if not base:
        print("_amplify_waitlist_inject: RADV_INJECT_BASE unset; skip")
        return
    if not path_s:
        print("_amplify_waitlist_inject: missing RADV_INJECT_HTML", file=sys.stderr)
        sys.exit(1)
    path = Path(path_s)
    if not path.is_file():
        print(f"_amplify_waitlist_inject: missing {path}", file=sys.stderr)
        sys.exit(1)
    if '"' in base or "<" in base:
        print("_amplify_waitlist_inject: invalid base URL", file=sys.stderr)
        sys.exit(1)
    text = path.read_text(encoding="utf-8")
    text_new, n = re.subn(
        r'data-api-base="[^"]*"',
        f'data-api-base="{base}"',
        text,
        count=1,
    )
    if n != 1:
        print("_amplify_waitlist_inject: expected one data-api-base on <body>", file=sys.stderr)
        sys.exit(1)
    path.write_text(text_new, encoding="utf-8")
    print(f"_amplify_waitlist_inject: set data-api-base to {base!r}")


if __name__ == "__main__":
    main()
