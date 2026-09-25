import LearningLab from "@/components/learning-lab";
import SkillsWorkspace from "@/components/skills-workspace";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Skills Lab" };
export default function Page(){return <LearningLab id="skills"><SkillsWorkspace/></LearningLab>;}
