export function typingResult(target: string, typed: string, seconds: number) {
  const correct = [...typed].filter((c,i)=>c===target[i]).length;
  return { correct, accuracy: typed.length ? Math.round(correct / typed.length * 100) : 100, wpm: seconds > 0 ? Math.round(correct / 5 / (seconds / 60)) : 0 };
}
export type Sheet = Record<string,string>;
export function cellValue(id: string, cells: Sheet, seen = new Set<string>()): number | string {
  if (seen.has(id)) return "#CYCLE";
  const next = new Set([...seen,id]), raw=(cells[id]??"").trim().toUpperCase();
  if (!raw.startsWith("=")) return raw===""?0:Number.isFinite(Number(raw))?Number(raw):"#VALUE";
  const formula=raw.slice(1).replace(/\s/g,"");
  const resolve=(token:string):number|string=>/^[A-D][1-9]$/.test(token)?cellValue(token,cells,next):Number(token);
  const aggregate=formula.match(/^(SUM|AVERAGE)\(([A-D])([1-9]):\2([1-9])\)$/);
  if(aggregate){const start=+aggregate[3],end=+aggregate[4];if(end<start)return "#RANGE";const values=Array.from({length:end-start+1},(_,i)=>cellValue(`${aggregate[2]}${start+i}`,cells,next));const error=values.find(v=>typeof v==="string");if(error)return error;const total=(values as number[]).reduce((a,b)=>a+b,0);return aggregate[1]==="AVERAGE"?total/values.length:total;}
  const binary=formula.match(/^([A-D][1-9]|-?\d+(?:\.\d+)?)([+*/-])([A-D][1-9]|-?\d+(?:\.\d+)?)$/);
  if(binary){const a=resolve(binary[1]),b=resolve(binary[3]);if(typeof a==="string")return a;if(typeof b==="string")return b;if(binary[2]==="/"&&b===0)return "#DIV/0";return binary[2]==="+"?a+b:binary[2]==="-"?a-b:binary[2]==="*"?a*b:a/b;}
  if(/^[A-D][1-9]$/.test(formula))return resolve(formula);
  return "#FORMULA";
}

/** Touch-typing finger for each key: 0–3 left little→index, 4–7 right index→little, 8 thumbs. */
export const KEY_ROWS = ["1234567890", "qwertyuiop", "asdfghjkl;", "zxcvbnm,./"];
const COLUMN_FINGER = [0, 1, 2, 3, 3, 4, 4, 5, 6, 7];
export const FINGER_NAMES = ["left little", "left ring", "left middle", "left index", "right index", "right middle", "right ring", "right little", "thumb"];
export function fingerFor(char: string) {
  if (char === " ") return 8;
  const c = char.toLowerCase(), shifted: Record<string, string> = { "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0", ":": ";", "<": ",", ">": ".", "?": "/", "'": ";", '"': ";", "-": "0", "—": "0" };
  const k = shifted[c] ?? c;
  for (const row of KEY_ROWS) { const i = row.indexOf(k); if (i >= 0) return COLUMN_FINGER[i]; }
  return null;
}
const WORDS = "a all and as ask add dad fall flask glad had has hall jak lad lag lass salad sad sash shall flash gash half dash ash alas jags kale lake leak sea seal seed self sell she shed sled deal desk fed feed feel fees fleas glee heal held jade led less lead safe sage sake sea tree tea trip true type quit quiet power poet pour pure your wire write water were rope ripe tire tour route equip pretty report tower outer require eat ate rate tree wet yet you your out top pot put rut try toy tip wit bar bat can cab man men van zinc mix box next cave name map navy bench crumb vex lamb climb exam band bank calm comb fix zoo buzz maze vivid exams college study notes lesson market friend people mizoram aizawl hills river music guitar student teacher library science history english culture language computer number rain cloud".split(" ");
/** A drill that only uses the given keys: real words when enough exist, otherwise short letter groups. */
export function drillText(keys: string, rng: () => number = Math.random, length = 160) {
  const allowed = new Set(keys.toLowerCase()), usable = WORDS.filter(w => [...w].every(c => allowed.has(c)));
  const letters = [...allowed].filter(c => /[a-z;,./]/.test(c)), out: string[] = [];
  while (out.join(" ").length < length) {
    if (usable.length >= 8) out.push(usable[Math.floor(rng() * usable.length)]);
    else out.push(Array.from({ length: 3 + Math.floor(rng() * 3) }, () => letters[Math.floor(rng() * letters.length)]).join(""));
  }
  return out.join(" ").slice(0, length).trim();
}
/** Which expected characters were typed wrongly, counted per character. */
export function typingMistakes(target: string, typed: string) {
  const misses: Record<string, number> = {};
  [...typed].forEach((c, i) => { const want = target[i]; if (want !== undefined && c !== want && want !== " ") misses[want.toLowerCase()] = (misses[want.toLowerCase()] ?? 0) + 1; });
  return misses;
}
