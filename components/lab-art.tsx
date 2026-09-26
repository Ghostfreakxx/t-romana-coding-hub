import { useId } from "react";

/** Small, local vector scenes stay crisp on phones and need no image downloads. */
export function RouteArt({ town = false, training = false }: { town?: boolean; training?: boolean }) {
  const id = useId();
  return <svg className="route-art" viewBox="0 0 300 100" aria-hidden="true">
    <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor="#93cad1"/><stop offset="1" stopColor="#e6d9ae"/></linearGradient></defs>
    <rect width="300" height="100" fill={`url(#${id})`}/><circle cx="237" cy="24" r="14" fill="#fff2c3"/>
    <path d="M0 72 45 27 88 62 145 18 210 68 267 30 300 65V100H0Z" fill="#638b80"/><path d="m0 86 65-38 82 40 92-43 61 40v15H0Z" fill="#335f59"/>
    <path d={training ? "M133 55H167L236 100H61Z" : "M150 55C210 70 110 80 229 100H58C163 76 131 73 145 55Z"} fill="#405057"/>
    <path d={training ? "M150 58V100" : "M148 57C177 71 137 79 144 100"} fill="none" stroke="#f2ddb3" strokeWidth="2" strokeDasharray="7 6"/>
    {town ? [18,62,219,260].map((x,i)=><g key={x}><path d={`M${x} 82V${40+i%2*14}h27V82Z`} fill={i%2?"#c79c77":"#d0c7ae"}/><path d={`M${x+5} 60h5m7 0h5m-17 10h5m7 0h5`} stroke="#315258" strokeWidth="6"/></g>) : [26,59,226,269].map((x,i)=><g key={x}><path d={`M${x} 90v-30`} stroke="#604b3b" strokeWidth="4"/><path d={`m${x} ${31+i%2*12} -18 43h36Z`} fill="#214d44"/></g>)}
  </svg>;
}

export function GuitarArt({ active, chord }: { active: number | null; chord: string }) {
  const id=useId();
  return <div className="guitar-showcase"><svg viewBox="0 0 880 260" role="img" aria-label={`Acoustic guitar, ${chord || "custom chord"}${active!==null?", string vibrating":""}`}>
    <defs>
      <linearGradient id={`${id}-wood`} x2="0.5" y2="1"><stop stopColor="#f8d7a1"/><stop offset=".42" stopColor="#c88946"/><stop offset="1" stopColor="#7b4224"/></linearGradient>
      <linearGradient id={`${id}-neck`} x2="0" y2="1"><stop stopColor="#2d221c"/><stop offset=".5" stopColor="#63412a"/><stop offset="1" stopColor="#221b19"/></linearGradient>
      <radialGradient id={`${id}-light`}><stop stopColor="#edb67a" stopOpacity=".2"/><stop offset="1" stopColor="#edb67a" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="443" cy="140" rx="395" ry="120" fill={`url(#${id}-light)`}/><ellipse cx="280" cy="227" rx="188" ry="13" fill="#0006"/>
    <path d="M285 47C246 7 195 20 181 65C165 95 117 91 111 139C98 221 179 249 231 215C260 197 274 206 303 211C351 222 398 178 382 136C372 109 341 100 329 78C318 57 300 49 285 47Z" fill="#603c24" transform="translate(0 7)"/>
    <path d="M285 40C246 0 195 13 181 58C165 88 117 84 111 132C98 214 179 242 231 208C260 190 274 199 303 204C351 215 398 171 382 129C372 102 341 93 329 71C318 50 300 42 285 40Z" fill={`url(#${id}-wood)`} stroke="#f5d4a1" strokeWidth="3"/>
    {[0,1,2,3,4,5,6].map(n=><path key={n} d={`M${165+n*22} 80q-17 62 3 107`} stroke="#6e431b" strokeWidth=".8" opacity=".18" fill="none"/>)}
    <circle cx="299" cy="126" r="39" fill="#231d18" stroke="#f7d69a" strokeWidth="5"/><circle cx="299" cy="126" r="44" fill="none" stroke="#6f4326" strokeWidth="3"/>
    <path d="M302 170q38-6 51-34q7 56-34 59Z" fill="#653b2b"/>
    <rect x="336" y="102" width="381" height="48" rx="3" fill={`url(#${id}-neck)`} stroke="#bc9365"/>
    {Array.from({length:14},(_,n)=><path key={n} d={`M${352+n*25} 103v46`} stroke="#c1b8a2" strokeWidth="2"/>)}
    {[2,4,6,8,11].map(n=><circle key={n} cx={365+n*25} cy="126" r={n===11?4:3} fill="#e7ddc7"/>)}
    <path d="M715 99 797 88q20 3 17 24l-5 42q-2 11-21 9l-73-10Z" fill="#986334" stroke="#d3ab72" strokeWidth="2"/>
    {[735,760,787].map(x=><g key={x}><rect x={x} y="80" width="12" height="14" rx="4" fill="#c9d1cd"/><rect x={x} y="159" width="12" height="14" rx="4" fill="#c9d1cd"/></g>)}
    <rect x="186" y="92" width="21" height="68" rx="4" fill="#3f2a1d"/><rect x="197" y="100" width="4" height="51" rx="1" fill="#eae0c8"/>
    {Array.from({length:6},(_,n)=><path key={n} className={active===n?"art-string vibrating":"art-string"} d={`M199 ${108+n*7}H${795-n*2}`} stroke={active===n?"#d4f6a6":"#ecddbb"} strokeWidth={2.2-n*.23} fill="none"/>)}
    <text x="42" y="36" fill="#aeaa9f" fontSize="12" letterSpacing="3">ACOUSTIC / SIX STRINGS</text>
    <text x="760" y="229" textAnchor="middle" fill="#e5cfab" fontSize="27">{chord || "Custom"}</text>
  </svg><p>Choose a chord below. Tap the strings or use Strum to hear it.</p></div>;
}

export function PartArt({ kind }: { kind: "battery" | "switch" | "motor" | "lamp" | "buzzer" | "contact" }) {
  return <svg className="part-art" viewBox="0 0 90 64" aria-hidden="true">
    {kind==="battery"?<><rect x="18" y="17" width="55" height="31" rx="6" fill="#364249" stroke="#b5c8bb" strokeWidth="2"/><path d="M53 18v29" stroke="#e6b970" strokeWidth="23"/><path d="M74 26h5v13h-5M25 31h11m24-5v13m-6-6h12" stroke="#e7e4d1" strokeWidth="2"/></>:kind==="motor"?<><path d="M18 33H5m67 0h13" stroke="#adc2c7" strokeWidth="6"/><rect x="18" y="12" width="53" height="41" rx="12" fill="#687d84" stroke="#bfd1cd" strokeWidth="2"/><path d="M33 17v30m8-30v30m8-30v30" stroke="#2a4148" strokeWidth="3"/></>:kind==="lamp"?<><path d="M35 47v-9a19 19 0 1 1 20 0v9" fill="#e3c789" fillOpacity=".3" stroke="#ecdaad" strokeWidth="2"/><path d="M33 47h24m-22 6h20m-18 5h16M42 45V29l6 3v13" fill="none" stroke="#c5cfbe" strokeWidth="3"/></>:kind==="buzzer"?<><rect x="16" y="9" width="57" height="46" rx="9" fill="#354951" stroke="#b1c5bd" strokeWidth="2"/><circle cx="44" cy="32" r="15" fill="#182b31" stroke="#b0caa3"/><circle cx="44" cy="32" r="6" fill="#b0caa3"/></>:<><path d="M9 43h22m28 0h22" stroke="#ba9560" strokeWidth="4"/><rect x="26" y="17" width="39" height="32" rx="5" fill="#293f42" stroke="#a9c2b5" strokeWidth="2"/><path d={kind==="switch"?"M35 40 53 23":"M33 39q5-25 11 0t12-5"} stroke="#d6cc9b" strokeWidth="4" fill="none"/></>}
  </svg>;
}
