import LearningLab from "@/components/learning-lab";
import DrivingSimulator from "@/components/driving-simulator";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Driving Lab" };
export default function Page(){return <LearningLab id="driving"><DrivingSimulator/></LearningLab>;}
