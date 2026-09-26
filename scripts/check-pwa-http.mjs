import assert from "node:assert/strict";
import { spawn } from "node:child_process";

// The server and client share one process environment; this also works in
// containers that isolate networking between shell invocations.
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3037"],{stdio:["ignore","pipe","pipe"]});
try {
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error("Production server did not start")),15000);
    const done=(error)=>{clearTimeout(timer);if(error)reject(error);else resolve();};
    server.once("error",done);
    server.once("exit",code=>done(new Error(`Server exited early (${code})`)));
    server.stdout.on("data",data=>{if(String(data).includes("Ready"))done();});
  });
  const base="http://127.0.0.1:3037";
  const response=await fetch(`${base}/manifest.webmanifest`);
  const manifest=await response.json();assert.equal(manifest.display,"standalone");assert.equal(manifest.id,"/");assert.equal(manifest.scope,"/");assert.equal(manifest.icons.length,3);
  for(const icon of manifest.icons){const result=await fetch(base+icon.src);assert.equal(result.status,200);assert.equal(result.headers.get("content-type"),"image/png");}
  const worker=await fetch(`${base}/sw.js`);assert.equal(worker.status,200);assert.ok(worker.headers.get("cache-control").includes("no-store"));assert.ok(!(await worker.text()).includes("__TRC_BUILD__"));
  const page=await(await fetch(`${base}/install`)).text();assert.ok(page.includes("/manifest.webmanifest"));assert.ok(page.includes("/icons/trc-apple-180.png"));assert.ok(page.includes("Add to Home Screen"));assert.ok(page.includes("Get the app"));
  console.log("Production HTTP checks passed: manifest, icon responses, worker headers and install page.");
} finally { server.kill("SIGTERM"); }
