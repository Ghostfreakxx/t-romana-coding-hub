/** Leitner-style spaced repetition: each correct recall moves a card to a box with a longer gap before it is shown again. */
export type Grade = "again" | "hard" | "good" | "easy";
export type Scheduled = { box?: number; due?: string };
/** Days to wait after reaching each box. Box 0 means “see it again this session”. */
export const INTERVALS = [0, 1, 3, 7, 14, 30, 60];
export const MAX_BOX = INTERVALS.length - 1;
export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number), date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}
/** New cards (never reviewed) are due straight away. */
export const isDue = (card: Scheduled, today: string) => !card.due || card.due <= today;
export function schedule<T extends Scheduled>(card: T, grade: Grade, today: string): T {
  const box = card.box ?? 0;
  const next = grade === "again" ? 0 : grade === "hard" ? Math.max(1, box) : grade === "good" ? Math.min(MAX_BOX, box + 1) : Math.min(MAX_BOX, box + 2);
  return { ...card, box: next, due: addDays(today, INTERVALS[next]) };
}
export function nextReviewLabel(card: Scheduled, grade: Grade) {
  const days = INTERVALS[schedule(card, grade, "2000-01-01").box ?? 0];
  return days === 0 ? "now" : days === 1 ? "1 day" : `${days} days`;
}
