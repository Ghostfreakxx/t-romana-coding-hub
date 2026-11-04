"use client";

import { useEffect, useMemo, useState } from "react";
import { download } from "@/lib/storage";

type GroupSummary = { id: string; title: string; semesters: number[]; exams: string[]; repeated: number };
type DeptSummary = { dept: string; name: string; papers: number; groups: GroupSummary[] };
type Question = { s: string; u: string | null; n: number; t: string; o: string[]; c: string | null };
type Paper = { exam: string; year: number; scheme: string | null; sem: number | null; code: string | null; paper: string | null; pdf?: string | null; questions: Question[] };
type Repeat = { id: string; kind: "written" | "objective"; text: string; times: number; exams: string[]; sections: string[]; unit: string | null; variants: string[] };
type Guess = { t: string; u: string | null; long: boolean; times: number; exams: string[]; level: "high" | "medium" | "low" };
type Forecast = { top: Guess[]; units: { unit: string | null; long: Guess[]; short: Guess[] }[] };
type Accuracy = { tests: number; top5: number; random: number; levels?: Record<string, number | null> } | null;
type Group = GroupSummary & { repeated: Repeat[]; papers: Paper[]; forecast?: Forecast };
type Dept = { dept: string; name: string; groups: Group[] };

const SECTION_NAMES: Record<string, string> = { A: "Section A — Objective", B: "Section B — Short answer", C: "Section C — Long answer" };
const cache = new Map<string, Promise<unknown>>();
function load<T>(url: string): Promise<T> {
  if (!cache.has(url)) cache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error("The question bank could not be loaded."); return r.json(); }).catch(e => { cache.delete(url); throw e; }));
  return cache.get(url) as Promise<T>;
}
const label = (exam: string) => exam.replace("NEP", "NEP 2020");
const NEXT_EXAM = "2026–27";
const LEVELS = { high: "High chance", medium: "Good chance", low: "Possible" };
const inTen = (rate?: number | null) => rate == null ? "" : `about ${Math.max(1, Math.round(rate * 10))} in 10 came`;
const asked = (g: Guess) => g.times > 1 ? `asked ${g.times}× (${g.exams.map(label).join(", ")})` : `asked once (${g.exams.map(label).join(", ")})`;

function guessText(dept: Dept, semester: number | "all", only?: Group) {
  const groups = only ? [only] : dept.groups.filter(g => semester === "all" || g.semesters.includes(semester));
  const lines = [`${dept.name.toUpperCase()} — GUESS PAPER FOR THE NEXT EXAM (${NEXT_EXAM})${only ? ` · ${only.title}` : semester === "all" ? "" : ` · SEMESTER ${semester}`}`,
    "Our guesses, worked out from past MZU papers: questions asked most often, especially long answers, rank highest.",
    "This is a study aid, not a leak or a promise. Study the whole syllabus; use this to decide what to revise first.", ""];
  for (const g of groups) {
    if (!g.forecast || !g.forecast.top.length) continue;
    lines.push(`== ${g.title} (Semester ${g.semesters.join("/")}) · based on: ${g.exams.map(label).join(", ")}`, "Most likely:");
    g.forecast.top.forEach((q, i) => lines.push(`  ${i + 1}. ${q.t}  [${LEVELS[q.level]} · ${asked(q)}]`));
    for (const u of g.forecast.units) {
      if (!u.long.length && !u.short.length) continue;
      lines.push(u.unit ? `Unit ${u.unit}` : "All units");
      u.long.forEach(q => lines.push(`  Long:  ${q.t}  [${LEVELS[q.level]}]`));
      u.short.forEach(q => lines.push(`  Short: ${q.t}  [${LEVELS[q.level]}]`));
    }
    lines.push("");
  }
  if (lines.length === 4) lines.push("Not enough past papers yet to make a guess for this selection.");
  return lines.join("\n");
}

function probableText(dept: Dept, semester: number | "all") {
  const groups = dept.groups.filter(g => semester === "all" || g.semesters.includes(semester));
  const lines = [`${dept.name.toUpperCase()} — PROBABLE QUESTIONS${semester === "all" ? "" : ` (SEMESTER ${semester})`}`,
    "Questions that were asked in two or more past MZU examinations, most repeated first.",
    "Source: past papers collected from GHBC and MZU. Prepared on the T. Romana Skills Hub. Check your current syllabus.", ""];
  for (const g of groups) {
    const written = g.repeated.filter(r => r.kind === "written");
    if (!written.length) continue;
    lines.push(`== ${g.title} (Semester ${g.semesters.join("/")}) · papers seen: ${g.exams.map(label).join(", ")}`);
    written.forEach((r, i) => lines.push(`${i + 1}. ${r.text}  [asked ${r.times}×: ${r.exams.map(label).join(", ")}${r.unit ? ` · Unit ${r.unit}` : ""}]`));
    lines.push("");
  }
  if (lines.length === 4) lines.push("No repeated questions yet for this selection. More past papers are needed.");
  return lines.join("\n");
}

function paperText(group: Group, paper: Paper) {
  const lines = [`${group.title} — ${label(paper.exam)}${paper.sem ? ` · Semester ${paper.sem}` : ""}${paper.code ? ` · ${paper.code}` : ""}`, ""];
  let section = "", unit: string | null = null;
  for (const q of paper.questions) {
    if (q.s !== section) { section = q.s; unit = null; lines.push("", SECTION_NAMES[q.s] ?? q.s); }
    if (q.u && q.u !== unit) { unit = q.u; lines.push(`Unit ${q.u}`); }
    lines.push(`${q.n}. ${q.t}`);
    q.o.forEach((o, i) => lines.push(`   (${"abcd"[i] ?? "-"}) ${o}`));
  }
  return lines.join("\n");
}

export default function QuestionBank() {
  const [index, setIndex] = useState<DeptSummary[] | null>(null);
  const [accuracy, setAccuracy] = useState<Accuracy>(null);
  const [error, setError] = useState("");
  const [deptId, setDeptId] = useState("");
  const [dept, setDept] = useState<Dept | null>(null);
  const [semester, setSemester] = useState<number | "all">("all");
  const [groupId, setGroupId] = useState("");
  const [view, setView] = useState<"guess" | "repeated" | "papers">("guess");
  const [examIndex, setExamIndex] = useState(0);
  const [showObjective, setShowObjective] = useState(false);

  useEffect(() => { load<{ subjects: DeptSummary[]; forecast: Accuracy }>("/question-bank/index.json").then(data => { setIndex(data.subjects); setAccuracy(data.forecast); setDeptId(data.subjects[0]?.dept ?? ""); }).catch(e => setError(e instanceof Error ? e.message : "Could not load.")); }, []);
  useEffect(() => {
    if (!deptId) return;
    let live = true;
    load<Dept>(`/question-bank/${deptId}.json`).then(data => { if (live) setDept(data); }).catch(e => setError(e instanceof Error ? e.message : "Could not load."));
    return () => { live = false; };
  }, [deptId]);

  const summary = index?.find(d => d.dept === deptId);
  const semesters = useMemo(() => [...new Set(summary?.groups.flatMap(g => g.semesters) ?? [])].sort((a, b) => a - b), [summary]);
  const groups = (dept?.dept === deptId ? dept.groups : []).filter(g => semester === "all" || g.semesters.includes(semester));
  const group = groups.find(g => g.id === groupId);
  const paper = group?.papers[Math.min(examIndex, (group?.papers.length ?? 1) - 1)];
  const repeatedIds = new Map(group?.repeated.map(r => [r.id, r]) ?? []);

  if (error) return <p className="notice error" role="alert">{error} Check your connection and reload the page.</p>;
  if (!index) return <p className="notice" role="status">Loading the question bank…</p>;

  const totalPapers = index.reduce((n, d) => n + d.papers, 0);
  const totalRepeated = index.reduce((n, d) => n + d.groups.reduce((m, g) => m + g.repeated, 0), 0);

  return <>
    <section className="panel">
      <div className="qb-stats"><div><strong>{totalPapers}</strong><span>past papers</span></div><div><strong>{index.length}</strong><span>subjects</span></div><div><strong>{totalRepeated}</strong><span>repeated questions found</span></div></div>
      <div className="two-col section-gap">
        <div><label htmlFor="qb-subject">Subject</label><select id="qb-subject" value={deptId} onChange={e => { setDeptId(e.target.value); setSemester("all"); setGroupId(""); }}>{index.map(d => <option key={d.dept} value={d.dept}>{d.name} ({d.papers} papers)</option>)}</select></div>
        <div><label htmlFor="qb-semester">Semester</label><select id="qb-semester" value={semester} onChange={e => { setSemester(e.target.value === "all" ? "all" : Number(e.target.value)); setGroupId(""); }}><option value="all">All semesters</option>{semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}</select></div>
      </div>
      <div className="row section-gap">
        <button className="btn" disabled={!dept || dept.dept !== deptId} onClick={() => dept && download(`${dept.dept}-${semester === "all" ? "all" : `sem-${semester}`}-probable-questions.txt`, probableText(dept, semester))}>Download probable questions{semester === "all" ? "" : ` · Semester ${semester}`}</button>
        <button className="btn secondary" disabled={!dept || dept.dept !== deptId} onClick={() => dept && download(`${dept.dept}-${semester === "all" ? "all" : `sem-${semester}`}-guess-paper-${NEXT_EXAM.replace("–", "-")}.txt`, guessText(dept, semester))}>Download guess papers {NEXT_EXAM}{semester === "all" ? "" : ` · Semester ${semester}`}</button>
      </div>
      <p className="small muted">“Probable questions” already came in two or more past exams. The “guess paper” is our own prediction for the next exam ({NEXT_EXAM}), unit by unit.{accuracy ? ` When we tested the method on ${accuracy.tests} past papers (guessing each paper's latest exam from the earlier ones), ${Math.round(accuracy.top5 * 100)}% of our top-5 guesses actually came, against ${Math.round(accuracy.random * 100)}% for a random past question.` : ""} Use it to decide what to revise first, not instead of the syllabus.</p>
    </section>

    <section className="section-gap" aria-label="Papers">
      {!dept || dept.dept !== deptId ? <p className="notice" role="status">Loading {summary?.name ?? "subject"}…</p> :
        groups.length === 0 ? <p className="notice">No papers for this semester yet.</p> :
          <div className="grid-cards">{groups.map(g => <button key={g.id} className={`lab-card qb-card${g.id === groupId ? " is-active" : ""}`} aria-pressed={g.id === groupId} onClick={() => { setGroupId(g.id); setView(g.forecast?.top.length ? "guess" : g.repeated.some(r => r.kind === "written") ? "repeated" : "papers"); setExamIndex(g.papers.length - 1); setTimeout(() => document.getElementById("qb-detail")?.scrollIntoView({ block: "start", behavior: "smooth" }), 50); }}>
            <div className="card-top"><span>SEMESTER {g.semesters.join(" / ") || "—"}</span><span>{g.papers.length} PAPER{g.papers.length === 1 ? "" : "S"}</span></div>
            <h2>{g.title}</h2>
            <p className="small muted">{g.exams.map(label).join(" · ")}</p>
            <div className="row between card-link"><span>{g.repeated.filter(r => r.kind === "written").length ? `${g.repeated.filter(r => r.kind === "written").length} repeated questions` : "Full paper only"}</span><span aria-hidden="true">→</span></div>
          </button>)}</div>}
    </section>

    {group && paper && <section className="panel section-gap" id="qb-detail" aria-label={group.title}>
      <p className="eyebrow">{dept?.name} · Semester {group.semesters.join(" / ")}</p><h2>{group.title}</h2>
      <p className="small muted">Papers in the bank: {group.exams.map(label).join(", ")}</p>
      {group.papers.some(p => p.pdf) && <div className="row qb-pdfs" aria-label="Download original papers"><span className="small muted">Original papers (PDF):</span>{group.papers.map((p, i) => p.pdf && <a key={i} className="tag" href={p.pdf} download target="_blank" rel="noreferrer">⬇ {label(p.exam)}{p.sem ? ` · Sem ${p.sem}` : ""}</a>)}</div>}
      <div className="row section-gap" role="tablist" aria-label="View">
        {group.forecast && group.forecast.top.length > 0 && <button role="tab" aria-selected={view === "guess"} className={`btn ${view === "guess" ? "" : "secondary"}`} onClick={() => setView("guess")}>Guess paper {NEXT_EXAM}</button>}
        <button role="tab" aria-selected={view === "repeated"} className={`btn ${view === "repeated" ? "" : "secondary"}`} onClick={() => setView("repeated")}>Repeated questions &amp; topics ({group.repeated.filter(r => r.kind === "written").length})</button>
        <button role="tab" aria-selected={view === "papers"} className={`btn ${view === "papers" ? "" : "secondary"}`} onClick={() => setView("papers")}>Full papers ({group.papers.length})</button>
      </div>

      {view === "guess" && group.forecast && <div className="section-gap">
        <p className="notice">Our guess for the next {group.title} exam ({NEXT_EXAM}), based on {group.papers.length} past paper{group.papers.length === 1 ? "" : "s"} ({group.exams.map(label).join(", ")}). Questions asked most often, especially as long answers, rank highest.{group.papers.length < 2 ? " Only one past paper is available, so treat these as weak guesses." : ""}</p>
        <h3 className="section-gap">Most likely questions</h3>
        {accuracy?.levels && <p className="small muted">How far to trust each label, from testing on past exams: High chance (a long answer asked 3+ times) — {inTen(accuracy.levels.high)}; Good chance (a long answer asked twice) — {inTen(accuracy.levels.medium)}; Possible — {inTen(accuracy.levels.low)}.</p>}
        <ol className="qb-list">{group.forecast.top.map((q, i) => <li key={i} className="qb-question"><div className="row between"><span className={`tag qb-${q.level}`}>{LEVELS[q.level]}</span><span className="small muted">{q.long ? "Long answer" : "Short answer"}{q.u ? ` · Unit ${q.u}` : ""}</span></div><p>{q.t}</p><p className="small muted">{asked(q)}</p></li>)}</ol>
        <h3 className="section-gap">Unit-by-unit guess paper</h3>
        <p className="small muted">MZU papers usually give one question per unit with an OR choice, so we list two long and two short guesses for each unit.</p>
        {group.forecast.units.filter(u => u.long.length || u.short.length).map((u, i) => <div key={i} className="qb-section"><p className="eyebrow">{u.unit ? `Unit ${u.unit}` : "All units"}</p><ul className="qb-list qb-guess">
          {u.long.map((q, j) => <li key={`l${j}`} className="qb-question"><div className="row between"><span className="small"><strong>Long answer</strong></span><span className={`tag qb-${q.level}`}>{LEVELS[q.level]}</span></div><p>{q.t}</p><p className="small muted">{asked(q)}</p></li>)}
          {u.short.map((q, j) => <li key={`s${j}`} className="qb-question"><div className="row between"><span className="small"><strong>Short answer</strong></span><span className={`tag qb-${q.level}`}>{LEVELS[q.level]}</span></div><p>{q.t}</p><p className="small muted">{asked(q)}</p></li>)}
        </ul></div>)}
        <div className="row section-gap"><button className="btn" onClick={() => dept && download(`${group.title.replace(/[^a-z0-9]+/gi, "-")}-guess-paper-${NEXT_EXAM.replace("–", "-")}.txt`, guessText(dept, semester, group))}>Download this guess paper (.txt)</button></div>
      </div>}

      {view === "repeated" && <div className="section-gap">
        {group.repeated.length === 0 ? <p className="notice">No question has repeated yet — only one exam of this paper is in the bank so far, or the papers differ. Open “Full papers” to study it.</p> : <>
          <ol className="qb-list">{group.repeated.filter(r => showObjective || r.kind === "written").map(r => <li key={r.id} className="qb-question">
            <div className="row between"><span className={`tag${r.times >= 3 ? " hot" : ""}`}>Asked {r.times}× · {r.exams.map(label).join(", ")}</span><span className="small muted">{r.kind === "objective" ? "Objective" : r.sections.includes("C") ? "Long answer" : "Short answer"}{r.unit ? ` · Unit ${r.unit}` : ""}</span></div>
            <p>{r.text}</p>
            {r.variants.length > 0 && <details><summary className="small">Other wordings used</summary><ul className="small muted">{r.variants.map(v => <li key={v}>{v}</li>)}</ul></details>}
          </li>)}</ol>
          {group.repeated.some(r => r.kind === "objective") && <label className="check-row section-gap"><input type="checkbox" checked={showObjective} onChange={e => setShowObjective(e.target.checked)} />Also show repeated objective (multiple-choice) questions</label>}
        </>}
      </div>}

      {view === "papers" && <div className="section-gap">
        <div className="two-col"><div><label htmlFor="qb-exam">Exam</label><select id="qb-exam" value={Math.min(examIndex, group.papers.length - 1)} onChange={e => setExamIndex(Number(e.target.value))}>{group.papers.map((p, i) => <option key={i} value={i}>{label(p.exam)}{p.sem ? ` · Semester ${p.sem}` : ""}{p.code ? ` · ${p.code}` : ""}</option>)}</select></div>
          <div className="row qb-actions">{paper.pdf && <a className="btn" href={paper.pdf} download target="_blank" rel="noreferrer">Download original paper (PDF)</a>}<button className="btn secondary" onClick={() => download(`${group.title.replace(/[^a-z0-9]+/gi, "-")}-${paper.exam.replace(/\s+/g, "-")}.txt`, paperText(group, paper))}>Download questions (.txt)</button></div></div>
        {(["A", "B", "C"] as const).map(s => {
          const qs = paper.questions.filter(q => q.s === s);
          if (!qs.length) return null;
          return <div key={s} className="qb-section"><h3>{SECTION_NAMES[s]}</h3><ol className="qb-list">{qs.map((q, i) => {
            const rep = q.c ? repeatedIds.get(q.c) : undefined;
            const showUnit = q.u && (i === 0 || qs[i - 1].u !== q.u);
            return <li key={i} className="qb-question" value={q.n}>
              {showUnit && <p className="eyebrow">Unit {q.u}</p>}
              <p>{q.t}</p>
              {q.o.length > 0 && <ol type="a" className="small muted qb-options">{q.o.map((o, j) => <li key={j}>{o}</li>)}</ol>}
              {rep && <span className="tag">Repeated · {rep.exams.map(label).join(", ")}</span>}
            </li>;
          })}</ol></div>;
        })}
        <p className="small muted">Text was read automatically from the original paper{paper.year >= 2025 ? " (scanned copies were read with OCR)" : ""}. If a word looks wrong, check the printed paper.</p>
      </div>}
    </section>}
  </>;
}
