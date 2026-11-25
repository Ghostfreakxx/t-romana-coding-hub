"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DRUM_KINDS, MusicAudio } from "@/lib/music-audio";
import { download, useSaved } from "@/lib/storage";
import { encodeWav } from "@/lib/wav";

const TRACKS = [...DRUM_KINDS];
type Grid = boolean[][];
const steps = (hits: number[]) => Array.from({ length: 16 }, (_, s) => hits.includes(s));
const every = (n: number, from = 0) => Array.from({ length: 16 }, (_, s) => s).filter(s => s >= from && (s - from) % n === 0);
/** Starter grooves. Rows follow TRACKS: Kick, Snare, Hi-hat, Clap, Open hat, Tom. */
const PRESETS: Record<string, { label: string; bpm: number; swing: number; rows: number[][]; tip: string }> = {
  rock: { label: "Rock", bpm: 90, swing: 0, rows: [[0, 8], [4, 12], every(2), [], [], []], tip: "Kick on 1 and 3, snare on 2 and 4, hi-hat on every eighth note." },
  dance: { label: "Dance", bpm: 120, swing: 0, rows: [every(4), [], [], [4, 12], every(4, 2), []], tip: "Four-on-the-floor: a kick on every beat, with the open hat between them." },
  hiphop: { label: "Hip-hop", bpm: 88, swing: 40, rows: [[0, 7, 10], [4, 12], every(2), [], [14], []], tip: "A syncopated kick and swung hi-hats give a relaxed, laid-back feel." },
  reggae: { label: "Reggae one-drop", bpm: 76, swing: 20, rows: [[8], [8], every(2, 2), [], [], [15]], tip: "Beat 1 is left empty; kick and snare land together on beat 3." },
  march: { label: "March", bpm: 110, swing: 0, rows: [[0, 8], [4, 12, 14], [], [], [], [6, 7]], tip: "Strong, even steps with a small snare roll leading back to beat 1." },
  empty: { label: "Empty grid", bpm: 90, swing: 0, rows: [[], [], [], [], [], []], tip: "Start from silence and build your own groove." },
};
const fromPreset = (id: string): Grid => PRESETS[id].rows.map(steps);
const INITIAL = fromPreset("rock");
const isRow = (row: unknown) => Array.isArray(row) && row.length === 16 && row.every(x => typeof x === "boolean");
/** Accepts the original 4-track patterns as well as the current 6-track ones. */
const valid = (v: unknown): v is Grid => Array.isArray(v) && (v.length === 4 || v.length === TRACKS.length) && v.every(isRow);
const normalise = (grid: Grid): Grid => grid.length === TRACKS.length ? grid : [...grid, ...Array.from({ length: TRACKS.length - grid.length }, () => steps([]))];
const LOOKAHEAD = .12;

/** Melody and bass use a five-note (pentatonic) scale, so any combination of notes sounds good together. */
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const KEYS = [0, 2, 4, 5, 7, 9];
const MODES = { major: { label: "Bright (major pentatonic)", steps: [0, 2, 4, 7, 9] }, minor: { label: "Soulful (minor pentatonic)", steps: [0, 3, 5, 7, 10] } } as const;
type Tune = { melody: (number | null)[]; bass: (number | null)[]; key: number; mode: keyof typeof MODES };
const MELODY_ROWS = 10, BASS_ROWS = 5;
const DEFAULT_TUNE: Tune = { melody: [4, null, 3, null, 2, null, null, null, 4, null, 5, null, 4, null, 2, null], bass: [0, null, null, null, null, null, 0, null, 3, null, null, null, 4, null, null, null], key: 0, mode: "major" };
const isNotes = (v: unknown, rows: number) => Array.isArray(v) && v.length === 16 && v.every(n => n === null || (Number.isInteger(n) && n >= 0 && n < rows));
const isTune = (v: unknown): v is Tune => !!v && typeof v === "object" && isNotes((v as Tune).melody, MELODY_ROWS) && isNotes((v as Tune).bass, BASS_ROWS) && KEYS.includes((v as Tune).key) && ((v as Tune).mode in MODES);
/** MIDI note for a scale row: rows climb the scale, wrapping into the next octave. */
const midiFor = (tune: Tune, row: number, base: number) => base + tune.key + 12 * Math.floor(row / 5) + MODES[tune.mode].steps[row % 5];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const melodyHz = (t: Tune, r: number) => hz(midiFor(t, r, 60)), bassHz = (t: Tune, r: number) => hz(midiFor(t, r, 36));
const noteLabel = (t: Tune, r: number, base: number) => { const m = midiFor(t, r, base); return `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`; };

export default function BeatMaker() {
  const saved = useSaved("beat-pattern", INITIAL, valid);
  const grid = useMemo(() => normalise(saved.value), [saved.value]);
  const [playing, setPlaying] = useState(false), [step, setStep] = useState(-1), [bpm, setBpm] = useState(90), [swing, setSwing] = useState(0), [message, setMessage] = useState("");
  const [muted, setMuted] = useState<boolean[]>(() => TRACKS.map(() => false)), [accentOne, setAccentOne] = useState(true), [tip, setTip] = useState(PRESETS.rock.tip);
  const tuneSaved = useSaved("beat-tune", DEFAULT_TUNE, isTune), tune = tuneSaved.value;
  const [muteMelody, setMuteMelody] = useState(false), [muteBass, setMuteBass] = useState(false), [exporting, setExporting] = useState(false);
  const audio = useRef<MusicAudio | null>(null), live = useRef({ grid, muted, bpm, swing, accentOne, tune, muteMelody, muteBass });
  useEffect(() => { live.current = { grid, muted, bpm, swing, accentOne, tune, muteMelody, muteBass }; }, [grid, muted, bpm, swing, accentOne, tune, muteMelody, muteBass]);

  // Look-ahead scheduler: sounds are booked on the audio clock slightly in advance, so timing stays even
  // even when the page is busy. The timer only decides what to book next.
  useEffect(() => {
    const engine = audio.current;
    if (!playing || !engine) return;
    let n = 0, next = engine.time + .06;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    const book = () => {
      while (next < engine.time + LOOKAHEAD) {
        const { grid: g, muted: m, bpm: tempo, swing: sw, accentOne: accent, tune: t, muteMelody: mm, muteBass: mb } = live.current, sixteenth = 60 / tempo / 4;
        const when = next + (n % 2 ? sixteenth * sw / 100 * .33 : 0), current = n;
        playStep(engine, g, m, t, mm, mb, current, when, sixteenth, accent);
        const id = setTimeout(() => { timeouts.delete(id); setStep(current); }, Math.max(0, (when - engine.time) * 1000));
        timeouts.add(id);
        n = (n + 1) % 16; next += sixteenth;
      }
    };
    book();
    const timer = setInterval(book, 25);
    return () => { clearInterval(timer); timeouts.forEach(clearTimeout); };
  }, [playing]);
  useEffect(() => {
    const stop = () => { if (document.hidden) { setPlaying(false); setStep(-1); } };
    document.addEventListener("visibilitychange", stop);
    return () => { document.removeEventListener("visibilitychange", stop); void audio.current?.close(); audio.current = null; };
  }, []);

  function playStep(engine: MusicAudio, g: Grid, m: boolean[], t: Tune, mm: boolean, mb: boolean, step: number, when: number, sixteenth: number, accent: boolean) {
    g.forEach((row, r) => { if (row[step] && !m[r]) engine.drum(TRACKS[r], when, accent && step % 4 === 0 ? 1 : .78); });
    const mel = t.melody[step], bas = t.bass[step];
    if (mel !== null && !mm) engine.piano(melodyHz(t, mel), when, sixteenth * 3);
    if (bas !== null && !mb) engine.bass(bassHz(t, bas), when, sixteenth * 2.5);
  }
  /** Renders four loops offline (faster than real time) and saves them as a WAV file. */
  async function exportWav() {
    setExporting(true); setMessage("");
    try {
      const sixteenth = 60 / bpm / 4, loops = 4, seconds = sixteenth * 16 * loops + 1.5, rate = 44100;
      const ctx = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate), engine = MusicAudio.offlineFor(ctx, .45);
      for (let i = 0; i < 16 * loops; i++) { const step = i % 16; playStep(engine, grid, muted, tune, muteMelody, muteBass, step, .05 + i * sixteenth + (step % 2 ? sixteenth * swing / 100 * .33 : 0), sixteenth, accentOne); }
      const rendered = await ctx.startRendering();
      const url = URL.createObjectURL(new Blob([encodeWav([rendered.getChannelData(0), rendered.getChannelData(1)], rate)], { type: "audio/wav" }));
      const a = document.createElement("a"); a.href = url; a.download = `my-beat-${bpm}bpm.wav`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage(`Saved my-beat-${bpm}bpm.wav: four loops, ${Math.round(seconds)} seconds. Muted tracks are left out.`);
    } catch { setMessage("This browser could not render audio. Try a recent Chrome, Edge, Firefox or Safari."); }
    finally { setExporting(false); }
  }
  function setNote(part: "melody" | "bass", step: number, row: number) {
    const list = tune[part].map((v, i) => i === step ? (v === row ? null : row) : v);
    tuneSaved.setValue({ ...tune, [part]: list });
    if (audio.current && list[step] !== null) { if (part === "melody") audio.current.piano(melodyHz(tune, row), undefined, .4); else audio.current.bass(bassHz(tune, row)); }
  }
  function surprise() {
    let row = 2 + Math.floor(Math.random() * 4);
    const melody = Array.from({ length: 16 }, (_, i) => { if (i % 2 && Math.random() < .6) return null; if (i % 4 && Math.random() < .3) return null; row = Math.max(0, Math.min(MELODY_ROWS - 1, row + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)])); return row; });
    const roots = [[0, 3, 4, 0], [0, 4, 3, 0], [0, 2, 3, 4], [0, 0, 3, 4]][Math.floor(Math.random() * 4)];
    const bass = Array.from({ length: 16 }, (_, i) => i % 4 === 0 ? roots[i / 4] : i % 4 === 3 && Math.random() < .3 ? roots[Math.floor(i / 4)] : null);
    tuneSaved.setValue({ ...tune, melody, bass });
  }
  async function toggle() {
    if (playing) { setPlaying(false); setStep(-1); return; }
    try { audio.current ??= new MusicAudio(); await audio.current.enable(); audio.current.volume = .45; setPlaying(true); setMessage(""); }
    catch { setMessage("Sound could not start. Check browser audio permissions and tap Play again."); }
  }
  async function preview(r: number) {
    try { audio.current ??= new MusicAudio(); await audio.current.enable(); audio.current.volume = .45; audio.current.drum(TRACKS[r]); } catch { /* Preview is optional. */ }
  }
  function loadPreset(id: string) {
    const p = PRESETS[id];
    if (!confirm(`Replace your pattern with the ${p.label} groove?`)) return;
    saved.setValue(fromPreset(id)); setBpm(p.bpm); setSwing(p.swing); setTip(p.tip);
  }
  const toggleStep = (r: number, s: number) => saved.setValue(grid.map((row, i) => i === r ? row.map((v, j) => j === s ? !v : v) : row));
  const hits = grid.reduce((n, row) => n + row.filter(Boolean).length, 0);

  return <section className="panel beat-maker">
    <div className="row between"><div><p className="eyebrow">Make music / 16-step sequencer</p><h2>Build your own rhythm.</h2></div><span className="tag">6 drums · 4 beats · {hits} hits</span></div>
    <p className="muted">Tap squares to place sounds, then play your loop. The four groups are beats 1–2–3–4. Tap a drum name to hear it; use M to mute a track while you listen.</p>
    <div className="beat-presets" role="group" aria-label="Starter grooves">{Object.entries(PRESETS).map(([id, p]) => <button key={id} type="button" className="tag" onClick={() => loadPreset(id)}>{p.label}</button>)}</div>
    <p className="small notice">{tip}</p>
    <div className="sequencer-scroll"><div className="sequencer-grid">
      <div className="sequence-label">COUNT</div>{Array.from({ length: 16 }, (_, i) => <span className={`sequence-count${playing && step === i ? " current" : ""}`} key={i}>{i % 4 === 0 ? i / 4 + 1 : ["", "e", "&", "a"][i % 4]}</span>)}
      {TRACKS.map((track, r) => <div className={`sequence-row${muted[r] ? " is-muted" : ""}`} key={track}>
        <span className="sequence-label sequence-track"><button type="button" className="track-name" onClick={() => void preview(r)} aria-label={`Hear ${track}`}>{track}</button><button type="button" className="track-mute" aria-pressed={muted[r]} aria-label={`Mute ${track}`} onClick={() => setMuted(muted.map((m, i) => i === r ? !m : m))}>M</button></span>
        {grid[r].map((on, s) => <button className={`sequence-step ${on ? "on" : ""} ${playing && step === s ? "current" : ""}`} aria-label={`${track}, step ${s + 1}`} aria-pressed={on} key={s} onClick={() => toggleStep(r, s)} />)}
      </div>)}
    </div></div>
    <div className="tune-head row between"><div><p className="eyebrow">Melody &amp; bass</p><h3>Add a tune on top</h3></div><div className="row tune-settings">
      <label>Key<select value={tune.key} onChange={e => tuneSaved.setValue({ ...tune, key: Number(e.target.value) })}>{KEYS.map(k => <option key={k} value={k}>{NOTE_NAMES[k]}</option>)}</select></label>
      <label>Mood<select value={tune.mode} onChange={e => tuneSaved.setValue({ ...tune, mode: e.target.value as Tune["mode"] })}>{Object.entries(MODES).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}</select></label>
      <button className="btn secondary" onClick={surprise}>🎲 Surprise me</button>
      <button className="btn secondary" onClick={() => { if (confirm("Clear the melody and bass?")) tuneSaved.setValue({ ...tune, melody: Array(16).fill(null), bass: Array(16).fill(null) }); }}>Clear tune</button>
    </div></div>
    <p className="small muted">Each column holds one note. These rows only use five notes of the scale, so whatever you tap will sound good together; try changing the key or mood afterwards.</p>
    {(["melody", "bass"] as const).map(part => { const rows = part === "melody" ? MELODY_ROWS : BASS_ROWS, mutedPart = part === "melody" ? muteMelody : muteBass; return <div className="sequencer-scroll piano-roll" key={part}><div className="sequencer-grid">
      <span className="sequence-label sequence-track"><strong className="track-name">{part === "melody" ? "Melody" : "Bass"}</strong><button type="button" className="track-mute" aria-pressed={mutedPart} aria-label={`Mute ${part}`} onClick={() => part === "melody" ? setMuteMelody(!muteMelody) : setMuteBass(!muteBass)}>M</button></span>{Array.from({ length: 16 }, (_, i) => <span className={`sequence-count${playing && step === i ? " current" : ""}`} key={i}>{i % 4 === 0 ? i / 4 + 1 : ""}</span>)}
      {Array.from({ length: rows }, (_, k) => rows - 1 - k).map(r => <div className={`sequence-row roll-row${mutedPart ? " is-muted" : ""}${r % 5 === 0 ? " is-root" : ""}`} key={r}>
        <span className="sequence-label roll-note">{noteLabel(tune, r, part === "melody" ? 60 : 36)}</span>
        {tune[part].map((v, st) => <button key={st} className={`sequence-step roll-cell ${v === r ? "on" : ""} ${playing && step === st ? "current" : ""}`} aria-label={`${part} ${noteLabel(tune, r, part === "melody" ? 60 : 36)}, step ${st + 1}`} aria-pressed={v === r} onClick={() => setNote(part, st, r)} />)}
      </div>)}
    </div></div>; })}
    <div className="row section-gap beat-controls">
      <button className="btn" onClick={() => void toggle()}>{playing ? "■ Stop loop" : "▶ Play loop"}</button>
      <label>Tempo · {bpm} BPM<input type="range" min="45" max="160" value={bpm} onChange={e => setBpm(+e.target.value)} /></label>
      <label>Swing · {swing}%<input type="range" min="0" max="60" step="5" value={swing} onChange={e => setSwing(+e.target.value)} /></label>
      <label className="check-row"><input type="checkbox" checked={accentOne} onChange={e => setAccentOne(e.target.checked)} /> Accent each beat</label>
    </div>
    <div className="row">
      <button className="btn secondary" onClick={() => { if (confirm("Clear every step?")) saved.setValue(fromPreset("empty")); }}>Clear grid</button>
      <button className="btn" disabled={exporting} onClick={() => void exportWav()}>{exporting ? "Rendering…" : "⬇ Save as audio (WAV)"}</button>
      <button className="btn secondary" onClick={() => download("my-beat.json", JSON.stringify({ bpm, swing, tracks: TRACKS, pattern: grid, tune }, null, 2), "application/json")}>Export pattern</button>
    </div>
    <label className="section-gap">Restore a pattern (.json)<input type="file" accept=".json" onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
      try {
        if (file.size > 20000) throw Error();
        const parsed = JSON.parse(await file.text());
        if (!valid(parsed.pattern) || !Number.isInteger(parsed.bpm) || parsed.bpm < 45 || parsed.bpm > 160) throw Error();
        if (confirm("Replace your current pattern?")) { setPlaying(false); setBpm(parsed.bpm); if (isTune(parsed.tune)) tuneSaved.setValue(parsed.tune); setSwing(Number.isInteger(parsed.swing) && parsed.swing >= 0 && parsed.swing <= 60 ? parsed.swing : 0); saved.setValue(normalise(parsed.pattern)); setMessage("Pattern restored."); }
      } catch { setMessage("Use a pattern backup exported by this sequencer."); }
    }} /></label>
    <p className="small muted">Pattern edits save on this device; tempo and swing are saved in the export. Swing delays every second sixteenth note for a shuffled feel. “Save as audio” renders four loops into a WAV file you can share or use in a video; “Export pattern” saves the notes for editing later. Older 4-drum patterns open with the two new drums empty.</p>
    {message && <p role="status">{message}</p>}{saved.error && <p role="alert">{saved.error}</p>}
  </section>;
}
