"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { studioTemplates } from "@/data/studio-templates";
import { projects as legacyProjects } from "@/data/projects";
import { makeDocument, type Code } from "@/lib/code";
import { buildCodingPrompt, isProjectList, MAX_CODE, MAX_PROJECTS, parseCodeResponse, validCode, type StudioProject } from "@/lib/coding-studio";
import { download, useSaved } from "@/lib/storage";
const Editor = dynamic(() => import("./studio-editor"), { ssr: false, loading: () => <p className="editor-loading">Loading your editor…</p> });
const INITIAL: StudioProject[] = [{ id: "first-portfolio", name: "My first portfolio", code: studioTemplates[0].code, updated: "" }];
const files = { html: "index.html", css: "styles.css", js: "script.js" };
type ConsoleLine = { level: string; text: string };
function unpack(partial: Partial<Code>, original: Code): Code {
  if (!partial.html) return { ...original, ...partial };
  const doc = new DOMParser().parseFromString(partial.html, "text/html");
  const styles = [...doc.querySelectorAll("style")].map(n => n.textContent ?? "");
  const scripts = [...doc.querySelectorAll("script:not([src])")].map(n => n.textContent ?? "");
  doc.querySelectorAll("style,script,link[rel=stylesheet]").forEach(n => n.remove());
  return { html: doc.body.innerHTML, css: [partial.css ?? (styles.length ? "" : original.css), ...styles].join("\n"), js: [partial.js ?? (scripts.length ? "" : original.js), ...scripts].join("\n") };
}
export default function CodingStudio() {
  const saved = useSaved("studio-projects", INITIAL, isProjectList);
  const [selected, setSelected] = useState(INITIAL[0].id), [language, setLanguage] = useState<keyof Code>("html");
  const [panel, setPanel] = useState("build"), [viewport, setViewport] = useState("desktop"), [message, setMessage] = useState("");
  const [preview, setPreview] = useState(""), [runId, setRunId] = useState(0), [logs, setLogs] = useState<ConsoleLine[]>([]);
  const [idea, setIdea] = useState(""), [task, setTask] = useState("Build a new project"), [shareCode, setShareCode] = useState(false);
  const [answer, setAnswer] = useState(""), [staged, setStaged] = useState<Code | null>(null), [previous, setPrevious] = useState<Code | null>(null);
  const frame = useRef<HTMLIFrameElement>(null), channel = useRef("");
  const project = saved.value.find(p => p.id === selected) ?? saved.value[0];
  const prompt = buildCodingPrompt(idea, task, shareCode ? project.code : undefined);
  function persist(code: Code, name = project.name) {
    if (!validCode(code)) { setMessage("A file exceeds the 600,000-character limit."); return; }
    saved.setValue(saved.value.map(p => p.id === project.id ? { ...p, name, code, updated: new Date().toISOString() } : p));
  }
  const stop = () => { setPreview(""); setLogs([]); };
  function create(name: string, code: Code) {
    if (saved.value.length >= MAX_PROJECTS) { setMessage("Your shelf holds 16 projects. Download and remove one before adding another."); return false; }
    if (!validCode(code)) { setMessage("The imported code is too large."); return false; }
    const next = { id: crypto.randomUUID(), name: name.slice(0, 80), code, updated: new Date().toISOString() };
    saved.setValue([...saved.value, next]); setSelected(next.id); setPrevious(null); stop(); setPanel("build");
    setMessage("Project created. Review the files, then press Run preview."); return true;
  }
  function run() { channel.current = crypto.randomUUID(); setLogs([]); setPreview(makeDocument(project.code, true, channel.current)); setRunId(n => n + 1); setMessage("Preview refreshed. New edits appear when you run again."); }
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const value = event.data;
      if (event.source !== frame.current?.contentWindow || !value || value.channel !== channel.current || typeof value.text !== "string" || !["log", "warn", "error", "info"].includes(value.level)) return;
      setLogs(lines => [...lines.slice(-99), { level: value.level, text: value.text.slice(0, 2000) }]);
    };
    window.addEventListener("message", receive); return () => window.removeEventListener("message", receive);
  }, []);
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setMessage("Copied. Open your AI chat and paste it there."); }
    catch { setMessage("Clipboard unavailable. Select the prompt below and copy it manually."); }
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw Error("Choose a file smaller than 2 MB.");
      const content = await file.text();
      if (/\.html?$/i.test(file.name)) { setAnswer(content); setStaged(unpack(parseCodeResponse(content), { html: "", css: "", js: "" })); setPanel("ai"); setMessage("HTML loaded for review. Import it as a new project when ready."); return; }
      const parsed = JSON.parse(content), code = parsed.code ?? parsed;
      if (!validCode(code)) throw Error("Choose a project JSON backup or an HTML file.");
      create(typeof parsed.name === "string" ? parsed.name : file.name.replace(/\.json$/i, ""), code);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not read that file."); }
  }
  function addImage(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 250_000) { setMessage("Choose a PNG, JPEG or WebP image below 250 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setPrevious(project.code); persist({ ...project.code, html: `${project.code.html}\n<img src="${reader.result}" alt="Describe this image" style="max-width:100%;height:auto">` }); setMessage("Image embedded. Write a helpful alt description, then run the preview."); };
    reader.onerror = () => setMessage("Could not read that image."); reader.readAsDataURL(file);
  }
  const checks = [
    { name: "A main heading", pass: /<h1[\s>]/i.test(project.code.html), hint: "Add a clear <h1> so visitors know what the page is about." },
    { name: "A small-screen layout", pass: /@media|min\(|clamp\(|auto-fit|auto-fill/.test(project.code.css), hint: "Use a flexible grid, clamp() or a media query. Test the phone preview too." },
    { name: "Images have alt text", pass: !/<img\b(?![^>]*\balt\s*=)[^>]*>/i.test(project.code.html), hint: "Add alt text to every image. Use empty alt text only for decoration." },
    { name: "Something interactive", pass: project.code.js.trim().length > 20, hint: "Try a button with an event listener. Test what it does." },
  ];
  return <div className="coding-studio">
    <div className="studio-command"><div><span className="live-dot"/> STUDENT STUDIO <span className="muted">/ browser projects</span></div><span className="tag">No hub account needed</span></div>
    <div className="studio-tabs" role="group" aria-label="Studio sections">{[["build","01 / Workspace"],["templates","02 / Start something"],["ai","03 / Your AI assistant"],["learn","04 / Learn & check"]].map(([id,name])=><button key={id} aria-pressed={panel===id} onClick={()=>setPanel(id)}>{name}</button>)}</div>
    <div className="project-toolbar"><label>Your projects <select value={project.id} onChange={e=>{setSelected(e.target.value);setPrevious(null);setStaged(null);stop();}}>{saved.value.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Project name <input maxLength={80} value={project.name} onChange={e=>persist(project.code,e.target.value)}/></label><button className="btn secondary" onClick={()=>create(`${project.name} copy`,{...project.code})}>Duplicate</button><button className="btn secondary" onClick={()=>{if(saved.value.length===1){setMessage("Keep at least one project on your shelf.");return;}if(confirm(`Delete “${project.name}” from this browser? Download a backup first.`)){const remaining=saved.value.filter(p=>p.id!==project.id);saved.setValue(remaining);setSelected(remaining[0].id);setPrevious(null);stop();setMessage("Project removed from this browser. A downloaded backup can restore it.");}}}>Remove</button></div>
    {panel==="templates"&&<section className="template-grid">{studioTemplates.map(t=><article className={`template-card template-${t.id}`} key={t.id}><div className="template-art" aria-hidden="true"><span/><span/><span/><span/></div><p className="eyebrow">{t.label}</p><h2>{t.name}</h2><p>{t.description}</p><button className="btn" onClick={()=>create(t.name,{...t.code})}>Create project ↗</button></article>)}</section>}
    {panel==="build"&&<><div className="studio-workspace"><section className="studio-code"><div className="editor-top"><div className="tabs" role="group" aria-label="Project files">{(["html","css","js"] as const).map(key=><button key={key} aria-pressed={language===key} onClick={()=>setLanguage(key)}>{files[key]}</button>)}</div><span className="small muted">{project.code[language].split("\n").length} lines</span></div><Editor key={`${project.id}-${language}`} language={language} value={project.code[language]} onChange={value=>{if(value.length<=MAX_CODE)persist({...project.code,[language]:value});else setMessage("File too large. The last accepted edit is still saved.");}}/><div className="editor-actions"><button className="btn" onClick={run}>Run preview ▶</button><button className="btn secondary" disabled={!preview} onClick={stop}>Stop</button><button className="btn secondary" disabled={!previous} onClick={()=>{if(previous){persist(previous);setPrevious(null);setMessage("Previous code restored. Run again to update the preview.");}}}>Undo import / image</button></div></section>
      <section className="studio-preview"><div className="editor-top"><strong>Preview</strong><div className="tabs" role="group" aria-label="Preview size">{["desktop","tablet","phone"].map(size=><button key={size} aria-pressed={viewport===size} onClick={()=>setViewport(size)}>{size}</button>)}</div></div><div className={`preview-scroll preview-${viewport}`}>{preview?<iframe ref={frame} key={runId} sandbox="allow-scripts" title="Student website preview" srcDoc={preview}/>:<div className="preview-empty"><span aria-hidden="true">↗</span><h3>Your next creation goes here.</h3><p>Review your code and press Run preview.</p></div>}</div><p className="small muted preview-caption">Phone: 375 px. Tablet: 768 px. Scroll sideways if needed. External resources, storage and backend services are unavailable in this isolated preview.</p></section></div>
      <section className="studio-console"><div className="row between"><strong>Console <span className="tag">{logs.length}</span></strong><button className="btn secondary" onClick={()=>setLogs([])}>Clear</button></div><div className="console-output" aria-label="Preview console">{logs.length?logs.map((line,index)=><p key={index} className={`console-${line.level}`}><span>{line.level.toUpperCase()}</span>{line.text}</p>):<p className="muted">console.log() messages, errors and blocked resources appear here after you run.</p>}</div></section></>}
    {panel==="ai"&&<section className="ai-workbench"><div className="ai-intro"><p className="eyebrow">Your idea + your own AI</p><h2>Bring an assistant.<br/>Keep control of the code.</h2><p>1. Describe the project. 2. Copy your brief into an AI chat. 3. Paste its answer here, review and import it.</p><p className="notice">This is a copy-and-paste workflow, not a built-in AI model. ChatGPT and Gemini offer free access with their own limits and account requirements. Nothing is sent automatically. Never paste passwords, API keys or personal student data.</p><div className="row"><a className="btn secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a><a className="btn secondary" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Open Gemini ↗</a></div></div><div className="two-col"><div className="panel"><h3>01 / Make your brief</h3><label>What are you doing?<select value={task} onChange={e=>setTask(e.target.value)}>{["Build a new project","Add a feature","Fix an error","Improve the design","Explain my code"].map(t=><option key={t}>{t}</option>)}</select></label><label>Describe your idea<textarea rows={5} maxLength={6000} value={idea} onChange={e=>setIdea(e.target.value)} placeholder="A college club website with events, a dark theme and a search box…"/></label><label className="check"><input type="checkbox" checked={shareCode} onChange={e=>setShareCode(e.target.checked)}/> Include this project’s code in the prompt I will copy</label><button className="btn" onClick={()=>void copy()}>Copy AI brief</button><details className="section-gap"><summary>Read or manually copy the prompt</summary><textarea readOnly rows={9} value={prompt} aria-label="Complete AI prompt"/></details></div><div className="panel"><h3>02 / Review the answer</h3><label>Paste HTML, named code blocks or a project JSON<textarea rows={9} maxLength={MAX_CODE*3} value={answer} onChange={e=>{setAnswer(e.target.value);setStaged(null);}} placeholder="Paste the code response here…"/></label><button className="btn secondary" disabled={!answer.trim()} onClick={()=>{try{setStaged(unpack(parseCodeResponse(answer),project.code));setMessage("Code detected. Inspect the files below. A language absent from the answer keeps its current file.");}catch(e){setStaged(null);setMessage(e instanceof Error?e.message:"Could not read the response.");}}}>Review detected files</button>{staged&&<div className="import-review"><p>No code has run. External scripts and stylesheet links are not imported.</p>{(["html","css","js"] as const).map(key=><details key={key}><summary>{files[key]} · {staged[key].length.toLocaleString()} characters</summary><pre>{staged[key]}</pre></details>)}<div className="row section-gap"><button className="btn" onClick={()=>{if(create(`${project.name} · AI version`,staged)){setStaged(null);setAnswer("");}}}>Import as new project</button><button className="btn secondary" onClick={()=>{if(confirm("Replace this project's code with the reviewed answer?")){setPrevious(project.code);persist(staged);setStaged(null);setPanel("build");stop();setMessage("Code applied. You can undo this import before leaving the project.");}}}>Apply to current</button></div></div>}</div></div></section>}
    {panel==="learn"&&<div className="two-col"><section className="panel"><h2>A builder’s checklist</h2><p className="muted">Simple code hints, not a full accessibility or quality audit. Test every feature yourself.</p>{checks.map(c=><div className={`studio-check ${c.pass?"checked":""}`} key={c.name}><strong>{c.pass?"✓":"○"} {c.name}</strong><p>{c.hint}</p></div>)}<h3>Your next challenge</h3><p>Add a theme switch, a search filter or a reset button. Test an empty value. Explain the event listener to a friend.</p></section><section className="panel"><h2>Understand your tools</h2><details open><summary>HTML is the structure</summary><p>Headings, buttons, images and forms give the page meaning. Add body content to index.html and use the other tabs for styles and scripts.</p></details><details><summary>CSS is the design</summary><p>Start with colours, spacing and typography. Use flexible layouts for small screens. The editor offers suggestions as you type.</p></details><details><summary>JavaScript is the behaviour</summary><p>Select an element, listen for an event and change something. Use console.log(value) to check your code. Read errors after running.</p></details><details><summary>What can I build here?</summary><p>Portfolios, landing pages, quizzes, calculators, simple games and front-end prototypes. This studio does not run Python, npm, server code, databases or payments. A real login or shop needs a backend and security review.</p></details><details><summary>How do I publish?</summary><p>Download the HTML to open it in a browser. Keep a JSON backup for editing. A public website link needs a hosting provider; the hub does not automatically publish student projects.</p></details><details><summary>Keep control when using AI</summary><p>Ask for one change at a time. Read code before running it. Keep the original project to compare. Never enter real passwords into a prototype.</p></details></section></div>}
    <section className="panel section-gap"><div className="row between"><div><p className="eyebrow">Your work stays yours</p><h2>Save, move and share</h2></div><span className="tag">{saved.value.length} / {MAX_PROJECTS} projects</span></div><div className="row"><button className="btn" onClick={()=>download(`${project.name.replace(/[^a-z0-9-]/gi,"-")||"website"}.html`,makeDocument(project.code),"text/html")}>Download website</button><button className="btn secondary" onClick={()=>download("coding-project.json",JSON.stringify(project,null,2),"application/json")}>Project backup</button></div><div className="two-col section-gap"><label>Import a backup or HTML file (2 MB max)<input type="file" accept=".json,.html,.htm" onChange={e=>{void restore(e.target.files?.[0]);e.target.value="";}}/></label><label>Embed an image (PNG, JPEG, WebP · 250 KB max)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{addImage(e.target.files?.[0]);e.target.value="";}}/></label></div><details><summary>Recover a project from the old Coding Lab</summary><p>Old drafts are kept. Choose one to copy into the new studio.</p><div className="row">{Object.entries(legacyProjects).map(([id,p])=><button className="btn secondary" key={id} onClick={()=>{try{const raw=localStorage.getItem(`trc:v1:code:${id}`);if(!raw){setMessage(`No saved ${p.name} draft in this browser.`);return;}const code=JSON.parse(raw);if(!validCode(code))throw Error();create(`${p.name} recovered`,code);}catch{setMessage("Could not recover that draft. Try a downloaded backup.");}}}>{p.name}</button>)}</div></details><p className="small muted">Edits save in this browser, not across devices. Download backups. HTML downloads contain your code and are not sandboxed outside the hub.</p></section>
    <p className="studio-status" role="status">{message || "Ready to build. Start with a template or ask your own AI for help."}</p>{saved.error&&<p className="notice error" role="alert">{saved.error}</p>}
  </div>;
}
