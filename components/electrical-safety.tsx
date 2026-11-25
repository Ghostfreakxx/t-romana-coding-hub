"use client";
import { useState } from "react";

type Spot = { id: string; hazard: boolean; title: string; text: string };
const SPOTS: Spot[] = [
  { id: "adapter", hazard: true, title: "Adapter plugged into an adapter", text: "Stacking adapters and running a heater, iron and kettle from one socket can overheat the socket and start a fire. Use one high-power appliance per wall socket." },
  { id: "frayed", hazard: true, title: "Damaged lamp cable", text: "Bare copper shows through the insulation. Touching it can give a shock, and sparks can start a fire. Unplug it, stop using it and have the cable or lamp replaced." },
  { id: "rug", hazard: true, title: "Cable under the rug", text: "Cables under rugs get walked on and crushed, and the heat cannot escape. Damage stays hidden until it fails. Run cables along the wall instead." },
  { id: "water", hazard: true, title: "Water beside the extension board", text: "Water conducts electricity. One spill onto a live board can cause a shock or a short circuit. Keep drinks and plants away from sockets and boards." },
  { id: "pillow", hazard: true, title: "Phone charging under a pillow", text: "Chargers and phone batteries get warm and need air to cool. Under a pillow they can overheat and catch fire. Charge on a hard, open surface such as a table." },
  { id: "heater", hazard: true, title: "Heater against the curtain", text: "Room heaters can set fabric alight. Keep at least one metre clear around a heater and switch it off when you leave the room or go to sleep." },
  { id: "alarm", hazard: false, title: "Smoke alarm", text: "This is a good thing! A working smoke alarm gives early warning of a fire. Test it monthly with its button." },
  { id: "switch", hazard: false, title: "Wall switch", text: "This switch has its cover plate fitted and is dry. Nothing wrong here." },
  { id: "laptop", hazard: false, title: "Laptop on the desk", text: "A laptop on a hard desk can let out its heat. This is the right way to use it." },
];
const HAZARDS = SPOTS.filter(s => s.hazard).length;

/** A room with hidden electrical hazards. Click or tap what looks unsafe. */
export function HazardHunt() {
  const [found, setFound] = useState<string[]>([]), [last, setLast] = useState<Spot | null>(null), [misses, setMisses] = useState(0);
  const pick = (id: string) => { const s = SPOTS.find(x => x.id === id)!; setLast(s); if (s.hazard) { if (!found.includes(id)) setFound([...found, id]); } else setMisses(m => m + 1); };
  const props = (id: string, label: string) => ({ role: "button", tabIndex: 0, "aria-label": label, className: `hazard-spot${found.includes(id) ? " is-found" : ""}`, onClick: () => pick(id), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(id); } } });
  const done = found.length === HAZARDS;
  return <section className="panel section-gap hazard-hunt" aria-labelledby="hazard-heading">
    <div className="row between"><div><p className="eyebrow">Electrical safety at home</p><h2 id="hazard-heading">Spot the hazard</h2></div><span className="tag">{found.length} / {HAZARDS} found{misses ? ` · ${misses} safe item${misses === 1 ? "" : "s"} picked` : ""}</span></div>
    <p className="muted">This hostel room has {HAZARDS} electrical dangers hidden in plain sight, and a few things that are perfectly safe. Tap anything that looks unsafe.</p>
    <div className="hazard-layout">
      <svg viewBox="0 0 800 450" className="hazard-room" role="group" aria-label="A hostel room. Tap the items that are dangerous.">
        <rect width="800" height="450" fill="#2c3b3f" /><rect y="330" width="800" height="120" fill="#4a3c30" /><path d="M0 330H800" stroke="#1c2629" strokeWidth="4" />
        <rect x="560" y="40" width="180" height="150" fill="#9fc9dd" stroke="#e6dcc4" strokeWidth="8" /><path d="M650 40V190M560 115H740" stroke="#e6dcc4" strokeWidth="5" />
        {/* curtain + heater */}
        <g {...props("heater", "Room heater beside the curtain")}><path d="M540 30Q555 120 540 330H585Q570 200 590 30Z" fill="#b5675c" /><rect x="565" y="262" width="78" height="66" rx="8" fill="#8a9599" /><path d="M575 280h58M575 295h58M575 310h58" stroke="#f0874f" strokeWidth="5" /><circle cx="604" cy="296" r="58" className="hit" /></g>
        {/* smoke alarm */}
        <g {...props("alarm", "Smoke alarm on the ceiling")}><circle cx="300" cy="28" r="18" fill="#eef0ea" /><circle cx="300" cy="28" r="4" fill="#e04b3c" /><circle cx="300" cy="28" r="30" className="hit" /></g>
        {/* switch */}
        <g {...props("switch", "Wall switch by the door")}><rect x="40" y="170" width="34" height="50" rx="4" fill="#eef0ea" /><rect x="50" y="182" width="14" height="24" rx="2" fill="#c9cdc4" /><circle cx="57" cy="195" r="34" className="hit" /></g>
        {/* bed + pillow + phone */}
        <rect x="40" y="260" width="250" height="70" rx="10" fill="#4f6b8a" /><rect x="40" y="300" width="250" height="30" fill="#3c536b" />
        <g {...props("pillow", "Phone charging under the pillow")}><rect x="52" y="240" width="90" height="38" rx="16" fill="#eef0ea" /><rect x="72" y="270" width="30" height="10" fill="#222" /><path d="M102 275Q170 290 175 330" stroke="#222" strokeWidth="3" fill="none" /><circle cx="100" cy="265" r="45" className="hit" /></g>
        {/* desk + laptop + lamp */}
        <rect x="320" y="230" width="200" height="14" fill="#8a6a4c" /><rect x="330" y="244" width="12" height="86" fill="#6b523b" /><rect x="498" y="244" width="12" height="86" fill="#6b523b" />
        <g {...props("laptop", "Laptop on the desk")}><rect x="345" y="200" width="70" height="30" rx="3" fill="#2a3236" stroke="#9aa8ac" strokeWidth="3" /><rect x="335" y="226" width="90" height="6" rx="2" fill="#9aa8ac" /><circle cx="380" cy="215" r="40" className="hit" /></g>
        <path d="M470 230V170L500 150" stroke="#c9cdc4" strokeWidth="5" fill="none" /><path d="M485 140l35 10-12 20Z" fill="#e6c78f" />
        <g {...props("frayed", "Lamp cable with damaged insulation")}><path d="M470 232Q460 290 430 300" stroke="#eef0ea" strokeWidth="5" fill="none" /><path d="M430 300Q415 304 405 312" stroke="#d98b3a" strokeWidth="3" strokeDasharray="2 2" fill="none" /><path d="M405 312Q392 320 380 330" stroke="#eef0ea" strokeWidth="5" fill="none" /><circle cx="418" cy="306" r="30" className="hit" /></g>
        {/* rug with cable */}
        <ellipse cx="420" cy="395" rx="150" ry="34" fill="#7d4f6b" />
        <g {...props("rug", "Cable running under the rug")}><path d="M260 395H275M565 395H600" stroke="#eef0ea" strokeWidth="5" /><path d="M275 395H565" stroke="#eef0ea" strokeWidth="5" strokeDasharray="10 12" opacity=".35" /><circle cx="300" cy="395" r="28" className="hit" /><circle cx="560" cy="395" r="28" className="hit" /></g>
        {/* extension board + water + adapter */}
        <rect x="610" y="380" width="120" height="24" rx="5" fill="#eef0ea" /><path d="M600 392H572" stroke="#eef0ea" strokeWidth="5" />
        <g {...props("water", "Glass of water on the extension board")}><path d="M690 340h22l-3 40h-16Z" fill="#9fd3e8" stroke="#eef0ea" strokeWidth="2" /><path d="M694 352h14" stroke="#eef0ea" strokeWidth="2" /><circle cx="701" cy="360" r="30" className="hit" /></g>
        <g {...props("adapter", "Adapters stacked on one socket")}><rect x="625" y="362" width="26" height="20" fill="#d8dad3" /><rect x="621" y="344" width="34" height="20" fill="#c9cdc4" /><rect x="628" y="326" width="22" height="20" fill="#b8bcb2" /><path d="M640 326Q630 300 600 290M650 340Q680 310 700 318" stroke="#222" strokeWidth="3" fill="none" /><circle cx="638" cy="350" r="32" className="hit" /></g>
      </svg>
      <div className="hazard-panel">
        {last ? <div className={`notice${last.hazard ? " error" : ""}`} role="status"><strong>{last.hazard ? "⚠ Hazard: " : "✓ Safe: "}{last.title}</strong><p>{last.text}</p></div> : <p className="notice">Tap something in the room to inspect it.</p>}
        {done && <p className="notice success" role="status">All {HAZARDS} hazards found{misses ? ` (and ${misses} safe item${misses === 1 ? "" : "s"} checked)` : " with no wrong guesses"}. Now look around your own room or hostel with the same eyes.</p>}
        {found.length > 0 && <ol className="hazard-found">{SPOTS.filter(s => found.includes(s.id)).map(s => <li key={s.id}><button className="linkish" onClick={() => setLast(s)}>{s.title}</button></li>)}</ol>}
        <button className="btn secondary" onClick={() => { setFound([]); setLast(null); setMisses(0); }}>Start again</button>
      </div>
    </div>
    <p className="small muted">Never repair mains wiring yourself. If you see a hazard like these in real life, switch off at the socket if it is safe to do so, and tell the warden, a teacher or a qualified electrician.</p>
  </section>;
}

type Row = { name: string; watts: number; count: number; hours: number };
const DEFAULT_ROWS: Row[] = [
  { name: "LED bulb", watts: 9, count: 4, hours: 6 }, { name: "Ceiling fan", watts: 60, count: 2, hours: 8 }, { name: "Television", watts: 80, count: 1, hours: 3 },
  { name: "Refrigerator (runs about half the day)", watts: 150, count: 1, hours: 12 }, { name: "Phone charger", watts: 10, count: 3, hours: 2 }, { name: "Laptop", watts: 50, count: 1, hours: 4 },
  { name: "Rice cooker", watts: 700, count: 1, hours: 1 }, { name: "Clothes iron", watts: 1000, count: 1, hours: 0.25 }, { name: "Water heater (geyser)", watts: 2000, count: 1, hours: 0.5 },
];
/** kWh per day for one row: watts × number × hours ÷ 1000. */
const rowKwh = (r: Row) => r.watts * r.count * r.hours / 1000;

/** Work out a household electricity bill from watts and hours. */
export function EnergyCalculator() {
  const [rows, setRows] = useState(DEFAULT_ROWS), [rate, setRate] = useState(6);
  const set = (i: number, key: "watts" | "count" | "hours", value: string) => { const n = Math.max(0, Math.min(key === "hours" ? 24 : 10000, Number(value) || 0)); setRows(rows.map((r, j) => j === i ? { ...r, [key]: n } : r)); };
  const daily = rows.reduce((n, r) => n + rowKwh(r), 0), monthly = daily * 30, cost = monthly * rate;
  const top = [...rows].sort((a, b) => rowKwh(b) - rowKwh(a))[0];
  return <section className="panel section-gap energy-calc" aria-labelledby="energy-heading">
    <div className="row between"><div><p className="eyebrow">Electricity at home</p><h2 id="energy-heading">What does it cost to run?</h2></div><span className="tag">kWh = watts × hours ÷ 1000</span></div>
    <p className="muted">The electricity bill counts units: one unit is one kilowatt-hour (kWh), such as a 1000 W iron used for one hour. Change the numbers to match your home. Wattage is printed on each appliance’s label.</p>
    <label className="energy-rate">Price per unit (₹/kWh)<input type="number" min="0" step="0.5" value={rate} onChange={e => setRate(Math.max(0, Number(e.target.value) || 0))} /></label>
    <div className="energy-table" role="table" aria-label="Appliances">
      <div role="row" className="energy-row head"><span role="columnheader">Appliance</span><span role="columnheader">Watts</span><span role="columnheader">How many</span><span role="columnheader">Hours a day</span><span role="columnheader">Units a month</span></div>
      {rows.map((r, i) => <div role="row" className="energy-row" key={r.name}><span role="cell">{r.name}</span>
        {(["watts", "count", "hours"] as const).map(k => <span role="cell" key={k}><input type="number" min="0" step={k === "hours" ? 0.25 : 1} value={r[k]} aria-label={`${r.name} ${k}`} onChange={e => set(i, k, e.target.value)} /></span>)}
        <span role="cell" className="energy-units">{(rowKwh(r) * 30).toFixed(1)}</span></div>)}
    </div>
    <div className="energy-total"><div><strong>{daily.toFixed(2)}</strong><small>units a day</small></div><div><strong>{monthly.toFixed(0)}</strong><small>units a month</small></div><div><strong>₹{cost.toFixed(0)}</strong><small>a month at ₹{rate}/unit</small></div></div>
    {top && rowKwh(top) > 0 && <p className="notice">Biggest user: <strong>{top.name}</strong> at {(rowKwh(top) * 30).toFixed(1)} units a month ({Math.round(rowKwh(top) / daily * 100)}% of the total). Heating appliances use the most power: a 2000 W geyser for 30 minutes uses as much as a 9 W LED bulb for {Math.round(1000 / 9)} hours.</p>}
    <p className="small muted">Real bills add fixed charges and taxes, and tariffs differ by slab and state. Check your own bill for the price per unit.</p>
  </section>;
}
