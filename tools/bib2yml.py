#!/usr/bin/env python3
"""BibTeX → _data/publications.yml 항목 변환기 (외부 패키지 필요 없음)

Google Scholar / 출판사에서 받은 BibTeX를 붙여 넣으면, publications.yml에
바로 붙여 넣을 수 있는 YAML 항목을 출력합니다.

  python3 tools/bib2yml.py paper.bib            # 파일에서
  pbpaste | python3 tools/bib2yml.py            # 클립보드에서 (macOS)
  python3 tools/bib2yml.py paper.bib --prepend  # publications.yml 맨 위에 바로 추가

출력된 항목의 venue(약칭), type, image, links 는 확인 후 다듬어 주세요.
"""
import argparse
import re
import sys
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "_data" / "publications.yml"

TYPE_MAP = {
    "article": "journal",
    "inproceedings": "conference",
    "conference": "conference",
    "proceedings": "conference",
    "phdthesis": "thesis",
    "mastersthesis": "thesis",
    "misc": "preprint",
    "unpublished": "preprint",
    "techreport": "preprint",
}

# 자주 쓰는 학회/저널 약칭. 필요하면 추가하세요. (소문자 부분 문자열 → 약칭)
VENUE_ABBR = [
    ("robotics and automation letters", "IEEE RA-L"),
    ("international conference on robotics and automation", "IEEE ICRA"),
    ("intelligent robots and systems", "IEEE/RSJ IROS"),
    ("transactions on mechatronics", "IEEE/ASME T-MECH"),
    ("transactions on robotics", "IEEE T-RO"),
    ("humanoid robots", "IEEE-RAS Humanoids"),
    ("conference on robot learning", "CoRL"),
    ("robotics: science and systems", "RSS"),
    ("advanced intelligent mechatronics", "IEEE/ASME AIM"),
    ("journal of control, automation", "IJCAS"),
    ("conference on control, automation", "ICCAS"),
    ("ieee access", "IEEE Access"),
    ("social robotics", "IJSR"),
    ("intelligent service robotics", "ISR"),
    ("arxiv", "arXiv"),
]


def parse_bibtex(text):
    """Very small BibTeX parser: returns a list of (entry_type, key, fields, raw)."""
    entries = []
    i = 0
    while True:
        m = re.compile(r"@(\w+)\s*\{\s*([^,\s]+)\s*,", re.S).search(text, i)
        if not m:
            break
        start = m.start()
        # find the matching closing brace of the entry
        depth, j = 0, start
        for j in range(text.index("{", start), len(text)):
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
                if depth == 0:
                    break
        body = text[m.end():j]
        raw = text[start:j + 1]
        entries.append((m.group(1).lower(), m.group(2), parse_fields(body), raw))
        i = j + 1
    return entries


def parse_fields(body):
    fields = {}
    pos = 0
    field_re = re.compile(r"\s*(\w+)\s*=\s*", re.S)
    while pos < len(body):
        m = field_re.match(body, pos)
        if not m:
            break
        name = m.group(1).lower()
        pos = m.end()
        if pos < len(body) and body[pos] == "{":
            depth = 0
            for q in range(pos, len(body)):
                if body[q] == "{":
                    depth += 1
                elif body[q] == "}":
                    depth -= 1
                    if depth == 0:
                        break
            value = body[pos + 1:q]
            pos = q + 1
        elif pos < len(body) and body[pos] == '"':
            q = body.index('"', pos + 1)
            value = body[pos + 1:q]
            pos = q + 1
        else:
            q = pos
            while q < len(body) and body[q] not in ",\n":
                q += 1
            value = body[pos:q].strip()
            pos = q
        fields[name] = clean(value)
        comma = body.find(",", pos)
        pos = len(body) if comma == -1 else comma + 1
    return fields


def clean(value):
    value = re.sub(r"\s+", " ", value)
    value = value.replace("{", "").replace("}", "")
    value = value.replace("\\&", "&").replace("--", "–")
    return value.strip()


def format_authors(raw):
    names = []
    for a in re.split(r"\s+and\s+", raw):
        a = a.strip()
        if not a:
            continue
        if "," in a:  # "Park, Suhan" → "Suhan Park"
            last, first = [s.strip() for s in a.split(",", 1)]
            a = f"{first} {last}"
        names.append(a)
    return ", ".join(names)


def guess_venue(f):
    venue = f.get("journal") or f.get("booktitle") or f.get("publisher") or f.get("school") or ""
    if not venue and f.get("archiveprefix", "").lower() == "arxiv":
        return "arXiv", ""
    low = venue.lower()
    for key, abbr in VENUE_ABBR:
        if key in low:
            return abbr, venue
    return venue, venue


def quote(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def to_yaml(etype, key, f, raw):
    venue, venue_full = guess_venue(f)
    ptype = TYPE_MAP.get(etype, "conference")
    has_venue = f.get("journal") or f.get("booktitle")
    if "arxiv" in (venue_full or "").lower() or (not has_venue and f.get("archiveprefix", "").lower() == "arxiv"):
        ptype = "preprint"
    lines = [
        f"- title: {quote(f.get('title', 'TODO'))}",
        f"  authors: {quote(format_authors(f.get('author', 'TODO')))}",
        f"  venue: {quote(venue or 'TODO')}",
    ]
    if venue_full and venue_full != venue:
        lines.append(f"  venue_full: {quote(venue_full)}")
    lines += [
        f"  year: {f.get('year', 'TODO')}",
        f"  type: {ptype}",
        f"  # image: /assets/img/pubs/{key}.png",
    ]
    links = []
    if f.get("doi"):
        links.append(f"    paper: https://doi.org/{f['doi']}")
    elif f.get("url"):
        links.append(f"    paper: {f['url']}")
    if f.get("eprint") and f.get("archiveprefix", "").lower() == "arxiv":
        links.append(f"    arxiv: https://arxiv.org/abs/{f['eprint']}")
    if links:
        lines.append("  links:")
        lines += links
    lines.append("  bibtex: |")
    lines += ["    " + ln for ln in raw.strip().splitlines()]
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bib", nargs="?", help="BibTeX 파일 (생략하면 stdin)")
    ap.add_argument("--prepend", action="store_true", help="publications.yml의 첫 항목 앞에 바로 추가")
    args = ap.parse_args()

    text = Path(args.bib).read_text(encoding="utf-8") if args.bib else sys.stdin.read()
    entries = parse_bibtex(text)
    if not entries:
        sys.exit("BibTeX 항목을 찾지 못했습니다.")
    out = "\n".join(to_yaml(*e) for e in entries)

    if not args.prepend:
        print(out)
        return
    data = DATA_FILE.read_text(encoding="utf-8")
    m = re.search(r"^- ", data, re.M)
    idx = m.start() if m else len(data)
    DATA_FILE.write_text(data[:idx] + out + "\n" + data[idx:], encoding="utf-8")
    print(f"{len(entries)}개 항목을 _data/publications.yml 맨 위에 추가했습니다.")


if __name__ == "__main__":
    main()
