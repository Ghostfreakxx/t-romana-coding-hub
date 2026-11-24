import LearningLab from "@/components/learning-lab";
import ReasoningTrainer from "@/components/reasoning-trainer";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Reasoning Lab" };
export default function Page(){return <LearningLab id="reasoning"><ReasoningTrainer/></LearningLab>;}
