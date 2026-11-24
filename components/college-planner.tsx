"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { dayKey, emptyList, emptyRecord, isStringList, isStringRecord, useSaved } from "@/lib/storage";

type Entry = { g: string; s: string; t: string; c: string; k: string };
type QbIndex = { subjects: { groups: { id: string; title: string; repeated: number }[] }[] };
export type PaperLinks = { topics: Map<string, { guide: string; sections: { id: string; title: string }[] }>; questions: Map<string, { id: string; repeated: number }> };
export type CoursePaper = { key: string; code: string; title: string; departmentName: string; semester: number };

/** “POLS 100”, “ECO/101/MD – …” and “ECO 101” all become “POLS100” / “ECO101”. */
export const paperCode = (code: string) => { const m = /([A-Z]+)\W*(\d+)/.exec(code.toUpperCase()); return m ? m[1] + m[2] : ""; };
const titleKey = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

let linksPromise: Promise<PaperLinks> | null = null;
function loadLinks() {
  linksPromise ??= Promise.all([
    import("@/components/notes-search").then(m => m.loadIndex() as Promise<Entry[]>).catch(() => [] as Entry[]),
    fetch("/question-bank/index.json").then(r => r.ok ? r.json() as Promise<QbIndex> : { subjects: [] }).catch(() => ({ subjects: [] } as QbIndex)),
  ]).then(([entries, qb]) => {
    const topics: PaperLinks["topics"] = new Map();
    for (const e of entries) {
      if (e.k !== "short" && e.k !== "long") continue;
      const code = paperCode(e.c.split(" · ")[1] ?? ""); if (!code) continue;
      const item = topics.get(code) ?? { guide: e.g, sections: [] };
      if (item.guide === e.g) item.sections.push({ id: e.s, title: e.t });
      topics.set(code, item);
    }
    const questions: PaperLinks["questions"] = new Map();
    for (const s of qb.subjects) for (const g of s.groups) if (!questions.has(titleKey(g.title))) questions.set(titleKey(g.title), { id: g.id, repeated: g.repeated });
    return { topics, questions };
  });
  return linksPromise;
}
/** Matches each paper to its note topics and its past-paper group. Loaded once, on demand. */
export function usePaperLinks() {
  const [links, setLinks] = useState<PaperLinks | null>(null);
  useEffect(() => { let live = true; void loadLinks().then(l => { if (live) setLinks(l); }); return () => { live = false; }; }, []);
  return links;
}
function paperProgress(course: CoursePaper, links: PaperLinks | null, revised: string[]) {
  const t = links?.topics.get(paperCode(course.code));
  if (!t) return null;
  const done = t.sections.filter(s => revised.includes(`${t.guide}:${s.id}`)).length;
  return { ...t, done, total: t.sections.length, next: t.sections.find(s => !revised.includes(`${t.guide}:${s.id}`)) };
}

/** Under each paper: revision progress in the matching guide, a link to the next topic, and its past questions. */
export function PaperStudyLinks({ course, links }: { course: CoursePaper; links: PaperLinks | null }) {
  const revised = useSaved("revised", emptyList, isStringList), dates = useSaved("examDates", emptyRecord, isStringRecord);
  const p = paperProgress(course, links, revised.value), q = links?.questions.get(titleKey(course.title));
  return <div className="paper-links">
    {p ? <div><div className="row between small"><span>Notes topics revised</span><strong>{p.done} / {p.total}</strong></div><progress max={p.total} value={p.done} aria-label={`${course.title} notes revised`} />
      {p.next ? <Link className="accent underline small" href={`/notes/${p.guide}#${p.guide}-${p.next.id}`}>Revise next: {p.next.title} →</Link> : <span className="small accent">Every topic revised ✓</span>}</div>
      : links && <p className="small muted">No prepared note topics are linked to this paper code yet.</p>}
    {q && <Link className="tag paper-qb" href={`/questions#${q.id}`}>Past questions{q.repeated ? ` · ${q.repeated} repeated` : ""} →</Link>}
    <label className="paper-date">Exam date<input type="date" value={dates.value[course.key] ?? ""} onChange={e => { const { [course.key]: _old, ...rest } = dates.value; void _old; dates.setValue(e.target.value ? { ...rest, [course.key]: e.target.value } : rest); }} /></label>
  </div>;
}

const noSubscribe = () => () => {};
const daysBetween = (from: string, to: string) => Math.round((Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10)) - Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10))) / 86_400_000);

/** Upcoming exams with days left and how many note topics to revise each day to finish in time. */
export function ExamPlanner({ courses, links }: { courses: CoursePaper[]; links: PaperLinks | null }) {
  const dates = useSaved("examDates", emptyRecord, isStringRecord), revised = useSaved("revised", emptyList, isStringList);
  const today = useSyncExternalStore(noSubscribe, () => dayKey(), () => "");
  if (!today) return null;
  const rows = courses.filter(c => dates.value[c.key]).map(c => ({ c, date: dates.value[c.key], days: daysBetween(today, dates.value[c.key]), p: paperProgress(c, links, revised.value) })).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = rows.filter(r => r.days >= 0), past = rows.filter(r => r.days < 0);
  return <section className="panel section-gap exam-planner" aria-labelledby="planner-heading">
    <div className="row between"><div><p className="eyebrow">Exam planner</p><h2 id="planner-heading">{upcoming.length ? `Next exam in ${upcoming[0].days === 0 ? "less than a day" : `${upcoming[0].days} day${upcoming[0].days === 1 ? "" : "s"}`}` : "Plan your exams"}</h2></div>{past.length > 0 && <button className="btn secondary" onClick={() => dates.setValue(Object.fromEntries(Object.entries(dates.value).filter(([k]) => !past.some(r => r.c.key === k))))}>Clear {past.length} past exam{past.length === 1 ? "" : "s"}</button>}</div>
    {upcoming.length === 0 ? <p className="muted">Add an exam date to any paper below (look for “Exam date”). The planner then counts down the days and works out how many note topics to revise each day.</p>
      : <div className="planner-rows">{upcoming.map(({ c, date, days, p }) => {
        const left = p ? p.total - p.done : null, perDay = left && days > 0 ? Math.ceil(left / days) : left;
        return <div className={`planner-row${days <= 7 ? " is-soon" : ""}`} key={c.key}>
          <div className="planner-days"><strong>{days}</strong><span>day{days === 1 ? "" : "s"}</span></div>
          <div><strong>{c.title}</strong><p className="small muted">{c.code} · {c.departmentName} · {new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</p></div>
          <div className="planner-plan small">{p ? left === 0 ? <span className="accent">All {p.total} topics revised ✓</span> : <><strong>{perDay} topic{perDay === 1 ? "" : "s"} a day</strong><span className="muted"> · {left} of {p.total} left</span>{p.next && <><br /><Link className="accent underline" href={`/notes/${p.guide}#${p.guide}-${p.next.id}`}>Start: {p.next.title}</Link></>}</> : <span className="muted">Use the official syllabus to plan this paper.</span>}</div>
        </div>;
      })}</div>}
  </section>;
}
