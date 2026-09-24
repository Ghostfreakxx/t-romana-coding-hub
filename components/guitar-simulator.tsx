"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const timeoutIds = useRef<number[]>([]);
  const volumeRef = useRef(volume);
  const fretsRef = useRef(frets);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { fretsRef.current = frets; }, [frets]);

  const pluck = useCallback((index: number, fret: Fret) => {
    if (fret === null) return;
    try {
      const context = audio.current ?? new AudioContext();
      audio.current = context;
      if (context.state === "suspended") void context.resume();
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
        oscillator.onended = () => { oscillator.disconnect(); partial.disconnect(); };
      }
      const cleanUp = window.setTimeout(() => { filter.disconnect(); gain.disconnect(); }, 2800);
      timeoutIds.current.push(cleanUp);
      setActive(index);
      const clearActive = window.setTimeout(() => setActive(current => current === index ? null : current), 180);
      timeoutIds.current.push(clearActive);
      setAudioError("");
    } catch {
      setAudioError("Sound is unavailable in this browser. Try a recent browser and check that audio is enabled.");
    }
  }, []);

  const strum = useCallback((up = false) => {
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state === "suspended") void audio.current.resume();
    } catch {
      setAudioError("Sound is unavailable in this browser. Try a recent browser and check that audio is enabled.");
      return;
    }
    fretsRef.current.forEach((fret, index) => {
      if (fret === null) return;
      const id = window.setTimeout(() => pluck(index, fret), (up ? 5 - index : index) * 60);
      timeoutIds.current.push(id);
    });
  }, [pluck]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes((event.target as HTMLElement).tagName) || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 6) pluck(index, fretsRef.current[index]);
      if (event.code === "Space") { event.preventDefault(); strum(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pluck, strum]);

  useEffect(() => () => {
    timeoutIds.current.forEach(window.clearTimeout);
    if (audio.current) void audio.current.close();
  }, []);

  return <section className="panel guitar-simulator" aria-label="Live guitar simulator">
    <div className="row between"><div><h2>Play the guitar</h2><p className="muted small">Tap a string to pluck it. Pick a chord and strum, or set your own frets.</p></div><span className="tag">LIVE IN YOUR BROWSER</span></div>
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
    {audioError && <p role="alert" className="notice error">{audioError}</p>}
  </section>;
}
