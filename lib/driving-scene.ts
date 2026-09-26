import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { roadCenter, type DriveState } from "./driving-engine";

export type DrivingScene = { render: (state: DriveState, cockpit: boolean) => void; dispose: () => void };
export function createDrivingScene(canvas: HTMLCanvasElement, state: DriveState, highQuality: boolean): DrivingScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: highQuality, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, highQuality ? 1.5 : 1));
  renderer.shadowMap.enabled = highQuality;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const night = state.weather === "night", rain = state.weather === "rain";
  const scene = new THREE.Scene();
  const sky = new THREE.Color(night ? "#101b36" : rain ? "#94a8af" : "#a2d2dd");
  scene.background = sky; scene.fog = new THREE.Fog(sky, night ? 38 : rain ? 60 : 100, night ? 150 : rain ? 190 : 300);
  const camera = new THREE.PerspectiveCamera(62, 1, .2, 500);
  scene.add(new THREE.HemisphereLight(night ? 0x96b5f6 : 0xe0f5ff, 0x465938, night ? 1.6 : 2.7));
  const sun = new THREE.DirectionalLight(night ? 0xb7d0ff : 0xffe8be, night ? 1.2 : 2.5);
  sun.castShadow = highQuality; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 90, bottom: -90, near: 1, far: 180 });
  sun.shadow.bias = -.001; scene.add(sun, sun.target);
  const materials: THREE.Material[] = [], geometries: THREE.BufferGeometry[] = [], textures: THREE.Texture[] = [];
  const scenery: THREE.Mesh[] = [];
  function material(color: string, emissive = false) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: .08, ...(emissive ? { emissive: color, emissiveIntensity: 1 } : {}) }); materials.push(m); return m;
  }
  const roadMat=material(rain?"#384850":"#414956"), grass=material(night?"#213b34":"#64806a"), white=material("#eee6ce"), railMat=material("#929fa6"), bark=material("#624b3d"), leaves=material("#356b56"), glass=material("#203b51"), rubber=material("#17232a"), chrome=material("#d3e4e7"), redLight=material("#ff6856",true), headLight=material("#fff4bc",true);
  const box=new THREE.BoxGeometry(1,1,1), cone=new THREE.ConeGeometry(1,1,7), cylinder=new THREE.CylinderGeometry(1,1,1,12);
  const rounded=new RoundedBoxGeometry(1,1,1,2,.1),rock=new THREE.IcosahedronGeometry(1,1);
  geometries.push(box,cone,cylinder,rounded,rock);
  function mesh(geometry:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number) {
    const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=highQuality;m.receiveShadow=highQuality;parent.add(m);if(!parent.userData.dynamic)scenery.push(m);return m;
  }
  const center=(d:number)=>roadCenter(d,state.course);
  const angle=(d:number)=>-Math.atan((center(d+1)-center(d-1))/2);
  mesh(box,grass,scene,0,-.35,-800,1600,.6,2300);
  const shoulder=material("#afaa93"),darkLeaf=material("#285347"),cloud=material(night?"#344559":"#e7eeea");
  // Asphalt grain is generated locally, so the course has no external assets.
  const asphalt=document.createElement("canvas");asphalt.width=asphalt.height=128;
  const grain=asphalt.getContext("2d");
  if(grain){grain.fillStyle=rain?"#64747d":"#8c9396";grain.fillRect(0,0,128,128);for(let n=0;n<1800;n++){const shade=90+(n*31%65);grain.fillStyle=`rgb(${shade},${shade},${shade})`;grain.fillRect(n*47%128,n*71%127,1,1);}const texture=new THREE.CanvasTexture(asphalt);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;roadMat.map=texture;roadMat.roughness=rain?.3:.92;textures.push(texture);}
  // A continuous road surface follows the same centreline as cars and checkpoints.
  const roadVertices:number[]=[],roadIndices:number[]=[],roadUvs:number[]=[];
  for(let d=-30,i=0;d<=1850;d+=5,i++){roadVertices.push(center(d)-6,.02,-d,center(d)+6,.02,-d);roadUvs.push(0,d/5,3,d/5);if(i)roadIndices.push((i-1)*2,(i-1)*2+1,i*2,(i-1)*2+1,i*2+1,i*2);}
  const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute("position",new THREE.Float32BufferAttribute(roadVertices,3));roadGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(roadUvs,2));roadGeometry.setIndex(roadIndices);roadGeometry.computeVertexNormals();geometries.push(roadGeometry);const road=new THREE.Mesh(roadGeometry,roadMat);road.receiveShadow=true;scene.add(road);
  for(let d=0;d<1800;d+=12){for(const x of [-2,2]){const line=mesh(box,white,scene,center(d)+x,.045,-d,.10,.025,5);line.rotation.y=angle(d);}for(const side of [-1,1]){const edge=mesh(box,white,scene,center(d)+side*5.85,.045,-d,.13,.025,12.1);edge.rotation.y=angle(d);}}
  const roof=material("#71615d"),wallColors=["#d4ac80","#afc5b1","#8ba9b5"].map(c=>material(c));
  for(let d=0;d<1700;d+=12){for(const side of [-1,1]){const curb=mesh(box,shoulder,scene,center(d)+side*6.55,.03,-d,.85,.12,12.2);curb.rotation.y=angle(d);}}
  for(let d=-20;d<1650;d+=24){for(const side of [-1,1]){
    const x=center(d)+side*(12+(Math.sin(d)*.5+.5)*9);
    if(state.course==="town"&&d%72!==4){const house=new THREE.Group();scene.add(house);house.position.set(x,0,-d);const height=4+(Math.abs(d)%3)*1.5;mesh(box,wallColors[Math.abs(d)%3],house,0,height/2,0,7,height,8);mesh(cone,roof,house,0,height+1,0,5.6,2.2,6);for(const wx of [-2,1.5])for(const wy of [1.8,height-1])mesh(box,night?headLight:glass,house,wx,wy,side===1?4.02:-4.02,1.2,1.25,.06);}
    else{const tree=new THREE.Group();tree.position.set(x,0,-d);tree.scale.setScalar(.8+(Math.abs(d)%7)/15);scene.add(tree);mesh(cylinder,bark,tree,0,1.5,0,.3,3,.3);mesh(cone,leaves,tree,0,4.5,0,3.3,7,3.3);mesh(cone,darkLeaf,tree,0,7,0,2.3,4,2.3);mesh(rock,darkLeaf,scene,x+side*4,.6,-d+8,1.5,1.1,1.8);}
    if(state.course==="hills"){const rail=mesh(box,railMat,scene,center(d)+side*7,.85,-d,.16,.27,24.2);rail.rotation.y=angle(d);mesh(box,railMat,scene,center(d)+side*7,.45,-d,.16,.9,.16);}
  }}
  const mountainNear=material("#58766e"),mountainFar=material("#75958c");
  for(let d=0;d<1700;d+=170){for(const side of [-1,1]){mesh(rock,d%340?mountainNear:mountainFar,scene,side*(100+d%60),21,-d,90,65,100);if(!rain)mesh(rock,cloud,scene,side*80,65,-d-100,32,5,13);}}
  if(state.course==="town")for(let d=15;d<1550;d+=48){for(const side of [-1,1]){const x=center(d)+side*8;mesh(cylinder,railMat,scene,x,3.3,-d,.08,6.6,.08);mesh(box,railMat,scene,x-side*.6,6.6,-d,1.3,.09,.12);mesh(box,headLight,scene,x-side*1.1,6.5,-d,.7,.12,.35);}}
  const wheelGroups:THREE.Group[]=[];
  const shadowGeo=new THREE.PlaneGeometry(2.3,4.2);geometries.push(shadowGeo);
  const shadowMat=new THREE.MeshBasicMaterial({color:0x07141b,transparent:true,opacity:.24,depthWrite:false});materials.push(shadowMat);
  function vehicle(color:string){const group=new THREE.Group();group.userData.dynamic=true;const paint=material(color);paint.metalness=.35;paint.roughness=.32;
    mesh(rounded,paint,group,0,.65,0,1.78,.68,3.65);mesh(rounded,paint,group,0,1.2,.16,1.52,.65,1.96);
    const shadow=mesh(shadowGeo,shadowMat,group,0,.05,0,1,1,1);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
    const wind=mesh(box,glass,group,0,1.29,-.77,1.35,.49,.05);wind.rotation.x=.2;mesh(box,glass,group,0,1.29,1.07,1.35,.44,.04);
    for(const side of [-1,1]){mesh(box,glass,group,side*.77,1.29,.14,.025,.46,1.5);mesh(box,paint,group,side*.79,1.29,.2,.04,.5,.09);mesh(rounded,paint,group,side*.95,1.11,-.61,.26,.15,.3);mesh(box,chrome,group,side*.89,.82,.25,.025,.045,.22);for(const z of [-1.15,1.12]){const wheel=new THREE.Group();wheel.userData.dynamic=true;wheel.position.set(side*.9,.36,z);group.add(wheel);wheelGroups.push(wheel);const tire=mesh(cylinder,rubber,wheel,0,0,0,.36,.22,.36);tire.rotation.z=Math.PI/2;const hub=mesh(cylinder,chrome,wheel,side*.12,0,0,.2,.025,.2);hub.rotation.z=Math.PI/2;mesh(box,rubber,wheel,side*.14,0,0,.02,.04,.33);}mesh(box,redLight,group,side*.57,.7,1.84,.36,.13,.04);mesh(box,headLight,group,side*.57,.7,-1.84,.39,.12,.04);}
    mesh(box,chrome,group,0,.42,1.8,1.6,.12,.09);mesh(box,white,group,0,.57,1.81,.45,.16,.02);scene.add(group);return group;
  }
  const player=vehicle("#cce68f"),cars=state.traffic.map(c=>({id:c.id,object:vehicle(["#d18b76","#91b6d1","#d3c591"][c.id%3])}));
  const stopLine=material("#f5de9d"), checkpointObjects:THREE.Mesh[]=[];
  for(const checkpoint of state.checkpoints){
    const g=new THREE.Group();g.position.set(center(checkpoint.distance),0,-checkpoint.distance);g.rotation.y=angle(checkpoint.distance);scene.add(g);
    mesh(box,stopLine,g,0,.06,0,11.6,.03,.6);mesh(box,railMat,g,-7,1.7,0,.14,3.4,.14);
    const signCanvas=document.createElement("canvas");signCanvas.width=128;signCanvas.height=128;const ctx=signCanvas.getContext("2d")!;ctx.fillStyle=checkpoint.kind==="stop"?"#a83837":"#e9d59a";ctx.fillRect(0,0,128,128);ctx.strokeStyle="#fff1dd";ctx.lineWidth=8;ctx.strokeRect(5,5,118,118);ctx.fillStyle=checkpoint.kind==="stop"?"white":"#22343c";ctx.textAlign="center";ctx.font="bold 40px sans-serif";ctx.fillText(checkpoint.kind==="stop"?"STOP":String(checkpoint.limit),64,78);
    const texture=new THREE.CanvasTexture(signCanvas);textures.push(texture);const signMat=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});materials.push(signMat);const sign=mesh(box,signMat,g,-7,3.3,0,1.5,1.5,.08);checkpointObjects.push(sign);
  }
  const headlights=new THREE.SpotLight(0xfff1c1,night?80:0,65,.55,.6,1);headlights.position.set(0,1,0);scene.add(headlights,headlights.target);
  // Trees, buildings, markings and rails share draw calls instead of issuing
  // hundreds of separate mesh draws on a phone GPU.
  scene.updateMatrixWorld(true);
  const batches=new Map<string,THREE.Mesh[]>();
  for(const object of scenery){const mat=object.material as THREE.Material,key=`${object.geometry.uuid}:${mat.uuid}`;const list=batches.get(key)??[];list.push(object);batches.set(key,list);}
  const instances:THREE.InstancedMesh[]=[];
  for(const list of batches.values()){
    const batch=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);
    list.forEach((object,i)=>{batch.setMatrixAt(i,object.matrixWorld);object.removeFromParent();});
    batch.castShadow=highQuality;batch.receiveShadow=highQuality;batch.computeBoundingSphere();scene.add(batch);instances.push(batch);
  }
  let width=0,height=0;
  return {render(s,cockpit){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const px=center(s.distance)+s.position*4.8,pz=-s.distance;
    player.position.set(px,0,pz);player.rotation.y=angle(s.distance)-s.steering*.10;player.visible=!cockpit;
    wheelGroups.forEach(wheel=>{wheel.rotation.x=-s.distance/.36;});
    cars.forEach(({id,object})=>{const car=s.traffic.find(c=>c.id===id);if(!car)return;object.visible=car.z>s.distance-25&&car.z<s.distance+280;object.position.set(center(car.z)+car.lane*4.8,0,-car.z);object.rotation.y=angle(car.z);});
    if(cockpit){camera.position.set(px,1.9,pz-.25);camera.lookAt(center(s.distance+40)+s.position*3,1.4,pz-40);}else{camera.position.set(px*.6+center(s.distance)*.4,5.1,pz+10);camera.lookAt(center(s.distance+30)+s.position*1.8,1.1,pz-30);}
    sun.position.set(px+30,55,pz+25);sun.target.position.set(px,0,pz-25);headlights.position.set(px,1,pz-1.8);headlights.target.position.set(center(s.distance+30)+s.position*4.8,.1,pz-35);
    renderer.render(scene,camera);
  },dispose(){instances.forEach(instance=>instance.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();}};
}
