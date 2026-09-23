"use client";
import type { ReactNode } from "react";
import { tracks } from "@/data/lessons";
import { emptyList,isStringList,useSaved } from "@/lib/storage";
import Shell from "./shell";
import Quiz from "./quiz";
export default function LearningLab({id,children}:{id:string;children?:ReactNode}) {
 const track=tracks[id]; const done=useSaved("lessons",emptyList,isStringList);
 const count=track.lessons.filter(l=>done.value.includes(l.id)).length;
 return <Shell eyebrow={`${id} lab`} title={track.title} intro={track.intro}><div className="stack">
 {track.note&&<p className="notice">{track.note}</p>}
 <section className="panel"><div className="row between"><h2>Your learning path</h2><span className="small muted">{count} / {track.lessons.length} read</span></div><progress value={count} max={track.lessons.length} aria-label="Lessons completed"/>{done.error&&<p role="alert" className="notice error">{done.error}</p>}
 {track.lessons.map((lesson,i)=><details key={lesson.id} open={i===0?true:undefined}><summary>{String(i+1).padStart(2,'0')}. {lesson.title} <span className="muted small">· {lesson.minutes} min {done.value.includes(lesson.id)?'· ✓ Read':''}</span></summary><div style={{paddingTop:12}}>{lesson.paragraphs.map(p=><p key={p}>{p}</p>)}<div className="notice"><strong>Try this:</strong> {lesson.task}</div><label className="check-row"><input type="checkbox" checked={done.value.includes(lesson.id)} onChange={e=>done.setValue(e.target.checked?[...done.value,lesson.id]:done.value.filter(x=>x!==lesson.id))}/>I have read and understood this lesson</label></div></details>)}
 </section>{children}<Quiz questions={track.questions} lab={id}/>{track.sources.length>0&&<section className="panel"><h2>Read further</h2><p className="small muted">References for further learning. Vehicle and electrical guidance varies by location; these links do not replace qualified local instruction.</p><ul className="stack">{track.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="accent">{s.title} ↗</a></li>)}</ul></section>}
 </div></Shell>;
}
