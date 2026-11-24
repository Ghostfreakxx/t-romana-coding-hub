"use client";

import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { extraPages, labs } from "@/data/site";
import { noteResources } from "@/data/notes";

type Item = { kind: string; title: string; detail: string; href: string; text: string };
type NoteEntry = { g: string; s: string; t: string; c: string; k: string; x: string };
type QbSubject = { dept: string; name: string; groups: { id: string; title: string; semesters: number[]; repeated: number }[] };

const kinds = ["Pages", "Lessons", "Courses", "Question bank", "Guides", "Note topics"];
const limits: Record<string, number> = { Pages: 4, Lessons: 4, Courses: 6, "Question bank": 5, Guides: 4, "Note topics": 8 };

const pageItems: Item[] = [
  ...labs.map(l => ({ kind: "Pages", title: l.title, detail: l.desc, href: l.href, text: `${l.title} ${l.desc} ${l.keywords}` })),
  ...extraPages.map(p => ({ kind: "Pages", title: p.title, detail: p.desc, href: p.href, text: `${p.title} ${p.desc} ${p.keywords}` })),
  ...noteResources.map(n => ({ kind: "Guides", title: n.label, detail: `${n.semesters} · TRC study guide`, href: `/notes/${n.id}`, text: `${n.label} ${n.semesters} notes guide` })),
];

let extraPromise: Promise<Item[]> | null = null;
/** Course, lesson and question-bank items are loaded on first search so they stay out of every page's bundle. */
function loadExtra() {
  extraPromise ??= Promise.all([
    import("@/data/courses"),
    import("@/data/lessons"),
    fetch("/question-bank/index.json").then(r => r.ok ? r.json() as Promise<{ subjects: QbSubject[] }> : { subjects: [] }).catch(() => ({ subjects: [] as QbSubject[] })),
  ]).then(([{ departments }, { tracks }, qb]) => [
    ...Object.entries(tracks).flatMap(([id, track]) => track.lessons.map(l => ({ kind: "Lessons", title: l.title, detail: `${id[0].toUpperCase()}${id.slice(1)} lab · ${l.minutes} min`, href: `/${id}`, text: `${l.title} ${id} ${l.paragraphs.join(" ")}` }))),
    ...departments.flatMap(d => d.semesters.flatMap(s => s.courses.map(c => ({ kind: "Courses", title: c.title, detail: `${d.name} · Semester ${s.semester} · ${c.code}`, href: `/college#${d.id}-s${s.semester}`, text: `${c.title} ${c.code} ${d.name} semester ${s.semester}` })))),
    ...qb.subjects.flatMap(s => s.groups.map(g => ({ kind: "Question bank", title: g.title, detail: `${s.name} · Semester ${g.semesters.join(", ")}${g.repeated ? ` · ${g.repeated} repeated` : ""}`, href: `/questions#${g.id}`, text: `${g.title} ${s.name} past papers questions exam` }))),
  ]).catch(() => { extraPromise = null; return []; });
  return extraPromise;
}
let notesPromise: Promise<Item[]> | null = null;
function loadNoteTopics() {
  const labels = Object.fromEntries(noteResources.map(n => [n.id, n.label]));
  notesPromise ??= import("@/components/notes-search").then(m => m.loadIndex()).then((entries: NoteEntry[]) =>
    entries.filter(e => e.k !== "general").map(e => ({ kind: "Note topics", title: e.t, detail: `${labels[e.g] ?? e.g}${e.c ? ` · ${e.c.split(" · ")[1] ?? ""}` : ""}`, href: `/notes/${e.g}#${e.g}-${e.s}`, text: `${e.t} ${e.c} ${e.x}` })),
  ).catch(() => { notesPromise = null; return []; });
  return notesPromise;
}

function rank(items: Item[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: { item: Item; score: number }[] = [];
  for (const item of items) {
    const title = item.title.toLowerCase();
    const hay = `${title} ${item.text.toLowerCase()}`;
    if (!words.every(w => hay.includes(w))) continue;
    const q = words.join(" ");
    const score = (title === q ? 100 : 0) + (title.startsWith(q) ? 40 : 0) + (title.includes(q) ? 20 : 0) + words.filter(w => title.includes(w)).length * 5 - title.length / 100;
    scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).map(s => s.item);
}

export default function SiteSearch() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [extra, setExtra] = useState<Item[]>([]);
  const [topics, setTopics] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const deferred = useDeferredValue(query.trim());

  const open = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    d.showModal();
    input.current?.select();
    setLoading(true);
    void Promise.all([loadExtra().then(setExtra), loadNoteTopics().then(setTopics)]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || !!target.closest(".cm-editor"));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open(); }
      else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const groups = useMemo(() => {
    if (deferred.length < 2) return [];
    const all = rank([...pageItems, ...extra, ...(deferred.length >= 3 ? topics : [])], deferred);
    return kinds.map(kind => ({ kind, items: all.filter(i => i.kind === kind).slice(0, limits[kind]) })).filter(g => g.items.length);
  }, [deferred, extra, topics]);
  const flat = groups.flatMap(g => g.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  function go(item: Item) {
    dialog.current?.close();
    setQuery("");
    router.push(item.href);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((current + 1) % Math.max(flat.length, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((current - 1 + flat.length) % Math.max(flat.length, 1)); }
    else if (e.key === "Enter" && flat[current]) { e.preventDefault(); go(flat[current]); }
  }

  useEffect(() => {
    document.getElementById(`${listId}-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current, listId]);

  let index = -1;
  return <>
    <button type="button" className="search-trigger" onClick={open} aria-haspopup="dialog" aria-keyshortcuts="Control+K /">
      <span aria-hidden="true">⌕</span> Search<kbd aria-hidden="true">Ctrl K</kbd>
    </button>
    <dialog ref={dialog} className="search-dialog" aria-label="Search the hub" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
      <div className="search-box">
        <div className="search-field">
          <span aria-hidden="true">⌕</span>
          <input ref={input} type="text" inputMode="search" enterKeyHint="go" spellCheck={false} value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey}
            placeholder="Search labs, courses, notes and past papers…" aria-label="Search" role="combobox" aria-expanded={flat.length > 0}
            aria-controls={listId} aria-activedescendant={flat.length ? `${listId}-${current}` : undefined} autoComplete="off" />
          <button type="button" className="search-close" onClick={() => dialog.current?.close()}>Esc</button>
        </div>
        <div className="search-body" id={listId} role="listbox" aria-label="Results">
          {deferred.length < 2
            ? <div className="search-empty">
                <p className="muted small">Try “federalism”, “sociology semester 3”, “guitar” or “macroeconomics”.</p>
                <div className="search-quick">{labs.map(l => <button type="button" key={l.href} className="tag" onClick={() => go({ kind: "Pages", title: l.title, detail: "", href: l.href, text: "" })}>{l.title}</button>)}</div>
              </div>
            : groups.length === 0
              ? <p className="search-empty muted">{loading ? "Loading everything we can search…" : `Nothing matches “${deferred}”. Try fewer or different words.`}</p>
              : groups.map(g => <div key={g.kind} role="group" aria-label={g.kind} className="search-group">
                  <p className="eyebrow">{g.kind}</p>
                  {g.items.map(item => { index++; const i = index; return <div key={`${item.href}-${item.title}`} id={`${listId}-${i}`} role="option" aria-selected={i === current}
                    className="search-option" onMouseMove={() => { if (i !== current) setActive(i); }} onClick={() => go(item)}>
                    <strong>{item.title}</strong><span className="small muted">{item.detail}</span>
                  </div>; })}
                </div>)}
          {deferred.length >= 2 && deferred.length < 3 && <p className="small muted search-hint">Type at least three letters to search inside the notes.</p>}
        </div>
        <p className="search-footer small muted"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></p>
      </div>
    </dialog>
  </>;
}
