/** Procedurally generated aptitude questions with worked explanations. Pure functions: pass a random source (seedable for tests). */
export type Rng = () => number;
export type GenQuestion = { topic: string; prompt: string; options: string[]; answer: number; explanation: string };

export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const int = (r: Rng, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const pick = <T,>(r: Rng, list: readonly T[]) => list[Math.floor(r() * list.length)];
/** Correct answer plus distinct distractors, shuffled. */
function options(r: Rng, correct: string, distractors: string[]): { options: string[]; answer: number } {
  const set = [...new Set(distractors.filter(d => d !== correct))].slice(0, 3);
  let n = 1; while (set.length < 3) { const extra = /^-?\d+$/.test(correct) ? String(Number(correct) + n * (n % 2 ? 1 : -1) * 2) : `${correct} (${n})`; if (extra !== correct && !set.includes(extra)) set.push(extra); n++; }
  const list = [correct, ...set].map(v => [r(), v] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return { options: list, answer: list.indexOf(correct) };
}
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const shiftWord = (w: string, k: number) => [...w].map(c => ABC[(ABC.indexOf(c) + k + 26) % 26]).join("");
const DIRS = ["north", "east", "south", "west"] as const;

const generators: Record<string, (r: Rng) => GenQuestion> = {
  "Number series": r => {
    const kind = int(r, 0, 2);
    if (kind === 0) { const a = int(r, 2, 30), d = int(r, 3, 12), s = Array.from({ length: 5 }, (_, i) => a + i * d), next = a + 5 * d;
      return { topic: "Number series", prompt: `What comes next: ${s.join(", ")}, …?`, ...options(r, String(next), [String(next + d), String(next - 1), String(next + 2)]), explanation: `Each number goes up by ${d}. ${s[4]} + ${d} = ${next}.` }; }
    if (kind === 1) { const a = int(r, 1, 5), m = int(r, 2, 4), s = Array.from({ length: 5 }, (_, i) => a * m ** i), next = a * m ** 5;
      return { topic: "Number series", prompt: `What comes next: ${s.join(", ")}, …?`, ...options(r, String(next), [String(next + s[4]), String(s[4] + (s[4] - s[3])), String(next / 2 + s[4])]), explanation: `Each number is multiplied by ${m}. ${s[4]} × ${m} = ${next}.` }; }
    const a = int(r, 1, 20), g = int(r, 1, 4), k = int(r, 1, 3), gaps = Array.from({ length: 5 }, (_, i) => g + i * k), s = [a]; for (const x of gaps.slice(0, 4)) s.push(s[s.length - 1] + x); const next = s[4] + gaps[4];
    return { topic: "Number series", prompt: `What comes next: ${s.join(", ")}, …?`, ...options(r, String(next), [String(s[4] + gaps[3]), String(next + k), String(next + 1)]), explanation: `The gaps are ${gaps.slice(0, 4).join(", ")}: each gap grows by ${k}. The next gap is ${gaps[4]}, so ${s[4]} + ${gaps[4]} = ${next}.` };
  },
  "Letter series": r => {
    const step = int(r, 2, 4), start = int(r, 0, 23 - 5 * step), s = Array.from({ length: 5 }, (_, i) => ABC[start + i * step]), next = ABC[start + 5 * step];
    return { topic: "Letter series", prompt: `What comes next: ${s.join(", ")}, …?`, ...options(r, next, [ABC[start + 5 * step + 1], ABC[start + 5 * step - 1], ABC[start + 4 * step + step + 2]]), explanation: `Using A = 1, the positions go up by ${step} each time (${s.map(c => ABC.indexOf(c) + 1).join(", ")}). Position ${start + 5 * step + 1} is ${next}.` };
  },
  "Coding": r => {
    const words = ["BOOK", "DESK", "LAMP", "RICE", "TEAM", "MILK", "GOAL", "PLAN", "FISH", "KING", "ROAD", "SONG"];
    const k = pick(r, [1, 2, 3, -1, -2]), a = pick(r, words); let b = pick(r, words); while (b === a) b = pick(r, words);
    const correct = shiftWord(b, k);
    return { topic: "Coding", prompt: `In a code, ${a} is written as ${shiftWord(a, k)}. How is ${b} written in that code?`, ...options(r, correct, [shiftWord(b, -k), shiftWord(b, k + 1), shiftWord(b, k).split("").reverse().join("")]), explanation: `Each letter moves ${Math.abs(k)} place${Math.abs(k) === 1 ? "" : "s"} ${k > 0 ? "forward" : "back"} in the alphabet (${a[0]} → ${shiftWord(a, k)[0]}). Apply the same to ${b}: ${correct}.` };
  },
  "Directions": r => {
    if (r() < .45) { const start = int(r, 0, 3), turns = Array.from({ length: int(r, 2, 4) }, () => pick(r, ["right", "left", "about"] as const));
      let d = start; for (const t of turns) d = (d + (t === "right" ? 1 : t === "left" ? 3 : 2)) % 4;
      return { topic: "Directions", prompt: `You face ${DIRS[start]}. You turn ${turns.map(t => t === "about" ? "around (180°)" : t).join(", then ")}. Which way do you face now?`, ...options(r, DIRS[d], DIRS.filter((_, i) => i !== d) as unknown as string[]), explanation: `Right is a quarter turn clockwise, left is anticlockwise, and turning around is a half turn. ${DIRS[start]} → ${turns.reduce<string[]>((acc, t) => { const prev = DIRS.indexOf(acc[acc.length - 1] as typeof DIRS[number]); acc.push(DIRS[(prev + (t === "right" ? 1 : t === "left" ? 3 : 2)) % 4]); return acc; }, [DIRS[start]]).slice(1).join(" → ")}.` }; }
    const legs = [[0, int(r, 2, 9)], [1, int(r, 2, 9)], [pick(r, [0, 2]), int(r, 1, 9)]] as [number, number][];
    let x = 0, y = 0; for (const [dir, km] of legs) { if (dir === 0) y += km; if (dir === 2) y -= km; if (dir === 1) x += km; }
    const ns = y === 0 ? "" : y > 0 ? "north" : "south", ew = x > 0 ? "east" : "", where = [ns && `${Math.abs(y)} km ${ns}`, ew && `${x} km ${ew}`].filter(Boolean).join(" and ");
    const wrong = [[`${Math.abs(y)} km ${y >= 0 ? "south" : "north"}`, ew && `${x} km east`].filter(Boolean).join(" and "), [ns && `${Math.abs(y)} km ${ns}`, `${x} km west`].filter(Boolean).join(" and "), `${legs.reduce((s, l) => s + l[1], 0)} km ${ns || "east"}`];
    return { topic: "Directions", prompt: `A student walks ${legs.map(([d, km]) => `${km} km ${DIRS[d]}`).join(", then ")}. Where is the student now compared with the start?`, ...options(r, where, wrong), explanation: `Add north–south and east–west movements separately; opposite directions cancel. North/south: ${y >= 0 ? `${y} north` : `${-y} south`}. East: ${x}. So the student is ${where} of the start.` };
  },
  "Percentages": r => {
    const p = pick(r, [5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75]), n = int(r, 2, 40) * 20, v = p * n / 100;
    if (r() < .5) return { topic: "Percentages", prompt: `What is ${p}% of ${n}?`, ...options(r, String(v), [String(v * 2), String(n - v), String(v + p)]), explanation: `${p}% means ${p} out of 100: ${n} × ${p} ÷ 100 = ${v}.` };
    return { topic: "Percentages", prompt: `A bag costs ₹${n}. It is sold at a ${p}% discount. What is the sale price?`, ...options(r, `₹${n - v}`, [`₹${v}`, `₹${n + v}`, `₹${n - p}`]), explanation: `Discount = ${p}% of ₹${n} = ₹${v}. Sale price = ₹${n} − ₹${v} = ₹${n - v}.` };
  },
  "Ratio": r => {
    const a = int(r, 1, 5), b = int(r, 2, 7), part = int(r, 2, 12), total = (a + b) * part;
    return { topic: "Ratio", prompt: `Tea and coffee drinkers in a class are in the ratio ${a}:${b}. There are ${total} students. How many drink coffee?`, ...options(r, String(b * part), [String(a * part), String(total - a), String(b * (part + 1))]), explanation: `${a} + ${b} = ${a + b} parts. One part = ${total} ÷ ${a + b} = ${part}. Coffee = ${b} × ${part} = ${b * part}.` };
  },
  "Averages": r => {
    const avg = int(r, 10, 60), n = int(r, 3, 5), known = Array.from({ length: n - 1 }, () => avg + int(r, -9, 9)), x = avg * n - known.reduce((s, v) => s + v, 0);
    return { topic: "Averages", prompt: `The average of ${known.join(", ")} and x is ${avg}. What is x?`, ...options(r, String(x), [String(avg), String(x + n), String(x - 2)]), explanation: `Total = average × count = ${avg} × ${n} = ${avg * n}. x = ${avg * n} − (${known.join(" + ")}) = ${x}.` };
  },
  "Ranking": r => {
    const front = int(r, 3, 20), back = int(r, 3, 20), total = front + back - 1;
    return { topic: "Ranking", prompt: `In a queue, Mawii is ${front}th from the front and ${back}th from the back. How many people are in the queue?`, ...options(r, String(total), [String(front + back), String(total - 1), String(Math.abs(front - back) + 1)]), explanation: `Total = ${front} + ${back} − 1 = ${total}. Subtract one because Mawii is counted in both positions.` };
  },
  "Clocks": r => {
    const h = int(r, 1, 11), m = pick(r, [0, 0, 30, 15, 45]), raw = Math.abs(30 * h - 5.5 * m), angle = Math.min(raw, 360 - raw), show = (v: number) => `${+v.toFixed(1)}°`;
    return { topic: "Clocks", prompt: `What is the smaller angle between the hour and minute hands at ${h}:${String(m).padStart(2, "0")}?`, ...options(r, show(angle), [show(30 * h % 360 > 180 ? 360 - 30 * h : 30 * h), show(Math.abs(angle - 15) || 45), show(360 - angle)]), explanation: `Angle = |30 × hours − 5.5 × minutes| = |30 × ${h} − 5.5 × ${m}| = ${raw}°.${raw > 180 ? ` That is more than 180°, so the smaller angle is 360 − ${raw} = ${angle}°.` : ""} The hour hand moves 0.5° every minute, which is why it is 5.5 and not 6.` };
  },
  "Ages": r => {
    const son = int(r, 4, 15), mult = int(r, 2, 4), years = int(r, 2, 10), father = son * mult;
    return { topic: "Ages", prompt: `A father is ${mult} times as old as his son. The son is ${son}. How old will the father be in ${years} years?`, ...options(r, String(father + years), [String(father), String((son + years) * mult), String(father - years)]), explanation: `Father now = ${mult} × ${son} = ${father}. In ${years} years: ${father} + ${years} = ${father + years}. (Both ages grow by the same number of years.)` };
  },
};
export const GEN_TOPICS = Object.keys(generators);
export function generate(topic: string | "Mixed", r: Rng = Math.random): GenQuestion {
  const t = topic === "Mixed" || !generators[topic] ? pick(r, GEN_TOPICS) : topic;
  return generators[t](r);
}
