import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import sharp from "sharp";

const origin="https://trc.test", stores=new Map(), listeners=new Map();
const keyOf=input=>new URL(typeof input==="string"?input:input.url,origin).href;
let online=true,serverError=false,networkCalls=0,skipped=0,claimed=0;
const caches={
  async open(name){
    if(!stores.has(name))stores.set(name,new Map());
    const store=stores.get(name);
    return {
      async put(key,response){store.set(keyOf(key),response.clone());},
      async match(key){return store.get(keyOf(key))?.clone();},
      async keys(){return [...store.keys()].map(url=>({url}));},
      async delete(key){return store.delete(keyOf(key));},
      async addAll(keys){for(const key of keys)store.set(keyOf(key),await fetchMock(key));},
    };
  },
  async keys(){return [...stores.keys()];},
  async delete(key){return stores.delete(key);},
};
const html='<html><link rel="stylesheet" href="/_next/static/main.css"><script src="/_next/static/main.js?dpl=test"></script><body>Loaded page</body></html>';
async function fetchMock(input){
  networkCalls++;
  if(!online)throw new TypeError("Network unavailable");
  if(serverError)return new Response("Temporarily unavailable",{status:503});
  const path=new URL(keyOf(input)).pathname;
  return new Response(path==="/offline.html"?"Offline fallback":path.startsWith("/_next/static/")?"static asset":path.endsWith(".json")?'{"notes":[]}':html,{headers:{"content-type":path.startsWith("/_next/static/")?"text/javascript":path.endsWith(".json")?"application/json":"text/html"}});
}
class WorkerRequest extends Request { constructor(input,init){super(typeof input==="string"?new URL(input,origin):input,init);} }
const self={location:{origin},clients:{async claim(){claimed++;}},async skipWaiting(){skipped++;},addEventListener(type,fn){listeners.set(type,fn);}};
const context=vm.createContext({self,caches,fetch:fetchMock,Request:WorkerRequest,Response,URL,AbortController,setTimeout,clearTimeout,console});
vm.runInContext(await readFile(new URL("../public/sw.js",import.meta.url),"utf8"),context);
async function dispatch(type,data={}){
  let response;const jobs=[];
  listeners.get(type)({...data,respondWith(promise){response=promise;},waitUntil(promise){jobs.push(promise);}});
  await Promise.all(jobs);return response?await response:undefined;
}
const request=(path,options={})=>({url:new URL(path,origin).href,method:"GET",mode:"cors",headers:new Headers(),...options});
await dispatch("install");
assert.equal(skipped,0,"An update must not automatically interrupt active exercises");
await caches.open("trc-hub-old-pages");await caches.open("unrelated-app");
await dispatch("activate");assert.equal(claimed,1);assert.ok(stores.has("unrelated-app"));assert.ok(!stores.has("trc-hub-old-pages"));
await dispatch("message",{data:{type:"CACHE_PAGE",path:"/skills"}});
const before=networkCalls;
const cachedJs=await dispatch("fetch",{request:request("/_next/static/main.js?dpl=new")});
assert.equal(await cachedJs.text(),"static asset");assert.equal(networkCalls,before,"Deployment query must not make immutable cached assets unavailable");
assert.equal(await dispatch("fetch",{request:request("/skills?_rsc=abc",{headers:new Headers({rsc:"1"})})}),undefined,"RSC is never cached as HTML");
assert.equal(await dispatch("fetch",{request:request("https://other.test/script.js")}),undefined,"External traffic is untouched");
assert.equal(await dispatch("fetch",{request:request("/api/private")}),undefined,"API responses are never cached");
assert.equal(await dispatch("fetch",{request:request("/coding",{method:"POST"})}),undefined,"Mutations are untouched");
online=false;
assert.ok((await (await dispatch("fetch",{request:request("/skills",{mode:"navigate"})})).text()).includes("Loaded page"),"Visited page opens during an outage");
assert.equal(await (await dispatch("fetch",{request:request("/electrical",{mode:"navigate"})})).text(),"Offline fallback","Unvisited page gets the offline guide");
assert.equal(await (await dispatch("fetch",{request:request("/",{mode:"navigate"})})).text(),html,"Home is available after installation");
online=true;serverError=true;
assert.equal(await (await dispatch("fetch",{request:request("/skills",{mode:"navigate"})})).text(),html,"Server failures do not overwrite a working cached page");
serverError=false;
const calls=networkCalls;await dispatch("message",{data:{type:"CACHE_PAGE",path:"https://other.test/"}});assert.equal(networkCalls,calls,"Cache messages cannot fetch arbitrary URLs");
await dispatch("message",{data:{type:"SKIP_WAITING"}});assert.equal(skipped,1,"Updates activate only on explicit request");
for(const [name,size] of [["trc-192.png",192],["trc-512.png",512],["trc-maskable-512.png",512],["trc-apple-180.png",180]]){
  const meta=await sharp(new URL(`../public/icons/${name}`,import.meta.url).pathname).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);assert.equal(meta.format,"png");
}
console.log("PWA checks passed: offline navigation, asset caching, RSC isolation, error recovery, explicit updates and college icons.");
