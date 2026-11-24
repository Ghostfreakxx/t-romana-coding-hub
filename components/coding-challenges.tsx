"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { challenges, type Challenge } from "@/data/coding-challenges";
import { makeDocument, type Code } from "@/lib/code";
import { validCode } from "@/lib/coding-studio";
import { emptyList, isStringList, useSaved } from "@/lib/storage";

const Editor = dynamic(() => import("./studio-editor"), { ssr: false, loading: () => <p className="editor-loading">Loading your editor…</p> });
const files = { html: "index.html", css: "styles.css", js: "script.js" };
const EMPTY: Record<string, Code> = {};
const isDrafts = (v: unknown): v is Record<string, Code> => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(validCode);
type Outcome = { results: boolean[]; errors: string[] } | { timeout: true; errors: string[] };

/** Builds the sandboxed page: the student's code, then our checks in a separate script so a syntax error in theirs cannot hide the result. */
function testDocument(code: Code, challenge: Challenge, channel: string) {
  const checks = challenge.tests.map(t => `async()=>{${t.run}}`).join(",");
  const harness = `<script>window.addEventListener("load",function(){setTimeout(async function(){var checks=[${checks}],results=[];for(var i=0;i<checks.length;i++){try{results.push((await checks[i]())===true);}catch(e){results.push(false);}}parent.postMessage({channel:${JSON.stringify(channel)},level:"test",results:results},"*");},120);});<\/script>`;
  return makeDocument(code, true, channel).replace(/<\/body><\/html>$/, `${harness}</body></html>`);
}

export default function CodingChallenges() {
  const drafts = useSaved("code-challenges", EMPTY, isDrafts), done = useSaved("challenges-done", emptyList, isStringList);
  const [index, setIndex] = useState(0), [language, setLanguage] = useState<keyof Code>("html");
  const [doc, setDoc] = useState(""), [runId, setRunId] = useState(0), [outcome, setOutcome] = useState<Outcome | null>(null), [checking, setChecking] = useState(false), [showHints, setShowHints] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null), channel = useRef(""), errors = useRef<string[]>([]), timer = useRef<ReturnType<typeof setTimeout> | null>(null), channelChallenge = useRef("");
  const challenge = challenges[index], code = drafts.value[challenge.id] ?? challenge.starter;
  const save = (next: Code) => drafts.setValue({ ...drafts.value, [challenge.id]: next });

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const v = event.data;
      if (event.source !== frame.current?.contentWindow || !v || v.channel !== channel.current) return;
      if (v.level === "error" && typeof v.text === "string") errors.current = [...errors.current.slice(-4), v.text.slice(0, 300)];
      if (v.level === "test" && Array.isArray(v.results)) {
        if (timer.current) clearTimeout(timer.current);
        const results = v.results.map((r: unknown) => r === true);
        setOutcome({ results, errors: errors.current }); setChecking(false);
        const id = challenges.find(c => c.id === channelChallenge.current)?.id;
        if (id && results.length && results.every(Boolean) && !done.value.includes(id)) done.setValue([...done.value, id]);
      }
    };
    window.addEventListener("message", receive);
    return () => { window.removeEventListener("message", receive); if (timer.current) clearTimeout(timer.current); };
  }, [done]);

  function run(withTests: boolean) {
    channel.current = crypto.randomUUID(); channelChallenge.current = challenge.id; errors.current = [];
    setDoc(withTests ? testDocument(code, challenge, channel.current) : makeDocument(code, true, channel.current)); setRunId(n => n + 1);
    if (!withTests) { setOutcome(null); return; }
    setChecking(true); setOutcome(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setChecking(false); setOutcome({ timeout: true, errors: errors.current }); }, 4000);
  }
  function choose(i: number) { setIndex(i); setLanguage(challenges[i].level === "CSS" ? "css" : challenges[i].level === "JavaScript" ? "js" : "html"); setDoc(""); setOutcome(null); setShowHints(false); }
  const passed = outcome && "results" in outcome ? outcome.results.filter(Boolean).length : 0;

  return <section className="challenges" aria-label="Coding challenges">
    <div className="challenge-list" role="group" aria-label="Choose a challenge">
      <p className="eyebrow">{done.value.filter(id => challenges.some(c => c.id === id)).length} / {challenges.length} solved</p>
      {challenges.map((c, i) => <button key={c.id} type="button" aria-pressed={i === index} onClick={() => choose(i)}><span className={done.value.includes(c.id) ? "is-done" : undefined}>{done.value.includes(c.id) ? "✓" : i + 1}</span><strong>{c.title}</strong><small>{c.level}</small></button>)}
    </div>
    <div className="challenge-main">
      <div className="panel challenge-brief"><p className="eyebrow">Challenge {index + 1} · {challenge.level}</p><h2>{challenge.title}</h2><p>{challenge.goal}</p><ol>{challenge.steps.map(s => <li key={s}>{s}</li>)}</ol></div>
      <div className="challenge-work">
        <section className="studio-code"><div className="editor-top"><div className="tabs" role="group" aria-label="Challenge files">{(["html", "css", "js"] as const).map(key => <button key={key} aria-pressed={language === key} onClick={() => setLanguage(key)}>{files[key]}</button>)}</div><button className="btn secondary" onClick={() => { if (confirm("Put this challenge back to its starting code?")) { const { [challenge.id]: _removed, ...rest } = drafts.value; void _removed; drafts.setValue(rest); setDoc(""); setOutcome(null); } }}>Reset</button></div>
          <Editor key={`${challenge.id}-${language}`} language={language} value={code[language]} onChange={value => save({ ...code, [language]: value })} />
          <div className="editor-actions"><button className="btn" onClick={() => run(true)} disabled={checking}>{checking ? "Checking…" : "✓ Check my code"}</button><button className="btn secondary" onClick={() => run(false)}>Run preview ▶</button></div></section>
        <section className="studio-preview challenge-results">
          <div className="editor-top"><strong>Checks</strong>{outcome && "results" in outcome && <span className={`tag${passed === challenge.tests.length ? " qb-high" : ""}`}>{passed} / {challenge.tests.length} passed</span>}</div>
          <ul className="check-list">{challenge.tests.map((t, i) => { const state = outcome && "results" in outcome ? outcome.results[i] ? "pass" : "fail" : "idle"; return <li key={t.name} className={`is-${state}`}><span aria-hidden="true">{state === "pass" ? "✓" : state === "fail" ? "✗" : "○"}</span><div><strong>{t.name}</strong>{(state === "fail" || showHints) && <p className="small muted">Hint: {t.hint}</p>}</div><span className="sr-only">{state === "pass" ? "passed" : state === "fail" ? "not passed yet" : "not checked yet"}</span></li>; })}</ul>
          {outcome && "results" in outcome && passed === challenge.tests.length && <p className="notice" role="status">Solved! {index < challenges.length - 1 ? "Ready for the next challenge?" : "You finished every challenge — try building your own project next."} {index < challenges.length - 1 && <button className="btn secondary" onClick={() => choose(index + 1)}>Next challenge →</button>}</p>}
          {outcome && "timeout" in outcome && <p className="notice error" role="alert">The checks did not finish. Look for a never-ending loop or an error that stops the page loading.</p>}
          {outcome && outcome.errors.length > 0 && <div className="notice error" role="alert"><strong>Errors from your code:</strong>{outcome.errors.map((e, i) => <p key={i} className="small">{e}</p>)}</div>}
          {!outcome && <label className="check-row"><input type="checkbox" checked={showHints} onChange={e => setShowHints(e.target.checked)} /> Show hints before checking</label>}
          <div className="preview-scroll challenge-preview">{doc ? <iframe ref={frame} key={runId} sandbox="allow-scripts" title="Challenge preview" srcDoc={doc} /> : <div className="preview-empty"><h3>Press Check or Run</h3><p>Your page appears here. Checking also clicks buttons and types into boxes for you.</p></div>}</div>
        </section>
      </div>
      <p className="small muted">Your challenge code saves on this device. The checks are automatic hints, not a full review: they try a few inputs and look at the page your code builds.</p>
    </div>
  </section>;
}
