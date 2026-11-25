export type Weather = "day" | "rain" | "night";
export type Course = "hills" | "town" | "training" | "pass" | "school";
export type Traffic = { id: number; z: number; lane: number; speed: number; hit: boolean; passed: boolean };
export type Checkpoint = { id: string; distance: number; kind: "stop" | "slow"; label: string; limit: number; passed: boolean; success: boolean; hold: number };
export type DriveState = { distance: number; speed: number; position: number; steering: number; elapsed: number; hits: number; passed: number; score: number; running: boolean; finished: boolean; weather: Weather; course: Course; traffic: Traffic[]; checkpoints: Checkpoint[]; offRoad: number; speeding: number; brakeStart: number | null; stoppingDistance: number | null; indicator: Signal; lane: number; laneChanges: number; signalFaults: number; tailgating: number; followGap: number | null };
export type Signal = -1 | 0 | 1;
export const ROUTE_LENGTH = 1200;
/** Lane centres across the road, left to right. */
export const LANES = [-.58, 0, .58];
/** Recommended minimum time gap to the vehicle ahead (the two-second rule). */
export const SAFE_GAP = 2;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const COURSES: Record<Course,{title:string;description:string}> = {
  training: {title:"Control practice",description:"Light traffic, a full stop and a gentle speed check."},
  hills: {title:"Hill route",description:"Forest bends, roadside barriers and controlled approaches."},
  town: {title:"Town route",description:"Buildings, busier traffic and a slower practice zone."},
  pass: {title:"Mountain pass",description:"Hairpin bends that push a fast car wide."},
  school: {title:"School zone",description:"30 km/h zone, zebra crossing, school gate."},
};
export const roadCenter = (distance: number, course: Course) => course === "training" ? Math.sin(distance/220)*2 : course === "pass" ? Math.sin(distance/90)*12+Math.sin(distance/37)*2.5 : course === "school" ? Math.sin(distance/260)*3 : Math.sin(distance/145)*9+Math.sin(distance/75)*2;
/** How sharply the road bends here (1/m). On the mountain pass this pushes a fast car towards the outside of the bend. */
export const curvature = (distance: number, course: Course) => (roadCenter(distance+5,course)-2*roadCenter(distance,course)+roadCenter(distance-5,course))/25;
/** True when a sharp bend lies within the next 60 m. */
export const sharpBendAhead = (distance: number, course: Course) => course === "pass" && [0,20,40,60].some(a => Math.abs(curvature(distance+a,course)) > .0016);
/** The zebra crossing on the school route; pedestrians cross here. */
export const ZEBRA = 470;
export const speedLimit = (weather: Weather, distance=0, course: Course="hills") => course==="town" && distance>180 && distance<440 ? 30 : course==="school" && distance>240 && distance<760 ? 30 : course==="pass" ? weather==="rain"?35:45 : weather==="rain"?40:course==="training"||course==="school"?50:60;
export function newDrive(weather: Weather = "day", course: Course = "hills"): DriveState {
  const events=course==="pass"?[{distance:260,kind:"slow" as const,label:"Hairpin bend",limit:30},{distance:560,kind:"slow" as const,label:"Hairpin bend",limit:30},{distance:820,kind:"stop" as const,label:"Junction on the pass",limit:0},{distance:1060,kind:"slow" as const,label:"Steep downhill bend",limit:30}]:course==="school"?[{distance:250,kind:"slow" as const,label:"School zone begins",limit:30},{distance:ZEBRA,kind:"stop" as const,label:"Zebra crossing: give way to pedestrians",limit:0},{distance:650,kind:"slow" as const,label:"School gate",limit:20},{distance:1000,kind:"stop" as const,label:"Junction stop",limit:0}]:course==="town"?[{distance:300,kind:"slow" as const,label:"Town zone",limit:30},{distance:620,kind:"stop" as const,label:"Stop checkpoint",limit:0},{distance:950,kind:"slow" as const,label:"Pedestrian-zone approach",limit:30}]:[{distance:350,kind:"stop" as const,label:"Stop checkpoint",limit:0},{distance:760,kind:"slow" as const,label:"Controlled approach",limit:30}];
  return { distance:0,speed:0,position:-.58,steering:0,elapsed:0,hits:0,passed:0,score:100,running:false,finished:false,weather,course,offRoad:0,speeding:0,brakeStart:null,stoppingDistance:null,indicator:0,lane:0,laneChanges:0,signalFaults:0,tailgating:0,followGap:null,
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
  // On the pass, speed in a bend pushes the car outwards (more with the square of speed), so drivers must slow before bends.
  if(s.course==="pass")s.position=clamp(s.position-curvature(s.distance,s.course)*(s.speed/3.6)**2*.35*dt,-1.22,1.22);
  if(Math.abs(s.position)>.94){s.speed=Math.max(0,s.speed-30*dt);s.score-=dt*3;s.offRoad+=dt;}
  if(s.speed>speedLimit(s.weather,s.distance,s.course)+1){s.score-=dt*1.2;s.speeding+=dt;}
  // Lane discipline: a lane change counts once the car is clearly past the lane line (hysteresis avoids double counting).
  if(Math.abs(s.position)<=.94&&Math.abs(s.position-LANES[s.lane])>.36){
    const next=LANES.reduce((best,c,i)=>Math.abs(c-s.position)<Math.abs(LANES[best]-s.position)?i:best,0);
    if(next!==s.lane){const direction=Math.sign(next-s.lane) as Signal;s.laneChanges++;
      if(s.speed>8&&s.indicator!==direction){s.signalFaults++;s.score-=4;}
      else if(s.indicator===direction)s.indicator=0; // cancel the indicator after a signalled change, as a driver should
      s.lane=next;}
  }
  // Following distance: the nearest vehicle ahead in the same lane, measured in seconds at the current speed.
  let ahead=Infinity;
  for(const car of s.traffic){const gap=car.z-s.distance-4.5;if(!car.hit&&gap>0&&gap<ahead&&Math.abs(car.lane-s.position)<.3)ahead=gap;}
  s.followGap=ahead<Infinity&&s.speed>10?ahead/(s.speed/3.6):null;
  if(s.followGap!==null&&s.followGap<SAFE_GAP){s.tailgating+=dt;s.score-=dt*.8;}
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
