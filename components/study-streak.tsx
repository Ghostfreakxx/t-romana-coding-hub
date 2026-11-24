"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { dayKey, emptyList, isStringList, useSaved } from "@/lib/storage";

const noSubscribe = () => () => {};
/** Today's local date on the client; empty during prerendering so nothing date-based is baked into the HTML. */
function useToday() {
  return useSyncExternalStore(noSubscribe, () => dayKey(), () => "");
}
function parse(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function shift(key: string, days: number) {
  const date = parse(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

export function streakStats(days: string[], today: string) {
  const set = new Set(days);
  let current = 0;
  // A streak stays alive until the end of the day after the last study day.
  let cursor = set.has(today) ? today : shift(today, -1);
  while (set.has(cursor)) { current++; cursor = shift(cursor, -1); }
  let best = 0, run = 0, previous = "";
  for (const day of [...set].sort()) {
    run = previous && shift(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  const week = Array.from({ length: 7 }, (_, i) => shift(today, i - 6));
  return { current, best, total: set.size, studiedToday: set.has(today), week, weekCount: week.filter(d => set.has(d)).length, set };
}

export function useActivity() {
  return useSaved("activity", emptyList, isStringList);
}

const weekday = (key: string) => parse(key).toLocaleDateString(undefined, { weekday: "narrow" });
const longDate = (key: string) => parse(key).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

/** Compact streak card for the home page. */
export function StudyStreak() {
  const activity = useActivity();
  const today = useToday();
  if (!today) return null;
  const stats = streakStats(activity.value, today);
  const message = stats.total === 0
    ? "Read a note, finish a lesson or save a project to start your streak."
    : stats.studiedToday
      ? "You have studied today. Come back tomorrow to keep it going."
      : stats.current > 0
        ? "Study something today to keep your streak alive."
        : "Start a new streak today. One topic is enough.";
  return <section className="streak-card section-gap" aria-labelledby="streak-heading">
    <div className="streak-count">
      <p className="eyebrow">Study streak</p>
      <h2 id="streak-heading"><strong>{stats.current}</strong> {stats.current === 1 ? "day" : "days"}</h2>
      <p className="small muted">Best: {stats.best} {stats.best === 1 ? "day" : "days"} · {stats.total} study {stats.total === 1 ? "day" : "days"} in all</p>
    </div>
    <div>
      <ol className="streak-week" aria-label={`Studied on ${stats.weekCount} of the last 7 days`}>
        {stats.week.map(day => <li key={day} className={stats.set.has(day) ? "is-on" : undefined} aria-current={day === today ? "date" : undefined} title={`${longDate(day)}${stats.set.has(day) ? ": studied" : ""}`}><span aria-hidden="true">{weekday(day)}</span><i aria-hidden="true" /><span className="sr-only">{longDate(day)}: {stats.set.has(day) ? "studied" : "no study"}</span></li>)}
      </ol>
      <p className="small muted streak-message">{message}</p>
    </div>
    <Link href="/progress" className="btn secondary">See my progress →</Link>
  </section>;
}

/** Twenty-week activity calendar for the progress page. Columns are weeks starting on Monday. */
export function ActivityCalendar() {
  const activity = useActivity();
  const today = useToday();
  if (!today) return <section className="panel section-gap"><h2>Study calendar</h2><p className="muted">Loading your study days…</p></section>;
  const stats = streakStats(activity.value, today);
  const mondayOffset = (parse(today).getDay() + 6) % 7;
  const start = shift(today, -mondayOffset - 7 * 19);
  const weeks = Array.from({ length: 20 }, (_, w) => Array.from({ length: 7 }, (_, d) => shift(start, w * 7 + d)));
  const inRange = weeks.flat().filter(d => d <= today && stats.set.has(d)).length;
  return <section className="panel section-gap" aria-labelledby="calendar-heading">
    <div className="row between"><h2 id="calendar-heading">Study calendar</h2><span className="tag">{stats.current}-day streak · best {stats.best}</span></div>
    <p className="muted">A day counts when you save anything on this hub: a revised topic, a lesson, a quiz, a project or a note. {inRange} study {inRange === 1 ? "day" : "days"} in the last 20 weeks.</p>
    <div className="activity-scroll">
      <div className="activity-grid" role="img" aria-label={`${inRange} study days in the last 20 weeks. Current streak ${stats.current} days, best ${stats.best} days.`}>
        {weeks.map(week => <div className="activity-week" key={week[0]}>{week.map(day => <span key={day} className={day > today ? "is-future" : stats.set.has(day) ? "is-on" : undefined} title={day > today ? undefined : `${longDate(day)}${stats.set.has(day) ? ": studied" : ""}`} />)}</div>)}
      </div>
    </div>
    <p className="small muted">Mondays are at the top. Study days are kept on this browser and included in the progress backup.</p>
  </section>;
}
