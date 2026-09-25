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
