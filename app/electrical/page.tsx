import LearningLab from "@/components/learning-lab";
import Circuit from "@/components/circuit";
import ApplianceWorkshop from "@/components/appliance-workshop";
import type {Metadata} from "next";
export const metadata: Metadata = {title:"Electrical Basics"};
export default function Page(){return <LearningLab id="electrical"><Circuit/><ApplianceWorkshop/></LearningLab>;}
