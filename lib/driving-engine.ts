export type Weather = "day" | "rain" | "night";
export type Course = "hills" | "town" | "training";
export type Traffic = { id: number; z: number; lane: number; speed: number; hit: boolean; passed: boolean };
export type Checkpoint = { id: string; distance: number; kind: "stop" | "slow"; label: string; limit: number; passed: boolean; success: boolean; hold: number };
export type DriveState = { distance: number; speed: number; position: number; steering: number; elapsed: number; hits: number; passed: number; score: number; running: boolean; finished: boolean; weather: Weather; course: Course; traffic: Traffic[]; checkpoints: Checkpoint[]; offRoad: number; speeding: number; brakeStart: number | null; stoppingDistance: number | null };
export const ROUTE_LENGTH = 1200;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const COURSES: Record<Course,{title:string;description:string}> = {
  training: {title:"Control practice",description:"Light traffic, a full stop and a gentle speed check."},
  hills: {title:"Hill route",description:"Forest bends, roadside barriers and controlled approaches."},
  town: {title:"Town route",description:"Buildings, busier traffic and a slower practice zone."},
};
export const roadCenter = (distance: number, course: Course) => course === "training" ? Math.sin(distance/220)*2 : Math.sin(distance/145)*9+Math.sin(distance/75)*2;
export const speedLimit = (weather: Weather, distance=0, course: Course="hills") => course==="town" && distance>180 && distance<440 ? 30 : weather==="rain"?40:course==="training"?50:60;
export function newDrive(weather: Weather = "day", course: Course = "hills"): DriveState {
  const events=course==="town"?[{distance:300,kind:"slow" as const,label:"Town zone",limit:30},{distance:620,kind:"stop" as const,label:"Stop checkpoint",limit:0},{distance:950,kind:"slow" as const,label:"Pedestrian-zone approach",limit:30}]:[{distance:350,kind:"stop" as const,label:"Stop checkpoint",limit:0},{distance:760,kind:"slow" as const,label:"Controlled approach",limit:30}];
  return { distance:0,speed:0,position:-.58,steering:0,elapsed:0,hits:0,passed:0,score:100,running:false,finished:false,weather,course,offRoad:0,speeding:0,brakeStart:null,stoppingDistance:null,
    checkpoints:events.map((e,i)=>({...e,id:String(i),passed:false,success:false,hold:0})),
    traffic:Array.from({length:course==="training"?5:12},(_,id)=>({id,z:110+id*105,lane:[0,.58,-.58][id%3],speed:18+id%4*5,hit:false,passed:false})) };
}
export function stepDrive(s:DriveState,seconds:number,input:{throttle:boolean;brake:boolean;steer:number}) {
  if(!s.running||s.finished)return;
  const dt=clamp(seconds,0,.05),before=s.distance;
  s.elapsed+=dt;
  s.steering+=(clamp(input.steer,-1,1)-s.steering)*Math.min(1,dt*7);
  if(input.brake&&s.speed>5&&s.brakeStart===null)s.brakeStart=s.distance;
  if(!input.brake)s.brakeStart=null;
  s.speed=clamp(s.speed+(input.brake?(s.weather==="rain"?-32:-48):input.throttle?18:-7)*dt,0,90);
  s.position=clamp(s.position+s.steering*dt*s.speed/55,-1.22,1.22);
  if(Math.abs(s.position)>.94){s.speed=Math.max(0,s.speed-30*dt);s.score-=dt*3;s.offRoad+=dt;}
  if(s.speed>speedLimit(s.weather,s.distance,s.course)+1){s.score-=dt*1.2;s.speeding+=dt;}
  s.distance+=s.speed/3.6*dt;
  if(s.speed<.2&&s.brakeStart!==null){s.stoppingDistance=s.distance-s.brakeStart;s.brakeStart=null;}
  for(const car of s.traffic){car.z+=car.speed/3.6*dt;const gap=car.z-s.distance;
    if(!car.hit&&Math.abs(gap)<4.2&&Math.abs(car.lane-s.position)<.23){car.hit=true;s.hits++;s.score-=18;s.speed=Math.min(s.speed,car.speed*.5);}
    if(!car.passed&&gap<-7){car.passed=true;s.passed++;}
  }
  for(const checkpoint of s.checkpoints){
    if(checkpoint.passed)continue;
    const gap=checkpoint.distance-s.distance;
    if(checkpoint.kind==="stop"&&gap>=-2&&gap<=16){if(s.speed<1)checkpoint.hold+=dt;else checkpoint.hold=0;if(checkpoint.hold>=1){checkpoint.success=true;checkpoint.passed=true;}}
    if(checkpoint.kind==="slow"&&before<=checkpoint.distance&&s.distance>checkpoint.distance){checkpoint.passed=true;checkpoint.success=s.speed<=checkpoint.limit+1;if(!checkpoint.success)s.score-=10;}
    if(!checkpoint.passed&&gap<-6){checkpoint.passed=true;checkpoint.success=false;s.score-=15;}
  }
  s.score=clamp(s.score,0,100);
  if(s.distance>=ROUTE_LENGTH){s.distance=ROUTE_LENGTH;s.finished=true;s.running=false;s.speed=0;}
}
