"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export const links = [["/", "Home"], ["/coding", "Coding"], ["/college", "College"], ["/notes", "Notes"], ["/study", "Study"], ["/reasoning", "Reasoning"], ["/driving", "Driving"], ["/skills", "Basic skills"], ["/electrical", "Electrical"], ["/progress", "My progress"]];
export default function Navigation() {
  const path = usePathname();
  return <header className="site-header"><div className="nav-wrap"><Link className="brand" href="/" aria-label="T. Romana Skills Hub home"><span className="brand-mark">TR</span><span>T. ROMANA <small>SKILLS HUB</small></span></Link><nav aria-label="Main navigation">{links.map(([href, text]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{text}</Link>)}</nav></div></header>;
}
