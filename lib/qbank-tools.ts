/** Helpers for the Question Bank: stable question keys, matching a question to a note topic, and practice tests. */
const STOP = new Set("what which explain discuss describe write short note notes examine define briefly analyse analyze critically evaluate assess elaborate state meaning nature main features importance about with their there between under from into that this those these does give your role significance concept various different types kinds following brief account detail details function functions power powers composition provision provisions system structure characteristic characteristics merit merits demerit demerits advantage advantages problem problems scope development".split(" "));
export const keywords = (text: string) => [...new Set((text.toLowerCase().match(/\p{L}{4,}/gu) ?? []).filter(w => !STOP.has(w)).map(w => w.replace(/(ies|es|s)$/, "")))];
/** A short, stable id for a question's wording so “prepared” marks survive data rebuilds with the same text. */
export function questionKey(groupId: string, text: string) {
  let h = 5381; for (const c of text.toLowerCase().replace(/[^a-z0-9]/g, "")) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return `${groupId}:${h.toString(36)}`;
}
export type NoteEntry = { g: string; s: string; t: string; c: string; k: string };
/** The note topic sharing the most keywords with the question (title words count double); null when the match is weak. */
export function matchNote(question: string, entries: NoteEntry[], guidePrefix: string) {
  const q = keywords(question); if (!q.length) return null;
  let best: { entry: NoteEntry; score: number } | null = null;
  for (const e of entries) {
    if (!e.g.startsWith(guidePrefix) || (e.k !== "short" && e.k !== "long")) continue;
    const title = keywords(e.t), ctx = keywords(e.c);
    const score = q.reduce((n, w) => n + (title.includes(w) ? 2 : ctx.includes(w) ? .5 : 0), 0) / Math.sqrt(title.length + 1);
    if (!best || score > best.score) best = { entry: e, score };
  }
  return best && best.score >= 1 ? best.entry : null;
}
/** A practice test: long and short questions, most-asked first but with some variety. */
export function mockTest<T extends { t: string; long: boolean; times: number }>(pool: T[], longCount = 2, shortCount = 3, rng: () => number = Math.random) {
  const weighted = (list: T[]) => list.map(q => [rng() * (1 + q.times), q] as const).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const seen = new Set<string>(), pickFrom = (list: T[], n: number) => weighted(list).filter(q => !seen.has(q.t) && seen.add(q.t)).slice(0, n);
  return [...pickFrom(pool.filter(q => q.long), longCount), ...pickFrom(pool.filter(q => !q.long), shortCount)];
}
