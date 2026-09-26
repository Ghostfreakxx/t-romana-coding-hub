"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
export const links = [["/", "Home"], ["/install", "Get app"], ["/coding", "Coding"], ["/college", "College"], ["/notes", "Notes"], ["/study", "Study"], ["/reasoning", "Reasoning"], ["/driving", "Driving"], ["/skills", "Basic skills"], ["/electrical", "Electrical"], ["/progress", "My progress"]];
export default function Navigation() {
  const path = usePathname();
  return <header className="site-header">
    <div className="college-masthead">
      <Link href="/" aria-label="Govt. T. Romana College Skills Hub home" className="college-logo-link"><Image src="/branding/trc-logo.png" width={600} height={100} alt="Govt. T. Romana College, Aizawl — Service to Mankind" priority unoptimized className="college-logo" /></Link>
      <p className="language-message"><strong>MIZO</strong><span>Know your own language.</span></p>
    </div>
    <div className="nav-wrap"><Link className="brand" href="/" aria-label="T. Romana Skills Hub home"><span>SKILLS HUB</span></Link><nav aria-label="Main navigation">{links.map(([href, text]) => <Link key={href} href={href} aria-current={path === href || (href !== "/" && path.startsWith(`${href}/`)) ? "page" : undefined}>{text}</Link>)}</nav></div>
  </header>;
}
