"use client";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
const languages = { html: html(), css: css(), js: javascript() };
export default function StudioEditor({ value, language, onChange }: { value: string; language: "html" | "css" | "js"; onChange: (value: string) => void }) {
  return <CodeMirror value={value} height="480px" theme={oneDark} extensions={[languages[language]]} onChange={onChange} aria-label={`${language.toUpperCase()} code editor`} basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true, highlightActiveLine: true }} />;
}
