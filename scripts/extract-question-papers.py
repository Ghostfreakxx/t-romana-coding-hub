"""Extract questions from the uploaded MZU / college question papers into data/question-bank/papers.json.

Usage: python3 scripts/extract-question-papers.py ["OLD QUESTION COLLEGE"]

Reads every PDF in the folder and inside its ZIP files. Papers with a text layer are read with pdftotext;
scanned papers are read with Tesseract OCR (apt install tesseract-ocr), cached in .cache/qbank-ocr/<md5>.txt.
Only BA subjects covered by the hub are kept. Duplicate uploads of the same exam are merged.
Then run scripts/build-question-bank.py.
"""
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from qbank.paper_meta import read as read_meta  # noqa: E402
from qbank.parse_questions import parse  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "OLD QUESTION COLLEGE")
CACHE = ROOT / ".cache/qbank-ocr"
OUTPUT = ROOT / "data/question-bank/papers.json"
KEEP = {"political-science", "sociology", "public-administration", "history", "english", "education", "economics", "vac"}


def pdfs():
    for path in sorted(SOURCE.rglob("*")):
        if path.suffix.lower() == ".pdf":
            yield path.relative_to(SOURCE).as_posix(), path.read_bytes()
        elif path.suffix.lower() == ".zip":
            with zipfile.ZipFile(path) as archive:
                for name in sorted(archive.namelist()):
                    if name.lower().endswith(".pdf"):
                        yield f"{path.name}/{name}", archive.read(name)


def run(args, data=None):
    return subprocess.run(args, input=data, capture_output=True).stdout


def text_of(data, md5):
    with tempfile.NamedTemporaryFile(suffix=".pdf") as handle:
        handle.write(data); handle.flush()
        text = run(["pdftotext", handle.name, "-"]).decode("utf-8", "ignore")
        if len(text.split()) > 40:
            return text, "text"
        cached = CACHE / f"{md5}.txt"
        if cached.exists():
            return cached.read_text(errors="ignore"), "ocr"
        if os.environ.get("SKIP_OCR"):
            return "", "skipped"
        with tempfile.TemporaryDirectory() as folder:
            run(["pdftoppm", "-r", "300", "-gray", "-png", handle.name, f"{folder}/p"])
            pages = []
            for image in sorted(Path(folder).glob("p-*.png")):
                pages.append(f"=== PAGE {image.name}\n" + subprocess.run(
                    ["tesseract", str(image), "-", "--psm", "4", "-l", "eng"], capture_output=True,
                    env={**os.environ, "OMP_THREAD_LIMIT": "1"}).stdout.decode("utf-8", "ignore"))
        text = "\n".join(pages)
        CACHE.mkdir(parents=True, exist_ok=True)
        cached.write_text(text)
        return text, "ocr"


def norm_title(title):
    title = (title or "").lower().replace("—", " ").replace("–", " ")
    title = re.sub(r"\bi\s*l\b|\bil\b", "ii", title)
    return re.sub(r"[^a-z0-9]+", " ", title).strip()


papers, seen_files = {}, set()
for name, data in pdfs():
    md5 = hashlib.md5(data).hexdigest()
    if md5 in seen_files:
        continue
    seen_files.add(md5)
    text, method = text_of(data, md5)
    meta = read_meta(text, name)
    if meta["dept"] not in KEEP or not meta["year"]:
        continue
    questions = parse(text)
    if len([q for q in questions if q["section"] in "BC"]) < 4:
        continue
    key = f'{meta["dept"]}|{meta["scheme"]}|{meta["year"]}|{meta["sem"]}|{norm_title(meta["title"])}|{meta["code"] or ""}'
    current = papers.get(key)
    if current and len(current["questions"]) >= len(questions):
        current["sources"].append(name)
        continue
    papers[key] = {**{k: meta[k] for k in ("dept", "subject", "scheme", "year", "sem", "code", "paper", "title")},
                   "method": method, "sources": ([*current["sources"]] if current else []) + [name],
                   "questions": [{k: q[k] for k in ("section", "unit", "n", "text", "options")} for q in questions]}

result = sorted(papers.values(), key=lambda p: (p["dept"], p["sem"] or 0, norm_title(p["title"]), p["year"], p["scheme"] or ""))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{len(seen_files)} unique PDFs read; {len(result)} BA papers kept; {sum(len(p['questions']) for p in result)} questions")
