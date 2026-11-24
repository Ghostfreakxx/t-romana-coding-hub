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

/** Every place a phrase appears, with a short snippet around it. */
export function searchPages(pages: SourcePage[], query: string, limit = 60) {
  const q = query.trim().toLowerCase(); if (q.length < 2) return [];
  const hits: { page: number; before: string; match: string; after: string }[] = [];
  for (const p of pages) {
    const text = p.text.replace(/\s+/g, " "), lower = text.toLowerCase();
    for (let i = lower.indexOf(q); i >= 0 && hits.length < limit; i = lower.indexOf(q, i + q.length))
      hits.push({ page: p.page, before: text.slice(Math.max(0, i - 70), i), match: text.slice(i, i + q.length), after: text.slice(i + q.length, i + q.length + 70) });
  }
  return hits;
}
/** Heading-like lines: short, no closing full stop, numbered or in capitals or title case. */
export function outline(pages: SourcePage[], limit = 80) {
  const out: { page: number; title: string }[] = [], seen = new Set<string>();
  for (const p of pages) for (const raw of p.text.split("\n")) {
    const line = raw.trim().replace(/\s+/g, " ");
    if (line.length < 4 || line.length > 70 || /[.,;:]$/.test(line) || /^\d+$/.test(line) || !/\p{L}{3}/u.test(line) || /^\p{Ll}/u.test(line)) continue;
    const letters = line.replace(/[^\p{L}]/gu, ""), words = line.split(" ");
    const caps = letters.length >= 4 && letters === letters.toUpperCase();
    const numbered = /^(\d+(\.\d+)*|[IVX]+|chapter|unit|section|part)\b[.)]?\s+\p{L}/iu.test(line);
    const title = words.length >= 2 && words.length <= 9 && words.filter(w => /^\p{Lu}/u.test(w) || /^(of|and|the|in|to|for|a|an|on)$/.test(w)).length === words.length;
    if (!(caps || numbered || title)) continue;
    const key = line.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
    out.push({ page: p.page, title: line }); if (out.length >= limit) return out;
  }
  return out;
}
/** Multiple-choice questions: a key sentence with one important term blanked; wrong options are other key terms. */
export function buildQuiz(pages: SourcePage[], count = 8, rng: () => number = Math.random) {
  const pack = decodeStudy(pages, 60), terms = pack.terms.map(t => t.term).filter(t => t.length >= 4);
  const used = new Set<string>(), questions: { page: number; prompt: string; options: string[]; answer: number; sentence: string }[] = [];
  // Table rows and run-on fragments make poor questions, so keep sentences a person could read at a glance.
  for (const s of pack.summary.filter(x => x.text.length <= 320 && x.text.split(" ").length >= 8)) {
    if (questions.length >= count) break;
    const term = terms.find(t => !used.has(t) && new RegExp(`\\b${t}\\b`, "i").test(s.text));
    if (!term) continue;
    const others = terms.filter(t => t !== term && !new RegExp(`\\b${t}\\b`, "i").test(s.text)).map(t => [rng(), t] as const).sort((a, b) => a[0] - b[0]).slice(0, 3).map(x => x[1]);
    if (others.length < 3) continue;
    used.add(term);
    const options = [term, ...others].map(t => [rng(), t] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    questions.push({ page: s.page, prompt: s.text.replace(new RegExp(`\\b${term}\\b`, "gi"), "_____"), options, answer: options.indexOf(term), sentence: s.text });
  }
  return questions;
}
export const readingStats = (text: string) => { const words = (text.match(/\S+/g) ?? []).length; return { words, minutes: Math.max(1, Math.round(words / 200)) }; };
