#!/usr/bin/env python3
"""Replace in-page WhatsApp / callback CTAs with Book (not footer/sticky)."""
import re
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

BOOK = """{indent}<button type="button" class="btn-book js-book-consultation"{topic_attr}>
{indent}  <span class="btn-book-label-full">Book a Free Consultation</span>
{indent}  <span class="btn-book-label-short">Book</span>
{indent}</button>"""


def book_button(indent, topic=None):
    topic_attr = f' data-book-topic="{topic}"' if topic else ""
    return BOOK.format(indent=indent, topic_attr=topic_attr)


def decode_service(href):
    m = re.search(r"service=([^\"&]+)", href)
    if not m:
        return None
    return urllib.parse.unquote(m.group(1))


def process(text: str) -> str:
    # WhatsApp + Get a callback (any indent)
    pat_pair = re.compile(
        r"(?P<indent>[ \t]*)<a class=\"btn-whatsapp\" href=\"https://wa\.me/919303061805\"[^>]*>WhatsApp</a>\s*\n"
        r"(?P=indent)<a class=\"btn-ghost\" href=\"(?P<href>[^\"]+)\">(?:Get a callback|Contact form)</a>",
        re.MULTILINE,
    )

    def repl_pair(m):
        indent = m.group("indent")
        topic = decode_service(m.group("href"))
        if m.group("href") == "contact.html":
            topic = None
        return book_button(indent, topic)

    text = pat_pair.sub(repl_pair, text)

    # WhatsApp alone in hero-actions / cta-actions (after Call) — health advisor card
    pat_wa_only = re.compile(
        r"(?P<indent>[ \t]*)<a class=\"btn-whatsapp\" href=\"https://wa\.me/919303061805\"[^>]*>WhatsApp</a>",
        re.MULTILINE,
    )
    # Only replace if not in footer (footer has footer-contact-link class on sibling patterns)
    # Safe: remaining btn-whatsapp in body are the ones we want gone from grep earlier

    def repl_wa(m):
        indent = m.group("indent")
        return book_button(indent, None)

    text = pat_wa_only.sub(repl_wa, text)
    return text


def main():
    for path in sorted(ROOT.glob("*.html")):
        if path.name == "index.html":
            continue
        if path.name == "privacy.html":
            continue
        orig = path.read_text(encoding="utf-8")
        new = process(orig)
        if path.name == "health-insurance.html":
            # advisor block: need topic on second book — fix duplicate none topic
            new = new.replace(
                """<div class="hero-actions">
                <a class="btn-call" href="tel:+919303061805">Call 93030 61805</a>
                <button type="button" class="btn-book js-book-consultation">
                  <span class="btn-book-label-full">Book a Free Consultation</span>
                  <span class="btn-book-label-short">Book</span>
                </button>""",
                """<div class="hero-actions">
                <a class="btn-call" href="tel:+919303061805">Call 93030 61805</a>
                <button type="button" class="btn-book js-book-consultation" data-book-topic="Health Insurance">
                  <span class="btn-book-label-full">Book a Free Consultation</span>
                  <span class="btn-book-label-short">Book</span>
                </button>""",
                1,
            )
        if path.name == "contact.html":
            new = new.replace(
                "Call, WhatsApp, or send the form below.",
                "Call, book a consultation, or send the form below.",
            )
        if new != orig:
            path.write_text(new, encoding="utf-8")
            print("updated", path.name)


if __name__ == "__main__":
    main()