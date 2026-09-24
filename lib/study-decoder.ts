export type SourcePage = { page: number; text: string };
export type SourceSentence = { page: number; text: string; score: number; order: number };
const STOP = new Set("the a an and or to of in on for from by with as is are was were be been being it its this that these those at not no but can could would should may will shall also such their they them we our you your have has had which who what when where how than then into about over under between through each all some any one two more most other there here do does did".split(" "));
export const words = (text: string) => (text.toLowerCase().match(/[\p{L}]{3,}/gu) ?? []).filter(word => !STOP.has(word));
export function decodeStudy(pages: SourcePage[], count = 12, focus = "") {
  const sentences: SourceSentence[] = [];
  for (const page of pages) {
    const clean = page.text.replace(/(\p{L})-\s*\n\s*(\p{L})/gu, "$1$2").replace(/\s+/g, " ");
    const pieces = clean.match(/[^.!?\n]+(?:[.!?]+(?=\s|$)|$)/g) ?? [];
    for (const piece of pieces) { const text=piece.trim(); if(text.length>=40 && text.length<=1800)sentences.push({page:page.page,text,score:0,order:sentences.length}); }
  }
  const frequency=new Map<string,number>();
  for(const sentence of sentences)for(const word of new Set(words(sentence.text)))frequency.set(word,(frequency.get(word)??0)+1);
  const focusWords=words(focus), seen=new Set<string>();
  const ranked=sentences.filter(s=>{const key=s.text.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).map(s=>{
    const terms=words(s.text);const focusHits=focusWords.filter(w=>terms.includes(w)).length;
    return {...s,score:terms.reduce((sum,w)=>sum+Math.log(1+(frequency.get(w)??0)),0)/Math.sqrt(Math.max(terms.length,1)) + focusHits*12};
  }).filter(s=>!focusWords.length||focusWords.some(w=>words(s.text).includes(w))).sort((a,b)=>b.score-a.score);
  const selected=ranked.slice(0,count).sort((a,b)=>a.order-b.order);
  const terms=[...frequency].filter(([term])=>!focusWords.length||ranked.some(s=>words(s.text).includes(term))).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([term,mentions])=>({term,mentions,source:ranked.find(s=>words(s.text).includes(term))})).filter(t=>t.source);
  const cards=selected.slice(0,8).map(s=>{const term=words(s.text).sort((a,b)=>(frequency.get(b)??0)-(frequency.get(a)??0))[0];return {front:term?s.text.replace(new RegExp(`\\b${term}\\b`,"i"),"_____ "):s.text,back:`${term??"Review the passage"}\nSource: page ${s.page}\n${s.text}`};});
  return { summary:selected,terms,cards,sentenceCount:sentences.length };
}
