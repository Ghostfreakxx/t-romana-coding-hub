import type { ReactNode } from "react";
export default function Shell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main id="main-content" className="page"><header className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro">{intro}</p></header>{children}</main>;
}
