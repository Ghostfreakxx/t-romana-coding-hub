import type { Metadata } from "next";
import Shell from "@/components/shell";
import InstallGuide from "@/components/install-guide";
export const metadata:Metadata={title:"Install the app"};
export default function Page(){return <Shell eyebrow="TRC / on your device" title="Your learning. Always close." intro="Put the Skills Hub on your home screen with the college logo. No app-store download or hub account is needed."><InstallGuide/></Shell>;}
