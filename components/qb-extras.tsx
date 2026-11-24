"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { matchNote, mockTest, questionKey, type NoteEntry } from "@/lib/qbank-tools";
import { emptyList, isStringList, useSaved } from "@/lib/storage";

/** Note topics for “Related note” links, loaded once when first needed. */
let entriesPromise: Promise<NoteEntry[]> | null = null;
export function useNoteEntries() {
  const [entries, setEntries] = useState<NoteEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    entriesPromise ??= import("@/components/notes-search").then(m => m.loadIndex() as Promise<NoteEntry[]>).catch(() => { entriesPromise = null; return []; });
    void entriesPromise.then(e => { if (live) setEntries(e); });
    return () => { live = false; };
  }, []);
  return entries;
}
export function usePrepared() {
  const saved = useSaved("qb-prepared", emptyList, isStringList);
  const toggle = (key: string, on?: boolean) => {
    const has = saved.value.includes(key), want = on ?? !has;
    if (want !== has) saved.setValue(want ? [...saved.value, key].slice(-3000) : saved.value.filter(k => k !== key));
  };
  return { list: saved.value, toggle };
}

function RelatedNote({ text, dept, entries }: { text: string; dept: string; entries: NoteEntry[] | null }) {
  const e = entries ? matchNote(text, entries, dept) : null;
  return e ? <Link className="qb-note-link small" href={`/notes/${e.g}#${e.g}-${e.s}`}>📖 Related note: {e.t}</Link> : null;
}
/** Under each question: “I can answer this” and a link to the closest topic in the prepared notes. */
export function QuestionTools({ groupId, text, dept, entries, prepared }: { groupId: string; text: string; dept: string; entries: NoteEntry[] | null; prepared: ReturnType<typeof usePrepared> }) {
  const key = questionKey(groupId, text), on = prepared.list.includes(key);
  return <div className="row qb-tools">
    <button type="button" className={`qb-ready${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => prepared.toggle(key)}>{on ? "✓ I can answer this" : "○ I can answer this"}</button>
    <RelatedNote text={text} dept={dept} entries={entries} />
  </div>;
}
export function preparedCount(groupId: string, texts: string[], list: string[]) {
  const unique = [...new Set(texts)];
  return { done: unique.filter(t => list.includes(questionKey(groupId, t))).length, total: unique.length };
}

type PoolItem = { t: string; long: boolean; times: number; u?: string | null };
type Mark = "got" | "partly" | "missed";
/** A timed practice test. Students outline answers, then mark themselves; “Got it” also marks the question as prepared. */
export function PracticeTest({ groupId, title, dept, pool, entries, prepared }: { groupId: string; title: string; dept: string; pool: PoolItem[]; entries: NoteEntry[] | null; prepared: ReturnType<typeof usePrepared> }) {
  const [minutes, setMinutes] = useState(45), [longCount, setLongCount] = useState(2);
  const [test, setTest] = useState<PoolItem[] | null>(null), [answers, setAnswers] = useState<Record<number, string>>({}), [endsAt, setEndsAt] = useState(0), [now, setNow] = useState(0), [finished, setFinished] = useState(false), [marks, setMarks] = useState<Record<number, Mark>>({});
  const left = Math.max(0, endsAt - now), running = !!test && !finished;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => { const n = Date.now(); setNow(n); if (n >= endsAt) setFinished(true); }, 500);
    return () => clearInterval(t);
  }, [running, endsAt]);
  const longs = pool.filter(q => q.long).length, shorts = pool.filter(q => !q.long).length;
  function start() { const n = Date.now(); setTest(mockTest(pool, longCount, 3)); setAnswers({}); setMarks({}); setFinished(false); setNow(n); setEndsAt(n + minutes * 60_000); }
  function mark(i: number, m: Mark) { setMarks({ ...marks, [i]: m }); if (test) prepared.toggle(questionKey(groupId, test[i].t), m === "got"); }
  if (!test) return <div className="section-gap qb-practice">
    <p className="notice">Practise like the real exam: write an outline for each question before the timer runs out, then check yourself against the notes. Questions are drawn from this paper’s guess paper and past questions, most-asked first, with a little variety each time.</p>
    {pool.length < 2 ? <p className="muted">There are not enough questions for {title} yet. Use “Full papers” instead.</p> : <div className="row qb-practice-setup">
      <label>Time<select value={minutes} onChange={e => setMinutes(Number(e.target.value))}><option value={20}>20 minutes</option><option value={45}>45 minutes</option><option value={90}>90 minutes</option></select></label>
      <label>Long questions<select value={longCount} onChange={e => setLongCount(Number(e.target.value))}>{[1, 2, 3].filter(n => n <= Math.max(1, longs)).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <span className="small muted">+ up to {Math.min(3, shorts)} short questions</span>
      <button className="btn" onClick={start}>Start practice test</button>
    </div>}
  </div>;
  const score = Object.values(marks).reduce((n, m) => n + (m === "got" ? 1 : m === "partly" ? .5 : 0), 0);
  return <div className="section-gap qb-practice">
    <div className={`qb-timer${running && left < 5 * 60_000 ? " is-low" : ""}`} role="timer"><strong>{finished ? "Time’s up" : `${Math.floor(left / 60_000)}:${String(Math.floor(left / 1000) % 60).padStart(2, "0")}`}</strong><span>{title} · practice test</span>{running ? <button className="btn secondary" onClick={() => setFinished(true)}>I’m done</button> : <button className="btn secondary" onClick={() => setTest(null)}>New test</button>}</div>
    <ol className="qb-list">{test.map((q, i) => <li key={i} className="qb-question">
      <div className="row between"><strong className="small">{q.long ? "Long answer" : "Short answer"}{q.u ? ` · Unit ${q.u}` : ""}</strong>{q.times > 1 && <span className="tag">asked {q.times}×</span>}</div>
      <p>{q.t}</p>
      <textarea rows={q.long ? 6 : 3} disabled={finished} value={answers[i] ?? ""} onChange={e => setAnswers({ ...answers, [i]: e.target.value })} placeholder={q.long ? "Outline: introduction → 3–5 main points with examples → conclusion" : "Two or three key points"} aria-label={`Your answer outline for question ${i + 1}`} />
      {finished && <div className="qb-selfmark"><span className="small">How did you do?</span>{(["got", "partly", "missed"] as const).map(m => <button key={m} className={`btn ${marks[i] === m ? "" : "secondary"}`} aria-pressed={marks[i] === m} onClick={() => mark(i, m)}>{m === "got" ? "Got it" : m === "partly" ? "Partly" : "Missed it"}</button>)}<RelatedNote text={q.t} dept={dept} entries={entries} /></div>}
    </li>)}</ol>
    {finished && <p className="notice" role="status">{Object.keys(marks).length < test.length ? "Compare each outline with the related note, then mark yourself honestly." : `Self-marked score: ${score} / ${test.length}. Questions you got are now ticked as prepared; revise the others in the notes and try another test tomorrow.`}</p>}
  </div>;
}

type SearchQuestion = { t: string };
type SearchGroup = { id: string; title: string; papers: { exam: string; questions: (SearchQuestion & { s: string })[] }[] };
/** Find a word or phrase in every past question of the subject. */
export function SubjectSearch({ groups, subject, onOpen }: { groups: SearchGroup[]; subject: string; onOpen: (groupId: string) => void }) {
  const [q, setQ] = useState("");
  const words = q.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const hits: { group: SearchGroup; text: string; exams: string[]; section: string }[] = [];
  if (words.length) {
    const seen = new Map<string, (typeof hits)[number]>();
    for (const g of groups) for (const p of g.papers) for (const question of p.questions) {
      const lower = question.t.toLowerCase(); if (!words.every(w => lower.includes(w))) continue;
      const key = `${g.id}|${lower.replace(/[^a-z0-9]/g, "")}`, found = seen.get(key);
      if (found) { if (!found.exams.includes(p.exam)) found.exams.push(p.exam); continue; }
      const hit = { group: g, text: question.t, exams: [p.exam], section: question.s }; seen.set(key, hit); hits.push(hit);
    }
    hits.sort((a, b) => b.exams.length - a.exams.length);
  }
  return <div className="section-gap qb-search">
    <label htmlFor="qb-subject-search">Search every past question in {subject}</label>
    <input id="qb-subject-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="For example: federalism, Gandhi, inflation" />
    {words.length > 0 && <p className="small muted" role="status">{hits.length ? `${hits.length} question${hits.length === 1 ? "" : "s"} found${hits.length > 25 ? ", showing the 25 asked most" : ""}.` : "No past question uses those words. Try a shorter word."}</p>}
    {hits.length > 0 && <ul className="qb-search-hits">{hits.slice(0, 25).map((h, i) => <li key={i}><button type="button" onClick={() => onOpen(h.group.id)}><span className="small muted">{h.group.title} · {h.section === "C" ? "Long" : h.section === "B" ? "Short" : "Objective"} · {h.exams.join(", ")}</span><span>{h.text}</span></button></li>)}</ul>}
  </div>;
}
