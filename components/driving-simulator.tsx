"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { clamp, newDrive, ROUTE_LENGTH, speedLimit, stepDrive, type DriveState, type Weather, type Course, COURSES } from "@/lib/driving-engine";

import { useSaved } from "@/lib/storage";
import type { DrivingScene } from "@/lib/driving-scene";
const EMPTY_BEST: Record<string,number> = {};
const validBest = (v:unknown):v is Record<string,number> => !!v && typeof v==="object" && Object.values(v).every(n=>typeof n==="number" && Number.isFinite(n) && n>=0 && n<=100);

function paint(ctx: CanvasRenderingContext2D, s: DriveState, width: number, height: number) {
  const night=s.weather==="night", rain=s.weather==="rain", horizon=height*.31, roadWidth=width*.46, curve=Math.sin(s.distance/230)*width*.09;
  const project=(z:number)=>{const t=1/(1+Math.max(0,z)/65);return {y:horizon+(height-horizon)*t,half:width*.035+roadWidth*t,x:width/2+curve*(1-t)**2,t};};
  const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,night?"#081529":rain?"#566978":"#57b5df");sky.addColorStop(1,night?"#405071":"#d1e5e8");ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  ctx.fillStyle=night?"#cfdff4":"#fff1bc";ctx.beginPath();ctx.arc(width*.8,horizon*.35,width*.035,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<2;layer++){ctx.fillStyle=night?"#1e3242":layer?"#3e7167":"#719897";ctx.beginPath();ctx.moveTo(0,horizon+10);for(let x=0;x<=width+20;x+=20)ctx.lineTo(x,horizon-22-Math.sin(x/(95+layer*40)+layer*3)*horizon*.2);ctx.lineTo(width,horizon+10);ctx.fill();}
  ctx.fillStyle=night?"#102c27":"#638b55";ctx.fillRect(0,horizon,width,height-horizon);
  for(let y=horizon;y<height;y+=2){const t=(y-horizon)/(height-horizon),half=width*.035+roadWidth*t,centre=width/2+curve*(1-t)**2;ctx.fillStyle=Math.floor(s.distance/6+30/Math.max(t,.01))%2?"#d8d9ce":"#b75a51";ctx.fillRect(centre-half-8*t,y,half*2+16*t,3);ctx.fillStyle=rain?"#3d4b56":night?"#25333e":"#48545e";ctx.fillRect(centre-half,y,half*2,3);}
  for(let z=Math.floor(s.distance/16)*16;z<s.distance+450;z+=16){if(z<s.distance)continue;const a=project(z-s.distance),b=project(z+7-s.distance);for(const lane of [-1/3,1/3]){ctx.fillStyle="#eee9c9";ctx.beginPath();ctx.moveTo(a.x+a.half*lane-2*a.t,a.y);ctx.lineTo(a.x+a.half*lane+2*a.t,a.y);ctx.lineTo(b.x+b.half*lane+2*b.t,b.y);ctx.lineTo(b.x+b.half*lane-2*b.t,b.y);ctx.fill();}}
  for(let z=Math.floor((s.distance+400)/38)*38;z>s.distance;z-=38){const p=project(z-s.distance);for(const side of [-1,1]){const x=p.x+side*(p.half+32*p.t);ctx.fillStyle="#354f36";ctx.beginPath();ctx.moveTo(x,p.y-75*p.t);ctx.lineTo(x-25*p.t,p.y);ctx.lineTo(x+25*p.t,p.y);ctx.fill();}}
  function car(x:number,ground:number,scale:number,colour:string){
    const w=width*.112*scale,h=height*.19*scale;
    ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(x,ground-h*.02,w*.65,h*.1,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#111b24";ctx.fillRect(x-w*.55,ground-h*.55,w*1.1,h*.45);
    const body=ctx.createLinearGradient(x-w/2,0,x+w/2,0);body.addColorStop(0,"#45646d");body.addColorStop(.3,colour);body.addColorStop(1,colour);ctx.fillStyle=body;ctx.beginPath();ctx.roundRect(x-w/2,ground-h,w,h,[w*.2,w*.2,w*.09,w*.09]);ctx.fill();
    ctx.fillStyle="#183440";ctx.beginPath();ctx.roundRect(x-w*.38,ground-h*.88,w*.76,h*.32,4);ctx.fill();ctx.fillStyle="#c9edf488";ctx.fillRect(x-w*.3,ground-h*.85,w*.07,h*.25);
    ctx.fillStyle="#ed4249";ctx.fillRect(x-w*.43,ground-h*.26,w*.22,h*.11);ctx.fillRect(x+w*.21,ground-h*.26,w*.22,h*.11);ctx.fillStyle="#e9e6d9";ctx.fillRect(x-w*.16,ground-h*.17,w*.32,h*.08);
  }
  for(const vehicle of [...s.traffic].sort((a,b)=>b.z-a.z)){const gap=vehicle.z-s.distance;if(gap < -8 || gap>420)continue;const p=project(gap);car(p.x+vehicle.lane*p.half*.85,p.y,p.t,["#e7ab6c","#9ac7ea","#b5aad7"][vehicle.id%3]);}
  car(width/2+s.position*(width*.035+roadWidth)*.85,height*.97,1,"#d6ef91");
  if(night){ctx.fillStyle="#07122555";ctx.fillRect(0,horizon,width,height-horizon);}
  if(rain){ctx.strokeStyle="#d2e6f45a";ctx.lineWidth=1.5;for(let i=0;i<50;i++){const x=(i*83+s.elapsed*70)%width,y=(i*137+s.elapsed*380)%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+18);ctx.stroke();}}
}

export default function DrivingSimulator(){
  const fallbackCanvas=useRef<HTMLCanvasElement>(null),canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
  const game=useRef(newDrive()),keys=useRef(new Set<string>()),touches=useRef(new Map<number,string>()),steering=useRef(0),scene=useRef<DrivingScene|null>(null),cockpitRef=useRef(false);
  const [display,setDisplay]=useState(newDrive),[expanded,setExpanded]=useState(false),[weather,setWeather]=useState<Weather>("day"),[course,setCourse]=useState<Course>("hills"),[quality,setQuality]=useState("balanced"),[graphics,setGraphics]=useState("Loading 3D scene"),[cockpit,setCockpit]=useState(false);
  const [savedRun,setSavedRun]=useState(false),best=useSaved("driving-best",EMPTY_BEST,validBest);
  useEffect(()=>{
    let disposed=false;
    import("@/lib/driving-scene").then(({createDrivingScene})=>{
      if(disposed||!canvas.current)return;
      try{scene.current=createDrivingScene(canvas.current,game.current,quality==="high");setGraphics("3D active");}
      catch{setGraphics("2D compatibility mode");}
    }).catch(()=>{if(!disposed)setGraphics("2D compatibility mode");});
    return()=>{disposed=true;scene.current?.dispose();scene.current=null;};
  },[weather,course,quality]);
  useEffect(()=>{
    let frame=0,previous=0,lastUpdate=0;
    const clear=()=>{keys.current.clear();touches.current.clear();steering.current=0;game.current.running=false;};
    const tick=(now:number)=>{
      const held=new Set([...keys.current,...touches.current.values()]);
      stepDrive(game.current,previous?(now-previous)/1000:0,{throttle:held.has("accelerate"),brake:held.has("brake"),steer:steering.current||Number(held.has("right"))-Number(held.has("left"))});previous=now;
      if(scene.current)scene.current.render(game.current,cockpitRef.current);
      else{const el=fallbackCanvas.current,box=stage.current;if(el&&box){const w=Math.round(box.clientWidth),h=Math.round(box.clientHeight),ratio=Math.min(window.devicePixelRatio||1,1.5);if(w&&h){if(el.width!==Math.round(w*ratio)||el.height!==Math.round(h*ratio)){el.width=Math.round(w*ratio);el.height=Math.round(h*ratio);}const ctx=el.getContext("2d");if(ctx){ctx.setTransform(ratio,0,0,ratio,0,0);paint(ctx,game.current,w,h);}}}}
      if(now-lastUpdate>100){setDisplay({...game.current,checkpoints:game.current.checkpoints.map(c=>({...c}))});lastUpdate=now;}frame=requestAnimationFrame(tick);
    };
    const mapping:Record<string,string>={ArrowUp:"accelerate",w:"accelerate",ArrowDown:"brake",s:"brake"," ":"brake",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"};
    const down=(e:KeyboardEvent)=>{if(e.altKey||e.ctrlKey||e.metaKey||["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement).tagName))return;if((e.target as HTMLElement).tagName==="BUTTON"&&e.key===" ")return;const action=mapping[e.key]??mapping[e.key.toLowerCase()];if(action){e.preventDefault();keys.current.add(action);}};
    const up=(e:KeyboardEvent)=>{const action=mapping[e.key]??mapping[e.key.toLowerCase()];if(action)keys.current.delete(action);};const hidden=()=>{if(document.hidden)clear();};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",clear);document.addEventListener("visibilitychange",hidden);frame=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",clear);document.removeEventListener("visibilitychange",hidden);};
  },[]);
  useEffect(()=>{if(!expanded)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setExpanded(false);};window.addEventListener("keydown",escape);return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",escape);};},[expanded]);
  const reset=(condition=weather,route=course)=>{game.current=newDrive(condition,route);touches.current.clear();keys.current.clear();steering.current=0;setSavedRun(false);setDisplay({...game.current});};
  const hold=(action:string)=>(e:PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touches.current.set(e.pointerId,action);};
  const release=(e:PointerEvent<HTMLButtonElement>)=>touches.current.delete(e.pointerId);
  const pedal=(label:string,action:string)=><button type="button" className={`drive-pedal ${action}`} onPointerDown={hold(action)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{label}</button>;
  const steer=(e:PointerEvent<HTMLDivElement>)=>{const rect=e.currentTarget.getBoundingClientRect();steering.current=clamp((e.clientX-rect.left-rect.width/2)/(rect.width/2),-1,1);};
  const next=display.checkpoints.find(c=>!c.passed),gap=next?Math.max(0,Math.round(next.distance-display.distance)):0;
  const hint=next&&gap<95?(next.kind==="stop"?(gap<=16?"Stop completely and hold for one second.":"Brake for the STOP line ahead."):`Approach the checkpoint at ${next.limit} km/h or less.`):display.speed>speedLimit(weather,display.distance,course)?"Ease off: you are above the course limit.":Math.abs(display.position)>.94?"Steer back onto the road.":"Look ahead and leave space. All lanes are one-way in this closed practice course.";
  return <section className={`panel driving-simulator driving-v3 ${expanded?"drive-expanded":""}`} aria-label="Mobile driving simulator">
    <div className="row between"><div><p className="eyebrow">Driving / interactive course</p><h2>The road is your classroom.</h2></div><button className="btn secondary" onClick={()=>setExpanded(!expanded)}>{expanded?"Close full view":"Full view"}</button></div>
    <div className="drive-route-select">{(Object.entries(COURSES) as [Course,typeof COURSES.hills][]).map(([id,data])=><button key={id} aria-pressed={course===id} onClick={()=>{setCourse(id);reset(weather,id);}}><strong>{data.title}</strong><small>{data.description}</small></button>)}</div>
    <div className="row drive-settings"><label>Weather <select value={weather} onChange={e=>{const value=e.target.value as Weather;setWeather(value);reset(value);}}><option value="day">Daylight</option><option value="rain">Rain</option><option value="night">Night</option></select></label><label>Graphics <select value={quality} onChange={e=>{game.current.running=false;setQuality(e.target.value);}}><option value="balanced">Balanced / mobile</option><option value="high">Detailed / shadows</option></select></label><button className="btn secondary" disabled={graphics!=="3D active"} onClick={()=>{cockpitRef.current=!cockpit;setCockpit(!cockpit);}}>{cockpit?"Chase camera":"Driver camera"}</button><span className="small muted">{graphics}</span></div>
    <div className="drive-stage" ref={stage}><canvas ref={fallbackCanvas} style={{visibility:graphics==="3D active"?"hidden":"visible"}} aria-label="Compatibility driving view" role="img"/><canvas key={quality} ref={canvas} style={{visibility:graphics==="3D active"?"visible":"hidden"}} aria-label="3D road, moving traffic and your car" role="img" onContextMenu={e=>e.preventDefault()}/>
      <div className="drive-hud"><div><strong>{Math.round(display.speed)}</strong><small>km/h</small></div><div><strong>{Math.round(display.score)}</strong><small>control score</small></div><div><strong>{speedLimit(weather,display.distance,course)}</strong><small>course limit</small></div></div>
      <div className="drive-nav"><span>{next?next.kind==="stop"?"STOP":"SLOW":"FINISH"}</span><div><strong>{next?next.label:"Complete the route"}</strong><small>{next?`${gap} m ahead`:`${Math.max(0,Math.round(ROUTE_LENGTH-display.distance))} m remaining`}</small></div></div>
      {weather==="rain"&&<div className="rain-glass" aria-hidden="true"/>}
      {!display.running&&<div className="drive-overlay"><h3>{display.finished?"Route complete":display.distance>0?"Drive paused":"Ready to take the wheel?"}</h3><p>{display.finished?`${display.checkpoints.filter(c=>c.success).length}/${display.checkpoints.length} checkpoints · ${display.hits} collisions · score ${Math.round(display.score)}/100`:"Steer with your left thumb. Hold GO with your right. Release GO and brake early for checkpoints."}</p><button className="btn" onClick={()=>{if(game.current.finished)reset();game.current.running=true;setDisplay({...game.current});}}>{display.finished?"Drive again":display.distance>0?"Resume drive":"Start engine"}</button></div>}
      <div className="drive-touch" aria-label="Driving controls"><div className="steering-cluster"><div className="drive-wheel" role="group" aria-label="Drag left or right to steer" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);steer(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))steer(e);}} onPointerUp={()=>{steering.current=0;}} onPointerCancel={()=>{steering.current=0;}} onLostPointerCapture={()=>{steering.current=0;}}><svg viewBox="0 0 100 100" style={{transform:`rotate(${display.steering*75}deg)`}} aria-hidden="true"><circle cx="50" cy="50" r="40"/><path d="M12 50H88M50 50V90"/><circle cx="50" cy="50" r="10"/></svg></div><div className="steer-buttons">{["left","right"].map(direction=><button key={direction} aria-label={`Hold to steer ${direction}`} onPointerDown={hold(direction)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{direction==="left"?"←":"→"}</button>)}</div></div><div className="drive-pedals">{pedal("BRAKE","brake")}{pedal("GO","accelerate")}</div></div>
    </div>
    <div className="row between drive-footer"><span>{Math.floor(display.distance)} / {ROUTE_LENGTH} m · {display.hits} collisions</span><div className="row"><button className="btn secondary" onClick={()=>{game.current.running=!game.current.running&&!game.current.finished;keys.current.clear();touches.current.clear();steering.current=0;setDisplay({...game.current});}} disabled={display.finished}>{display.running?"Pause":"Resume"}</button><button className="btn secondary" onClick={()=>reset()}>Restart</button></div></div><progress max={ROUTE_LENGTH} value={display.distance} aria-label="Route progress"/>
    <p className="drive-coach" role="status">{hint}</p><div className="drive-debrief"><div><h3>Your checkpoints</h3>{display.checkpoints.map(c=><p key={c.id}><span className={c.success?"checkpoint-success":c.passed?"checkpoint-missed":""}>{c.passed?c.success?"✓":"!":"○"}</span> {c.label} · {c.distance} m <small>{c.passed?c.success?"completed":"missed":c.kind==="stop"?"full stop for 1 second":`≤ ${c.limit} km/h`}</small></p>)}</div><div><h3>Understand this drive</h3><p>Time above limit: <strong>{display.speeding.toFixed(1)} s</strong></p><p>Time on verge: <strong>{display.offRoad.toFixed(1)} s</strong></p><p>Last full braking distance: <strong>{display.stoppingDistance===null?"Try braking to a stop":`${display.stoppingDistance.toFixed(1)} m`}</strong></p><p>Best saved score ({course}, {weather}): <strong>{best.value[`${course}:${weather}`]??"—"}</strong></p>{display.finished&&<button className="btn" disabled={savedRun} onClick={()=>{const key=`${course}:${weather}`;best.setValue({...best.value,[key]:Math.max(best.value[key]??0,Math.round(display.score))});setSavedRun(true);}}>{savedRun?"Run saved":"Save my result"}</button>}</div></div>
    <p className="small muted">Keyboard: arrows or W A S D; Space brakes. Weather changes reset the course. Rain reduces braking in this simplified model. Switching tabs pauses the game. This is an arcade simulation, not real vehicle physics or a driving qualification.</p>{best.error&&<p role="alert">{best.error}</p>}
  </section>;
}
