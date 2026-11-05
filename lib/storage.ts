"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
/** Values that could not be written to localStorage (quota, private mode) stay here for this visit. */
const memory = new Map<string, string>();
/**
 * Last value read from localStorage per key. React reads the snapshot on every render;
 * without this cache a large notebook string was copied out of storage on each keystroke.
 */
const snapshots = new Map<string, string | null>();
const event = "trc-storage";
let watching = false;
function watchOtherTabs() {
  if (watching) return;
  watching = true;
  // Registered before any component listener, so the cache is fresh when React re-reads.
  window.addEventListener("storage", e => { if (e.key === null) snapshots.clear(); else snapshots.delete(e.key); });
}
function subscribe(callback: () => void) {
  watchOtherTabs();
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(event, callback); };
}
function read(fullKey: string) {
  if (memory.has(fullKey)) return memory.get(fullKey)!;
  if (snapshots.has(fullKey)) return snapshots.get(fullKey)!;
  let raw: string | null = null;
  try { raw = localStorage.getItem(fullKey); } catch { /* Storage blocked: fall back to defaults. */ }
  snapshots.set(fullKey, raw);
  return raw;
}
export function useSaved<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const fullKey = `trc:v1:${key}`;
  const [error, setError] = useState("");
  const raw = useSyncExternalStore(subscribe, () => read(fullKey), () => null);
  const value = useMemo(() => {
    try { const parsed: unknown = JSON.parse(raw ?? "null"); return validate(parsed) ? parsed : initial; }
    catch { return initial; }
  }, [raw, initial, validate]);
  const setValue = useCallback((next: T) => {
    const encoded = JSON.stringify(next);
    try { localStorage.setItem(fullKey, encoded); memory.delete(fullKey); snapshots.set(fullKey, encoded); setError(""); }
    catch { memory.set(fullKey, encoded); setError("Your browser could not save this. Keep this page open and download a copy before leaving."); }
    window.dispatchEvent(new Event(event));
  }, [fullKey]);
  return { value, setValue, error };
}
export const isString = (v: unknown): v is string => typeof v === "string";
export const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string");
export const emptyList: string[] = [];
export const isStringRecord = (v: unknown): v is Record<string, string> =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v as object).every(x => typeof x === "string");
export const emptyRecord: Record<string, string> = {};
export function download(name: string, content: string | Blob, type = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: type.includes("charset") ? type : `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  // Firefox needs the link in the document; Safari and slow phones need the URL to live
  // longer than a second while the save sheet opens.
  const a = document.createElement("a"); a.href = url; a.download = name; a.rel = "noopener"; a.style.display = "none";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
