"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SiteSearch from "@/components/site-search";
export const links = [["/", "Home"], ["/install", "Get app"], ["/coding", "Coding"], ["/college", "College"], ["/notes", "Notes"], ["/questions", "Question bank"], ["/study", "Study"], ["/reasoning", "Reasoning"], ["/driving", "Driving"], ["/skills", "Basic skills"], ["/electrical", "Electrical"], ["/progress", "My progress"]];
export default function Navigation() {
  const path = usePathname();
  // The menu belongs to the page it was opened on, so it closes by itself after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === path;
  const current = links.find(([href]) => path === href || (href !== "/" && path.startsWith(`${href}/`)));
  return <header className="site-header">
    <div className="college-masthead">
      <Link href="/" aria-label="Govt. T. Romana College Skills Hub home" className="college-logo-link"><Image src="/branding/trc-logo.png" width={600} height={100} alt="Govt. T. Romana College, Aizawl — Service to Mankind" priority unoptimized className="college-logo" /></Link>
      <p className="language-message"><strong>MIZO</strong><span>Know your own language.</span></p>
    </div>
    <div className="nav-wrap">
      <div className="nav-bar">
        <Link className="brand" href="/" aria-label="T. Romana Skills Hub home"><span>SKILLS HUB</span></Link>
        <div className="nav-actions">
          <SiteSearch />
          <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setOpenOn(menuOpen ? null : path)}>
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span> {menuOpen ? "Close" : current && current[0] !== "/" ? current[1] : "Menu"}
          </button>
        </div>
      </div>
      <nav id="main-navigation" aria-label="Main navigation" className={menuOpen ? "is-open" : undefined}>{links.map(([href, text]) => <Link key={href} href={href} aria-current={current?.[0] === href ? "page" : undefined} onClick={() => setOpenOn(null)}>{text}</Link>)}</nav>
    </div>
  </header>;
}
