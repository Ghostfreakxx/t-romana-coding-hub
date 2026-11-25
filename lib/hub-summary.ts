/** Reads everything the hub has saved (keys without the "trc:v1:" prefix) and turns it into a daily plan, lab stats and badges. Pure, so it is testable. */
export type Snap = Record<string, unknown>;
export type PlanItem = { id: string; title: string; detail: string; href: string; icon: string };
export type Badge = { id: string; title: string; detail: string; earned: boolean; progress: string };

const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
const rec = <T,>(v: unknown): Record<string, T> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, T> : {};
const shift = (day: string, n: number) => { const [y, m, d] = day.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export function streaks(days: string[], today: string) {
  const set = new Set(days); let current = 0, cursor = set.has(today) ? today : shift(today, -1);
  while (set.has(cursor)) { current++; cursor = shift(cursor, -1); }
  let best = 0, run = 0, prev = "";
  for (const d of [...set].sort()) { run = prev && shift(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return { current, best, studiedToday: set.has(today), total: set.size };
}

type Card = { box?: number; due?: string };
type Result = { lab: string; score: number; total: number; mode: string };
type Run = { w: number; a: number; d: string };

export function stats(s: Snap, today: string) {
  const cards = arr<{ cards?: Card[] }>(s.notebooks).flatMap(n => arr<Card>(n.cards));
  const reasoning = Object.entries(rec<[number, number]>(s["reasoning-stats"])).filter(([, v]) => Array.isArray(v) && v[1] > 0);
  const right = reasoning.reduce((n, [, v]) => n + v[0], 0), tries = reasoning.reduce((n, [, v]) => n + v[1], 0);
  const weakest = reasoning.filter(([, v]) => v[1] >= 3).map(([t, v]) => ({ topic: t, pct: v[0] / v[1] })).sort((a, b) => a.pct - b.pct)[0];
  const results = arr<Result>(s.results), speed = results.filter(r => r.lab === "reasoning" && r.mode === "speed round");
  const typing = arr<Run>(s["typing-history"]), goodTyping = typing.filter(r => r.a >= 90);
  const driving = Object.values(rec<number>(s["driving-best"])).filter(n => typeof n === "number");
  const exams = Object.entries(rec<string>(s.examDates)).map(([key, date]) => ({ code: key.split(":")[2] ?? key, date, days: daysBetween(today, date) })).filter(e => e.days >= 0).sort((a, b) => a.days - b.days);
  return {
    streak: streaks(arr<string>(s.activity).filter(d => typeof d === "string"), today),
    revised: arr(s.revised).length,
    lessons: arr(s.lessons).length,
    cards: cards.length, cardsDue: cards.filter(c => !c.due || c.due <= today).length, cardsLearned: cards.filter(c => (c.box ?? 0) >= 3).length,
    reasoning: { right, tries, pct: tries ? right / tries : null, weakest, bestSpeed: Math.max(0, ...speed.map(r => r.score)) },
    challenges: arr(s["challenges-done"]).length,
    repairs: arr(s["appliance-cases"]).length, missions: arr(s["circuit-missions"]).length,
    driving: { runs: driving.length, best: Math.max(0, ...driving) },
    typing: { runs: typing.length, best: Math.max(0, ...goodTyping.map(r => r.w)), lastDay: typing.map(r => r.d.slice(0, 10)).sort().pop() ?? null },
    prepared: arr(s["qb-prepared"]).length,
    focus: Object.values(rec<number>(s["focus-log"])).reduce((n, v) => n + (typeof v === "number" ? v : 0), 0),
    quizzes: results.length,
    nextExam: exams[0] ?? null,
    myCourse: typeof s.myCourse === "string" && s.myCourse.includes("|") ? s.myCourse : null,
  };
}
export type Stats = ReturnType<typeof stats>;

/** Up to four things worth doing today, most urgent first. */
export function dailyPlan(st: Stats, today: string): PlanItem[] {
  const items: (PlanItem & { rank: number })[] = [];
  if (st.streak.current > 0 && !st.streak.studiedToday) items.push({ rank: 0, id: "streak", icon: "🔥", title: `Keep your ${st.streak.current}-day streak`, detail: "Save anything today: revise a topic, finish a lesson or review cards.", href: "/notes" });
  if (st.nextExam && st.nextExam.days <= 30) items.push({ rank: 1, id: "exam", icon: "📅", title: `${st.nextExam.code} exam ${st.nextExam.days === 0 ? "today" : `in ${st.nextExam.days} day${st.nextExam.days === 1 ? "" : "s"}`}`, detail: "Open the exam planner to see today’s topics.", href: "/college" });
  if (st.cardsDue > 0) items.push({ rank: 2, id: "cards", icon: "🃏", title: `Review ${st.cardsDue} revision card${st.cardsDue === 1 ? "" : "s"}`, detail: "Spaced review takes a few minutes and keeps them in memory.", href: "/study" });
  if (st.reasoning.weakest && st.reasoning.weakest.pct < .7) items.push({ rank: 3, id: "reasoning", icon: "◇", title: `Practise ${st.reasoning.weakest.topic}`, detail: `Your weakest reasoning topic, at ${Math.round(st.reasoning.weakest.pct * 100)}% correct.`, href: "/reasoning" });
  if (st.challenges > 0 && st.challenges < 8) items.push({ rank: 4, id: "coding", icon: "</>", title: `Coding challenge ${st.challenges + 1} of 8`, detail: "Pick up where you left off in the Coding Studio.", href: "/coding" });
  if (st.repairs > 0 && st.repairs < 15) items.push({ rank: 5, id: "repair", icon: "ϟ", title: `Fix appliance ${st.repairs + 1} of 15`, detail: "Inspect, repair and test in the Electrical Workshop.", href: "/electrical" });
  if (st.typing.runs > 0 && (!st.typing.lastDay || daysBetween(st.typing.lastDay, today) >= 3)) items.push({ rank: 6, id: "typing", icon: "⌨", title: "Five-minute typing warm-up", detail: st.typing.best ? `Your best is ${st.typing.best} WPM. Accuracy first.` : "Start with the home row.", href: "/skills" });
  if (!items.length) {
    if (st.streak.total === 0) return [
      { id: "start-notes", icon: "✎", title: "Read one topic from your notes", detail: "Mark it as revised to start your study streak.", href: "/notes" },
      { id: "start-questions", icon: "?", title: "See what your exam repeats", detail: "Open the Question Bank for your subject.", href: "/questions" },
      { id: "start-reasoning", icon: "◇", title: "Try five reasoning questions", detail: "Every answer explains the method.", href: "/reasoning" },
    ];
    items.push({ rank: 9, id: "explore", icon: "↗", title: "Try something new today", detail: "A coding challenge, a hazard hunt or a new driving route.", href: "/#labs" });
  }
  return items.sort((a, b) => a.rank - b.rank).slice(0, 4).map(({ rank: _rank, ...item }) => { void _rank; return item; });
}

/** Short progress text for each lab card on the home page. */
export function labProgress(st: Stats): Record<string, string> {
  const out: Record<string, string> = {};
  if (st.challenges) out["/coding"] = `${st.challenges} / 8 challenges`;
  if (st.revised) out["/notes"] = `${st.revised} topics revised`;
  if (st.prepared) out["/questions"] = `${st.prepared} questions prepared`;
  if (st.cards) out["/study"] = `${st.cardsDue} card${st.cardsDue === 1 ? "" : "s"} due`;
  if (st.reasoning.tries) out["/reasoning"] = `${Math.round((st.reasoning.pct ?? 0) * 100)}% of ${st.reasoning.tries}`;
  if (st.driving.runs) out["/driving"] = `best ${st.driving.best}/100`;
  if (st.typing.best) out["/skills"] = `typing ${st.typing.best} WPM`;
  if (st.repairs || st.missions) out["/electrical"] = `${st.repairs} / 15 repairs`;
  return out;
}

export function badges(st: Stats): Badge[] {
  const b = (id: string, title: string, detail: string, value: number, goal: number): Badge => ({ id, title, detail, earned: value >= goal, progress: `${Math.min(value, goal)} / ${goal}` });
  return [
    b("first", "First step", "Study on any day", st.streak.total, 1),
    b("streak3", "On a roll", "A 3-day study streak", st.streak.best, 3),
    b("streak7", "Week warrior", "A 7-day study streak", st.streak.best, 7),
    b("revise25", "Reviser", "Mark 25 note topics revised", st.revised, 25),
    b("revise100", "Bookworm", "Mark 100 note topics revised", st.revised, 100),
    b("cards", "Memory builder", "10 cards well learned (box 3+)", st.cardsLearned, 10),
    b("exam", "Exam ready", "Prepare 20 likely exam questions", st.prepared, 20),
    b("code4", "Code builder", "Solve 4 coding challenges", st.challenges, 4),
    b("code8", "Challenge champion", "Solve all 8 coding challenges", st.challenges, 8),
    b("fix5", "Fixer", "Repair 5 virtual appliances", st.repairs, 5),
    b("fix15", "Master repairer", "Repair all 15 appliances", st.repairs, 15),
    b("speed", "Quick thinker", "Score 8+ in a reasoning speed round", st.reasoning.bestSpeed, 8),
    b("typing", "Touch typist", "30 WPM at 90% accuracy", st.typing.best, 30),
    b("driver", "Safe driver", "Finish a drive with 90+ control score", st.driving.best, 90),
    b("focus", "Deep focus", "Complete 10 focus sessions", st.focus, 10),
  ];
}
