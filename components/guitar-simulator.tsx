"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GuitarArt } from "./lab-art";

type Fret = number | null;
type Chord = { name: string; frets: Fret[] };

const STRINGS = [
  { name: "Low E", note: "E2", midi: 40 },
  { name: "A", note: "A2", midi: 45 },
  { name: "D", note: "D3", midi: 50 },
  { name: "G", note: "G3", midi: 55 },
  { name: "B", note: "B3", midi: 59 },
  { name: "High E", note: "E4", midi: 64 },
];
const CHORDS: Chord[] = [
  { name: "Em", frets: [0, 2, 2, 0, 0, 0] },
  { name: "G", frets: [3, 2, 0, 0, 0, 3] },
  { name: "C", frets: [null, 3, 2, 0, 1, 0] },
  { name: "D", frets: [null, null, 0, 2, 3, 2] },
  { name: "Am", frets: [null, 0, 2, 2, 1, 0] },
  { name: "F", frets: [1, 3, 3, 2, 1, 1] },
  { name: "A", frets: [null, 0, 2, 2, 2, 0] },
  { name: "E", frets: [0, 2, 2, 1, 0, 0] },
  { name: "Dm", frets: [null, null, 0, 2, 3, 1] },
  { name: "Bm", frets: [null, 2, 4, 4, 3, 2] },
  { name: "A7", frets: [null, 0, 2, 0, 2, 0] },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0] },
  { name: "D7", frets: [null, null, 0, 2, 1, 2] },
];
/** Common progressions used in thousands of songs; a good order to learn chord changes in. */
const PROGRESSIONS = [
  { name: "Em – G (first change)", chords: ["Em", "G"] },
  { name: "G – C – D – G", chords: ["G", "C", "D", "G"] },
  { name: "C – Am – F – G", chords: ["C", "Am", "F", "G"] },
  { name: "Em – C – G – D", chords: ["Em", "C", "G", "D"] },
  { name: "Am – Dm – E7 – Am", chords: ["Am", "Dm", "E7", "Am"] },
  { name: "D – A – Bm – G", chords: ["D", "A", "Bm", "G"] },
  { name: "A – D – E7 – A (blues feel)", chords: ["A", "D", "E7", "A"] },
];
const noteName = (midi: number) => {
  const names = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
};

export default function GuitarSimulator() {
  const [frets, setFrets] = useState<Fret[]>(CHORDS[0].frets);
  const [selectedChord, setSelectedChord] = useState("Em");
  const [volume, setVolume] = useState(65);
  const [active, setActive] = useState<number | null>(null);
  const [audioError, setAudioError] = useState("");
  const audio = useRef<AudioContext | null>(null);
  const [progression, setProgression] = useState(1), [bpm, setBpm] = useState(60), [beatsPer, setBeatsPer] = useState(4), [autoStrum, setAutoStrum] = useState(true);
  const [trainer, setTrainer] = useState<{ step: number; beat: number } | null>(null), [changes, setChanges] = useState(0);
  const timeoutIds = useRef(new Set<number>());
  const noteTimer = useRef<number | null>(null);
  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(() => { timeoutIds.current.delete(id); fn(); }, delay);
    timeoutIds.current.add(id);
  }, []);
  const volumeRef = useRef(volume);
  const fretsRef = useRef(frets);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { fretsRef.current = frets; }, [frets]);

  const pluck = useCallback((index: number, fret: Fret) => {
    if (fret === null) return;
    try {
      const context = audio.current ?? new AudioContext();
      audio.current = context;
      if (context.state === "suspended") void context.resume().catch(() => setAudioError("Tap again to enable sound in this browser."));
      const frequency = 440 * 2 ** ((STRINGS[index].midi + fret - 69) / 12);
      const start = context.currentTime;
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(4200, frequency * 13), start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(450, frequency * 3), start + 1.5);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volumeRef.current / 100 * 0.13), start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);
      filter.connect(gain);
      gain.connect(context.destination);
      for (const [harmonic, level] of [[1, 1], [2, 0.22], [3, 0.08]] as const) {
        const oscillator = context.createOscillator();
        const partial = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency * harmonic;
        partial.gain.value = level;
        oscillator.connect(partial);
        partial.connect(filter);
        oscillator.start(start);
        oscillator.stop(start + 2.55);
        oscillator.onended = () => { oscillator.disconnect(); partial.disconnect(); if (harmonic === 3) { filter.disconnect(); gain.disconnect(); } };
      }
      setActive(index);
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
      noteTimer.current = window.setTimeout(() => setActive(null), 250);
      setAudioError("");
    } catch {
      setAudioError("Sound is unavailable in this browser. Try a recent browser and check that audio is enabled.");
    }
  }, []);

  const strum = useCallback((up = false) => {
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state === "suspended") void audio.current.resume().catch(() => setAudioError("Tap again to enable sound in this browser."));
    } catch {
      setAudioError("Sound is unavailable in this browser. Try a recent browser and check that audio is enabled.");
      return;
    }
    fretsRef.current.forEach((fret, index) => {
      if (fret === null) return;
      schedule(() => pluck(index, fret), (up ? 5 - index : index) * 60);
    });
  }, [pluck, schedule]);

  const click = useCallback((accent: boolean) => {
    const ctx = audio.current; if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = accent ? 1500 : 1000; g.gain.setValueAtTime(volumeRef.current / 100 * .12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .06); o.onended = () => { o.disconnect(); g.disconnect(); };
  }, []);
  // Chord-change trainer: a metronome walks through the progression; the next chord is shown in advance.
  const running = trainer !== null;
  useEffect(() => {
    if (!running) return;
    const chords = PROGRESSIONS[progression].chords;
    let beat = 0, step = 0;
    const tick = () => {
      const chord = CHORDS.find(c => c.name === chords[step])!;
      if (beat === 0) { fretsRef.current = [...chord.frets]; setFrets([...chord.frets]); setSelectedChord(chord.name); if (autoStrum) strum(); }
      click(beat === 0); setTrainer({ step, beat });
      beat++; if (beat >= beatsPer) { beat = 0; step = (step + 1) % chords.length; setChanges(n => n + 1); }
    };
    tick();
    const timer = window.setInterval(tick, 60000 / bpm);
    return () => window.clearInterval(timer);
  }, [running, progression, bpm, beatsPer, autoStrum, strum, click]);
  async function startTrainer() {
    try { audio.current ??= new AudioContext(); if (audio.current.state === "suspended") await audio.current.resume(); }
    catch { setAudioError("Sound is unavailable in this browser. Try a recent browser and check that audio is enabled."); return; }
    setChanges(0); setTrainer({ step: 0, beat: 0 });
  }
  function reference(index: number) {
    for (let i = 0; i < 3; i++) schedule(() => pluck(index, 0), i * 1300);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (target.tagName === "BUTTON" && event.code === "Space") return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 6) pluck(index, fretsRef.current[index]);
      if (event.code === "Space") { event.preventDefault(); strum(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pluck, strum]);

  useEffect(() => {
    const pending = timeoutIds.current;
    const pause = () => { if (document.hidden) { pending.forEach(window.clearTimeout); pending.clear(); setActive(null); setTrainer(null); void audio.current?.suspend().catch(() => {}); } };
    document.addEventListener("visibilitychange", pause);
    return () => {
      document.removeEventListener("visibilitychange", pause);
      pending.forEach(window.clearTimeout); pending.clear();
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
      const context = audio.current; audio.current = null;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  return <section className="panel guitar-simulator" aria-label="Live guitar simulator">
    <div className="row between"><div><h2>Play the guitar</h2><p className="muted small">Tap a string to pluck it. Pick a chord and strum, or set your own frets.</p></div><span className="tag">LIVE IN YOUR BROWSER</span></div>
    <GuitarArt active={active} chord={selectedChord}/>
    <div className="row guitar-chords" role="group" aria-label="Choose a guitar chord">
      {CHORDS.map(chord => <button key={chord.name} type="button" className="btn secondary" aria-pressed={selectedChord === chord.name} onClick={() => { setFrets([...chord.frets]); setSelectedChord(chord.name); }}>{chord.name}</button>)}
    </div>
    <div className="guitar-neck" role="group" aria-label="Six playable guitar strings">
      {STRINGS.map((string, index) => {
        const fret = frets[index];
        return <div className="guitar-string-row" key={string.name}>
          <span className="guitar-string-label">{string.note}</span>
          <button type="button" className={`guitar-string ${active === index ? "is-plucked" : ""}`} style={{ "--string-width": `${Math.max(2, 6 - index * 0.7)}px` } as React.CSSProperties} aria-label={`Pluck ${string.name} string, ${fret === null ? "muted" : `fret ${fret}, note ${noteName(string.midi + fret)}`}`} disabled={fret === null} onPointerDown={e => { e.preventDefault(); pluck(index, fret); }} onClick={e=>{if(e.detail===0)pluck(index,fret);}}>
            <span className="guitar-fret-dot">{fret === null ? "×" : fret === 0 ? "○" : fret}</span>
          </button>
          <label className="guitar-fret-label">Fret <select aria-label={`${string.name} string fret`} value={fret === null ? "x" : fret} onChange={event => { const next = [...frets]; next[index] = event.target.value === "x" ? null : Number(event.target.value); setFrets(next); setSelectedChord(""); }}><option value="x">Mute</option>{Array.from({ length: 13 }, (_, fretNumber) => <option value={fretNumber} key={fretNumber}>{fretNumber}</option>)}</select></label>
        </div>;
      })}
    </div>
    <div className="row guitar-actions"><button type="button" className="btn" onClick={()=>strum()}>Strum ↓</button><button type="button" className="btn secondary" onClick={()=>strum(true)}>Strum ↑</button><label className="guitar-volume">Volume <input type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Guitar volume"/><span>{volume}%</span></label></div>
    <p className="guitar-note-strip">{selectedChord || "Custom shape"} · {frets.map((fret,index)=>fret===null?"×":noteName(STRINGS[index].midi+fret)).join(" · ")}</p>
    <p className="small muted">Keyboard: 1–6 plucks the strings from low E to high E; Space strums. The sound is synthesized guitar practice audio.</p>
    <section className="guitar-trainer" aria-labelledby="chord-trainer-heading">
      <div className="row between"><div><p className="eyebrow">Practise chord changes</p><h3 id="chord-trainer-heading">Chord-change trainer</h3></div>{running && <span className="tag">{changes} change{changes === 1 ? "" : "s"}</span>}</div>
      <p className="small muted">Play along on a real guitar or on the strings above. Change chord on beat 1; the next chord lights up early so you can get your fingers ready. Start slow: clean changes at 60 BPM beat rushed ones at 100.</p>
      <div className="trainer-settings">
        <label>Progression<select value={progression} disabled={running} onChange={e => setProgression(Number(e.target.value))}>{PROGRESSIONS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}</select></label>
        <label>Tempo · {bpm} BPM<input type="range" min="40" max="140" step="5" value={bpm} onChange={e => setBpm(Number(e.target.value))} /></label>
        <label>Beats per chord<select value={beatsPer} onChange={e => setBeatsPer(Number(e.target.value))}><option value={8}>8 · gentle</option><option value={4}>4 · standard</option><option value={2}>2 · quick</option></select></label>
        <label className="check-row"><input type="checkbox" checked={autoStrum} onChange={e => setAutoStrum(e.target.checked)} /> Strum for me on beat 1</label>
      </div>
      <div className="progression-strip" aria-live="polite">{PROGRESSIONS[progression].chords.map((c, i) => <span key={i} className={trainer?.step === i ? "is-now" : trainer && (trainer.step + 1) % PROGRESSIONS[progression].chords.length === i && trainer.beat >= beatsPer - 2 ? "is-next" : undefined}>{c}</span>)}</div>
      {running && <div className="beat-lights guitar-beats">{Array.from({ length: beatsPer }, (_, n) => <span key={n} className={trainer?.beat === n ? "lit" : ""}>{n + 1}</span>)}</div>}
      <button className="btn" onClick={() => running ? setTrainer(null) : void startTrainer()}>{running ? "■ Stop trainer" : "▶ Start trainer"}</button>
    </section>
    <details className="guitar-tuning"><summary>Tune your real guitar</summary><p className="small muted">Play a reference note, then turn that string’s tuning peg until your guitar sounds the same. Each note plays three times. Tighten to raise the pitch, loosen to lower it.</p><div className="row">{STRINGS.map((st, i) => <button key={st.name} className="btn secondary" onClick={() => reference(i)}>{st.name} · {st.note}</button>)}</div></details>
    {audioError && <p role="alert" className="notice error">{audioError}</p>}
  </section>;
}
