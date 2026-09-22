"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
const memory = new Map<string, string>();
const event = "trc-storage";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(event, callback); };
}
export function useSaved<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const fullKey = `trc:v1:${key}`;
  const [error, setError] = useState("");
  const raw = useSyncExternalStore(subscribe, () => {
    if (memory.has(fullKey)) return memory.get(fullKey)!;
    try { return localStorage.getItem(fullKey); } catch { return null; }
  }, () => null);
  const value = useMemo(() => {
    try { const parsed: unknown = JSON.parse(raw ?? "null"); return validate(parsed) ? parsed : initial; }
    catch { return initial; }
  }, [raw, initial, validate]);
  const setValue = useCallback((next: T) => {
    const encoded = JSON.stringify(next);
    try { localStorage.setItem(fullKey, encoded); memory.delete(fullKey); setError(""); }
    catch { memory.set(fullKey, encoded); setError("Your browser could not save this. Keep this page open and download a copy before leaving."); }
    window.dispatchEvent(new Event(event));
  }, [fullKey]);
  return { value, setValue, error };
}
export const isString = (v: unknown): v is string => typeof v === "string";
export const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string");
export const emptyList: string[] = [];
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
