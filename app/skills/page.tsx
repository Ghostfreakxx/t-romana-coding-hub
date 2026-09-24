import LearningLab from "@/components/learning-lab";
import MusicStudio from "@/components/music-studio";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Skills Lab" };
export default function Page(){return <LearningLab id="skills"><MusicStudio/></LearningLab>;}
