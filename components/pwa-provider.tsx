"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type PwaState = { installed:boolean; ready:boolean; failed:boolean; canInstall:boolean; install:()=>Promise<void>; ios:boolean };
const Context=createContext<PwaState>({ installed:false,ready:false,failed:false,canInstall:false,install:async()=>{},ios:false });
export const usePwa=()=>useContext(Context);
const onlineSnapshot=()=>navigator.onLine;
const onlineServer=()=>true;
const onlineSubscribe=(fn:()=>void)=>{window.addEventListener("online",fn);window.addEventListener("offline",fn);return()=>{window.removeEventListener("online",fn);window.removeEventListener("offline",fn);};};
const deviceSubscribe=(fn:()=>void)=>{const query=window.matchMedia("(display-mode: standalone)");query.addEventListener("change",fn);window.addEventListener("appinstalled",fn);return()=>{query.removeEventListener("change",fn);window.removeEventListener("appinstalled",fn);};};
const deviceSnapshot=()=>`${window.matchMedia("(display-mode: standalone)").matches || !!(navigator as Navigator & {standalone?:boolean}).standalone}|${/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}`;
const deviceServer=()=>"false|false";

export default function PwaProvider({children}:{children:React.ReactNode}) {
  const [prompt,setPrompt]=useState<InstallEvent|null>(null),[waiting,setWaiting]=useState<ServiceWorker|null>(null);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[updating,setUpdating]=useState(false);
  const path=usePathname(), reloadRequested=useRef(false);
  const online=useSyncExternalStore(onlineSubscribe,onlineSnapshot,onlineServer);
  const device=useSyncExternalStore(deviceSubscribe,deviceSnapshot,deviceServer).split("|");
  const installed=device[0]==="true",ios=device[1]==="true";
  useEffect(()=>{
    const before=(event:Event)=>{event.preventDefault();setPrompt(event as InstallEvent);};
    const complete=()=>setPrompt(null);
    window.addEventListener("beforeinstallprompt",before);window.addEventListener("appinstalled",complete);
    return()=>{window.removeEventListener("beforeinstallprompt",before);window.removeEventListener("appinstalled",complete);};
  },[]);
  useEffect(()=>{
    if(process.env.NODE_ENV!=="production"||!("serviceWorker" in navigator))return;
    let disposed=false,registration:ServiceWorkerRegistration|undefined;
    const changed=()=>{if(reloadRequested.current)window.location.reload();else setWaiting(null);};
    const check=()=>{if(!disposed)setWaiting(navigator.serviceWorker.controller?registration?.waiting??null:null);};
    const found=()=>{const worker=registration?.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed")check();});};
    navigator.serviceWorker.addEventListener("controllerchange",changed);
    void navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(async reg=>{
      if(disposed)return;registration=reg;check();reg.addEventListener("updatefound",found);
      await navigator.serviceWorker.ready;if(!disposed)setReady(true);
    }).catch(()=>{if(!disposed)setFailed(true);});
    return()=>{disposed=true;navigator.serviceWorker.removeEventListener("controllerchange",changed);registration?.removeEventListener("updatefound",found);};
  },[]);
  useEffect(()=>{
    if(!ready||!online)return;
    let disposed=false;
    void navigator.serviceWorker.ready.then(reg=>{if(!disposed)reg.active?.postMessage({type:"CACHE_PAGE",path});});
    return()=>{disposed=true;};
  },[ready,path,online]);
  useEffect(()=>{
    if(!updating)return;
    // A terminated or superseded worker must not leave the button disabled forever.
    const timer=window.setTimeout(()=>{reloadRequested.current=false;setUpdating(false);},10000);
    return()=>window.clearTimeout(timer);
  },[updating]);
  async function update(){
    if(updating||!online)return;
    reloadRequested.current=true;setUpdating(true);
    try{
      const registration=await navigator.serviceWorker.getRegistration("/");
      // The worker shown earlier may already have activated in this or another tab.
      if(!registration?.waiting){window.location.reload();return;}
      registration.waiting.postMessage({type:"SKIP_WAITING"});
    }catch{reloadRequested.current=false;setUpdating(false);}
  }
  async function install(){if(!prompt)return;try{await prompt.prompt();await prompt.userChoice;}catch{/* Browser menu instructions remain available. */}finally{setPrompt(null);}}
  return <Context.Provider value={{installed,ready,failed,canInstall:!!prompt,install,ios}}>{children}
    <div className="pwa-bar no-print" aria-label="App installation and connection">
      <span className={`connection-dot ${online?"":"offline"}`} aria-hidden="true"/>
      <p>{online?installed?"TRC Skills, on your home screen.":"Take your learning with you.":"You’re offline. Previously opened tools may still work."}</p>
      {!installed&&<Link href="/install" className="btn secondary">Get the app</Link>}
      {waiting&&<button className="btn" disabled={updating||!online} onClick={()=>void update()}> {updating?"Updating…":online?"Reload to update":"Connect to update"}</button>}
    </div>
  </Context.Provider>;
}
