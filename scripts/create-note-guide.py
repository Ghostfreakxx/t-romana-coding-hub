"""Create a new TRC notes .docx guide from a JSON outline, reusing the styles of an existing guide.

Usage: python3 scripts/create-note-guide.py <outline.json> <template.docx> <output.docx>

The outline is {"title": [lines...], "blocks": [[kind, text], ...]} where kind is one of
h1, h2, h3 (headings), bullet (list paragraph) or p (body paragraph). Section headings named
"SHORT NOTES" / "LONG NOTES" (h2) let build-note-readers.py classify the sections, as in the
existing guides. Afterwards add the guide to data/notes.ts and run build-note-readers.py.
"""
import copy
import json
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import etree

WNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = "{%s}" % WNS
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
STYLES = {"h1": "Heading1", "h2": "Heading2", "h3": "Heading3", "bullet": "ListBullet"}


def style_of(paragraph):
    style = paragraph.find(W + "pPr/" + W + "pStyle")
    return style.get(W + "val") if style is not None else ""


def text_of(paragraph):
    return "".join(t.text or "" for t in paragraph.iter(W + "t")).strip()


def build(template_paragraph, text):
    paragraph = etree.Element(W + "p")
    ppr = template_paragraph.find(W + "pPr")
    if ppr is not None:
        paragraph.append(copy.deepcopy(ppr))
    run = etree.SubElement(paragraph, W + "r")
    rpr = template_paragraph.find(W + "r/" + W + "rPr")
    if rpr is not None:
        run.append(copy.deepcopy(rpr))
    t = etree.SubElement(run, W + "t")
    t.text = text
    t.set(XML_SPACE, "preserve")
    return paragraph


def main(outline_path, template_path, output_path):
    outline = json.loads(Path(outline_path).read_text(encoding="utf-8"))
    with ZipFile(template_path) as archive:
        entries = [(info, archive.read(info.filename)) for info in archive.infolist()]
    tree = etree.fromstring(dict((i.filename, d) for i, d in entries)["word/document.xml"])
    body = tree.find(W + "body")
    paragraphs = [n for n in body if n.tag == W + "p" and text_of(n)]

    title_templates = []
    for paragraph in paragraphs:
        if style_of(paragraph):
            break
        title_templates.append(paragraph)
    templates = {}
    for kind, style in STYLES.items():
        templates[kind] = next(p for p in paragraphs if style_of(p) == style)
    templates["p"] = next(p for p in paragraphs[len(title_templates):] if not style_of(p))

    section_properties = body.find(W + "sectPr")
    for child in list(body):
        body.remove(child)
    for index, line in enumerate(outline["title"]):
        body.append(build(title_templates[min(index, len(title_templates) - 1)], line))
    for kind, text in outline["blocks"]:
        body.append(build(templates[kind], text))
    if section_properties is not None:
        body.append(section_properties)

    xml = etree.tostring(tree, xml_declaration=True, encoding="UTF-8", standalone=True)
    with ZipFile(output_path, "w", ZIP_DEFLATED) as archive:
        for info, data in entries:
            archive.writestr(info, xml if info.filename == "word/document.xml" else data)
    print(f"{output_path}: {len(outline['blocks'])} blocks written")


if __name__ == "__main__":
    main(*sys.argv[1:4])
