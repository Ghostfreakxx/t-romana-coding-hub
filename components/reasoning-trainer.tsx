"use client";
import { useEffect, useState } from "react";
import { generate, GEN_TOPICS, type GenQuestion } from "@/lib/reasoning-gen";
import { emptyResults, isResults } from "@/components/quiz";
import { useSaved } from "@/lib/storage";

type Stats = Record<string, [number, number]>;
const EMPTY: Stats = {};
const isStats = (v: unknown): v is Stats => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(x => Array.isArray(x) && x.length === 2 && x.every(n => Number.isInteger(n) && n >= 0) && x[0] <= x[1]);
const SPEED_COUNT = 10, SPEED_SECONDS = 300;
type Speed = { started: number; answered: number; right: number; over: boolean; saved: boolean };

export default function ReasoningTrainer() {
  const stats = useSaved("reasoning-stats", EMPTY, isStats), history = useSaved("results", emptyResults, isResults);
  const [topic, setTopic] = useState("Mixed"), [q, setQ] = useState<GenQuestion | null>(null), [chosen, setChosen] = useState<number | null>(null);
  const [session, setSession] = useState({ right: 0, tries: 0, streak: 0 }), [speed, setSpeed] = useState<Speed | null>(null), [now, setNow] = useState(0);
  const left = speed && !speed.over ? Math.max(0, SPEED_SECONDS - Math.floor((now - speed.started) / 1000)) : 0;

  /** Ends the round once and records it in My progress. */
  function finish(s: Speed) {
    if (s.over) return;
    setNow(Date.now()); setSpeed({ ...s, over: true, saved: true });
    history.setValue([...history.value, { id: crypto.randomUUID(), lab: "reasoning", score: s.right, total: SPEED_COUNT, date: new Date().toISOString(), mode: "speed round" }].slice(-100));
  }
  useEffect(() => {
    if (!speed || speed.over) return;
    const t = setInterval(() => { const n = Date.now(); setNow(n); if (n - speed.started >= SPEED_SECONDS * 1000) finish(speed); }, 250);
    return () => clearInterval(t);
  });

  const ranked = GEN_TOPICS.map(t => ({ t, right: stats.value[t]?.[0] ?? 0, tries: stats.value[t]?.[1] ?? 0 })).map(x => ({ ...x, pct: x.tries ? x.right / x.tries : null }));
  const weakest = ranked.filter(x => x.tries >= 3).sort((a, b) => (a.pct ?? 1) - (b.pct ?? 1))[0];
  const bestSpeed = Math.max(0, ...history.value.filter(r => r.lab === "reasoning" && r.mode === "speed round").map(r => r.score));

  function next(t = topic) { setQ(generate(t)); setChosen(null); }
  function answer(i: number) {
    if (!q || chosen !== null) return;
    const ok = i === q.answer, [r, n] = stats.value[q.topic] ?? [0, 0];
    setChosen(i); stats.setValue({ ...stats.value, [q.topic]: [r + (ok ? 1 : 0), n + 1] });
    setSession(s => ({ right: s.right + (ok ? 1 : 0), tries: s.tries + 1, streak: ok ? s.streak + 1 : 0 }));
    if (speed && !speed.over) {
      const done = speed.answered + 1, right = speed.right + (ok ? 1 : 0), updated = { ...speed, answered: done, right };
      if (done >= SPEED_COUNT) finish(updated); else setSpeed(updated);
      if (done < SPEED_COUNT) setTimeout(() => next("Mixed"), ok ? 450 : 1400);
    }
  }
  function startSpeed() { const t = Date.now(); setNow(t); setSpeed({ started: t, answered: 0, right: 0, over: false, saved: false }); next("Mixed"); }

  return <section className="panel reasoning-trainer" aria-labelledby="trainer-heading">
    <div className="row between"><div><p className="eyebrow">Unlimited practice</p><h2 id="trainer-heading">Reasoning gym</h2></div><span className="tag">{session.right} / {session.tries} today · streak {session.streak}</span></div>
    <p className="muted">Fresh questions every time across {GEN_TOPICS.length} aptitude topics, each with the method explained. Use the speed round to practise under exam pressure.</p>
    {speed ? speed.over
      ? <div className="notice speed-result" role="status"><h3>Speed round: {speed.right} / {SPEED_COUNT}</h3><p>{speed.answered < SPEED_COUNT ? `Time ran out after ${speed.answered} answers.` : `Finished in ${Math.round((now - speed.started) / 1000)} seconds.`} {speed.right >= bestSpeed && speed.right > 0 ? "That is your best speed round so far!" : `Your best is ${bestSpeed} / ${SPEED_COUNT}.`} Saved to My progress.</p><div className="row"><button className="btn" onClick={startSpeed}>Try again</button><button className="btn secondary" onClick={() => { setSpeed(null); setQ(null); }}>Back to practice</button></div></div>
      : <div className="speed-bar" role="timer" aria-live="off"><strong>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</strong><progress max={SPEED_COUNT} value={speed.answered} aria-label="Speed round progress" /><span>{speed.answered} / {SPEED_COUNT} · {speed.right} right</span><button className="btn secondary" onClick={() => finish(speed)}>Stop</button></div>
      : <div className="row trainer-controls"><label>Topic<select value={topic} onChange={e => { setTopic(e.target.value); next(e.target.value); }}><option>Mixed</option>{GEN_TOPICS.map(t => <option key={t}>{t}</option>)}</select></label><button className="btn" onClick={() => next()}>{q ? "New question" : "Start practising"}</button><button className="btn secondary" onClick={startSpeed}>⏱ Speed round · {SPEED_COUNT} in {SPEED_SECONDS / 60} min</button>{weakest && weakest.t !== topic && <button className="btn secondary" onClick={() => { setTopic(weakest.t); next(weakest.t); }}>Practise my weakest: {weakest.t}</button>}</div>}
    {q && !(speed?.over) && <div className="gen-question" key={q.prompt}>
      <p className="eyebrow">{q.topic}</p><h3>{q.prompt}</h3>
      <div className="option-grid" role="group" aria-label="Answer options">{q.options.map((o, i) => <button key={o} className={`option${chosen !== null && i === q.answer ? " correct" : chosen === i ? " wrong" : ""}`} disabled={chosen !== null} aria-pressed={chosen === i} onClick={() => answer(i)}><span className="muted">{String.fromCharCode(65 + i)}.</span>{o}</button>)}</div>
      {chosen !== null && <div className={`notice${chosen === q.answer ? "" : " error"}`} role="status"><strong>{chosen === q.answer ? "Correct." : `Not quite — the answer is ${q.options[q.answer]}.`}</strong> {q.explanation}</div>}
      {chosen !== null && !speed && <button className="btn section-gap" onClick={() => next()}>Next question →</button>}
    </div>}
    <details className="section-gap"><summary>My accuracy by topic</summary><div className="topic-stats">{ranked.map(x => <div key={x.t}><span>{x.t}</span><progress max={1} value={x.pct ?? 0} aria-label={`${x.t} accuracy`} /><small>{x.tries ? `${Math.round((x.pct ?? 0) * 100)}% of ${x.tries}` : "not tried"}</small></div>)}</div><button className="btn secondary" onClick={() => { if (confirm("Reset your accuracy record for every topic?")) stats.setValue({}); }}>Reset my record</button></details>
  </section>;
}
