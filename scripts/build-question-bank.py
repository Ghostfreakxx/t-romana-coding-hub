"""Build the Question Bank data from data/question-bank/papers.json.

Groups the same paper across years and schemes (by title), then clusters similar questions inside each paper
so the site can show which questions were repeated and in which years.
Writes public/question-bank/index.json and public/question-bank/<subject>.json.
"""
import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAPERS = json.loads((ROOT / "data/question-bank/papers.json").read_text(encoding="utf-8"))
OUT = ROOT / "public/question-bank"
NAMES = {"political-science": "Political Science", "sociology": "Sociology", "public-administration": "Public Administration",
         "history": "History", "english": "English", "education": "Education", "economics": "Economics", "vac": "Value Added Courses"}

STOP = set("""a an the of in on and or to for with by as at is are was were be its it this that these those from into their
his her what which who whom how why when where do does did any two three four five six briefly brief explain discuss describe
examine write short note notes essay mention state define elucidate critically analyse analyze evaluate highlight bring out
give account meaning concept main various different important features nature significance role between give your own words
answer following detail elaborate comment illustrate examples example also about you understand mean meant""".split())


def norm_title(title):
    title = (title or "").lower().replace("—", " ").replace("–", " ").replace(" - ", " ")
    title = re.sub(r"\bi\s*l\b|\bil\b", "ii", title)
    return re.sub(r"[^a-z0-9]+", " ", title).strip()


def tokens(text):
    short = {w.lower() for w in re.findall(r"\b[A-Z]{2}\b", text)}  # keep US, UN, UK, EU ...
    words = re.findall(r"[a-z]+", text.lower())
    return {w[:-1] if len(w) > 4 and w.endswith("s") else w for w in words if w not in STOP and (len(w) > 2 or w in short)}


def similar(a, b):
    ta, tb = a["tok"], b["tok"]
    if not ta or not tb:
        return False
    jaccard = len(ta & tb) / len(ta | tb)
    only_a, only_b = ta - tb, tb - ta
    if len(only_a) == 1 and len(only_b) == 1:
        # One key word swapped (public/private, Tripura/Manipur) is a different question, not a new wording.
        word_a, word_b = next(iter(only_a)), next(iter(only_b))
        if SequenceMatcher(None, word_a, word_b).ratio() < 0.8:
            return False
    if jaccard >= 0.6:
        return True
    if min(len(ta), len(tb)) >= 2 and (ta <= tb or tb <= ta) and jaccard >= 0.5:
        return True
    return jaccard >= 0.45 and SequenceMatcher(None, a["norm"], b["norm"]).ratio() >= 0.85


def exam(paper):
    return f'{paper["year"]} {paper["scheme"] or ""}'.strip()


def numeral(title):
    """The part number of a paper title (Microeconomics-I vs -II), which must match for two papers to be grouped."""
    m = re.search(r"\b(?:part\s*)?(i{1,3}|iv|v|vi|[1-6])\s*$", title)
    return {"1": "i", "2": "ii", "3": "iii", "4": "iv", "5": "v", "6": "vi"}.get(m.group(1), m.group(1)) if m else ""


def group_papers(papers):
    groups = []
    for paper in papers:
        title = norm_title(paper["title"])
        for group in groups:
            if title and numeral(title) == numeral(group["key"]) and SequenceMatcher(None, title, group["key"]).ratio() >= 0.82:
                group["papers"].append(paper); break
        else:
            groups.append({"key": title, "papers": [paper]})
    return groups


def cluster(group_id, papers):
    items = []
    for p_index, paper in enumerate(papers):
        for q_index, question in enumerate(paper["questions"]):
            kind = "objective" if question["section"] == "A" else "written"
            items.append({"p": p_index, "q": q_index, "kind": kind, "text": question["text"], "tok": tokens(question["text"]),
                          "norm": " ".join(sorted(tokens(question["text"]))), "exam": exam(paper), "year": paper["year"],
                          "section": question["section"], "unit": question["unit"]})
    clusters = []
    for item in items:
        for c in clusters:
            if c["kind"] == item["kind"] and any(similar(item, other) for other in c["items"][:2]):
                c["items"].append(item); break
        else:
            clusters.append({"kind": item["kind"], "items": [item]})
    out, assignment = [], {}
    for index, c in enumerate(clusters):
        exams = sorted({i["exam"] for i in c["items"]}, key=lambda e: (int(e[:4]), e))
        cid = f"{group_id}-{index}"
        for i in c["items"]:
            assignment[(i["p"], i["q"])] = cid
        if len(exams) < 2:
            continue
        latest = max(c["items"], key=lambda i: (i["year"], len(i["text"])))
        out.append({"id": cid, "kind": c["kind"], "text": latest["text"], "times": len(exams), "exams": exams,
                    "sections": sorted({i["section"] for i in c["items"]}), "unit": latest["unit"],
                    "variants": sorted({i["text"] for i in c["items"]} - {latest["text"]})[:4]})
    out.sort(key=lambda c: (-c["times"], c["kind"] != "written", c["text"]))
    return out, assignment


OUT.mkdir(parents=True, exist_ok=True)
index = []
by_dept = defaultdict(list)
for paper in PAPERS:
    by_dept[paper["dept"]].append(paper)
for dept, papers in sorted(by_dept.items()):
    groups_out = []
    for g_index, group in enumerate(group_papers(papers)):
        group_id = f"{dept}-{g_index}"
        ps = sorted(group["papers"], key=lambda p: (p["year"], p["scheme"] or ""))
        repeated, assignment = cluster(group_id, ps)
        title = Counter(p["title"] for p in ps if p["title"]).most_common(1)
        sems = sorted({p["sem"] for p in ps if p["sem"]})
        groups_out.append({
            "id": group_id, "title": title[0][0] if title else "Untitled paper", "semesters": sems,
            "exams": [exam(p) for p in ps], "repeated": repeated,
            "papers": [{"exam": exam(p), "year": p["year"], "scheme": p["scheme"], "sem": p["sem"], "code": p["code"], "paper": p["paper"],
                        "questions": [{"s": q["section"], "u": q["unit"], "n": q["n"], "t": q["text"], "o": q["options"],
                                       "c": assignment.get((pi, qi))} for qi, q in enumerate(p["questions"])]}
                       for pi, p in enumerate(ps)],
        })
    groups_out.sort(key=lambda g: (g["semesters"][0] if g["semesters"] else 9, g["title"]))
    (OUT / f"{dept}.json").write_text(json.dumps({"dept": dept, "name": NAMES.get(dept, dept), "groups": groups_out},
                                                  ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    index.append({"dept": dept, "name": NAMES.get(dept, dept), "papers": len(papers),
                  "groups": [{"id": g["id"], "title": g["title"], "semesters": g["semesters"], "exams": g["exams"],
                              "repeated": len([c for c in g["repeated"] if c["kind"] == "written"])} for g in groups_out]})
(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
total = sum(g["repeated"] for d in index for g in d["groups"])
print(f"{len(PAPERS)} papers in {sum(len(d['groups']) for d in index)} paper groups; {total} written questions repeated across exams")
