#!/usr/bin/env python3
"""Reorder site nav: Home, About, Services, Calculators, Contact."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORDER = ("home", "about", "services", "calc", "contact")

MARKERS = [
    ("home", r'<li class="nav-item"><a class="nav-link[^>]*href="(?:index\.html|#top)"'),
    ("about", r'<li class="nav-item"><a class="nav-link[^>]*href="about\.html"'),
    ("services", r'<li class="nav-item dropdown">\s*\n\s*<a class="nav-link[^>]*id="navServices"'),
    ("calc", r'<li class="nav-item dropdown">\s*\n\s*<a class="nav-link[^>]*id="navCalculators"'),
    ("contact", r'<li class="nav-item"><a class="nav-link[^>]*href="contact\.html"'),
]

NAV_RE = re.compile(
    r'(<ul class="navbar-nav site-nav[^>]*>)\s*(.*?)\s*(</ul>\s*<div class="header-ctas)',
    re.DOTALL,
)


def extract_blocks(inner):
    positions = []
    for name, pat in MARKERS:
        m = re.search(pat, inner)
        if not m:
            raise ValueError("Missing nav block: %s" % name)
        positions.append((m.start(), name))
    positions.sort(key=lambda x: x[0])

    blocks = {}
    for i, (start, name) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(inner)
        blocks[name] = inner[start:end].rstrip()
    return blocks


def reorder_html(html):
    m = NAV_RE.search(html)
    if not m:
        return html, False
    blocks = extract_blocks(m.group(2))
    new_inner = "\n            ".join(blocks[key] for key in ORDER)
    replacement = m.group(1) + "\n            " + new_inner + "\n          " + m.group(3)
    return html[: m.start()] + replacement + html[m.end() :], True


def main():
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        new, ok = reorder_html(text)
        if ok and new != text:
            path.write_text(new, encoding="utf-8")
            print("updated", path.name)
        elif not ok:
            print("skip (no nav)", path.name)


if __name__ == "__main__":
    main()