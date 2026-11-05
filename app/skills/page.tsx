import LearningLab from "@/components/learning-lab";
import SkillsWorkspace from "@/components/skills-workspace";
import LabBoundary from "@/components/lab-boundary";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Skills Lab" };
export default function Page(){return <LearningLab id="skills"><LabBoundary name="Skills workspace"><SkillsWorkspace/></LabBoundary></LearningLab>;}
