import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const dir = await mkdtemp(join(tmpdir(), 'trc-lab-tests-'));
try {
  for (const name of ['code', 'coding-studio', 'driving-engine', 'circuit-engine', 'skills-practice', 'reasoning-gen', 'spaced', 'study-decoder', 'qbank-tools']) {
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
  drive=newDrive();drive.running=true;drive.traffic=[];drive.speed=40;for(let i=0;i<40&&drive.lane===0;i++)stepDrive(drive,.05,{...idle,throttle:true,steer:1});
  assert.equal(drive.lane,1);assert.equal(drive.signalFaults,1,'An unsignalled lane change is a fault');assert.equal(drive.laneChanges,1);
  drive=newDrive();drive.running=true;drive.traffic=[];drive.speed=40;drive.indicator=1;for(let i=0;i<40&&drive.lane===0;i++)stepDrive(drive,.05,{...idle,throttle:true,steer:1});
  assert.equal(drive.signalFaults,0,'A signalled lane change is not a fault');assert.equal(drive.indicator,0,'The indicator cancels after the change');
  drive=newDrive();drive.running=true;drive.speed=72;drive.traffic=[{id:0,z:drive.distance+4.5+20,lane:drive.position,speed:72,hit:false,passed:false}];stepDrive(drive,.05,{...idle,throttle:true});
  assert.ok(drive.followGap!==null&&drive.followGap<2&&drive.tailgating>0,'A one-second gap is too close');
  drive=newDrive();drive.running=true;drive.speed=72;drive.traffic=[{id:0,z:drive.distance+4.5+60,lane:drive.position,speed:72,hit:false,passed:false}];stepDrive(drive,.05,{...idle,throttle:true});
  assert.equal(drive.tailgating,0,'A three-second gap is safe');
  const wet=newDrive('rain'),dry=newDrive('day');wet.running=dry.running=true;wet.speed=dry.speed=40;stepDrive(wet,.05,{...idle,brake:true});stepDrive(dry,.05,{...idle,brake:true});assert.ok(wet.speed>dry.speed,'Wet course has reduced braking');

  const { generate, GEN_TOPICS, seeded } = require('./reasoning-gen');
  for (const topic of GEN_TOPICS) { const rng = seeded(topic.length * 97); for (let i = 0; i < 2000; i++) { const g = generate(topic, rng);
    assert.equal(g.options.length, 4, `${topic}: four options`); assert.equal(new Set(g.options).size, 4, `${topic}: distinct options ${g.options}`);
    assert.ok(g.answer >= 0 && g.answer < 4, `${topic}: answer index`); assert.ok(!/NaN|undefined|Infinity/.test(g.prompt + g.options.join() + g.explanation), `${topic}: clean text ${g.prompt} ${g.options}`); } }
  { const r = seeded(1); for (let i = 0; i < 300; i++) { const g = generate('Percentages', r); const m = /What is (\d+)% of (\d+)\?/.exec(g.prompt); if (m) assert.equal(Number(g.options[g.answer]), m[1] * m[2] / 100); } }
  { const r = seeded(2); for (let i = 0; i < 300; i++) { const g = generate('Ranking', r); const [, f, b] = /(\d+)th from the front and (\d+)th/.exec(g.prompt); assert.equal(Number(g.options[g.answer]), +f + +b - 1); } }
  const { schedule, isDue, addDays } = require('./spaced');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01'); assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  let card = { id: 'c' }; assert.ok(isDue(card, '2026-01-01'), 'New cards are due');
  card = schedule(card, 'good', '2026-01-01'); assert.equal(card.box, 1); assert.equal(card.due, '2026-01-02'); assert.ok(!isDue(card, '2026-01-01'));
  card = schedule(card, 'easy', '2026-01-02'); assert.equal(card.box, 3); assert.equal(card.due, '2026-01-09');
  card = schedule(card, 'again', '2026-01-09'); assert.equal(card.box, 0); assert.ok(isDue(card, '2026-01-09'), 'Forgotten cards come back today');
  assert.equal(schedule({ box: 6 }, 'easy', '2026-01-01').box, 6, 'Box is capped');
  { const { fingerFor, drillText, typingMistakes } = require('./skills-practice');
    assert.equal(fingerFor('a'), 0); assert.equal(fingerFor('f'), 3); assert.equal(fingerFor('j'), 4); assert.equal(fingerFor(';'), 7); assert.equal(fingerFor(' '), 8); assert.equal(fingerFor('G'), 3); assert.equal(fingerFor('?'), 7);
    const home = drillText('asdfghjkl', () => .37); assert.ok(home.length > 100 && /^[asdfghjkl ]+$/.test(home), 'Home-row drill uses only home-row keys');
    const few = drillText('fj', () => .5); assert.ok(/^[fj ]+$/.test(few), 'Tiny key sets use letter groups');
    assert.deepEqual(typingMistakes('the cat', 'thx cut'), { e: 1, a: 1 }); }
  { const { searchPages, outline, buildQuiz, readingStats } = require('./study-decoder');
    const pages = [{ page: 1, text: "CHAPTER 1 INTRODUCTION\nDemocracy is a system of government in which citizens elect their representatives through regular elections.\nLiberty means the absence of arbitrary restraint on the choices of citizens in a political community.\n" },
      { page: 2, text: "1.2 Forms of Government\nFederalism divides sovereign power between a central government and regional units under a written constitution.\nSovereignty refers to the supreme legal authority of the state within its territory and over its citizens.\nEquality requires that citizens receive equal treatment and equal protection of the laws of the government.\nJustice demands a fair distribution of rights, duties and resources among citizens of the political community.\n" }];
    const hits = searchPages(pages, 'citizens'); assert.ok(hits.length >= 4 && hits.every(h => h.match.toLowerCase() === 'citizens'), 'Search finds every match');
    assert.deepEqual(outline(pages).map(o => o.title), ['CHAPTER 1 INTRODUCTION', '1.2 Forms of Government'], 'Outline finds headings');
    let seed = 3; const quiz = buildQuiz(pages, 4, () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; });
    assert.ok(quiz.length >= 1, 'The quiz has questions');
    for (const q of quiz) { assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.ok(q.prompt.includes('_____') && !new RegExp(`\\b${q.options[q.answer]}\\b`, 'i').test(q.prompt), 'Answer is blanked'); }
    assert.equal(readingStats('one two three').words, 3); }
  { const { questionKey, matchNote, mockTest, keywords } = require('./qbank-tools');
    assert.equal(questionKey('g', 'What is Federalism?'), questionKey('g', 'what is federalism')); assert.notEqual(questionKey('g', 'Federalism'), questionKey('g', 'Liberty'));
    assert.deepEqual(keywords('Explain the features of Federalism.'), ['federalism'], 'Question words are ignored');
    const entries = [{ g: 'political-science-1', s: 'section-9', t: 'Federalism', c: 'x', k: 'short' }, { g: 'political-science-1', s: 'section-3', t: 'Liberty', c: 'x', k: 'short' }, { g: 'sociology-1', s: 'section-2', t: 'Federalism', c: 'x', k: 'short' }];
    assert.equal(matchNote('Discuss the main features of Indian federalism.', entries, 'political-science').s, 'section-9'); assert.equal(matchNote('Explain the caste system.', entries, 'political-science'), null);
    const pool = [{ t: 'a', long: true, times: 3 }, { t: 'b', long: true, times: 1 }, { t: 'c', long: true, times: 2 }, { t: 'd', long: false, times: 1 }, { t: 'e', long: false, times: 2 }];
    const test = mockTest(pool, 2, 3, () => .5); assert.equal(test.filter(q => q.long).length, 2); assert.equal(test.filter(q => !q.long).length, 2); assert.equal(new Set(test.map(q => q.t)).size, test.length); }
  const { circuitReadings } = require('./circuit-engine');
  const { resistorBands, bandsToOhms, formatOhms, predictAnswer, predictionCorrect } = require('./circuit-engine');
  assert.deepEqual(resistorBands(470),[4,7,1],'470 Ω is yellow-violet-brown');assert.deepEqual(resistorBands(10),[1,0,0]);assert.deepEqual(resistorBands(2200),[2,2,2]);
  assert.equal(bandsToOhms(resistorBands(68000)),68000);assert.equal(formatOhms(4700),'4.7 kΩ');assert.throws(()=>resistorBands(475));
  const q={mode:'series',volts:6,r1:200,r2:100,kind:'current'};assert.equal(predictAnswer(q),20);assert.ok(predictionCorrect(q,20.3));assert.ok(!predictionCorrect(q,25));
  assert.equal(predictAnswer({mode:'parallel',volts:6,r1:300,r2:300,kind:'resistance'}),150);
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
  console.log('Lab checks passed: driving missions, lane signals, following distance, circuit math, colour codes, predictions, generated reasoning questions, spaced repetition, spreadsheet formulas, typing metrics, finger guide, typing drills, PDF search/outline/quiz, question-bank tools, project validation and AI response parsing.');
} finally { await rm(dir,{recursive:true,force:true}); }
