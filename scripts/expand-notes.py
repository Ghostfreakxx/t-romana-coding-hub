"""Insert the expanded explanations from data/note-expansions/<id>/*.json into the TRC .docx guides.

Each expansion file (a guide may be split into several parts) maps a reader section id (as produced by build-note-readers.py) to a list of
extra paragraphs. They are added after the existing text of that section, so the original wording
stays first. Running the script again is safe: paragraphs already in a guide are not inserted twice.
Afterwards run build-note-readers.py to refresh the online reader JSON.
"""
import copy
import json
import re
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
WNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = "{%s}" % WNS
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"


def paragraph_text(node):
    return "".join(
        child.text or "" if child.tag == W + "t" else "\n" if child.tag == W + "br" else "\t"
        for child in node.iter() if child.tag in (W + "t", W + "br", W + "tab")
    ).strip()


def section_nodes(body):
    """Return {section_id: last top-level node of that section}, mirroring build-note-readers.py."""
    count = 0
    current_title = "About this guide"
    current_has_blocks = False
    current_id = "section-0"
    last = {}
    for node in body:
        if node.tag == W + "p":
            text = paragraph_text(node)
            if not text:
                continue
            style = node.find(W + "pPr/" + W + "pStyle")
            style_name = style.get(W + "val", "") if style is not None else ""
            if re.match(r"Heading([1-6])", style_name, re.I):
                if current_has_blocks or current_title != "About this guide":
                    count += 1
                current_id = f"section-{count}"
                current_title = text
                current_has_blocks = False
                continue
            current_has_blocks = True
            last[current_id] = node
        elif node.tag == W + "tbl":
            current_has_blocks = True
            last[current_id] = node
    return last


def make_paragraph(text, template):
    paragraph = etree.Element(W + "p")
    if template is not None and template.tag == W + "p":
        ppr = template.find(W + "pPr")
        if ppr is not None:
            paragraph.append(copy.deepcopy(ppr))
    run = etree.SubElement(paragraph, W + "r")
    if template is not None and template.tag == W + "p":
        rpr = template.find(W + "r/" + W + "rPr")
        if rpr is not None:
            run.append(copy.deepcopy(rpr))
    t = etree.SubElement(run, W + "t")
    t.text = text
    t.set(XML_SPACE, "preserve")
    return paragraph


def expand(docx_path, expansions):
    with ZipFile(docx_path) as archive:
        entries = [(info, archive.read(info.filename)) for info in archive.infolist()]
    document = dict((info.filename, data) for info, data in entries)["word/document.xml"]
    tree = etree.fromstring(document)
    body = tree.find(W + "body")
    existing = {paragraph_text(p) for p in body.iter(W + "p")}
    targets = section_nodes(body)
    added = 0
    for section_id, paragraphs in expansions.items():
        anchor = targets.get(section_id)
        if anchor is None:
            raise SystemExit(f"{docx_path.name}: unknown or empty section {section_id}")
        template = anchor if anchor.tag == W + "p" else None
        for text in paragraphs:
            text = text.strip()
            if not text or text in existing:
                continue
            new = make_paragraph(text, template)
            anchor.addnext(new)
            anchor = new
            existing.add(text)
            added += 1
    if not added:
        return 0
    xml = etree.tostring(tree, xml_declaration=True, encoding="UTF-8", standalone=True)
    temporary = docx_path.with_suffix(".tmp")
    with ZipFile(temporary, "w", ZIP_DEFLATED) as archive:
        for info, data in entries:
            archive.writestr(info, xml if info.filename == "word/document.xml" else data)
    temporary.replace(docx_path)
    return added


resources = dict(re.findall(r'id: "([^"]+)"[^\n]+file: "([^"]+\.docx)"', (ROOT / "data/notes.ts").read_text()))
wanted = sys.argv[1:] or sorted(resources)
for resource_id in wanted:
    expansions = {}
    for source in sorted((ROOT / "data/note-expansions" / resource_id).glob("*.json")):
        for section_id, paragraphs in json.loads(source.read_text(encoding="utf-8")).items():
            expansions.setdefault(section_id, []).extend(paragraphs)
    if not expansions:
        continue
    added = expand(ROOT / "public" / resources[resource_id].lstrip("/"), expansions)
    print(f"{resource_id}: {added} paragraphs added across {len(expansions)} sections")
