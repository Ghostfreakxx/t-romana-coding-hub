import LearningLab from "@/components/learning-lab";
import CircuitWorkbench from "@/components/circuit-workbench";
import ApplianceWorkshop from "@/components/appliance-workshop";
import {PredictGame,ResistorTrainer} from "@/components/electrical-trainers";
import type {Metadata} from "next";
export const metadata: Metadata = {title:"Electrical Basics"};
export default function Page(){return <LearningLab id="electrical"><CircuitWorkbench/><PredictGame/><ResistorTrainer/><ApplianceWorkshop/></LearningLab>;}
