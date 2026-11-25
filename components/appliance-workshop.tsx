"use client";

import { useState } from "react";
import { PartArt } from "./lab-art";
import { emptyList, isStringList, useSaved } from "@/lib/storage";

type Fault = { id: string; symptom: string; clues: [string, string, string]; repair: number; why: string };
type PartKind = "battery" | "switch" | "motor" | "lamp" | "buzzer" | "contact";
type Appliance = { name: string; description: string; kind: "lamp" | "fan" | "bell" | "car"; parts: [PartKind, PartKind, PartKind]; checks: [string, string, string]; repairs: [string, string, string]; faults: Fault[] };

const APPLIANCES: Appliance[] = [
  {
    name: "Battery torch", kind: "lamp", parts: ["battery", "contact", "lamp"], description: "A small torch powered by removable dry-cell batteries.",
    checks: ["Check battery indicator", "Inspect contact", "Inspect lamp"],
    repairs: ["Replace virtual batteries", "Reseat virtual contact", "Replace virtual lamp"],
    faults: [
      { id: "torch-battery", symptom: "The torch will not light.", clues: ["Battery indicator: empty.", "Contact: seated firmly.", "Lamp: looks intact."], repair: 0, why: "The cells were depleted. Replacing the virtual batteries restores the circuit's power." },
      { id: "torch-contact", symptom: "The torch flickers and then goes dark.", clues: ["Battery indicator: charged.", "Contact: loose, so the path is open.", "Lamp: looks intact."], repair: 1, why: "A loose contact interrupted the path. Reseating it closes the virtual circuit." },
      { id: "torch-lamp", symptom: "The torch stays dark even with charged cells.", clues: ["Battery indicator: charged.", "Contact: seated firmly.", "Lamp: failed in the virtual component test."], repair: 2, why: "The lamp was the failed component. Replacing the virtual lamp restores the light." },
    ],
  },
  {
    name: "Battery fan", kind: "fan", parts: ["battery", "motor", "switch"], description: "A small battery-driven fan with a protected rotor.",
    checks: ["Check battery indicator", "Inspect rotor", "Inspect switch"],
    repairs: ["Replace virtual batteries", "Clear virtual rotor", "Replace virtual switch"],
    faults: [
      { id: "fan-battery", symptom: "The fan will not spin.", clues: ["Battery indicator: empty.", "Rotor: turns freely in the simulation.", "Switch: working."], repair: 0, why: "The cells were depleted. With power restored, the motor can spin the rotor." },
      { id: "fan-rotor", symptom: "The fan hums but does not turn.", clues: ["Battery indicator: charged.", "Rotor: blocked in the simulation.", "Switch: working."], repair: 1, why: "The simulated rotor was blocked. Clearing the virtual obstruction lets it spin." },
      { id: "fan-switch", symptom: "The fan does not respond to its switch.", clues: ["Battery indicator: charged.", "Rotor: turns freely in the simulation.", "Switch: fails to close the circuit."], repair: 2, why: "The switch was faulty. Replacing it restores the virtual current path." },
    ],
  },
  {
    name: "Battery doorbell", kind: "bell", parts: ["battery", "switch", "buzzer"], description: "A simple push-button buzzer powered by removable dry cells.",
    checks: ["Check battery indicator", "Inspect button", "Inspect buzzer"],
    repairs: ["Replace virtual batteries", "Replace virtual button", "Replace virtual buzzer"],
    faults: [
      { id: "bell-battery", symptom: "Pressing the button makes no sound.", clues: ["Battery indicator: empty.", "Button: closes the virtual path.", "Buzzer: working."], repair: 0, why: "The cells were depleted. With power restored, the buzzer receives energy." },
      { id: "bell-button", symptom: "The button clicks, but the bell stays silent.", clues: ["Battery indicator: charged.", "Button: stuck open in the simulation.", "Buzzer: working."], repair: 1, why: "The faulty button left the path open. Replacing the virtual button lets the circuit close." },
      { id: "bell-buzzer", symptom: "The doorbell is silent despite a working button.", clues: ["Battery indicator: charged.", "Button: closes the virtual path.", "Buzzer: failed in the virtual component test."], repair: 2, why: "The buzzer could no longer turn electrical energy into sound. Replacing the virtual buzzer fixes this case." },
    ],
  },
  {
    name: "LED reading lamp", kind: "lamp", parts: ["battery", "switch", "lamp"], description: "A rechargeable desk lamp with a built-in battery pack and an LED panel.",
    checks: ["Check battery indicator", "Inspect switch", "Inspect LED panel"],
    repairs: ["Recharge virtual battery", "Replace virtual switch", "Replace virtual LED panel"],
    faults: [
      { id: "led-battery", symptom: "The lamp glows very dimly and then switches off.", clues: ["Battery indicator: one red bar, nearly flat.", "Switch: clicks and closes the virtual path.", "LED panel: passes the virtual component test."], repair: 0, why: "The battery was nearly flat. LEDs dim and cut out as the voltage falls; recharging restores full brightness." },
      { id: "led-switch", symptom: "The lamp only lights if the switch is pressed and held.", clues: ["Battery indicator: full.", "Switch: springs back and opens the path when released.", "LED panel: passes the virtual component test."], repair: 1, why: "A worn switch could not stay closed. A new virtual switch keeps the path complete." },
      { id: "led-panel", symptom: "The battery is full and the switch clicks, but nothing lights.", clues: ["Battery indicator: full.", "Switch: clicks and closes the virtual path.", "LED panel: failed in the virtual component test."], repair: 2, why: "The LED panel had failed. LEDs only pass current in one direction and can fail open; a new panel lights again." },
    ],
  },
  {
    name: "Battery toy car", kind: "car", parts: ["battery", "contact", "motor"], description: "A toy car with two AA cells, spring contacts and a small DC motor driving the wheels.",
    checks: ["Check battery indicator", "Inspect battery contacts", "Inspect motor"],
    repairs: ["Replace virtual batteries", "Clean virtual contacts", "Replace virtual motor"],
    faults: [
      { id: "car-battery", symptom: "The car moves very slowly, then stops.", clues: ["Battery indicator: empty.", "Contacts: clean and springy.", "Motor: turns freely in the virtual test."], repair: 0, why: "Weak cells cannot give the motor enough current to turn the wheels. Fresh virtual cells fix it." },
      { id: "car-contact", symptom: "The car works only when you squeeze the battery cover.", clues: ["Battery indicator: charged.", "Contacts: green corrosion from an old leaking cell.", "Motor: turns freely in the virtual test."], repair: 1, why: "Corrosion on the contacts made a poor connection. Cleaning the virtual contacts closes the circuit firmly." },
      { id: "car-motor", symptom: "Fresh batteries are fitted, but the wheels never turn.", clues: ["Battery indicator: charged.", "Contacts: clean and springy.", "Motor: failed in the virtual test (open winding)."], repair: 2, why: "The motor's coil was broken, so no current could flow through it. A new virtual motor turns the wheels." },
    ],
  },
];

function AppliancePicture({ kind, working, tested }: { kind: Appliance["kind"]; working: boolean; tested: boolean }) {
  return <div className={`appliance-scene ${working ? "is-working" : ""}`}>
    <svg viewBox="0 0 480 270" role="img" aria-label={`${kind === "lamp" ? "Lamp" : kind === "fan" ? "Fan" : kind === "car" ? "Toy car" : "Doorbell"} ${tested ? working ? "working" : "still faulty" : "waiting for test"}`}>
      <defs><radialGradient id="appliance-glow"><stop stopColor="#fffbd7" stopOpacity=".95"/><stop offset="1" stopColor="#fffbd7" stopOpacity="0"/></radialGradient><linearGradient id="appliance-metal" x2="0.8" y2="1"><stop stopColor="#d0e8dc"/><stop offset=".45" stopColor="#668b7d"/><stop offset="1" stopColor="#29493f"/></linearGradient></defs>
      <ellipse cx="235" cy="250" rx="120" ry="12" fill="#0005"/>
      {kind === "lamp" && <>
        {working && <><ellipse cx="395" cy="135" rx="90" ry="100" fill="url(#appliance-glow)"/><path d="M325 95 L470 20 M325 175 L470 250" stroke="#ffe9a1" strokeWidth="5"/></>}
        <rect x="88" y="102" width="215" height="66" rx="19" fill="url(#appliance-metal)" stroke="#e2f4c8" strokeWidth="5"/>
        <path d="M303 96 Q342 105 342 135 Q342 165 303 174Z" fill={working ? "#fff4b8" : "#8d9e93"} stroke="#e2f4c8" strokeWidth="5"/>
        <rect x="175" y="91" width="52" height="15" rx="4" fill="#4a5b42"/><rect x="106" y="118" width="50" height="31" rx="5" fill="#486947"/>
      </>}
      {kind === "fan" && <>
        <path d="M225 180 L235 180 L245 245 L210 245Z" fill="#8ccbb0"/><rect x="176" y="240" width="106" height="15" rx="8" fill="#9bd5b7"/>
        <circle cx="230" cy="112" r="93" fill="#375a56" stroke="#a7dcc5" strokeWidth="9"/>
        <g className="appliance-blades" style={{ transformOrigin:"230px 112px" }}>
          <path d="M228 107 Q176 65 200 39 Q236 30 241 105Z M228 107 Q285 67 311 93 Q322 126 243 121Z M228 107 Q238 172 210 184 Q176 168 218 113Z" fill="#c6ee90"/>
        </g>{[30,55,78].map(r=><circle key={r} cx="230" cy="112" r={r} fill="none" stroke="#d6e8de66" strokeWidth="2"/>)}<path d="M137 112H323M230 19V205" stroke="#d6e8de88" strokeWidth="3"/><circle cx="230" cy="112" r="17" fill="url(#appliance-metal)"/>
      </>}
      {kind === "car" && <>
        <rect x="95" y="120" width="270" height="70" rx="22" fill="url(#appliance-metal)" stroke="#e2f4c8" strokeWidth="5"/>
        <path d="M150 122 L180 78 H290 L320 122Z" fill="#375a56" stroke="#e2f4c8" strokeWidth="5"/><path d="M190 86 H232 V118 H170Z M242 86 H284 L306 118 H242Z" fill="#a9d7e4"/>
        {[160, 300].map(x => <g key={x} className="appliance-blades" style={{ transformOrigin: `${x}px 195px` }}><circle cx={x} cy="195" r="32" fill="#1d2a2f" stroke="#c6ee90" strokeWidth="5"/><path d={`M${x - 22} 195H${x + 22}M${x} 173V217`} stroke="#c6ee90" strokeWidth="4"/></g>)}
        {working && <path d="M60 140H20M70 160H35M60 180H25" stroke="#c6ee90" strokeWidth="5" strokeLinecap="round"/>}
        <rect x="350" y="140" width="18" height="14" rx="3" fill={working ? "#fff4b8" : "#8d9e93"}/>
      </>}
      {kind === "bell" && <>
        {working && <><path d="M304 71 Q335 111 304 150 M342 50 Q390 109 342 170" fill="none" stroke="#c6ee90" strokeWidth="6" strokeLinecap="round"/></>}
        <rect x="120" y="30" width="180" height="207" rx="28" fill="url(#appliance-metal)" stroke="#b5dcc0" strokeWidth="7"/>
        <circle cx="210" cy="126" r="61" fill={working ? "#c6ee90" : "#a7b5a3"} stroke="#edf6e5" strokeWidth="7"/><circle cx="210" cy="126" r="22" fill="#496b54"/>
        <text x="178" y="216" fill="#edf6e5" fontSize="20">DING</text>
      </>}
    </svg>
    <span className="appliance-status">{tested ? working ? "WORKING" : "FAULT STILL PRESENT" : "READY TO TEST"}</span>
  </div>;
}

export default function ApplianceWorkshop() {
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [rounds, setRounds] = useState(() => APPLIANCES.map(() => 0));
  const [power, setPower] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [repaired, setRepaired] = useState(false);
  const [tested, setTested] = useState(false);
  const saved = useSaved("appliance-cases", emptyList, isStringList);
  const completed = saved.value.filter(id=>APPLIANCES.some(a=>a.faults.some(f=>f.id===id)));
  const [inside, setInside] = useState(true);
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("Turn the virtual power on to observe the fault, then switch it off before inspecting or repairing.");
  const device = APPLIANCES[deviceIndex];
  const fault = device.faults[rounds[deviceIndex] % device.faults.length];
  const working = power && tested && repaired;
  const reset = (message: string) => { setPower(false); setChecked([]); setSelectedPart(null); setAttempts(0); setRepaired(false); setTested(false); setFeedback(message); };
  const inspect = (index:number) => { if(power)return; setSelectedPart(index); if(!checked.includes(index))setChecked([...checked,index]); };

  const attemptRepair = (option: number) => {
    if (power) { setFeedback("Switch the virtual power off before changing any part."); return; }
    if (!checked.includes(option)) { setFeedback("Inspect this part first so your repair follows the evidence."); return; }
    setAttempts(previous=>previous+1);
    if (option !== fault.repair) { setFeedback("That part was not the fault. Check the observations and try another repair."); return; }
    setRepaired(true);
    setFeedback("Virtual repair applied. Turn the power on and run the test to see whether it worked.");
  };

  const runTest = () => {
    if (!power) { setFeedback("Turn the virtual power on before testing."); return; }
    setTested(true);
    if (!repaired) { setFeedback("The fault is still present. Switch the power off, inspect the parts and choose a repair."); return; }
    setFeedback(`Success! ${fault.why}`);
    if (!completed.includes(fault.id)) saved.setValue([...completed, fault.id]);
  };

  return <section className="panel appliance-workshop" aria-label="Virtual appliance repair workshop">
    <p className="eyebrow">Interactive repair practice</p>
    <h2>Find the fault. Fix the virtual appliance.</h2>
    <p className="muted">Fifteen faults across five appliances. Look inside the virtual appliance, inspect its parts, choose a repair and verify it. Your completed cases are saved in this browser.</p>
    <div className="workshop-progress"><strong>{completed.length} / {APPLIANCES.length * 3} solved</strong><progress max={APPLIANCES.length * 3} value={completed.length} aria-label="Repair cases solved"/><span>{attempts} repair attempts this case</span></div>
    <p className="notice">This is a simulation. Do not open a plugged-in appliance, damaged battery pack, or live wiring. For a real faulty appliance, stop using it and contact the manufacturer or a qualified repair technician.</p>
    <div className="tabs" role="group" aria-label="Choose an appliance">
      {APPLIANCES.map((item, index) => <button type="button" key={item.name} aria-pressed={deviceIndex === index} onClick={() => { setDeviceIndex(index); reset(`Selected ${item.name}. Observe the fault, then inspect its parts with the virtual power off.`); }}>{item.name}</button>)}
    </div>
    <div className="row between section-gap"><label>Practice case <select value={rounds[deviceIndex]%device.faults.length} onChange={e=>{const value=Number(e.target.value);setRounds(previous=>previous.map((n,i)=>i===deviceIndex?value:n));reset("New case selected. Test, inspect and repair.");}}>{device.faults.map((item,index)=><option value={index} key={item.id}>Case {index+1}{completed.includes(item.id)?" · solved":""}</option>)}</select></label><button className="btn secondary" aria-pressed={inside} onClick={()=>setInside(!inside)}>{inside?"Hide inside view":"Look inside"}</button></div>
    {inside&&<div className={`repair-board ${working?"powered":""}`}><div className="repair-board-top"><strong>Virtual diagnostic bench</strong><span className="tag">{power?"POWER ON · INSPECTION LOCKED":"POWER OFF · READY"}</span></div><div className="repair-parts">{device.checks.map((name,index)=><button key={name} className={`repair-part ${selectedPart===index?"selected":""}`} disabled={power} onClick={()=>inspect(index)}><PartArt kind={device.parts[index]}/><strong>{name.replace(/Check |Inspect /,"")}</strong><small>{checked.includes(index)?"Inspected":"Tap to inspect"}</small></button>)}</div><div className="virtual-meter"><span>SIMULATED TEST RESULT</span><strong>{selectedPart===null?"SELECT A PART":repaired?"PASS":selectedPart===0?(fault.repair===0?"0.4 V · LOW":"3.0 V · OK"):selectedPart===fault.repair?"FAULT FOUND":"PASS"}</strong><p>{selectedPart===null?"Select a component above to see its test result.":repaired?"Replacement applied. Run the powered test to verify the complete appliance.":fault.clues[selectedPart]}</p></div><p className="small muted">Readings belong to this simplified 3 V teaching model. They are not instructions for probing real appliances.</p></div>}
    <div className="two-col appliance-layout">
      <div><AppliancePicture kind={device.kind} working={working} tested={tested}/><p className="small muted">{device.description}</p><p><strong>Problem:</strong> {fault.symptom}</p><div className="row"><button type="button" className="btn secondary" aria-pressed={power} onClick={() => { setPower(!power); setTested(false); setFeedback(power ? "Virtual power off. You can now inspect and repair." : "Virtual power on. Run the test to observe the result."); }}>{power ? "Switch power off" : "Switch power on"}</button><button type="button" className="btn" onClick={runTest}>Run test</button></div></div>
      <div className="stack"><div><h3>1. Inspect with power off</h3><div className="appliance-options">{device.checks.map((item, index) => <button type="button" className="btn secondary" key={item} disabled={power} onClick={() => inspect(index)}>{item}</button>)}</div><div className="stack appliance-clues">{checked.map(index => <p className="notice" key={index}><strong>Before repair · {device.checks[index]}:</strong> {fault.clues[index]}</p>)}</div></div><div><h3>2. Choose a virtual repair</h3><div className="appliance-options">{device.repairs.map((item, index) => <button type="button" className="btn secondary" key={item} disabled={power || repaired} onClick={() => attemptRepair(index)}>{item}</button>)}</div></div><p role="status" className={`notice ${working ? "success" : ""}`}>{feedback}</p>{working && <button type="button" className="btn" onClick={() => { setRounds(previous => previous.map((round, index) => index === deviceIndex ? round + 1 : round)); reset("New fault loaded. Turn on the virtual power to observe it."); }}>Try another fault →</button>}</div>
    </div>
    <details className="section-gap"><summary>What are you learning?</summary><p>A battery supplies energy. A switch or contact completes the path. A lamp, motor or buzzer turns electrical energy into light, movement or sound. Similar symptoms can have different causes, so inspect first and replace only the part supported by the evidence.</p><p>A successful repair needs a final test. A fan also has moving parts: a mechanical obstruction can stop it even when its electrical supply is healthy.</p></details>
    {saved.error&&<p role="alert" className="notice error">{saved.error}</p>}
  </section>;
}
