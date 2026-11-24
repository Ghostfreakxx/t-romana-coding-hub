"use client";
import { useState } from "react";
import { BAND_COLOURS, BAND_HEX, E12, bandsToOhms, circuitReadings, formatOhms, predictAnswer, predictionCorrect, resistorBands, type Prediction, type PredictKind } from "@/lib/circuit-engine";
import { useSaved } from "@/lib/storage";

const EMPTY: Record<string, number> = {};
const isScores = (v: unknown): v is Record<string, number> => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(n => typeof n === "number" && Number.isFinite(n) && n >= 0);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T,>(list: T[]) => list.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);

function Resistor({ bands, label }: { bands: [number, number, number]; label: string }) {
  return <svg className="resistor-art" viewBox="0 0 320 90" role="img" aria-label={label}>
    <path d="M0 45H60M260 45H320" stroke="#b9c3c6" strokeWidth="6" strokeLinecap="round" />
    <rect x="58" y="18" width="204" height="54" rx="26" fill="#d9bd8c" stroke="#f3dfb7" strokeWidth="2" />
    <rect x="62" y="22" width="196" height="16" rx="8" fill="#fff4" />
    {bands.map((b, i) => <rect key={i} x={95 + i * 30} y="18" width="16" height="54" fill={BAND_HEX[b]} stroke="#0003" />)}
    <rect x="212" y="18" width="16" height="54" fill="#c8a43c" stroke="#0003" />
  </svg>;
}

type ResistorQ = { ohms: number; options: number[] };
function resistorQuestion(): ResistorQ {
  const ohms = pick(E12) * 10 ** Math.floor(Math.random() * 5);
  const [a, b, m] = resistorBands(ohms);
  const distractors = new Set<number>([bandsToOhms([a, b, m + 1]), m > 0 ? bandsToOhms([a, b, m - 1]) : bandsToOhms([a, b, m + 2])]);
  if (b !== 0 && a !== b) distractors.add(bandsToOhms([b, a, m]));
  while (distractors.size < 3) distractors.add(pick(E12) * 10 ** m);
  distractors.delete(ohms);
  return { ohms, options: shuffle([ohms, ...[...distractors].slice(0, 3)]) };
}

export function ResistorTrainer() {
  const scores = useSaved("electrical-scores", EMPTY, isScores);
  const [mode, setMode] = useState<"read" | "build">("read");
  const [q, setQ] = useState<ResistorQ>({ ohms: 470, options: [4700, 470, 47, 740] });
  const [chosen, setChosen] = useState<number | null>(null), [build, setBuild] = useState<[number, number, number]>([1, 0, 0]), [checked, setChecked] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0), [total, setTotal] = useState({ right: 0, tries: 0 });
  const bands = resistorBands(q.ohms), best = scores.value.resistorStreak ?? 0;
  function score(ok: boolean) {
    const next = ok ? streak + 1 : 0;
    setStreak(next); setTotal(t => ({ right: t.right + (ok ? 1 : 0), tries: t.tries + 1 }));
    if (next > best) scores.setValue({ ...scores.value, resistorStreak: next });
  }
  function next() { setQ(resistorQuestion()); setChosen(null); setChecked(null); setBuild([1, 0, 0]); }
  const answered = mode === "read" ? chosen !== null : checked !== null;
  return <section className="panel section-gap trainer-panel" aria-labelledby="resistor-heading">
    <div className="row between"><div><p className="eyebrow">Electrical / colour code</p><h2 id="resistor-heading">Read a resistor</h2></div><span className="tag">Streak {streak} · best {best}</span></div>
    <p className="muted">Real resistors are too small to print numbers on, so their value is painted as coloured bands. Band 1 and band 2 are digits; band 3 says how many zeros follow. The gold band means ±5 %.</p>
    <div className="tabs" role="group" aria-label="Trainer mode">{([["read", "Read the bands"], ["build", "Paint the bands"]] as const).map(([id, label]) => <button key={id} aria-pressed={mode === id} onClick={() => { setMode(id); next(); }}>{label}</button>)}</div>
    {mode === "read" ? <>
      <Resistor bands={bands} label={`Resistor with bands ${bands.map(b => BAND_COLOURS[b]).join(", ")} and gold`} />
      <div className="option-grid" role="group" aria-label="Choose its value">{q.options.map(o => <button key={o} type="button" className={`option${chosen !== null && o === q.ohms ? " correct" : chosen === o ? " wrong" : ""}`} aria-pressed={chosen === o} disabled={chosen !== null} onClick={() => { setChosen(o); score(o === q.ohms); }}>{formatOhms(o)}</button>)}</div>
    </> : <>
      <p className="trainer-target">Paint a <strong>{formatOhms(q.ohms)}</strong> resistor</p>
      <Resistor bands={build} label={`Your resistor: ${build.map(b => BAND_COLOURS[b]).join(", ")}, gold`} />
      <div className="band-pickers">{(["1st digit", "2nd digit", "Multiplier"] as const).map((name, i) => <label key={name}>{name}<select value={build[i]} disabled={checked !== null} onChange={e => setBuild(build.map((v, j) => j === i ? +e.target.value : v) as [number, number, number])}>{BAND_COLOURS.map((c, n) => (i < 2 || n <= 6) && <option key={c} value={n}>{c} · {i < 2 ? n : `×${10 ** n >= 1000 ? `${10 ** n / 1000}k` : 10 ** n}`}</option>)}</select></label>)}</div>
      <button className="btn" disabled={checked !== null} onClick={() => { const ok = bandsToOhms(build) === q.ohms; setChecked(ok); score(ok); }}>Check my bands</button>
    </>}
    {answered && <p className={`notice${(mode === "read" ? chosen === q.ohms : checked) ? "" : " error"}`} role="status">
      {(mode === "read" ? chosen === q.ohms : checked) ? "Correct! " : "Not this time. "}
      {BAND_COLOURS[bands[0]]} ({bands[0]}) · {BAND_COLOURS[bands[1]]} ({bands[1]}) · {BAND_COLOURS[bands[2]]} (×{10 ** bands[2]}) = {bands[0]}{bands[1]} × {10 ** bands[2]} = {formatOhms(q.ohms)}.
    </p>}
    <div className="row"><button className="btn secondary" onClick={next}>{answered ? "Next resistor →" : "Skip"}</button><span className="small muted">{total.right} / {total.tries} correct this session</span></div>
    <details><summary>Colour chart</summary><div className="colour-chart">{BAND_COLOURS.map((c, i) => <span key={c}><i style={{ background: BAND_HEX[i] }} />{i} · {c}</span>)}</div><p className="small">Memory aid: <strong>B</strong>lack <strong>B</strong>rown <strong>R</strong>ed <strong>O</strong>range <strong>Y</strong>ellow <strong>G</strong>reen <strong>B</strong>lue <strong>V</strong>iolet <strong>G</strong>rey <strong>W</strong>hite — 0 to 9.</p></details>
  </section>;
}

const KINDS: Record<PredictKind, { ask: string; unit: string }> = {
  current: { ask: "the total current from the supply", unit: "mA" },
  resistance: { ask: "the total resistance of R1 and R2", unit: "Ω" },
  v2: { ask: "the voltage across R2", unit: "V" },
  power: { ask: "the power delivered by the supply", unit: "mW" },
};
function predictQuestion(): Prediction {
  const nice = [100, 200, 300, 400, 500, 600, 1000];
  return { mode: pick(["series", "parallel"] as const), volts: pick([3, 6, 9, 12]), r1: pick(nice), r2: pick(nice), kind: pick(Object.keys(KINDS) as PredictKind[]) };
}
function working(p: Prediction) {
  const r = circuitReadings(p.volts, p.r1, p.r2, p.mode, true);
  const total = p.mode === "series" ? `R = R1 + R2 = ${p.r1} + ${p.r2} = ${r.resistance.toFixed(1)} Ω` : `1/R = 1/${p.r1} + 1/${p.r2}, so R = ${r.resistance.toFixed(1)} Ω`;
  const current = `I = V ÷ R = ${p.volts} ÷ ${r.resistance.toFixed(1)} = ${(r.current * 1000).toFixed(1)} mA`;
  if (p.kind === "resistance") return `${total}.`;
  if (p.kind === "current") return `${total}. ${current}.`;
  if (p.kind === "v2") return p.mode === "parallel" ? "In parallel every branch has the full supply voltage, so V2 = " + p.volts + " V." : `${total}. ${current}. V2 = I × R2 = ${(r.current * 1000).toFixed(1)} mA × ${p.r2} Ω = ${r.v2.toFixed(2)} V.`;
  return `${total}. ${current}. P = V × I = ${p.volts} V × ${(r.current * 1000).toFixed(1)} mA = ${(r.power * 1000).toFixed(1)} mW.`;
}

export function PredictGame() {
  const scores = useSaved("electrical-scores", EMPTY, isScores);
  const [q, setQ] = useState<Prediction>({ mode: "series", volts: 6, r1: 200, r2: 100, kind: "current" });
  const [answer, setAnswer] = useState(""), [result, setResult] = useState<boolean | null>(null), [streak, setStreak] = useState(0);
  const best = scores.value.predictStreak ?? 0, kind = KINDS[q.kind];
  function check() {
    const ok = predictionCorrect(q, Number(answer.replace(",", ".")));
    setResult(ok); const nextStreak = ok ? streak + 1 : 0; setStreak(nextStreak);
    if (nextStreak > best) scores.setValue({ ...scores.value, predictStreak: nextStreak });
  }
  return <section className="panel section-gap trainer-panel" aria-labelledby="predict-heading">
    <div className="row between"><div><p className="eyebrow">Electrical / Ohm’s law</p><h2 id="predict-heading">Predict before you measure</h2></div><span className="tag">Streak {streak} · best {best}</span></div>
    <p className="muted">Engineers work out what a meter should read before they touch the circuit, so a strange reading stands out. Use a calculator if you like; answers within 2 % count.</p>
    <div className="predict-card"><p className="eyebrow">{q.mode} circuit · switch closed</p><p className="predict-values"><span>Supply <strong>{q.volts} V</strong></span><span>R1 <strong>{q.r1} Ω</strong></span><span>R2 <strong>{q.r2} Ω</strong></span></p><p>What is <strong>{kind.ask}</strong>?</p>
      <form className="row" onSubmit={e => { e.preventDefault(); if (result === null && answer.trim()) check(); }}><label className="predict-input">Your answer ({kind.unit})<input inputMode="decimal" value={answer} disabled={result !== null} onChange={e => setAnswer(e.target.value)} placeholder={`e.g. 12.5`} /></label><button className="btn" disabled={result !== null || !answer.trim()}>Check</button></form>
    </div>
    {result !== null && <p className={`notice${result ? "" : " error"}`} role="status">{result ? "Correct! " : `Not quite: the answer is ${+predictAnswer(q).toFixed(2)} ${kind.unit}. `}{working(q)}</p>}
    <div className="row"><button className="btn secondary" onClick={() => { setQ(predictQuestion()); setAnswer(""); setResult(null); }}>{result === null ? "Skip" : "Next circuit →"}</button><span className="small muted">Then build the same circuit on the workbench above and measure it.</span></div>
  </section>;
}
