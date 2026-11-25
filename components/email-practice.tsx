"use client";
import { useState } from "react";
import { checkEmail, EMAIL_SCENARIOS, type EmailCheck } from "@/lib/skills-practice";
import { download } from "@/lib/storage";

const EMPTY = { to: "", subject: "", body: "", attachment: false };
/** Email rehearsal: five real situations, checks for each, then a model email to compare. Nothing is ever sent. */
export default function EmailPractice() {
  const [scenario, setScenario] = useState("assignment"), [draft, setDraft] = useState(EMPTY), [checks, setChecks] = useState<EmailCheck[] | null>(null), [showModel, setShowModel] = useState(false), [tries, setTries] = useState(0);
  const sc = EMAIL_SCENARIOS[scenario], passed = checks?.filter(c => c.ok).length ?? 0;
  const edit = (patch: Partial<typeof draft>) => { setDraft({ ...draft, ...patch }); setChecks(null); };
  const words = draft.body.trim().split(/\s+/).filter(Boolean).length;
  return <div className="email-practice">
    <div className="lesson-picker" role="group" aria-label="Email situations">{Object.entries(EMAIL_SCENARIOS).map(([id, s]) => <button key={id} type="button" aria-pressed={scenario === id} onClick={() => { setScenario(id); setDraft(EMPTY); setChecks(null); setShowModel(false); setTries(0); }}>{s.title}</button>)}</div>
    <div className="two-col">
      <div className="email-brief"><p className="eyebrow">Your task</p><h3>{sc.title}</h3><p>{sc.brief}</p><p className="small muted">Send to: <code>{sc.to}</code> (example address)</p>
        <p className="notice small">Practice only: nothing is sent. Use a made-up name and never type real passwords or ID numbers.</p>
        <details><summary>Email basics</summary><ul className="small"><li>Subject: what the email is about, in a few words.</li><li>Greeting: “Dear Sir / Ma’am / Dr. …,”.</li><li>First line: why you are writing.</li><li>Then the details the reader needs (dates, numbers, what is attached).</li><li>Say what you want them to do.</li><li>Close politely and sign with your name (and class or phone if useful).</li></ul></details></div>
      <div className="email-composer">
        <label>To<input value={draft.to} onChange={e => edit({ to: e.target.value })} placeholder={sc.to} inputMode="email" autoComplete="off" /></label>
        <label>Subject<input maxLength={160} value={draft.subject} onChange={e => edit({ subject: e.target.value })} /></label>
        <label>Message <span className="small muted">· {words} word{words === 1 ? "" : "s"}</span><textarea rows={10} maxLength={3000} value={draft.body} onChange={e => edit({ body: e.target.value })} placeholder={"Dear …,\n\n"} /></label>
        <label className="check-row"><input type="checkbox" checked={draft.attachment} onChange={e => edit({ attachment: e.target.checked })} /> 📎 Attach a file (simulated, nothing is uploaded)</label>
        <div className="row"><button className="btn" onClick={() => { setChecks(checkEmail(scenario, draft)); setTries(t => t + 1); }}>Review my draft</button><button className="btn secondary" disabled={tries === 0} onClick={() => setShowModel(!showModel)}>{showModel ? "Hide the example" : "Compare with an example"}</button><button className="btn secondary" onClick={() => download("practice-email.txt", `PRACTICE DRAFT — NOT SENT\nTo: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}\n\n${draft.attachment ? "Simulated attachment" : "No attachment"}`)}>Keep draft</button></div>
        {tries === 0 && <p className="small muted">Write your own version first; the example unlocks after your first review.</p>}
      </div>
    </div>
    {checks && <div className="email-checks section-gap" role="status"><div className="row between"><strong>{passed === checks.length ? "Ready to send in real life — after one last read for spelling and tone." : `${passed} of ${checks.length} checks passed`}</strong><span className={`tag${passed === checks.length ? " qb-high" : ""}`}>{Math.round(passed / checks.length * 100)}%</span></div>
      <ul className="check-list">{checks.map(c => <li key={c.label} className={c.ok ? "is-pass" : "is-fail"}><span aria-hidden="true">{c.ok ? "✓" : "✗"}</span><div><strong>{c.label}</strong>{!c.ok && <p className="small muted">{c.tip}</p>}</div></li>)}</ul>
      <p className="small muted">These checks look for the usual parts of a good email. They cannot judge spelling, facts or how your reader will feel, so read it aloud once before sending a real one.</p></div>}
    {showModel && <div className="email-model section-gap"><p className="eyebrow">One good way to write it</p><p><strong>Subject:</strong> {sc.model.subject}</p><pre>{sc.model.body}</pre><p className="small muted">Yours does not need to match. Compare: is your purpose as clear in the first two lines? Did you include every detail the reader needs?</p></div>}
  </div>;
}
