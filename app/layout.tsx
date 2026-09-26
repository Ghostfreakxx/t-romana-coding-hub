import type { Metadata, Viewport } from "next";
import Navigation from "@/components/navigation";
import PwaProvider from "@/components/pwa-provider";
import "./globals.css";
import "./lab-polish.css";
export const metadata: Metadata = {
  title: { default: "T. Romana Skills Hub", template: "%s | T. Romana Skills Hub" },
  description: "Learn, practise and build. Free coding, college study tools, reasoning and everyday skills for students.",
  applicationName: "TRC Skills Hub",
  appleWebApp: { capable:true, title:"TRC Skills", statusBarStyle:"default" },
  icons: { icon: "/icons/trc-192.png", apple: "/icons/trc-apple-180.png" },
};
export const viewport:Viewport={themeColor:"#173b36",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><PwaProvider><a className="skip-link" href="#main-content">Skip to content</a><Navigation />{children}</PwaProvider><footer className="site-footer"><strong>T. Romana Skills Hub</strong><span>Learn from the world. Know your roots.</span><p>No account needed. Notes and progress stay in this browser. Download important work to keep a backup.</p></footer></body></html>;
}
