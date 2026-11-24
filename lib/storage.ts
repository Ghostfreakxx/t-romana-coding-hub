"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
const memory = new Map<string, string>();
const event = "trc-storage";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(event, callback); };
}
/** Local calendar date, e.g. "2026-11-24". */
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const activityKey = "trc:v1:activity";
let lastRecorded = "";
/** Marks today as a study day. Any saved change on the hub counts. Keeps about a year of days. */
export function recordActivity() {
  const today = dayKey();
  if (lastRecorded === today) return;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(activityKey) ?? "[]");
    const days = Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === "string") : [];
    if (!days.includes(today)) localStorage.setItem(activityKey, JSON.stringify([...days, today].sort().slice(-400)));
    lastRecorded = today;
  } catch { /* Storage is unavailable; the streak simply is not kept. */ }
}
/** Saves that are settings or bookkeeping rather than study, so they do not count towards the streak. */
const notStudy = new Set(["activity", "readerPrefs", "recentGuides"]);
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
    if (!notStudy.has(key)) recordActivity();
    const encoded = JSON.stringify(next);
    try { localStorage.setItem(fullKey, encoded); memory.delete(fullKey); setError(""); }
    catch { memory.set(fullKey, encoded); setError("Your browser could not save this. Keep this page open and download a copy before leaving."); }
    window.dispatchEvent(new Event(event));
  }, [fullKey, key]);
  return { value, setValue, error };
}
export const isString = (v: unknown): v is string => typeof v === "string";
export const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string");
export const emptyList: string[] = [];
export const isStringRecord = (v: unknown): v is Record<string, string> =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v as object).every(x => typeof x === "string");
export const emptyRecord: Record<string, string> = {};
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
