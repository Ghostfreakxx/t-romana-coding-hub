import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "T. Romana Skills Hub", template: "%s | T. Romana Skills Hub" },
  description: "Learn, practise and build. Free coding, college study tools, reasoning and everyday skills for students.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><Navigation />{children}<footer className="site-footer"><strong>T. Romana Skills Hub</strong><span>Learn from the world. Know your roots.</span><p>No account needed. Notes and progress stay in this browser. Download important work to keep a backup.</p></footer></body></html>;
}
