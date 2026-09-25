import { isCode, type Code } from "./code";

export type StudioProject = { id: string; name: string; code: Code; updated: string };
export const MAX_CODE = 600_000;
export const MAX_PROJECTS = 16;
export function validCode(value: unknown): value is Code {
  return isCode(value) && Object.values(value).every(v => typeof v === "string" && v.length <= MAX_CODE);
}
export function isProjectList(value: unknown): value is StudioProject[] {
  if (!Array.isArray(value) || !value.length || value.length > MAX_PROJECTS) return false;
  const ids = new Set<string>();
  return value.every(p => {
    if (!p || typeof p.id !== "string" || ids.has(p.id) || typeof p.name !== "string" || p.name.length > 80 || typeof p.updated !== "string" || !validCode(p.code)) return false;
    ids.add(p.id); return true;
  });
}

// Parse, never execute, an AI response. Incomplete answers remain staged for review.
export function parseCodeResponse(text: string): Partial<Code> {
  if (text.length > MAX_CODE * 3) throw new Error("Use a response smaller than 1.8 million characters.");
  const trimmed = text.trim();
  try {
    const json = JSON.parse(trimmed);
    const code = json.code ?? json;
    if (validCode(code)) return { html: code.html, css: code.css, js: code.js };
  } catch { /* Markdown and HTML are handled below. */ }
  const result: Partial<Code> = {};
  const blocks = [...text.matchAll(/```([\w.-]*)[^\n]*\n([\s\S]*?)```/g)];
  for (const match of blocks) {
    const language = match[1].toLowerCase();
    const key = ["html", "htm", "index.html"].includes(language) ? "html" : ["css", "styles.css", "style.css"].includes(language) ? "css" : ["javascript", "js", "script.js"].includes(language) ? "js" : null;
    if (key) result[key] = (result[key] ? `${result[key]}\n` : "") + match[2].trim();
    if (language === "json") { try { const v = JSON.parse(match[2]); if (validCode(v)) return v; } catch { /* Ignore non-project JSON. */ } }
  }
  if (!Object.keys(result).length && /^(<!doctype\s+html|<html|<body|<main|<div|<h1|<section)/i.test(trimmed)) result.html = trimmed;
  if (!Object.keys(result).length) throw new Error("No HTML, CSS or JavaScript found. Ask your AI for named code blocks or one complete HTML file.");
  if (Object.values(result).some(v => v.length > MAX_CODE)) throw new Error("One of the files is too large for this editor.");
  return result;
}

export function buildCodingPrompt(idea: string, task: string, code?: Code) {
  return `You are helping a beginner at Govt. T. Romana College build a browser project.\nTask: ${task}.\nMy idea or question: ${idea.trim() || "A personal portfolio website"}\n\nUse plain HTML, CSS and JavaScript. No npm, React, external libraries, APIs, remote images, backend, accounts or secret keys. The preview is an isolated browser sandbox without network or localStorage access. Use in-memory state. Use accessible labels, keyboard controls, mobile-first layouts, inline SVG/CSS artwork and clear error messages. Do not collect real personal data.\n\nReturn the COMPLETE updated files in three fenced blocks named html, css and javascript. In the HTML block, give the body content only; place styles and scripts in their own blocks. Then briefly explain the changes in simple English and suggest one thing I can try. Do not claim you have deployed or tested it.\n${code ? `\nHere is my current project, shared with my permission:\nHTML:\n${code.html}\nCSS:\n${code.css}\nJavaScript:\n${code.js}` : ""}`;
}
