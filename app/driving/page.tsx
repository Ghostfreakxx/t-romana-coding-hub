import LearningLab from "@/components/learning-lab";
import DrivingSimulator from "@/components/driving-simulator";
import LabBoundary from "@/components/lab-boundary";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Driving Lab" };
export default function Page(){return <LearningLab id="driving"><LabBoundary name="Driving simulator"><DrivingSimulator/></LabBoundary></LearningLab>;}
