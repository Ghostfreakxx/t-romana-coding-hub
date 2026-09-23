"use client";

import { useEffect, useId, useState } from "react";
import type { NoteResource } from "@/data/notes";

type Block = { type: "paragraph"; text: string } | { type: "table"; rows: string[][] };
type Section = { id: string; title: string; context: string[]; kind: string; blocks: Block[] };
type Guide = { id: string; sections: Section[] };

function sectionText(section: Section) {
  return [section.title, ...section.context, ...section.blocks.map(block => block.type === "paragraph" ? block.text : block.rows.flat().join(" "))].join(" ");
}

function ReaderContent({ resource }: { resource: NoteResource }) {
  const fieldId = useId();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [attempt, setAttempt] = useState(0);

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

  if (error) return <div role="alert" className="notice error section-gap"><p>{error} Check your connection and try again, or download the guide.</p><button className="btn secondary" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Try loading again</button></div>;
  if (!guide) return <p role="status" className="notice section-gap">Loading your study notes…</p>;
  const sections = guide.sections.filter(section => (kind === "all" || section.kind === kind) && sectionText(section).toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="section-gap">
    <div className="two-col no-print">
      <div><label htmlFor={`${fieldId}-search`}>Search inside this guide</label><input id={`${fieldId}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Topic, paper code or keyword" /></div>
      <div><label htmlFor={`${fieldId}-kind`}>Notes to show</label><select id={`${fieldId}-kind`} value={kind} onChange={event => setKind(event.target.value)}><option value="all">All notes</option><option value="short">Short notes</option><option value="long">Long notes</option></select></div>
    </div>
    <p className="small muted" role="status">{sections.length} sections in {resource.label}</p>
    {sections.length > 0 && <details className="no-print"><summary>Jump to a topic</summary><div className="reader-contents">{sections.map(section => <a key={section.id} href={`#${resource.id}-${section.id}`}>{section.title}</a>)}</div></details>}
    {sections.length === 0 && <p className="notice">No matching notes. Try a different keyword or choose All notes.</p>}
    <div className="note-reading-area" role="region" aria-label={`${resource.label} reading area`} tabIndex={0}>{sections.map(section => <section className="note-section" key={section.id} id={`${resource.id}-${section.id}`}>
      {section.context.length > 0 && <p className="small muted reader-context">{section.context.join(" · ")}</p>}
      <h3>{section.title}</h3>
      {section.blocks.map((block, index) => block.type === "paragraph"
        ? <p className="note-paragraph" key={index}>{block.text}</p>
        : <div className="reader-table" key={index}><table><caption className="sr-only">{section.title}</caption><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>)}
    </section>)}</div>
  </div>;
}

export default function NoteReader({ resources }: { resources: NoteResource[] }) {
  const fieldId = useId();
  const [selected, setSelected] = useState(resources[0]?.id ?? "");
  const resource = resources.find(item => item.id === selected) ?? resources[0];
  if (!resource) return <p className="notice">No prepared guide is available for this subject yet.</p>;
  return <section className="panel section-gap" aria-label="College study notes">
    <p className="eyebrow">Read here</p><h2>Short notes &amp; long notes</h2>
    <p className="muted">For Govt. T. Romana College students. If you are not taking this subject, you do not need to study it. These are the previously prepared guides; check examination coverage with your teacher and the official syllabus.</p>
    <label htmlFor={`${fieldId}-guide`}>Choose a study guide</label>
    <select id={`${fieldId}-guide`} value={resource.id} onChange={event => setSelected(event.target.value)}>{resources.map(item => <option key={item.id} value={item.id}>{item.label} · {item.semesters}</option>)}</select>
    <div className="row section-gap no-print"><a className="btn secondary" href={resource.file} download>Download this guide (.docx)</a></div>
    <ReaderContent key={resource.id} resource={resource} />
  </section>;
}
