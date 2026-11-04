"""Split an MZU question paper's text into questions: section (A objective / B short / C long), unit, number, text."""
import re

FOOTER = re.compile(r"^\s*(/\s*\d+|\d{1,2}|\[\s*Contd\.?\s*\]?|\[?\s*P\.?T\.?O\.?\s*\]?|H\s*H\s*H|\*+|G\d{2}\s*[—–-]+\s*\d+.*|.*Student.s Copy.*|=== PAGE.*)\s*$", re.I)
SECTION = re.compile(r"SECTION\s*[:.\-–—]?\s*([ABC])\b|\b(OBJECTIVE|SHORT\s+ANSWER|DESCRIPTIVE|LONG\s+ANSWER)\b", re.I)
UNIT = re.compile(r"^[^A-Za-z0-9]*U[NnIil1]{1,4}T\s*[—–\-:.~_]*\s*([IVXl1|]+|\d+)(?![a-z])", re.I)
TAIL = re.compile(r"(\s*[\[{|(]*\s*\|?\s*Contd.*$)|(\s*[-§\d]+\s*\+\s*\d+\s*=\s*\d+.*$)|(\s+(?:Or|OR)\s*$)|(\s+\d+\s*(?:\+\s*\d+\s*)+=\s*\d+\s*\w?\s*$)|(\s+\d{1,2}\s*$)|(\s+k{2,}.*$)|(\s+/\d{2,4}\s.*$)|(\s+G\d{2}\b.*$)|(\s*[|‘\\;]+[\s|‘\\;t\d]*$)|(\s+[a-z]\s*$)|(\s*_?U[NnIil1]{1,4}T\s*[—–\-:.~_]*\s*[IVXl1|]+\s*$)|(\s*/?\s*\d{1,4}\s+\d{1,2}\s*\[\s*Contd.*$)|(\s*\[\s*Contd\.?\s*\]?\s*$)|(\s*\bP\.?\s*T\.?\s*O\.?\s*$)", re.I)
QNUM = re.compile(r"^\s*[\"'‘’“”`*_|]*\s*(\d{1,2})\s*[.)]\s+(.*)$")
OPTION = re.compile(r"^\s*\(?([a-d])\)\s+(.*)$")
OR = re.compile(r"^\s*OR\s*$")
MARKS = re.compile(r"\b\d+\s*[×xX]\s*\d+\s*=\s*\d+\b")


def roman(value):
    """Normalise OCR'd unit numerals: 'Il1' -> 'III', 'l' -> 'I', '2' -> 'II'."""
    if value.isdigit():
        return {"1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI"}.get(value, value)
    return re.sub(r"[l1|]", "I", value).upper()


def clean(text):
    text = re.sub(r"\(\s*\)", " ", text)
    text = MARKS.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip(" .;:,")
    return text


def section_of(match):
    letter, word = match.group(1), (match.group(2) or "").upper()
    if letter: return letter.upper()
    if word.startswith("OBJ"): return "A"
    if word.startswith("SHORT"): return "B"
    return "C"


def parse(text):
    questions, current, section, unit = [], None, None, None
    pending_unit = None
    for raw in text.splitlines():
        line = raw.strip()
        if pending_unit:
            if current: questions.append(current); current = None
            unit, pending_unit = pending_unit, None
        if not line or FOOTER.match(line):
            continue
        inline = re.search(r"\s_?U[NnIil1]{1,4}T\s*[—–\-:.~_]*\s*([IVXl1|]+)\s*$", line)
        if inline and not UNIT.match(line):
            pending_unit, line = roman(inline.group(1)), line[:inline.start()].strip()
        sec = SECTION.search(line)
        if sec and len(line) < 70 and ("SECTION" in line.upper() or line.upper() == line) and not QNUM.match(line):
            if current: questions.append(current); current = None
            section, unit = section_of(sec), None
            continue
        u = UNIT.match(line)
        if u and len(line) < 30:
            if current: questions.append(current); current = None
            unit = roman(u.group(1))
            continue
        if OR.match(line):
            if current: questions.append(current); current = None
            continue
        q = QNUM.match(line)
        if q and section:
            if current: questions.append(current)
            current = {"section": section, "unit": unit, "n": int(q.group(1)), "text": q.group(2), "options": []}
            continue
        if current is None:
            continue
        current["text"] += " " + line
    if current: questions.append(current)
    out = []
    for q in questions:
        text = re.sub(r"\(\s*\)", " ", q["text"])
        if q["section"] == "A":
            parts = re.split(r"\(\s*([a-d])\s*\)", text)
            if len(parts) >= 7:
                text = parts[0]
                q["options"] = [clean(re.sub(r"[()]", " ", parts[i + 1])) for i in range(1, len(parts) - 1, 2)]
        text = re.sub(r"[()]\s*$", "", text)
        for _ in range(3):
            text = TAIL.sub("", text)
        q["text"] = clean(text)
        q["options"] = [o for o in q["options"] if o]
        instruction = re.match(r"^(?:Candidates?|Students?)\b", q["text"]) or re.search(r"answer sheets?|Candidate only", q["text"], re.I)
        if len(q["text"]) >= 8 and not instruction:
            out.append(q)
    return out


if __name__ == "__main__":
    import sys, json  # noqa: E401
    print(json.dumps(parse(open(sys.argv[1], errors="ignore").read()), indent=1, ensure_ascii=False)[:4000])
