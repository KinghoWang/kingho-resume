from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
IGNORED_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append(value)


missing = []
checked = 0

for html_file in sorted(ROOT.glob("*.html")):
    parser = ReferenceParser()
    parser.feed(html_file.read_text(encoding="utf-8"))
    for reference in parser.references:
        parsed = urlsplit(reference)
        if parsed.scheme in IGNORED_SCHEMES or parsed.netloc or not parsed.path:
            continue
        checked += 1
        target = ROOT / unquote(parsed.path.lstrip("/"))
        if not target.exists():
            missing.append(f"{html_file.name}: {reference}")

if missing:
    raise SystemExit("Missing local references:\n" + "\n".join(missing))

print(f"Checked {checked} local references across {len(list(ROOT.glob('*.html')))} HTML files; missing=[]")
