import LearningLab from "@/components/learning-lab";
import Circuit from "@/components/circuit";
import type {Metadata} from "next";
export const metadata: Metadata = {title:"Electrical Basics"};
export default function Page(){return <LearningLab id="electrical"><Circuit/></LearningLab>;}
