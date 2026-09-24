"use client";
import { useEffect, useRef, useState } from "react";
import { decodeStudy, type SourcePage } from "@/lib/study-decoder";
import { download } from "@/lib/storage";
import type { PDFDocumentLoadingTask } from "pdfjs-dist";

export default function PdfDecoder({ onNotes, onCards }: { onNotes: (notes:string)=>void; onCards:(cards:{front:string;back:string}[])=>number }) {
  const [pages,setPages]=useState<SourcePage[]>([]),[name,setName]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[focus,setFocus]=useState(""),[length,setLength]=useState(12),[first,setFirst]=useState(1),[last,setLast]=useState(1),[page,setPage]=useState(1),[password,setPassword]=useState("");
  const [result,setResult]=useState<ReturnType<typeof decodeStudy>|null>(null);
  const task=useRef<PDFDocumentLoadingTask|null>(null),request=useRef(0);
  useEffect(()=>()=>{request.current++;void task.current?.destroy();},[]);
  async function read(file?:File){
    if(!file)return;const id=++request.current;void task.current?.destroy();setResult(null);setPages([]);setProgress(0);setBusy(true);setName(file.name);setStatus("Opening PDF on this device…");
    try{
      if(file.size>25*1024*1024)throw Error("Choose a PDF smaller than 25 MB.");
      const pdfjs=await import("pdfjs-dist");
      if(id!==request.current)return;
      pdfjs.GlobalWorkerOptions.workerSrc="/pdfjs/pdf.worker.min.mjs";
      const data=new Uint8Array(await file.arrayBuffer());if(id!==request.current)return;
      const loading=pdfjs.getDocument({data,password:password||undefined,cMapUrl:"/pdfjs/cmaps/",cMapPacked:true,standardFontDataUrl:"/pdfjs/standard_fonts/",useWasm:false});task.current=loading;
      const document=await loading.promise;if(id!==request.current){await loading.destroy();return;}
      if(document.numPages>250)throw Error("This PDF has more than 250 pages. Split it into smaller chapters first.");
      const extracted:SourcePage[]=[];let chars=0;
      for(let n=1;n<=document.numPages;n++){
        if(id!==request.current)return;
        const pdfPage=await document.getPage(n),content=await pdfPage.getTextContent();
        const text=content.items.map(item=>"str" in item?item.str+(item.hasEOL?"\n":" "):"").join("").trim();chars+=text.length;
        if(chars>2_000_000)throw Error("This PDF contains too much text for this browser workspace. Use a smaller chapter.");
        extracted.push({page:n,text});pdfPage.cleanup();setProgress(Math.round(n/document.numPages*100));setStatus(`Reading page ${n} of ${document.numPages}…`);
      }
      if(id!==request.current)return;
      setPages(extracted);setFirst(1);setLast(extracted.length);setPage(1);
      const blank=extracted.filter(p=>p.text.length<30).length;
      setStatus(blank===extracted.length?"No readable text found. This may be a scanned PDF. Run OCR (text recognition) first, then upload the searchable PDF.":`Extracted ${extracted.length} pages.${blank?` ${blank} pages have little or no text and may need OCR.`:""} Choose a page range and build your study notes.`);
      await loading.destroy();task.current=null;
    }catch(error){if(id===request.current){setStatus(error instanceof Error?(error.name==="PasswordException"?"This PDF needs a password. Enter it below and select the file again.":error.message):"Could not read this PDF. Try a searchable PDF or a smaller file.");void task.current?.destroy();task.current=null;}}
    finally{if(id===request.current)setBusy(false);}
  }
  const summaryText=result?`${name}\nPages ${first}–${last}\n\nKEY POINTS\n${result.summary.map(s=>`• ${s.text} [p. ${s.page}]`).join("\n\n")}\n\nKEY TERMS\n${result.terms.map(t=>`${t.term}: ${t.source?.text} [p. ${t.source?.page}]`).join("\n\n")}`:"";
  return <section className="panel pdf-decoder"><div className="decoder-heading"><div><p className="eyebrow">PDF decoder</p><h2>Turn a chapter into a study pack</h2><p>Extract text, select key points, collect terms and create recall cards with page references.</p></div><span className="tag">ON YOUR DEVICE</span></div>
    <div className="decoder-upload"><label htmlFor="decode-file">Choose a PDF · up to 25 MB / 250 pages</label><input id="decode-file" type="file" accept=".pdf,application/pdf" onChange={e=>{void read(e.target.files?.[0]);e.target.value="";}}/><details><summary>Password-protected PDF?</summary><label htmlFor="pdf-password">Document password (optional)</label><input id="pdf-password" type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></details></div>
    {busy&&<div className="row"><progress value={progress} max={100} aria-label="PDF extraction progress"/><button className="btn secondary" onClick={()=>{request.current++;void task.current?.destroy();task.current=null;setBusy(false);setStatus("Extraction cancelled. Choose a PDF to start again.");}}>Cancel</button></div>}
    <p role="status" className="notice">{status||"Your PDF and password stay in this browser. Scanned images need OCR before this tool can extract their words."}</p>
    {pages.length>0&&<><div className="decoder-options"><label>From page<input type="number" min={1} max={pages.length} value={first} onChange={e=>{setFirst(Number(e.target.value));setResult(null);}}/></label><label>To page<input type="number" min={1} max={pages.length} value={last} onChange={e=>{setLast(Number(e.target.value));setResult(null);}}/></label><label>Summary length<select value={length} onChange={e=>{setLength(Number(e.target.value));setResult(null);}}><option value={6}>Brief · 6 points</option><option value={12}>Standard · 12 points</option><option value={24}>Detailed · 24 points</option></select></label></div><label htmlFor="decoder-focus">Focus on a topic (optional)</label><input id="decoder-focus" placeholder="For example: liberty or democracy" value={focus} maxLength={200} onChange={e=>{setFocus(e.target.value);setResult(null);}}/><button className="btn section-gap" disabled={busy||!Number.isInteger(first)||!Number.isInteger(last)||first<1||last<first||last>pages.length} onClick={()=>{const built=decodeStudy(pages.filter(p=>p.page>=first&&p.page<=last),length,focus);setResult(built);setStatus(built.summary.length?"Study pack ready. Review the extracted points against the source before using them.":"No suitable passages found. Try a wider page range, a different topic, or check the extracted text.");}}>Build study pack</button>
    {result&&result.summary.length>0&&<div className="decoder-result section-gap"><div className="row between"><h3>Key points from your PDF</h3><button className="btn secondary" onClick={()=>download("pdf-study-pack.txt",summaryText)}>Download study pack</button></div><p className="small muted">An automatic extractive summary: these are selected source sentences, not an AI explanation or a complete account of the document. Reading order and tables can be imperfect.</p><ol className="decoder-points">{result.summary.map((s,i)=><li key={i}>{s.text} <button className="source-page" onClick={()=>{setPage(s.page);document.getElementById("extracted-text")?.scrollIntoView({behavior:"smooth",block:"center"});}}>Page {s.page}</button></li>)}</ol><div className="row"><button className="btn" onClick={()=>{onNotes(summaryText);setStatus("Study notes appended to the selected notebook.");}}>Add to notebook</button><button className="btn secondary" onClick={()=>{const added=onCards(result.cards);setStatus(`${added} recall cards added to the selected notebook. ${added<result.cards.length?"This notebook has reached its 500-card limit.":""}`);}}>Create {result.cards.length} recall cards</button></div><details><summary>Key terms in context</summary>{result.terms.map(t=><p key={t.term}><strong>{t.term}</strong> · {t.source?.text} <span className="tag">p. {t.source?.page}</span></p>)}</details></div>}
    <details id="extracted-text" open><summary>Check the extracted source</summary><label>Page<select value={page} onChange={e=>setPage(Number(e.target.value))}>{pages.map(p=><option key={p.page} value={p.page}>Page {p.page}</option>)}</select></label><pre className="source-text">{pages[page-1]?.text||"No readable text on this page."}</pre><button className="btn secondary" onClick={()=>download("pdf-extracted-text.txt",pages.map(p=>`PAGE ${p.page}\n${p.text}`).join("\n\n"))}>Download extracted text</button></details></>}
  </section>;
}
