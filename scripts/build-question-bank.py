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
    return out, assignment, clusters


ROMAN_ORDER = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}


def candidate(c, exams_allowed=None):
    """Features of one question cluster (optionally using only some exams), for ranking guesses."""
    items = [i for i in c["items"] if exams_allowed is None or i["exam"] in exams_allowed]
    if not items or c["kind"] != "written":
        return None
    exams = sorted({i["exam"] for i in items}, key=lambda e: (int(e[:4]), e))
    sections = {i["section"] for i in items}
    latest = max(items, key=lambda i: (i["year"], i["section"] == "C", len(i["text"])))
    times = len(exams)
    # Weights chosen by back-testing on past exams (see backtest()): frequency matters most, then long answers.
    score = times + 0.3 * ("C" in sections) + 0.3 * (len(sections) > 1) + 0.1 * len(items)
    return {"text": latest["text"], "unit": latest["unit"], "long": "C" in sections, "times": times, "exams": exams,
            "last": latest["year"], "score": round(score, 2), "items": items}


def likelihood(cand):
    """Calibrated on the back-test: repeated long answers are the strong signal; repeated short answers are not."""
    if cand["long"] and cand["times"] >= 3:
        return "high"
    if cand["long"] and cand["times"] == 2:
        return "medium"
    return "low"


def public(cand):
    return {"t": cand["text"], "u": cand["unit"], "long": cand["long"], "times": cand["times"], "exams": cand["exams"],
            "level": likelihood(cand)}


def forecast(raw):
    """A guess paper for the next exam: per unit, two long and two short questions (MZU papers give an OR choice)."""
    cands = [x for x in (candidate(c) for c in raw) if x]
    cands.sort(key=lambda x: (-x["score"], -x["last"], x["text"]))
    units = sorted({x["unit"] for x in cands if x["unit"]}, key=lambda u: ROMAN_ORDER.get(u, 9))
    chosen, out_units = [], []

    def fresh(x):
        """Skip a guess that overlaps an already chosen one (Kautilya's Arthashastra vs the book Arthashastra)."""
        tx = tokens(x["text"])
        return all(len(tx & tokens(y["text"])) / (min(len(tx), len(tokens(y["text"]))) or 1) < 0.5
                   for y in chosen if y["long"] == x["long"])

    slots = {(unit, kind): [] for unit in units or [None] for kind in (True, False)}
    for x in cands:  # strongest guesses first, so a weaker near-duplicate never pushes them out
        slot = slots.get((x["unit"] if units else None, x["long"]))
        if slot is not None and len(slot) < 2 and fresh(x):
            slot.append(x); chosen.append(x)
    for unit in units or [None]:
        out_units.append({"unit": unit, "long": [public(x) for x in slots[(unit, True)]], "short": [public(x) for x in slots[(unit, False)]]})
    return {"top": [public(x) for x in cands[:5]], "units": out_units}


def backtest(groups):
    """Hide each paper's latest exam, guess it from the earlier ones, and count how many top-5 guesses came."""
    hits, random_rate, tests = [], [], 0
    by_level = {"high": [0, 0], "medium": [0, 0], "low": [0, 0]}
    for raw, ps in groups:
        occasions = sorted({exam(p) for p in ps}, key=lambda e: (int(e[:4]), e))
        if len({int(o[:4]) for o in occasions}) < 2:
            continue
        held = occasions[-1]
        train = {o for o in occasions if int(o[:4]) < int(held[:4])}
        cands = []
        for c in raw:
            x = candidate(c, train)
            if x:
                x["hit"] = any(i["exam"] == held for i in c["items"])
                cands.append(x)
                by_level[likelihood(x)][0] += x["hit"]; by_level[likelihood(x)][1] += 1
        if len(cands) < 12:
            continue
        tests += 1
        cands.sort(key=lambda x: (-x["score"], -x["last"]))
        hits.append(sum(x["hit"] for x in cands[:5]) / 5)
        random_rate.append(sum(x["hit"] for x in cands) / len(cands))
    if not tests:
        return None
    return {"tests": tests, "top5": round(sum(hits) / tests, 3), "random": round(sum(random_rate) / tests, 3),
            "levels": {k: round(h / n, 2) if n else None for k, (h, n) in by_level.items()}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    tested = []
    by_dept = defaultdict(list)
    for paper in PAPERS:
        by_dept[paper["dept"]].append(paper)
    for dept, papers in sorted(by_dept.items()):
        groups_out = []
        for g_index, group in enumerate(group_papers(papers)):
            group_id = f"{dept}-{g_index}"
            ps = sorted(group["papers"], key=lambda p: (p["year"], p["scheme"] or ""))
            repeated, assignment, raw = cluster(group_id, ps)
            title = Counter(p["title"] for p in ps if p["title"]).most_common(1)
            sems = sorted({p["sem"] for p in ps if p["sem"]})
            tested.append((raw, ps))
            groups_out.append({
                "id": group_id, "forecast": forecast(raw), "title": title[0][0] if title else "Untitled paper", "semesters": sems,
                "exams": [exam(p) for p in ps], "repeated": repeated,
                "papers": [{"exam": exam(p), "year": p["year"], "scheme": p["scheme"], "sem": p["sem"], "code": p["code"], "paper": p["paper"], "pdf": p.get("pdf"),
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
    accuracy = backtest(tested)
    (OUT / "index.json").write_text(json.dumps({"subjects": index, "forecast": accuracy}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("Back-test of guesses:", accuracy)
    total = sum(g["repeated"] for d in index for g in d["groups"])
    print(f"{len(PAPERS)} papers in {sum(len(d['groups']) for d in index)} paper groups; {total} written questions repeated across exams")


if __name__ == "__main__":
    main()
