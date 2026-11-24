"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isDue, nextReviewLabel, schedule, type Grade, type Scheduled } from "@/lib/spaced";
import { dayKey, useSaved } from "@/lib/storage";

const noSubscribe = () => () => {};
/** Local date on the client; empty while prerendering so no date is baked into the HTML. */
export function useToday() { return useSyncExternalStore(noSubscribe, () => dayKey(), () => ""); }

export type ReviewCard = Scheduled & { id: string; front: string; back: string };
const GRADES: { id: Grade; label: string; key: string }[] = [
  { id: "again", label: "Forgot", key: "1" }, { id: "hard", label: "Hard", key: "2" }, { id: "good", label: "Good", key: "3" }, { id: "easy", label: "Easy", key: "4" },
];

/** One card at a time: recall, reveal, then grade honestly. Forgotten cards return at the end of the session. */
export function CardReview({ cards, onGrade }: { cards: ReviewCard[]; onGrade: (card: ReviewCard) => void }) {
  const today = useToday();
  const [queue, setQueue] = useState<string[] | null>(null), [shown, setShown] = useState(false), [tally, setTally] = useState({ done: 0, forgot: 0 });
  const due = today ? cards.filter(c => isDue(c, today)) : [];
  const learned = cards.filter(c => (c.box ?? 0) >= 3).length;
  const card = queue?.length ? cards.find(c => c.id === queue[0]) : undefined;
  const ref = useRef<(g: Grade) => void>(() => {});
  function grade(g: Grade) {
    if (!card || !queue) return;
    onGrade(schedule(card, g, dayKey()));
    setQueue(g === "again" ? [...queue.slice(1), card.id] : queue.slice(1));
    setTally(t => ({ done: t.done + (g === "again" ? 0 : 1), forgot: t.forgot + (g === "again" ? 1 : 0) }));
    setShown(false);
  }
  useEffect(() => { ref.current = grade; });
  useEffect(() => {
    if (!queue?.length) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setShown(true); return; }
      const g = GRADES.find(x => x.key === e.key); if (g) { e.preventDefault(); ref.current(g.id); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [queue]);

  if (!queue) return <div className="review-start">
    <div><strong className="review-count">{today ? due.length : "…"}</strong><span>card{due.length === 1 ? "" : "s"} due today</span></div>
    <div><strong className="review-count">{learned}</strong><span>well learned (box 3+)</span></div>
    <button className="btn" disabled={!due.length} onClick={() => { setQueue(due.sort((a, b) => (a.due ?? "").localeCompare(b.due ?? "")).map(c => c.id)); setTally({ done: 0, forgot: 0 }); setShown(false); }}>{due.length ? `Start review · ${due.length}` : "Nothing due — well done"}</button>
  </div>;
  if (!card) return <div className="notice review-done" role="status"><strong>Review complete.</strong> {tally.done} card{tally.done === 1 ? "" : "s"} scheduled{tally.forgot ? `, ${tally.forgot} forgotten and practised again` : ""}. Come back tomorrow for the next ones. <button className="btn secondary" onClick={() => setQueue(null)}>Close</button></div>;
  return <div className="review-card" aria-live="polite">
    <div className="row between small muted"><span>{queue.length} left in this session</span><span>Box {card.box ?? 0} of 6</span></div>
    <h3>{card.front}</h3>
    {shown ? <><p className="review-answer">{card.back}</p><p className="small muted">How well did you remember it?</p>
      <div className="review-grades">{GRADES.map(g => <button key={g.id} className={`btn ${g.id === "again" ? "danger" : g.id === "good" ? "" : "secondary"}`} onClick={() => grade(g.id)}>{g.label}<small>{nextReviewLabel(card, g.id)} · {g.key}</small></button>)}</div></>
      : <button className="btn" onClick={() => setShown(true)}>Show answer <small>Space</small></button>}
    <button className="btn secondary review-stop" onClick={() => setQueue(null)}>End session</button>
  </div>;
}

const MODES = { focus: { label: "Focus", minutes: 25 }, short: { label: "Short break", minutes: 5 }, long: { label: "Long break", minutes: 15 } } as const;
type Mode = keyof typeof MODES;
const EMPTY_LOG: Record<string, number> = {};
const isLog = (v: unknown): v is Record<string, number> => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(n => Number.isInteger(n) && n >= 0);

function chime() {
  try {
    const ctx = new AudioContext(), t = ctx.currentTime;
    [660, 880, 990].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(.0001, t + i * .22); g.gain.exponentialRampToValueAtTime(.2, t + i * .22 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + i * .22 + .6); o.connect(g); g.connect(ctx.destination); o.start(t + i * .22); o.stop(t + i * .22 + .62); });
    setTimeout(() => void ctx.close(), 1600);
  } catch { /* Sound is optional. */ }
}

/** A Pomodoro timer: 25 minutes of focus, then a break. Based on an end time, so it stays accurate when the tab sleeps. */
export function FocusTimer() {
  const log = useSaved("focus-log", EMPTY_LOG, isLog), today = useToday();
  const [mode, setMode] = useState<Mode>("focus"), [endsAt, setEndsAt] = useState<number | null>(null), [remaining, setRemaining] = useState(MODES.focus.minutes * 60_000), [now, setNow] = useState(0), [note, setNote] = useState("");
  const left = endsAt ? Math.max(0, endsAt - now) : remaining, secs = Math.ceil(left / 1000), label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const sessions = today ? log.value[today] ?? 0 : 0;
  const complete = useRef<() => void>(() => {});
  useEffect(() => {
    complete.current = () => {
      chime(); setEndsAt(null);
      if (mode === "focus") {
        const day = dayKey(), count = (log.value[day] ?? 0) + 1;
        log.setValue(Object.fromEntries([...Object.entries(log.value), [day, count]].slice(-60)));
        const next: Mode = count % 4 === 0 ? "long" : "short";
        setMode(next); setRemaining(MODES[next].minutes * 60_000); setNote(`Focus session ${count} done. Take a ${MODES[next].label.toLowerCase()}: stand up, drink water, rest your eyes.`);
      } else { setMode("focus"); setRemaining(MODES.focus.minutes * 60_000); setNote("Break over. Pick one small task for the next focus session."); }
    };
  });
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => { const n = Date.now(); setNow(n); if (n >= endsAt) complete.current(); }, 250);
    return () => clearInterval(t);
  }, [endsAt]);
  useEffect(() => {
    if (!endsAt) return;
    const original = document.title; document.title = `${label} · ${MODES[mode].label}`;
    return () => { document.title = original; };
  }, [endsAt, label, mode]);
  const switchTo = (m: Mode) => { setMode(m); setEndsAt(null); setRemaining(MODES[m].minutes * 60_000); setNote(""); };
  const total = MODES[mode].minutes * 60_000;
  return <section className="panel focus-timer" aria-labelledby="focus-heading">
    <div className="row between"><div><p className="eyebrow">Study in sprints</p><h2 id="focus-heading">Focus timer</h2></div><span className="tag">{sessions} focus session{sessions === 1 ? "" : "s"} today · {sessions * 25} min</span></div>
    <div className="focus-body">
      <div className="focus-dial" style={{ "--done": `${(1 - left / total) * 100}%` } as React.CSSProperties}><strong role="timer" aria-live="off">{label}</strong><span>{MODES[mode].label}</span></div>
      <div className="stack">
        <div className="tabs" role="group" aria-label="Timer mode">{(Object.keys(MODES) as Mode[]).map(m => <button key={m} aria-pressed={mode === m} onClick={() => switchTo(m)}>{MODES[m].label} · {MODES[m].minutes}</button>)}</div>
        <div className="row">
          {endsAt ? <button className="btn" onClick={() => { setRemaining(Math.max(0, endsAt - Date.now())); setEndsAt(null); }}>Pause</button>
            : <button className="btn" onClick={() => { const n = Date.now(); setNow(n); setEndsAt(n + remaining); setNote(""); }}>{remaining < total ? "Resume" : "Start"} {MODES[mode].label.toLowerCase()}</button>}
          <button className="btn secondary" onClick={() => switchTo(mode)}>Reset</button>
        </div>
        <p className="small muted">{note || "Work on one thing for 25 minutes with your phone away, then rest for 5. After four focus sessions, take a longer break. A chime plays when time is up."}</p>
      </div>
    </div>
  </section>;
}
