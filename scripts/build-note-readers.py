"""Extract the existing TRC guides into browser-readable JSON. No text is authored here."""
import json
import re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def paragraph_text(node):
    return "".join(
        child.text or "" if child.tag == W + "t" else "\n" if child.tag == W + "br" else "\t"
        for child in node.iter() if child.tag in (W + "t", W + "br", W + "tab")
    ).strip()


def extract(path):
    with ZipFile(path) as archive:
        body = ET.fromstring(archive.read("word/document.xml")).find(W + "body")
    sections = []
    current = {"id": "section-0", "title": "About this guide", "context": [], "kind": "general", "blocks": []}
    hierarchy = {}
    kind = "general"
    paper = ""
    for node in body:
        if node.tag == W + "p":
            text = paragraph_text(node)
            if not text:
                continue
            style = node.find(W + "pPr/" + W + "pStyle")
            style_name = style.get(W + "val", "") if style is not None else ""
            match = re.match(r"Heading([1-6])", style_name, re.I)
            if match:
                if current["blocks"] or current["title"] != "About this guide":
                    sections.append(current)
                level = int(match[1])
                if re.match(r"SEMESTER\b", text, re.I):
                    paper = ""
                elif re.match(r"(?:POLS|SOC|EDU|ENG|HIST|PUB|ECO|VAC)[ /]*[A-Z/]*\d", text, re.I):
                    paper = text
                hierarchy = {key: value for key, value in hierarchy.items() if key < level}
                if level <= 2:
                    kind = "short" if "SHORT" in text.upper() else "long" if "LONG" in text.upper() else "general"
                context = list(hierarchy.values())
                if paper and paper != text and paper not in context:
                    context.insert(1 if context else 0, paper)
                current = {"id": f"section-{len(sections)}", "title": text,
                           "context": context, "kind": kind, "blocks": []}
                hierarchy[level] = text
            else:
                current["blocks"].append({"type": "paragraph", "text": text})
        elif node.tag == W + "tbl":
            rows = []
            for row in node.findall(W + "tr"):
                rows.append(["\n".join(paragraph_text(p) for p in cell.findall(W + "p"))
                             for cell in row.findall(W + "tc")])
            current["blocks"].append({"type": "table", "rows": rows})
    if current["blocks"]:
        sections.append(current)
    return sections


destination = ROOT / "public/notes/read"
destination.mkdir(parents=True, exist_ok=True)
resources = re.findall(r'id: "([^"]+)"[^\n]+file: "([^"]+\.docx)"', (ROOT / "data/notes.ts").read_text())
for resource_id, filename in resources:
    sections = extract(ROOT / "public" / filename.lstrip("/"))
    assert sections, filename
    output = {"id": resource_id, "sections": sections}
    (destination / f"{resource_id}.json").write_text(json.dumps(output, ensure_ascii=False), encoding="utf-8")
print(f"Extracted {len(resources)} existing guides for the online reader.")
