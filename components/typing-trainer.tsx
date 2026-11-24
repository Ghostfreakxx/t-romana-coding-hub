"use client";
import { useEffect, useRef, useState } from "react";
import { drillText, fingerFor, FINGER_NAMES, KEY_ROWS, typingMistakes, typingResult } from "@/lib/skills-practice";
import { useSaved } from "@/lib/storage";

const PASSAGES = [
  "A useful skill grows with practice. Start slowly, check your work, and try again. Small improvements made every day can become real confidence.",
  "Technology can help us learn about the world. Read carefully, protect your private information, and never become a stranger to your own language.",
  "Dear Teacher, I have attached my assignment for your review. Please let me know if any changes are needed. Thank you for your time and guidance.",
  "Aizawl sits on a ridge above the Tlawng river valley. On clear mornings, students can see hills folding into the distance, one blue line after another.",
  "Good notes are short and clear. Write the main idea, one example and one question. Then close the book and explain it aloud in your own words.",
];
type Lesson = { id: string; title: string; keys?: string; tip: string };
const LESSONS: Lesson[] = [
  { id: "home", title: "1 · Home row", keys: "asdfghjkl;", tip: "Rest your fingers on A S D F and J K L ;. Feel the bumps on F and J with your index fingers, and return there after every key." },
  { id: "home-plus", title: "2 · Home row + E I R U", keys: "asdfghjkl;eiru", tip: "Reach up with your middle and index fingers, then come straight back to the home row." },
  { id: "top", title: "3 · Top row", keys: "asdfghjklqwertyuiop", tip: "Keep your wrists still. Only the finger that types should move." },
  { id: "bottom", title: "4 · Bottom row", keys: "asdfghjklzxcvbnm,.", tip: "Curl the finger down for the bottom row; do not move the whole hand." },
  { id: "all", title: "5 · All letters", keys: "abcdefghijklmnopqrstuvwxyz", tip: "Mix every row. Look at the screen, not your hands; slow and accurate is faster in the end." },
  { id: "numbers", title: "6 · Numbers", keys: "asdfjkl1234567890", tip: "Numbers are a long reach. Use the same finger as the letter below each number." },
  { id: "sentences", title: "7 · Sentences", tip: "Real sentences add capitals and punctuation. Hold Shift with the little finger of the opposite hand." },
];
const DURATIONS = [30, 60, 120, 0];
type Run = { d: string; l: string; w: number; a: number };
const EMPTY: Run[] = [];
const isRuns = (v: unknown): v is Run[] => Array.isArray(v) && v.length <= 60 && v.every(r => r && typeof r.d === "string" && typeof r.l === "string" && Number.isFinite(r.w) && Number.isFinite(r.a));
/** Deterministic text for the first render (same on server and client); later texts are random. */
const lcg = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const textFor = (lesson: Lesson, keys?: string, rng: () => number = Math.random) => lesson.id === "sentences" ? PASSAGES[Math.floor(rng() * PASSAGES.length)] : drillText(keys ?? lesson.keys!, rng);

export default function TypingTrainer() {
  const history = useSaved("typing-history", EMPTY, isRuns);
  const [lesson, setLesson] = useState(LESSONS[0]), [trouble, setTrouble] = useState<string | null>(null), [text, setText] = useState(() => textFor(LESSONS[0], undefined, lcg(7)));
  const [typed, setTyped] = useState(""), [startedAt, setStartedAt] = useState<number | null>(null), [now, setNow] = useState(0), [limit, setLimit] = useState(60);
  const [done, setDone] = useState(false), [misses, setMisses] = useState<Record<string, number>>({}), [note, setNote] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const seconds = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const result = typingResult(text, typed, seconds), lessonKey = trouble ? "trouble" : lesson.id;
  const best = Math.max(0, ...history.value.filter(r => r.l === lessonKey && r.a >= 90).map(r => r.w));
  const nextChar = done ? undefined : text[typed.length], finger = nextChar !== undefined ? fingerFor(nextChar) : null;
  const troubleKeys = Object.entries(misses).filter(([k]) => /[a-z0-9;,./]/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  function finish(final = typed, at = Date.now()) {
    if (done) return;
    setDone(true); setNow(at);
    const secs = startedAt ? (at - startedAt) / 1000 : 0, r = typingResult(text, final, secs);
    setMisses(m => { const add = typingMistakes(text, final), out = { ...m }; for (const [k, n] of Object.entries(add)) out[k] = (out[k] ?? 0) + n; return out; });
    if (final.length >= 10 && secs >= 5) history.setValue([...history.value, { d: new Date().toISOString(), l: lessonKey, w: r.wpm, a: r.accuracy }].slice(-60));
    setNote(r.accuracy < 90 ? "Accuracy first: slow down until you reach 90 % or more, then build speed." : r.wpm > best && best > 0 ? `New personal best for this lesson: ${r.wpm} WPM!` : "Well done. Try again and aim for the same accuracy a little faster.");
  }
  useEffect(() => {
    if (!startedAt || done) return;
    const t = setInterval(() => { const n = Date.now(); setNow(n); if (limit && n - startedAt >= limit * 1000) finish(typed, n); }, 200);
    return () => clearInterval(t);
  });
  function reset(next = text) { setText(next); setTyped(""); setStartedAt(null); setNow(0); setDone(false); setNote(""); requestAnimationFrame(() => box.current?.focus()); }
  function chooseLesson(l: Lesson) { setLesson(l); setTrouble(null); reset(textFor(l)); }
  function onType(value: string) {
    if (done) return;
    const v = value.slice(0, text.length), n = Date.now();
    if (!startedAt) { setStartedAt(n); setNow(n); }
    setTyped(v);
    if (v.length >= text.length) finish(v, n);
  }
  const recent = history.value.filter(r => r.l === lessonKey).slice(-12);

  return <div className="typing-lab typing-trainer">
    <div className="lesson-picker" role="group" aria-label="Typing lessons">{LESSONS.map(l => <button key={l.id} type="button" aria-pressed={!trouble && lesson.id === l.id} onClick={() => chooseLesson(l)}>{l.title}</button>)}{trouble && <button type="button" aria-pressed>Trouble keys: {trouble}</button>}</div>
    <p className="small notice">{trouble ? `A drill built from the keys you missed most: ${trouble.split("").join(" ")}. Go slowly and watch which finger the keyboard shows.` : lesson.tip}</p>
    <div className="practice-stats">
      <div><strong>{limit ? Math.max(0, Math.ceil(limit - seconds)) : Math.floor(seconds)}s</strong><small>{limit ? "time left" : "time"}</small></div>
      <div><strong>{result.wpm}</strong><small>words / minute</small></div>
      <div><strong>{result.accuracy}%</strong><small>accuracy</small></div>
      <div><strong>{best || "—"}</strong><small>best here (90 %+)</small></div>
    </div>
    <p className="typing-target" aria-label={text}>{[...text].map((char, i) => <span aria-hidden="true" key={i} className={i < typed.length ? typed[i] === char ? "correct" : "incorrect" : i === typed.length && !done ? "cursor" : ""}>{char}</span>)}</p>
    <label>Type here — the timer starts with your first key<textarea ref={box} rows={3} value={typed} disabled={done} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" onPaste={e => { e.preventDefault(); setNote("Paste is turned off here: type it yourself to practise."); }} onChange={e => onType(e.target.value)} /></label>
    <div className="keyboard-guide" aria-hidden="true">
      {KEY_ROWS.map((row, r) => <div className={`kb-row kb-row-${r}`} key={row}>{[...row].map(k => <span key={k} className={`kb-key f${fingerFor(k)}${nextChar !== undefined && nextChar.toLowerCase() === k ? " is-next" : ""}${(misses[k] ?? 0) > 0 ? " has-miss" : ""}${k === "f" || k === "j" ? " has-bump" : ""}`}>{k}</span>)}</div>)}
      <div className="kb-row"><span className={`kb-key kb-space f8${nextChar === " " ? " is-next" : ""}`}>space</span></div>
    </div>
    <p className="small finger-hint" role="status">{nextChar === undefined ? (done ? "Finished." : "") : <>Next: <kbd>{nextChar === " " ? "space" : nextChar}</kbd> · use your <strong>{finger === 8 ? "thumb" : `${finger !== null ? FINGER_NAMES[finger] : "nearest"} finger`}</strong>{nextChar !== nextChar.toLowerCase() ? " with Shift" : ""}</>}</p>
    <div className="row">
      <label className="typing-limit">Time<select value={limit} disabled={!!startedAt && !done} onChange={e => setLimit(Number(e.target.value))}>{DURATIONS.map(d => <option key={d} value={d}>{d ? `${d} seconds` : "Until the text ends"}</option>)}</select></label>
      {startedAt && !done && <button className="btn secondary" onClick={() => finish()}>Finish now</button>}
      <button className="btn" onClick={() => reset(trouble ? drillText(`${trouble}asdfjkl`) : textFor(lesson))}>New text</button>
      <button className="btn secondary" onClick={() => reset()}>Same text again</button>
      {troubleKeys.length > 0 && <button className="btn secondary" onClick={() => { const keys = troubleKeys.join(""); setTrouble(keys); reset(drillText(`${keys}asdfjkl`)); }}>Practise my trouble keys ({troubleKeys.join(" ")})</button>}
    </div>
    {done && <p className="notice success" role="status">{result.wpm} WPM at {result.accuracy}% accuracy. {note}</p>}
    {!done && note && <p className="small muted">{note}</p>}
    {recent.length > 0 && <div className="typing-history"><p className="small muted">Your last {recent.length} result{recent.length === 1 ? "" : "s"} in this lesson (WPM; faded bars were under 90 % accuracy)</p><div className="wpm-bars">{recent.map(r => <span key={r.d} className={r.a < 90 ? "is-low" : undefined} style={{ height: `${Math.max(8, Math.min(100, r.w))}%` }} title={`${r.w} WPM · ${r.a}% · ${r.d.slice(0, 10)}`}><b>{r.w}</b></span>)}</div></div>}
    <p className="small muted">A word is five correct characters. Results save on this device. Speed only counts as a personal best at 90 % accuracy or more, because accuracy is the habit that lasts.</p>
  </div>;
}
