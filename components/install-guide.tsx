"use client";
import Image from "next/image";
import { usePwa } from "./pwa-provider";
export default function InstallGuide(){
  const pwa=usePwa();
  return <section className="install-guide panel"><div className="install-identity"><Image src="/icons/trc-192.png" alt="Govt. T. Romana College crest" width={96} height={96} unoptimized/><div><p className="eyebrow">YOUR POCKET CAMPUS</p><h2>T. Romana Skills Hub</h2><p>One app for learning, making and practising.</p></div></div>
    {pwa.installed?<p className="notice success" role="status">You are already using the installed app.</p>:pwa.canInstall?<button className="btn" onClick={()=>void pwa.install()}>Install TRC Skills</button>:<p className="notice">{pwa.ios?"On iPhone or iPad, follow the Safari steps below.":"Use your browser’s install option, or follow the phone instructions below. An install button appears here when your browser offers it."}</p>}
    <div className="install-steps"><article><span>01 / iPHONE & iPAD</span><h3>Add it from Safari</h3><ol><li>Open this website in Safari.</li><li>Tap Share, then Add to Home Screen.</li><li>Keep Open as Web App enabled if shown, then tap Add.</li></ol></article><article><span>02 / ANDROID</span><h3>Add it from Chrome</h3><ol><li>Open this website in Chrome.</li><li>Tap Install TRC Skills above when available, or open the ⋮ menu.</li><li>Choose Install app or Add to Home screen, then confirm.</li></ol></article></div>
    <p className="small muted">If you opened the link inside Instagram or another app, use its menu to open it in Safari or Chrome first. On a computer, use Chrome or Edge’s install icon in the address bar when available.</p>
    <div className="install-offline"><h3>Keep learning when the signal drops</h3><p>Open the pages and tools you want while connected. The app saves recently opened pages, loaded graphics and note text for later use on this device. Offline availability depends on browser storage and what has already loaded.</p><p>New downloads, external AI chats and pages you have not opened still need internet. Keep backups of important notes and coding projects; installing does not sync them between devices.</p><p role="status">{pwa.ready?"Offline support is ready. Pages and tools are saved as you use them.":pwa.failed?"Offline support could not start here. The online website still works; try reloading in your regular browser.":"Preparing offline support when the browser allows it…"}</p></div>
    <p className="small muted">Updates appear as “Reload to update”. Save your current exercise before reloading.</p>
  </section>;
}
