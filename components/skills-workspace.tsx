"use client";
import { useState } from "react";
import DigitalPractice from "./digital-practice";
import MusicStudio from "./music-studio";
import BeatMaker from "./beat-maker";
export default function SkillsWorkspace(){const [tab,setTab]=useState("music");return <><div className="skill-paths" role="group" aria-label="Choose a skills workspace">{[["music","01","Play an instrument","Guitar, piano, drums and guided practice"],["compose","02","Make a beat","Compose, save and replay your own rhythms"],["digital","03","Everyday digital skills","Typing, spreadsheet formulas and email rehearsal"]].map(([id,num,title,description])=><button aria-pressed={tab===id} key={id} onClick={()=>setTab(id)}><span>{num} / WORKSHOP</span><strong>{title}</strong><small>{description}</small></button>)}</div>{tab==="music"?<MusicStudio/>:tab==="compose"?<BeatMaker/>:<DigitalPractice/>}</>;}
