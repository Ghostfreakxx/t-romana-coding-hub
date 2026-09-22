export type Code = { html:string; css:string; js:string };
export function isCode(v:unknown):v is Code {return !!v && typeof v==='object' && ['html','css','js'].every(k=>typeof (v as Record<string,unknown>)[k]==='string');}
export function makeDocument(code:Code,preview=false){
 const js=code.js.replace(/<\/script/gi,'<\\/script');
 const css=code.css.replace(/<\/style/gi,'<\\/style');
 const protection=preview?`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none';">`:'';
 const errors=preview?`<script>window.addEventListener('error',function(e){var box=document.createElement('pre');box.style.cssText='white-space:pre-wrap;padding:16px;background:#fee2e2;color:#991b1b';box.textContent='JavaScript error: '+e.message;document.body.appendChild(box);});window.addEventListener('unhandledrejection',function(e){var box=document.createElement('pre');box.textContent='Promise error: '+String(e.reason);document.body.appendChild(box);});<\/script>`:'';
 return `<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My coding project</title>${protection}<style>${css}</style></head><body>${errors}${code.html}<script>${js}<\/script></body></html>`;
}
