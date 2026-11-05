export type SourcePage = { page: number; text: string };
export type SourceSentence = { page: number; text: string; score: number; order: number };
const STOP = new Set("the a an and or to of in on for from by with as is are was were be been being it its this that these those at not no but can could would should may will shall also such their they them we our you your have has had which who what when where how than then into about over under between through each all some any one two more most other there here do does did".split(" "));
export const words = (text: string) => (text.toLowerCase().match(/[\p{L}]{3,}/gu) ?? []).filter(word => !STOP.has(word));
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Blank out the first whole-word use of a term. Works for non-English letters, unlike \b. */
export const cloze = (text: string, term: string) => text.replace(new RegExp(`(?<!\\p{L})${escapeRegExp(term)}(?!\\p{L})`, "iu"), "_____");
export function decodeStudy(pages: SourcePage[], count = 12, focus = "") {
  const sentences: SourceSentence[] = [];
  for (const page of pages) {
    const clean = page.text.replace(/(\p{L})-\s*\n\s*(\p{L})/gu, "$1$2").replace(/\s+/g, " ");
    const pieces = clean.match(/[^.!?\n]+(?:[.!?]+(?=\s|$)|$)/g) ?? [];
    for (const piece of pieces) { const text=piece.trim(); if(text.length>=40 && text.length<=1800)sentences.push({page:page.page,text,score:0,order:sentences.length}); }
  }
  // Each sentence is tokenised once. Large chapters previously re-ran the word regex
  // for every term × sentence pair, which froze phones on long PDFs.
  const tokens = sentences.map(sentence => words(sentence.text));
  const sets = tokens.map(list => new Set(list));
  const frequency=new Map<string,number>();
  for(const set of sets)for(const word of set)frequency.set(word,(frequency.get(word)??0)+1);
  const focusWords=[...new Set(words(focus))], seen=new Set<string>();
  const ranked:(SourceSentence&{index:number})[]=[];
  sentences.forEach((s,index)=>{
    const key=s.text.toLowerCase();if(seen.has(key))return;seen.add(key);
    const set=sets[index],terms=tokens[index],focusHits=focusWords.filter(w=>set.has(w)).length;
    if(focusWords.length&&!focusHits)return;
    ranked.push({...s,index,score:terms.reduce((sum,w)=>sum+Math.log(1+(frequency.get(w)??0)),0)/Math.sqrt(Math.max(terms.length,1)) + focusHits*12});
  });
  ranked.sort((a,b)=>b.score-a.score);
  const selected=ranked.slice(0,count).sort((a,b)=>a.order-b.order);
  // First (best-ranked) sentence that uses each word; doubles as the "appears in the focus range" filter.
  const firstUse=new Map<string,SourceSentence>();
  for(const s of ranked)for(const word of sets[s.index])if(!firstUse.has(word))firstUse.set(word,s);
  const strip=({index,...s}:SourceSentence&{index:number}):SourceSentence=>{void index;return s;};
  const terms=[...frequency].filter(([term])=>firstUse.has(term)).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([term,mentions])=>({term,mentions,source:strip(firstUse.get(term) as SourceSentence&{index:number})}));
  const cards=selected.slice(0,8).map(s=>{const term=[...sets[s.index]].sort((a,b)=>(frequency.get(b)??0)-(frequency.get(a)??0))[0];return {front:term?cloze(s.text,term):s.text,back:`${term??"Review the passage"}\nSource: page ${s.page}\n${s.text}`};});
  return { summary:selected.map(strip),terms,cards,sentenceCount:sentences.length };
}
