"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NoteResource } from "@/data/notes";
import { emptyList, emptyRecord, isStringList, isStringRecord, useSaved } from "@/lib/storage";

type Block = { type: "paragraph"; text: string } | { type: "table"; rows: string[][] };
type Section = { id: string; title: string; context: string[]; kind: string; blocks: Block[] };
type Guide = { id: string; sections: Section[] };

const SIZES = ["15", "16", "18", "20"];

function sectionText(section: Section) {
  return [section.title, ...section.context, ...section.blocks.map(block => block.type === "paragraph" ? block.text : block.rows.flat().join(" "))].join(" ");
}

/** Sections that count towards revision progress: the study notes themselves, not headings or the cover. */
export function isStudySection(section: { id: string; kind: string; blocks: unknown[] }) {
  return section.id !== "section-0" && section.blocks.length > 0 && (section.kind === "short" || section.kind === "long");
}

/** Keep the three most recently opened guides, newest first, for "Continue reading". */
export function rememberGuide(list: string[], id: string) {
  return [id, ...list.filter(item => item !== id)].slice(0, 3);
}

function ReaderContent({ resource }: { resource: NoteResource }) {
  const fieldId = useId();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [attempt, setAttempt] = useState(0);
  const [recall, setRecall] = useState(false);
  const [shown, setShown] = useState<string[]>([]);
  const revised = useSaved("revised", emptyList, isStringList);
  const lastRead = useSaved("lastRead", emptyRecord, isStringRecord);
  const recent = useSaved("recentGuides", emptyList, isStringList);
  const prefs = useSaved("readerPrefs", emptyRecord, isStringRecord);
  const size = SIZES.includes(prefs.value.size) ? prefs.value.size : "16";
  const areaRef = useRef<HTMLDivElement>(null);
  const lastWritten = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/notes/read/${resource.id}.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("The guide could not be loaded."); return response.json(); })
      .then((data: Guide) => {
        if (data.id !== resource.id || !Array.isArray(data.sections)) throw new Error("The guide could not be loaded.");
        setGuide(data);
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "The guide could not be loaded."); });
    return () => controller.abort();
  }, [resource.id, attempt]);

  // Remember this guide as recently opened (for the home page and Notes library).
  const recentValue = recent.value, setRecent = recent.setValue;
  useEffect(() => {
    if (guide && recentValue[0] !== resource.id) setRecent(rememberGuide(recentValue, resource.id));
  }, [guide, resource.id, recentValue, setRecent]);

  // Open a linked topic (#guide-section) once the notes have loaded, e.g. from the all-guides search.
  useEffect(() => {
    if (!guide) return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash.startsWith(`${resource.id}-section-`)) return;
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
  }, [guide, resource.id]);

  // Track the topmost visible section so the student can continue where they stopped.
  const lastReadValue = lastRead.value, setLastRead = lastRead.setValue;
  useEffect(() => {
    const area = areaRef.current;
    if (!guide || !area || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      const sectionId = visible?.target.getAttribute("data-section");
      if (!sectionId || sectionId === "section-0") return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (lastWritten.current === sectionId || lastReadValue[resource.id] === sectionId) return;
        lastWritten.current = sectionId;
        setLastRead({ ...lastReadValue, [resource.id]: sectionId });
      }, 1200);
    }, { rootMargin: "0px 0px -70% 0px" });
    area.querySelectorAll("[data-section]").forEach(node => observer.observe(node));
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [guide, resource.id, lastReadValue, setLastRead, query, kind]);

  const study = useMemo(() => guide?.sections.filter(isStudySection) ?? [], [guide]);
  const revisedHere = useMemo(() => new Set(revised.value.filter(key => key.startsWith(`${resource.id}:`)).map(key => key.slice(resource.id.length + 1))), [revised.value, resource.id]);

  if (error) return <div role="alert" className="notice error section-gap"><p>{error} Check your connection and try again, or download the guide.</p><button className="btn secondary" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Try loading again</button></div>;
  if (!guide) return <p role="status" className="notice section-gap">Loading your study notes…</p>;

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const sections = guide.sections.filter(section => {
    if (kind === "todo") { if (!isStudySection(section) || revisedHere.has(section.id)) return false; }
    else if (kind !== "all" && section.kind !== kind) return false;
    const text = sectionText(section).toLowerCase();
    return words.every(word => text.includes(word));
  });
  const doneCount = study.filter(section => revisedHere.has(section.id)).length;
  const resume = guide.sections.find(section => section.id === lastRead.value[resource.id]);

  function toggleRevised(sectionId: string) {
    const key = `${resource.id}:${sectionId}`;
    revised.setValue(revised.value.includes(key) ? revised.value.filter(item => item !== key) : [...revised.value, key]);
  }
  function jump(sectionId: string) {
    setQuery(""); setKind("all");
    requestAnimationFrame(() => document.getElementById(`${resource.id}-${sectionId}`)?.scrollIntoView({ block: "start" }));
  }

  return <div className="section-gap">
    {study.length > 0 && <div className="reader-progress no-print">
      <div className="row between"><strong>{doneCount} of {study.length} topics revised</strong><span className="small muted">{Math.round(doneCount / study.length * 100)}%</span></div>
      <progress max={study.length} value={doneCount} aria-label={`Revision progress for ${resource.label}`} />
      {resume && resume.id !== "section-0" && <button className="btn secondary section-gap" onClick={() => jump(resume.id)}>Continue where you stopped: {resume.title} ↓</button>}
    </div>}
    <div className="two-col no-print section-gap">
      <div><label htmlFor={`${fieldId}-search`}>Search inside this guide</label><input id={`${fieldId}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Topic, paper code or keyword" /></div>
      <div><label htmlFor={`${fieldId}-kind`}>Notes to show</label><select id={`${fieldId}-kind`} value={kind} onChange={event => setKind(event.target.value)}><option value="all">All notes</option><option value="short">Short notes</option><option value="long">Long notes</option><option value="todo">Not yet revised</option></select></div>
    </div>
    <div className="row reader-tools no-print">
      <label className="check-row"><input type="checkbox" checked={recall} onChange={event => { setRecall(event.target.checked); setShown([]); }} />Recall mode: hide the notes and test yourself first</label>
      <div className="row" role="group" aria-label="Text size">
        <button className="btn secondary" disabled={size === SIZES[0]} onClick={() => prefs.setValue({ ...prefs.value, size: SIZES[Math.max(0, SIZES.indexOf(size) - 1)] })} aria-label="Smaller text">A−</button>
        <button className="btn secondary" disabled={size === SIZES[SIZES.length - 1]} onClick={() => prefs.setValue({ ...prefs.value, size: SIZES[Math.min(SIZES.length - 1, SIZES.indexOf(size) + 1)] })} aria-label="Larger text">A+</button>
      </div>
    </div>
    <p className="small muted" role="status">{sections.length} sections in {resource.label}</p>
    {sections.length > 0 && <details className="no-print"><summary>Jump to a topic</summary><div className="reader-contents">{sections.map(section => <a key={section.id} href={`#${resource.id}-${section.id}`}>{revisedHere.has(section.id) ? "✓ " : ""}{section.title}</a>)}</div></details>}
    {sections.length === 0 && <p className="notice">{kind === "todo" && !words.length ? "Every topic in this guide is marked as revised. Well done." : "No matching notes. Try a different keyword or choose All notes."}</p>}
    <div ref={areaRef} className="note-reading-area" style={{ ["--note-size" as string]: `${size}px` }} role="region" aria-label={`${resource.label} reading area`}>{sections.map(section => {
      const hidden = recall && isStudySection(section) && !shown.includes(section.id);
      const isRevised = revisedHere.has(section.id);
      return <section className={`note-section${isRevised ? " is-revised" : ""}`} key={section.id} id={`${resource.id}-${section.id}`} data-section={section.id}>
        {section.context.length > 0 && <p className="small muted reader-context">{section.context.join(" · ")}</p>}
        <h3>{section.title}</h3>
        {hidden
          ? <div className="recall-box no-print"><p className="small muted">Say or write what you remember about this topic, then check.</p><button className="btn secondary" onClick={() => setShown([...shown, section.id])}>Show the notes</button></div>
          : section.blocks.map((block, index) => block.type === "paragraph"
            ? <p className="note-paragraph" key={index}>{block.text}</p>
            : <div className="reader-table" key={index}><table><caption className="sr-only">{section.title}</caption><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>)}
        {isStudySection(section) && <button className={`btn ${isRevised ? "" : "secondary"} revise-toggle no-print`} aria-pressed={isRevised} onClick={() => toggleRevised(section.id)}>{isRevised ? "✓ Revised" : "Mark as revised"}</button>}
      </section>;
    })}</div>
    {(revised.error || lastRead.error) && <p className="notice error" role="alert">{revised.error || lastRead.error}</p>}
  </div>;
}

export default function NoteReader({ resources }: { resources: NoteResource[] }) {
  const fieldId = useId();
  const [selected, setSelected] = useState(resources[0]?.id ?? "");
  const resource = resources.find(item => item.id === selected) ?? resources[0];
  if (!resource) return <p className="notice">No prepared guide is available for this subject yet.</p>;
  return <section className="panel section-gap" aria-label="College study notes">
    <p className="eyebrow">Read here</p><h2>Short notes &amp; long notes</h2>
    <p className="muted">For Govt. T. Romana College students. If you are not taking this subject, you do not need to study it. Check examination coverage with your teacher and the official syllabus.</p>
    {resources.length > 1 && <><label htmlFor={`${fieldId}-guide`}>Choose a study guide</label>
    <select id={`${fieldId}-guide`} value={resource.id} onChange={event => setSelected(event.target.value)}>{resources.map(item => <option key={item.id} value={item.id}>{item.label} · {item.semesters}</option>)}</select></>}
    <div className="row section-gap no-print"><a className="btn secondary" href={resource.file} download>Download this guide (.docx)</a><button className="btn secondary" onClick={() => window.print()}>Print or save as PDF</button></div>
    <ReaderContent key={resource.id} resource={resource} />
  </section>;
}
