import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'trc-lab-tests-'));
try {
  for (const name of ['code', 'coding-studio', 'driving-engine', 'circuit-engine', 'skills-practice']) {
    const input = await readFile(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
    const result = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    await writeFile(join(dir, `${name}.js`), result.outputText);
  }
  const require = createRequire(join(dir, 'tests.cjs'));
  const { newDrive, stepDrive, ROUTE_LENGTH } = require('./driving-engine');
  const idle = { throttle: false, brake: false, steer: 0 };
  let drive = newDrive(); stepDrive(drive, 1, { ...idle, throttle: true }); assert.equal(drive.distance, 0, 'Paused cars cannot move');
  drive.running = true; drive.speed = 40; stepDrive(drive, .05, { ...idle, brake: true, throttle: true }); assert.ok(drive.speed < 40, 'Brake takes priority');
  drive = newDrive(); drive.running = true; drive.distance = 340;
  for (let i=0;i<22;i++) stepDrive(drive,.05,{...idle,brake:true});
  assert.equal(drive.checkpoints[0].success, true, 'A full one-second stop completes the checkpoint');
  drive = newDrive(); drive.running = true; drive.distance = 357; stepDrive(drive,.05,idle);
  assert.equal(drive.checkpoints[0].success, false); assert.equal(drive.checkpoints[0].passed, true, 'Missed stop is recorded once');
  const afterPenalty = drive.score; stepDrive(drive,.05,idle); assert.equal(drive.score, afterPenalty);
  drive = newDrive(); drive.running=true; drive.traffic[0].z=0; drive.traffic[0].lane=drive.position;
  stepDrive(drive,.05,idle); stepDrive(drive,.05,idle); assert.equal(drive.hits,1,'A traffic impact is counted once');
  drive = newDrive(); drive.running=true; drive.distance=ROUTE_LENGTH-.1; drive.speed=60; stepDrive(drive,.05,idle); assert.equal(drive.finished,true);assert.equal(drive.speed,0);
  const wet=newDrive('rain'),dry=newDrive('day');wet.running=dry.running=true;wet.speed=dry.speed=40;stepDrive(wet,.05,{...idle,brake:true});stepDrive(dry,.05,{...idle,brake:true});assert.ok(wet.speed>dry.speed,'Wet course has reduced braking');

  const { circuitReadings } = require('./circuit-engine');
  const series=circuitReadings(6,200,100,'series',true);assert.equal(series.current,.02);assert.equal(series.nodes.B,2);assert.equal(series.power,.12);
  const parallel=circuitReadings(6,300,300,'parallel',true);assert.equal(parallel.current,.04);assert.equal(parallel.i1,.02);assert.equal(parallel.i2,.02);assert.equal(parallel.v1,6);
  const open=circuitReadings(6,100,100,'series',false);assert.equal(open.current,0);assert.equal(open.nodes.A,6);assert.equal(open.nodes.B,0);
  assert.throws(()=>circuitReadings(6,0,100,'series',true));

  const { cellValue, typingResult } = require('./skills-practice');
  const sheet={B2:'3',C2:'40',D2:'=B2*C2',B3:'5',C3:'10',D3:'=B3*C3',D4:'40',D5:'=SUM(D2:D4)'};
  assert.equal(cellValue('D5',sheet),210);assert.equal(cellValue('D5',{...sheet,B2:'4'}),250,'Changing quantities recalculates formulas');
  assert.equal(cellValue('D2',{D2:'=D3',D3:'=D2'}),'#CYCLE');assert.equal(cellValue('D2',{D2:'=3/0'}),'#DIV/0');
  assert.equal(cellValue('D2',{D2:'=alert(1)'}),'#FORMULA');assert.equal(cellValue('D2',{D2:'=SUM(B4:B2)'}),'#RANGE');
  assert.equal(typingResult('abcde','abcxe',60).accuracy,80);

  const { parseCodeResponse, isProjectList, buildCodingPrompt } = require('./coding-studio');
  const sample={html:'<h1>Hello</h1>',css:'body{color:red}',js:'console.log("hello")'};
  const parsed=parseCodeResponse('Here are the files:\n```html\n<h1>Hello</h1>\n```\n```css\nbody{color:red}\n```\n```javascript\nconsole.log("hello")\n```');assert.deepEqual(parsed,sample);
  assert.deepEqual(parseCodeResponse(JSON.stringify({code:sample})),sample);assert.equal(parseCodeResponse('```js\nconsole.log(1)\n```').html,undefined,'Partial replies preserve omitted files');
  assert.throws(()=>parseCodeResponse('I made your website!'));assert.throws(()=>parseCodeResponse('```html\n'+ 'x'.repeat(600001)+'\n```'));
  const p={id:'one',name:'A',updated:'',code:sample};assert.equal(isProjectList([p,p]),false,'Duplicate project IDs rejected');
  assert.ok(!buildCodingPrompt('Portfolio','Create').includes(sample.js),'Code is excluded unless explicitly supplied');
  const { makeDocument }=require('./code');const html=makeDocument(sample,true,'test-channel');assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes('test-channel'));assert.ok(html.includes("parent.postMessage"));assert.ok(!makeDocument(sample).includes('Content-Security-Policy'));
  console.log('Lab checks passed: driving missions, circuit math, spreadsheet formulas, typing metrics, project validation and AI response parsing.');
} finally { await rm(dir,{recursive:true,force:true}); }
