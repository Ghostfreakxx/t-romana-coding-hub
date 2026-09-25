import Shell from "@/components/shell";
import CodingStudio from "@/components/coding-studio";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Coding Studio" };
export default function Coding() {
  return <Shell eyebrow="Create / experiment / understand" title="Your ideas belong on the web." intro="A real workspace for your first website, game or browser tool. Start with a design, bring code from your own AI, and make it yours."><CodingStudio/></Shell>;
}
