"""Read paper metadata (code, year, scheme, semester, subject, title) from the first lines of a question paper."""
import re

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
SUBJECTS = {
    "POLITICAL SCIENCE": "political-science", "SOCIOLOGY": "sociology", "PUBLIC ADMINISTRATION": "public-administration",
    "HISTORY": "history", "ENGLISH": "english", "EDUCATION": "education", "ECONOMICS": "economics",
    "ENVIRONMENTAL STUDIES": "vac", "ENVIRONMENTAL SCIENCE": "vac", "UNIVERSAL HUMAN VALUES": "vac", "UNDERSTANDING INDIA": "vac",
    "HEALTH AND WELLNESS": "vac", "GEOGRAPHY": "geography", "PSYCHOLOGY": "psychology", "MIZO": "mizo", "PHILOSOPHY": "philosophy",
}
CODE_PREFIX = {"POLS": "political-science", "SOC": "sociology", "PA": "public-administration", "PUB": "public-administration",
               "HIST": "history", "ENG": "english", "EDN": "education", "ECO": "economics", "EVS": "vac", "VAC": "vac",
               "GEOG": "geography", "GEO": "geography", "PSY": "psychology", "MIZ": "mizo", "PHL": "philosophy"}


def lines_of(text, n=40):
    out = []
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("=== PAGE"):
            out.append(line)
        if len(out) >= n:
            break
    return out


def read(text, filename=""):
    head = lines_of(text)
    joined = " ".join(head)
    meta = {"code": None, "year": None, "scheme": None, "sem": None, "subject": None, "dept": None, "title": None, "paper": None}
    m = re.search(r"\b([A-Z]{2,5})\s*/\s*([IVX]{1,4})\s*/\s*([A-Z]{2,4})\s*/\s*(\d+\s*[A-Za-z]?)\s*(R)?\b", joined)
    if m:
        meta["code"] = f"{m.group(1)}/{m.group(2)}/{m.group(3)}/{m.group(4).replace(' ', '')}{m.group(5) or ''}"
        meta["sem"] = ROMAN.get(m.group(2))
        meta["dept"] = CODE_PREFIX.get(m.group(1))
        if m.group(1) == "EVS" and m.group(3) != "FC": meta["skip"] = True  # B.Sc. Environmental Science honours, not the common paper
    m = re.search(r"\b([A-Z]{2,5})\s*[-–]?\s*(\d)(\d{2})\s*([A-Z])?\b", joined)  # NEP codes such as POLS 361, EDN260
    if not meta["code"] and m and m.group(1) in CODE_PREFIX:
        meta["code"] = f"{m.group(1)} {m.group(2)}{m.group(3)}{m.group(4) or ''}"
        meta["dept"] = CODE_PREFIX[m.group(1)]
    y = re.search(r"\b(20[12]\d)\b", joined)
    meta["year"] = int(y.group(1)) if y else None
    if re.search(r"\bCBCS\b", joined, re.I): meta["scheme"] = "CBCS"
    elif re.search(r"\bNEP\b|FYUGP|\bMAJOR\b|\bMINOR\b|MULTIDISCIPLINARY", joined, re.I): meta["scheme"] = "NEP"
    s = re.search(r"\b([1-8])\s*(?:st|nd|rd|th)\s*Sem", joined, re.I)
    if s: meta["sem"] = int(s.group(1))
    for line in head:
        up = re.sub(r"[^A-Z ]", "", line.upper()).strip()
        if up in SUBJECTS and line.upper() == line:
            meta["subject"] = up.title(); meta["dept"] = meta["dept"] or SUBJECTS[up]; break
    for i, line in enumerate(head):
        if re.search(r"\bPAPER\b|\bCOURSE\b", line, re.I) and len(line) < 60:
            meta["paper"] = re.sub(r"\s+", " ", line).strip()
            for nxt in head[i + 1:i + 4]:
                t = re.match(r"^\[\s*(.+?)\s*\]$", nxt) or re.match(r"^\(\s*(.+?)\s*\)?$", nxt)
                if t and not re.search(r"Marks|Time|Semester|CBCS|NEP|^\(\s*(?:Pre-?)?revised\s*\)$", nxt, re.I):
                    meta["title"] = t.group(1).strip(" )"); break
            break
    named = re.search(r"Name of the Paper\s*:\s*([^\n]+?)\s*(?:Date of|$)", joined)
    if named:
        meta["title"] = named.group(1).strip()
    if meta["title"]:
        meta["title"] = re.sub(r"[\s}\]\)(|_]+$", "", meta["title"]).replace("_s ", "'s ").strip()
    if meta["title"] and (meta["title"].upper() == meta["title"] or len(meta["title"]) < 6 or not meta["title"][0].isupper()
                          or re.match(r"^[a-d]\)|^Pre-?revised$", meta["title"], re.I)):
        meta["title"] = None
    if not meta["title"] and filename:
        parts = re.findall(r"\(\s*([A-Za-z][^()]{5,80}?)\s*\)", filename.rsplit("/", 1)[-1])
        parts = [x for x in parts if not re.search(r"MAJOR|MINOR|CBCS|Sem\b|AEC|^[A-Z]{2,5}\s?\d{3}", x, re.I)]
        if parts: meta["title"] = parts[-1].strip()
        if meta["title"] and meta["title"].upper() == meta["title"]: meta["title"] = meta["title"].title()
    if not meta["title"]:
        for line in head[:20]:
            t = re.match(r"^\(\s*([A-Z][^()]{4,80}?)\s*\)$", line)
            if t and not re.search(r"Marks|Time|Semester|CBCS|NEP|SECTION|Copy|OBJECTIVE", line, re.I):
                meta["title"] = t.group(1).strip(); break
    if not meta["dept"] and filename:
        for word, dept in SUBJECTS.items():
            if word in filename.upper(): meta["dept"] = dept; meta["subject"] = meta["subject"] or word.title(); break
    if not meta["sem"] and filename:
        s = re.search(r"\b([1-8])\s*(?:st|nd|rd|th)\s*Sem", filename, re.I) or re.search(r"[A-Z]{2,5}\s?(\d)\d{2}", filename)
        if s: meta["sem"] = int(s.group(1))
    if meta.get("skip"): meta["dept"] = None
    return meta
