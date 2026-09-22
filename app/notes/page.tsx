"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/shell";
import { noteResources, syllabusResources } from "@/data/notes";
import { departments } from "@/data/courses";

export default function NotesPage() {
  const [department, setDepartment] = useState("all");
  const [query, setQuery] = useState("");
  const notes = useMemo(() => noteResources.filter((note) => {
    const matchesDepartment = department === "all" || note.department === department;
    const haystack = `${note.label} ${note.semesters}`.toLowerCase();
    return matchesDepartment && haystack.includes(query.trim().toLowerCase());
  }), [department, query]);

  return <Shell eyebrow="TRC notes library" title="Your prepared study guides." intro="All the simple-English notes already prepared for Govt. T. Romana College students, organised in one place. Download a guide and keep an offline copy.">
    <section className="panel">
      <div className="two-col">
        <div><label htmlFor="notes-department">Subject</label><select id="notes-department" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All subjects</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div><label htmlFor="notes-search">Search guides</label><input id="notes-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject, batch or semester" /></div>
      </div>
      <p className="small muted" role="status">Showing {notes.length} guide{notes.length === 1 ? "" : "s"}. If you are not taking a subject, you do not need to study that section.</p>
    </section>

    <section className="grid-cards section-gap">{notes.map((note) => <a className="lab-card" href={note.file} download key={note.id}><div className="card-top"><span className="card-icon" aria-hidden="true">▧</span><span>DOCX</span></div><h2>{note.label}</h2><p>{note.semesters}</p><span className="card-link">Download guide ↗</span></a>)}</section>
    {notes.length === 0 && <section className="panel section-gap"><h2>No guide found</h2><p className="muted">Try another subject or search term.</p></section>}

    <section className="panel section-gap"><div className="row between"><div><p className="eyebrow">Reference documents</p><h2>Official syllabuses</h2></div><span className="small muted">{syllabusResources.length} PDFs</span></div><p className="muted">Use these when checking course codes, semester placement and examination coverage. Notes are study aids and do not replace the official syllabus.</p><div className="row">{syllabusResources.map((syllabus) => <a className="btn secondary" href={syllabus.file} target="_blank" rel="noreferrer" key={syllabus.department}>{syllabus.label} ↗</a>)}</div><p className="notice section-gap">An official Economics syllabus PDF was not among the supplied files. Economics notes are included from the earlier project; confirm the current Economics syllabus with the department.</p></section>
  </Shell>;
}
