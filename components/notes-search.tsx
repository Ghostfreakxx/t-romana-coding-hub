"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { noteResources } from "@/data/notes";
import { emptyList, emptyRecord, isStringList, isStringRecord, useSaved } from "@/lib/storage";

type Entry = { g: string; s: string; t: string; c: string; k: string; x: string };
type FullText = Record<string, string>;

const labels = Object.fromEntries(noteResources.map(note => [note.id, note.label]));
let indexPromise: Promise<Entry[]> | null = null;
function loadIndex() {
  indexPromise ??= fetch("/notes/read/index.json").then(response => {
    if (!response.ok) throw new Error("Search is unavailable right now.");
    return response.json() as Promise<Entry[]>;
  }).catch(reason => { indexPromise = null; throw reason; });
  return indexPromise;
}

/** Search every TRC guide at once. Titles and opening lines are searched first; full text is optional. */
export function NotesSearch({ department }: { department: string }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");
  const [deep, setDeep] = useState(false);
  const [full, setFull] = useState<FullText | null>(null);
  const [loadingFull, setLoadingFull] = useState("");
  const words = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(word => word.length > 1), [query]);

  useEffect(() => {
    if (!words.length || index) return;
    loadIndex().then(setIndex).catch(reason => setError(reason instanceof Error ? reason.message : "Search is unavailable right now."));
  }, [words.length, index]);

  useEffect(() => {
    if (!deep || full) return;
    let cancelled = false;
    (async () => {
      const texts: FullText = {};
      let next = 0, done = 0;
      setLoadingFull(`Loading guides 0 of ${noteResources.length}…`);
      // A few guides at a time: much faster than one by one, without flooding a phone connection.
      const worker = async () => {
        while (!cancelled && next < noteResources.length) {
          const note = noteResources[next++];
          try {
            const response = await fetch(`/notes/read/${note.id}.json`);
            if (response.ok) {
              const guide = await response.json() as { sections: { id: string; blocks: { type: string; text?: string; rows?: string[][] }[] }[] };
              for (const section of guide.sections) texts[`${note.id}:${section.id}`] = section.blocks.map(block => block.text ?? block.rows?.flat().join(" ") ?? "").join(" ").toLowerCase();
            }
          } catch { /* Skip a guide that cannot load; the rest stay searchable. */ }
          if (!cancelled) setLoadingFull(`Loading guides ${++done} of ${noteResources.length}…`);
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
      if (!cancelled) { setFull(texts); setLoadingFull(""); }
    })();
    return () => { cancelled = true; };
  }, [deep, full]);

  const results = useMemo(() => {
    if (!index || !words.length) return [];
    const scored: { entry: Entry; score: number }[] = [];
    for (const entry of index) {
      if (department !== "all" && !entry.g.startsWith(`${department}-`)) continue;
      const title = entry.t.toLowerCase(), meta = `${entry.c} ${entry.x}`.toLowerCase();
      const body = deep && full ? full[`${entry.g}:${entry.s}`] ?? "" : "";
      let score = 0, matched = true;
      for (const word of words) {
        if (title.includes(word)) score += 5;
        else if (meta.includes(word)) score += 2;
        else if (body.includes(word)) score += 1;
        else { matched = false; break; }
      }
      if (matched) scored.push({ entry, score: score + (entry.k === "long" ? 0.5 : 0) });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 40).map(item => item.entry);
  }, [index, words, department, deep, full]);

  return <section className="panel section-gap" aria-label="Search all study guides">
    <p className="eyebrow">Search every guide</p><h2>Find a topic across all subjects</h2>
    <label htmlFor="all-notes-search">Topic, thinker, Act or keyword</label>
    <input id="all-notes-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. Sanskritization, Panchayati Raj, food chain" />
    <label className="check-row section-gap"><input type="checkbox" checked={deep} onChange={event => setDeep(event.target.checked)} />Also search inside the full notes text (downloads all guides, about 4 MB, once)</label>
    {loadingFull && <p className="small muted" role="status">{loadingFull}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {words.length > 0 && index && <p className="small muted" role="status">{results.length === 40 ? "Top 40 matches" : `${results.length} match${results.length === 1 ? "" : "es"}`}{department !== "all" ? " in this subject" : ""}</p>}
    {words.length > 0 && !index && !error && <p className="small muted" role="status">Loading the search index…</p>}
    <div className="search-results">{results.map(entry => <Link className="search-hit" key={`${entry.g}:${entry.s}`} href={`/notes/${entry.g}#${entry.g}-${entry.s}`}>
      <span className="small muted">{labels[entry.g] ?? entry.g}{entry.c ? ` · ${entry.c}` : ""}</span><br />
      <strong>{entry.t}</strong>{entry.x && <span className="small muted"><br />{entry.x}{entry.x.length >= 160 ? "…" : ""}</span>}
    </Link>)}</div>
  </section>;
}

/** Shows the guides a student opened most recently, with their saved revision count. */
export function ContinueReading() {
  const recent = useSaved("recentGuides", emptyList, isStringList);
  const revised = useSaved("revised", emptyList, isStringList);
  const lastRead = useSaved("lastRead", emptyRecord, isStringRecord);
  const guides = recent.value.map(id => noteResources.find(note => note.id === id)).filter(note => note !== undefined);
  if (!guides.length) return null;
  return <section className="panel section-gap" aria-label="Continue reading">
    <p className="eyebrow">Pick up where you stopped</p><h2>Continue reading</h2>
    <div className="continue-strip">{guides.map(note => {
      const count = revised.value.filter(key => key.startsWith(`${note.id}:`)).length;
      const section = lastRead.value[note.id];
      return <Link key={note.id} className="btn secondary" href={`/notes/${note.id}${section ? `#${note.id}-${section}` : ""}`}>{note.label} · {count} revised →</Link>;
    })}</div>
  </section>;
}

/** Per-guide revision progress for the My progress page. Totals come from the shared search index. */
export function GuideProgress() {
  const revised = useSaved("revised", emptyList, isStringList);
  const [totals, setTotals] = useState<Record<string, number> | null>(null);
  const opened = noteResources.filter(note => revised.value.some(key => key.startsWith(`${note.id}:`)));
  useEffect(() => {
    if (!opened.length || totals) return;
    loadIndex().then(index => {
      const counts: Record<string, number> = {};
      for (const entry of index) if (entry.k === "short" || entry.k === "long") counts[entry.g] = (counts[entry.g] ?? 0) + 1;
      setTotals(counts);
    }).catch(() => setTotals({}));
  }, [opened.length, totals]);
  return <section className="panel section-gap"><p className="eyebrow">Notes library</p><h2>Topics revised</h2>
    {opened.length === 0
      ? <p className="muted">Open a study guide and press “Mark as revised” after each topic you have learnt. Your progress for each guide will appear here.</p>
      : <div className="stack">{opened.map(note => {
        const done = revised.value.filter(key => key.startsWith(`${note.id}:`)).length, total = totals?.[note.id];
        return <div className="guide-progress" key={note.id}><div className="row between"><Link href={`/notes/${note.id}`}>{note.label}</Link><span className="small muted">{done}{total ? ` / ${total}` : ""} topics</span></div>{total ? <progress max={total} value={Math.min(done, total)} aria-label={`${note.label} revision progress`} /> : null}</div>;
      })}</div>}
    <Link href="/notes" className="btn secondary section-gap">Open the notes library →</Link>
  </section>;
}
