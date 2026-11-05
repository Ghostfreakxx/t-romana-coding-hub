import LearningLab from "@/components/learning-lab";
import CircuitWorkbench from "@/components/circuit-workbench";
import ApplianceWorkshop from "@/components/appliance-workshop";
import LabBoundary from "@/components/lab-boundary";
import type {Metadata} from "next";
export const metadata: Metadata = {title:"Electrical Basics"};
export default function Page(){return <LearningLab id="electrical"><LabBoundary name="Circuit workbench"><CircuitWorkbench/></LabBoundary><LabBoundary name="Appliance workshop"><ApplianceWorkshop/></LabBoundary></LearningLab>;}
