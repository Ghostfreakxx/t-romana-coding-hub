import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = new URL("../", import.meta.url).pathname;
const icons = join(root, "public/icons");
await mkdir(icons, { recursive: true });
// Reuse the exact college crest from the existing official masthead, with
// generous padding so Android's mask never cuts into the crest or ribbon.
const crest = await sharp(join(root, "public/branding/trc-logo.png"))
  .extract({ left: 0, top: 0, width: 160, height: 100 }).png().toBuffer();
for (const [file, size, fraction] of [["trc-192.png",192,.84],["trc-512.png",512,.84],["trc-maskable-512.png",512,.68],["trc-apple-180.png",180,.84]]) {
  const mark = await sharp(crest).resize({ width: Math.round(size*fraction) }).png().toBuffer();
  await sharp({ create: { width:size, height:size, channels:3, background:"#faf9f7" } })
    .composite([{ input: mark, gravity:"centre" }]).png().toFile(join(icons,file));
}
const digest = createHash("sha256");
async function hashFolder(folder) {
  for (const entry of (await readdir(join(root,folder),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const path=join(folder,entry.name);
    if(entry.isDirectory()) await hashFolder(path);
    else { digest.update(path); digest.update(await readFile(join(root,path))); }
  }
}
for(const folder of ["app","components","lib","data"]) await hashFolder(folder);
for(const file of ["package-lock.json","public/branding/trc-logo.png","public/offline.html","scripts/prepare-pwa.mjs"]) digest.update(await readFile(join(root,file)));
const worker=await readFile(join(root,"lib/service-worker.js"),"utf8");
await writeFile(join(root,"public/sw.js"),worker.replace("__TRC_BUILD__",digest.digest("hex").slice(0,16)));
console.log("PWA prepared: college icons and versioned offline worker.");
