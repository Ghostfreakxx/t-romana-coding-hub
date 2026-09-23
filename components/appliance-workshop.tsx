"use client";

import { useState } from "react";

type Fault = { id: string; symptom: string; clues: [string, string, string]; repair: number; why: string };
type Appliance = { name: string; description: string; kind: "lamp" | "fan" | "bell"; checks: [string, string, string]; repairs: [string, string, string]; faults: [Fault, Fault] };

const APPLIANCES: Appliance[] = [
  {
    name: "Battery torch", kind: "lamp", description: "A small torch powered by removable dry-cell batteries.",
    checks: ["Check battery indicator", "Inspect contact", "Inspect lamp"],
    repairs: ["Replace virtual batteries", "Reseat virtual contact", "Replace virtual lamp"],
    faults: [
      { id: "torch-battery", symptom: "The torch will not light.", clues: ["Battery indicator: empty.", "Contact: seated firmly.", "Lamp: looks intact."], repair: 0, why: "The cells were depleted. Replacing the virtual batteries restores the circuit's power." },
      { id: "torch-contact", symptom: "The torch flickers and then goes dark.", clues: ["Battery indicator: charged.", "Contact: loose, so the path is open.", "Lamp: looks intact."], repair: 1, why: "A loose contact interrupted the path. Reseating it closes the virtual circuit." },
    ],
  },
  {
    name: "Battery fan", kind: "fan", description: "A small battery-driven fan with a protected rotor.",
    checks: ["Check battery indicator", "Inspect rotor", "Inspect switch"],
    repairs: ["Replace virtual batteries", "Clear virtual rotor", "Replace virtual switch"],
    faults: [
      { id: "fan-battery", symptom: "The fan will not spin.", clues: ["Battery indicator: empty.", "Rotor: turns freely in the simulation.", "Switch: working."], repair: 0, why: "The cells were depleted. With power restored, the motor can spin the rotor." },
      { id: "fan-rotor", symptom: "The fan hums but does not turn.", clues: ["Battery indicator: charged.", "Rotor: blocked in the simulation.", "Switch: working."], repair: 1, why: "The simulated rotor was blocked. Clearing the virtual obstruction lets it spin." },
    ],
  },
  {
    name: "Battery doorbell", kind: "bell", description: "A simple push-button buzzer powered by removable dry cells.",
    checks: ["Check battery indicator", "Inspect button", "Inspect buzzer"],
    repairs: ["Replace virtual batteries", "Replace virtual button", "Replace virtual buzzer"],
    faults: [
      { id: "bell-battery", symptom: "Pressing the button makes no sound.", clues: ["Battery indicator: empty.", "Button: closes the virtual path.", "Buzzer: working."], repair: 0, why: "The cells were depleted. With power restored, the buzzer receives energy." },
      { id: "bell-button", symptom: "The button clicks, but the bell stays silent.", clues: ["Battery indicator: charged.", "Button: stuck open in the simulation.", "Buzzer: working."], repair: 1, why: "The faulty button left the path open. Replacing the virtual button lets the circuit close." },
    ],
  },
];

function AppliancePicture({ kind, working, tested }: { kind: Appliance["kind"]; working: boolean; tested: boolean }) {
  return <div className={`appliance-scene ${working ? "is-working" : ""}`}>
    <svg viewBox="0 0 480 270" role="img" aria-label={`${kind === "lamp" ? "Torch" : kind === "fan" ? "Fan" : "Doorbell"} ${tested ? working ? "working" : "still faulty" : "waiting for test"}`}>
      <defs><radialGradient id="appliance-glow"><stop stopColor="#fffbd7" stopOpacity=".95"/><stop offset="1" stopColor="#fffbd7" stopOpacity="0"/></radialGradient></defs>
      {kind === "lamp" && <>
        {working && <><ellipse cx="395" cy="135" rx="90" ry="100" fill="url(#appliance-glow)"/><path d="M325 95 L470 20 M325 175 L470 250" stroke="#ffe9a1" strokeWidth="5"/></>}
        <rect x="88" y="102" width="215" height="66" rx="19" fill="#a9d77f" stroke="#e2f4c8" strokeWidth="5"/>
        <path d="M303 96 Q342 105 342 135 Q342 165 303 174Z" fill={working ? "#fff4b8" : "#8d9e93"} stroke="#e2f4c8" strokeWidth="5"/>
        <rect x="175" y="91" width="52" height="15" rx="4" fill="#4a5b42"/><rect x="106" y="118" width="50" height="31" rx="5" fill="#486947"/>
      </>}
      {kind === "fan" && <>
        <path d="M225 180 L235 180 L245 245 L210 245Z" fill="#8ccbb0"/><rect x="176" y="240" width="106" height="15" rx="8" fill="#9bd5b7"/>
        <circle cx="230" cy="112" r="93" fill="#375a56" stroke="#a7dcc5" strokeWidth="9"/>
        <g className="appliance-blades" style={{ transformOrigin:"230px 112px" }}>
          <path d="M228 107 Q176 65 200 39 Q236 30 241 105Z M228 107 Q285 67 311 93 Q322 126 243 121Z M228 107 Q238 172 210 184 Q176 168 218 113Z" fill="#c6ee90"/>
        </g><circle cx="230" cy="112" r="17" fill="#f0f8e5"/>
      </>}
      {kind === "bell" && <>
        {working && <><path d="M304 71 Q335 111 304 150 M342 50 Q390 109 342 170" fill="none" stroke="#c6ee90" strokeWidth="6" strokeLinecap="round"/></>}
        <rect x="120" y="30" width="180" height="207" rx="28" fill="#577b67" stroke="#b5dcc0" strokeWidth="7"/>
        <circle cx="210" cy="126" r="61" fill={working ? "#c6ee90" : "#a7b5a3"} stroke="#edf6e5" strokeWidth="7"/><circle cx="210" cy="126" r="22" fill="#496b54"/>
        <text x="178" y="216" fill="#edf6e5" fontSize="20">DING</text>
      </>}
    </svg>
    <span className="appliance-status">{tested ? working ? "WORKING" : "FAULT STILL PRESENT" : "READY TO TEST"}</span>
  </div>;
}

export default function ApplianceWorkshop() {
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [rounds, setRounds] = useState([0, 0, 0]);
  const [power, setPower] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [repaired, setRepaired] = useState(false);
  const [tested, setTested] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("Turn the virtual power on to observe the fault, then switch it off before inspecting or repairing.");
  const device = APPLIANCES[deviceIndex];
  const fault = device.faults[rounds[deviceIndex] % device.faults.length];
  const working = power && tested && repaired;
  const reset = (message: string) => { setPower(false); setChecked([]); setRepaired(false); setTested(false); setFeedback(message); };

  const attemptRepair = (option: number) => {
    if (power) { setFeedback("Switch the virtual power off before changing any part."); return; }
    if (checked.length === 0) { setFeedback("Inspect at least one part before choosing a repair."); return; }
    if (option !== fault.repair) { setFeedback("That part was not the fault. Check the observations and try another repair."); return; }
    setRepaired(true);
    setFeedback("Virtual repair applied. Turn the power on and run the test to see whether it worked.");
  };

  const runTest = () => {
    if (!power) { setFeedback("Turn the virtual power on before testing."); return; }
    setTested(true);
    if (!repaired) { setFeedback("The fault is still present. Switch the power off, inspect the parts and choose a repair."); return; }
    setFeedback(`Success! ${fault.why}`);
    if (!completed.includes(fault.id)) setCompleted(previous => [...previous, fault.id]);
  };

  return <section className="panel appliance-workshop" aria-label="Virtual appliance repair workshop">
    <p className="eyebrow">Interactive repair practice</p>
    <h2>Find the fault. Fix the virtual appliance.</h2>
    <p className="muted">Work through six simple cases using battery-powered models. Inspect, choose a repair, then test the result. {completed.length} / 6 cases solved.</p>
    <p className="notice">This is a simulation. Do not open a plugged-in appliance, damaged battery pack, or live wiring. For a real faulty appliance, stop using it and contact the manufacturer or a qualified repair technician.</p>
    <div className="tabs" role="group" aria-label="Choose an appliance">
      {APPLIANCES.map((item, index) => <button type="button" key={item.name} aria-pressed={deviceIndex === index} onClick={() => { setDeviceIndex(index); reset(`Selected ${item.name}. Observe the fault, then inspect its parts with the virtual power off.`); }}>{item.name}</button>)}
    </div>
    <div className="two-col appliance-layout">
      <div><AppliancePicture kind={device.kind} working={working} tested={tested}/><p className="small muted">{device.description}</p><p><strong>Problem:</strong> {fault.symptom}</p><div className="row"><button type="button" className="btn secondary" aria-pressed={power} onClick={() => { setPower(!power); setTested(false); setFeedback(power ? "Virtual power off. You can now inspect and repair." : "Virtual power on. Run the test to observe the result."); }}>{power ? "Switch power off" : "Switch power on"}</button><button type="button" className="btn" onClick={runTest}>Run test</button></div></div>
      <div className="stack"><div><h3>1. Inspect with power off</h3><div className="appliance-options">{device.checks.map((item, index) => <button type="button" className="btn secondary" key={item} disabled={power} onClick={() => { if (!checked.includes(index)) setChecked([...checked, index]); }}>{item}</button>)}</div><div className="stack appliance-clues">{checked.map(index => <p className="notice" key={index}><strong>{device.checks[index]}:</strong> {fault.clues[index]}</p>)}</div></div><div><h3>2. Choose a virtual repair</h3><div className="appliance-options">{device.repairs.map((item, index) => <button type="button" className="btn secondary" key={item} disabled={power || repaired} onClick={() => attemptRepair(index)}>{item}</button>)}</div></div><p role="status" className={`notice ${working ? "success" : ""}`}>{feedback}</p>{working && <button type="button" className="btn" onClick={() => { setRounds(previous => previous.map((round, index) => index === deviceIndex ? round + 1 : round)); reset("New fault loaded. Turn on the virtual power to observe it."); }}>Try another fault →</button>}</div>
    </div>
  </section>;
}
