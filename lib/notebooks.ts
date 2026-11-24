/** Study Lab notebooks and revision cards, shared so other labs (such as the Notes library) can add cards. */
export type Card = { id: string; front: string; back: string; box?: number; due?: string };
export type Notebook = { id: string; title: string; notes: string; cards: Card[] };
export const initialNotebooks: Notebook[] = [{ id: "first", title: "My first notebook", notes: "", cards: [] }];
export const NOTES_NOTEBOOK = "notes-library";
export function isNotebooks(v: unknown): v is Notebook[] {
  return Array.isArray(v) && v.length > 0 && v.length <= 100 && new Set(v.map(n => n?.id)).size === v.length && v.every(n => n && typeof n.id === "string" && typeof n.title === "string" && typeof n.notes === "string" && Array.isArray(n.cards) && n.cards.length <= 500 && n.cards.every((c: Card) => c && typeof c.id === "string" && typeof c.front === "string" && typeof c.back === "string" && (c.box === undefined || (Number.isInteger(c.box) && c.box >= 0 && c.box <= 6)) && (c.due === undefined || /^\d{4}-\d{2}-\d{2}$/.test(c.due))));
}
/** Adds a card to the “From the Notes library” notebook, creating it when needed. Returns null when the card already exists or the notebook is full. */
export function addNotesCard(books: Notebook[], card: Card): Notebook[] | null {
  const existing = books.find(b => b.id === NOTES_NOTEBOOK);
  if (books.some(b => b.cards.some(c => c.id === card.id))) return null;
  if (existing) return existing.cards.length >= 500 ? null : books.map(b => b.id === NOTES_NOTEBOOK ? { ...b, cards: [...b.cards, card] } : b);
  if (books.length >= 100) return null;
  return [...books, { id: NOTES_NOTEBOOK, title: "From the Notes library", notes: "", cards: [card] }];
}
