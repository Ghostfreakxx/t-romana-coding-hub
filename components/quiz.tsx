"use client";
import { useState } from "react";
import type { Question } from "@/data/lessons";
import { useSaved } from "@/lib/storage";
export type Result = { id:string; lab:string; score:number; total:number; date:string; mode:string };
export const emptyResults: Result[] = [];
export function isResults(v:unknown):v is Result[] { return Array.isArray(v) && v.every(x=>x && typeof x.id==='string' && typeof x.lab==='string' && Number.isInteger(x.score) && Number.isInteger(x.total) && x.total>0 && x.score>=0 && x.score<=x.total && typeof x.date==='string' && typeof x.mode==='string'); }
export default function Quiz({questions,lab}:{questions:Question[];lab:string}) {
  const [topic,setTopic]=useState("All topics");
  const [mode,setMode]=useState("practice");
  const [started,setStarted]=useState(false);
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [checked,setChecked]=useState<string[]>([]);
  const [hint,setHint]=useState(false);
  const [finished,setFinished]=useState(false);
  const history=useSaved("results",emptyResults,isResults);
  const list=questions.filter(q=>topic==="All topics"||q.topic===topic);
  const current=list[index];
  const score=list.filter(q=>answers[q.id]===q.answer).length;
  const answered=list.filter(q=>answers[q.id]!==undefined).length;
  function restart(){setStarted(false);setFinished(false);setIndex(0);setAnswers({});setChecked([]);setHint(false);}
  function finish(){ setFinished(true);history.setValue([...history.value,{id:crypto.randomUUID(),lab,score,total:list.length,date:new Date().toISOString(),mode}].slice(-100)); }
  if(!started) return <section className="panel"><p className="eyebrow">Put it into practice</p><h2>Check your understanding</h2><p className="muted">Practice gives feedback after each answer. Test mode saves explanations until you finish. No timer and no negative marks.</p><div className="two-col"><div><label htmlFor={`${lab}-topic`}>Topic</label><select id={`${lab}-topic`} value={topic} onChange={e=>setTopic(e.target.value)}><option>All topics</option>{[...new Set(questions.map(q=>q.topic))].map(t=><option key={t}>{t}</option>)}</select></div><div><label htmlFor={`${lab}-mode`}>Mode</label><select id={`${lab}-mode`} value={mode} onChange={e=>setMode(e.target.value)}><option value="practice">Practice with feedback</option><option value="test">Test yourself</option></select></div></div><button className="btn section-gap" onClick={()=>setStarted(true)}>Start {list.length} questions</button></section>;
  if(finished) return <section className="panel" aria-live="polite"><p className="eyebrow">Session complete</p><h2>{score} / {list.length} correct</h2><p className="muted">{Math.round(score/list.length*100)}% · {list.length-answered} unanswered · {mode==='test'?'Test':'Practice'}</p>{history.error&&<p role="alert" className="notice error">{history.error}</p>}<button className="btn" onClick={restart}>Try another session</button><h3 className="section-gap">Review every answer</h3><div className="stack">{list.map((q,i)=><div key={q.id} className="notice"><strong>{i+1}. {q.prompt}</strong><p>Your answer: {answers[q.id]===undefined?'Unanswered':q.options[answers[q.id]]} {answers[q.id]===q.answer?'✓':''}<br/>Correct answer: {q.options[q.answer]}</p><p>{q.explanation}</p></div>)}</div></section>;
  const revealed=checked.includes(current.id);
  return <section className="panel"><div className="row between"><p className="eyebrow">{mode} · {current.topic}</p><span className="small muted">Question {index+1} of {list.length}</span></div><progress aria-label="Quiz progress" value={index+1} max={list.length}/><h2 className="section-gap">{current.prompt}</h2><div className="stack" role="group" aria-label="Answer options">{current.options.map((option,i)=><button key={option} className={`option ${revealed&&i===current.answer?'correct':''} ${revealed&&answers[current.id]===i&&i!==current.answer?'wrong':''}`} aria-pressed={answers[current.id]===i} disabled={revealed} onClick={()=>setAnswers({...answers,[current.id]:i})}><span className="muted">{String.fromCharCode(65+i)}.</span>{option}</button>)}</div>
    {mode==='practice'&&<div className="section-gap"><div className="row"><button className="btn" disabled={answers[current.id]===undefined||revealed} onClick={()=>setChecked([...checked,current.id])}>Check answer</button><button className="btn secondary" onClick={()=>setHint(!hint)}>{hint?'Hide hint':'Show hint'}</button></div>{hint&&<p className="muted">Hint: {current.hint}</p>}{revealed&&<div role="status" className="notice section-gap"><strong>{answers[current.id]===current.answer?'Correct.':'Not quite.'}</strong> {current.explanation}</div>}</div>}
    <div className="row between section-gap"><button className="btn secondary" disabled={index===0} onClick={()=>{setIndex(index-1);setHint(false);}}>Previous</button>{index<list.length-1?<button className="btn secondary" onClick={()=>{setIndex(index+1);setHint(false);}}>Next question →</button>:<button className="btn" onClick={finish}>Finish {mode}</button>}</div><p className="muted small">{answered} answered. You can skip questions; unanswered questions score zero.</p><button className="btn secondary" onClick={()=>{if(confirm('Leave this session? Unfinished answers will be lost.'))restart();}}>End session without saving</button>
  </section>;
}
