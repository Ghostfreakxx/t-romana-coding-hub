"use client";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { labs } from "@/data/site";
import { noteResources } from "@/data/notes";
import { badges, dailyPlan, labProgress, stats } from "@/lib/hub-summary";
import { dayKey, snapshotKey, subscribeAll } from "@/lib/storage";

const noSubscribe = () => () => {};
/** Everything saved on this device, summarised. Empty while prerendering, so nothing personal is baked into the page. */
export function useHub() {
  const raw = useSyncExternalStore(subscribeAll, snapshotKey, () => "");
  const today = useSyncExternalStore(noSubscribe, () => dayKey(), () => "");
  return useMemo(() => {
    if (!raw || !today) return null;
    const snap: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, string>)) { try { snap[k] = JSON.parse(v); } catch { /* skip */ } }
    const st = stats(snap, today);
    return { today, stats: st, plan: dailyPlan(st, today), badges: badges(st), labs: labProgress(st) };
  }, [raw, today]);
}
const titleCase = (slug: string) => slug.split("-").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

/** Home page: a greeting and up to four suggestions for today, built from the student’s own saved work. */
export function TodayPanel() {
  const hub = useHub(), hour = useSyncExternalStore(noSubscribe, () => new Date().getHours(), () => 12);
  if (!hub) return <div className="today-panel is-loading" aria-hidden="true" />;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [dept, sem] = hub.stats.myCourse?.split("|") ?? [];
  const earned = hub.badges.filter(b => b.earned).length;
  return <section className="today-panel section-gap" aria-labelledby="today-heading">
    <div className="row between today-head"><div><p className="eyebrow">{new Date(`${hub.today}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p><h2 id="today-heading">{greeting}. {hub.stats.streak.total ? "Here is your plan for today." : "Where would you like to start?"}</h2></div>
      <div className="row today-links">{dept && <Link className="tag" href="/college">★ {titleCase(dept)} · Semester {sem}</Link>}<Link className="tag" href="/progress">🏅 {earned} / {hub.badges.length} badges</Link></div></div>
    <ol className="plan-list">{hub.plan.map(p => <li key={p.id}><Link href={p.href} className="plan-item"><span className="plan-icon" aria-hidden="true">{p.icon}</span><span><strong>{p.title}</strong><small>{p.detail}</small></span><span aria-hidden="true" className="accent">→</span></Link></li>)}</ol>
  </section>;
}

/** Home page lab cards, with the student’s own progress on each once the page is running. */
export function LabGrid() {
  const hub = useHub();
  return <div className="grid-cards">{labs.map(({ n, icon, title, desc, href, tag }) => <Link href={href} key={href} className="lab-card"><div className="card-top"><span className="card-icon" aria-hidden="true">{icon}</span><span>{n} / LAB</span></div><h2>{title}</h2><p>{desc}</p>
    {hub?.labs[href] && <span className="lab-mine">You: {hub.labs[href]}</span>}
    <div className="row between card-link"><span>{href === "/notes" ? `${noteResources.length} guides · search + revision tracker` : tag}</span><span aria-hidden="true">↗</span></div></Link>)}</div>;
}

/** My progress: one tile per lab and the badge shelf. */
export function ProgressOverview() {
  const hub = useHub();
  if (!hub) return <p className="notice">Loading your progress…</p>;
  const s = hub.stats, pct = (n: number | null) => n === null ? "—" : `${Math.round(n * 100)}%`;
  const tiles: [string, string, string, string][] = [
    ["Study streak", `${s.streak.current} day${s.streak.current === 1 ? "" : "s"}`, `best ${s.streak.best} · ${s.streak.total} study days`, "/progress#calendar-heading"],
    ["Notes revised", String(s.revised), "topics marked as revised", "/notes"],
    ["Revision cards", String(s.cards), `${s.cardsDue} due today · ${s.cardsLearned} well learned`, "/study"],
    ["Exam questions", String(s.prepared), s.nextExam ? `next exam: ${s.nextExam.code} in ${s.nextExam.days} days` : "likely questions prepared", "/questions"],
    ["Reasoning", pct(s.reasoning.pct), `${s.reasoning.tries} answered · best speed round ${s.reasoning.bestSpeed}/10`, "/reasoning"],
    ["Coding challenges", `${s.challenges} / 8`, "solved with every check passing", "/coding"],
    ["Electrical", `${s.repairs} / 15`, `appliances repaired · ${s.missions} / 3 bench missions`, "/electrical"],
    ["Driving", s.driving.runs ? `${s.driving.best}` : "—", s.driving.runs ? `best control score · ${s.driving.runs} saved route${s.driving.runs === 1 ? "" : "s"}` : "save a finished drive", "/driving"],
    ["Typing", s.typing.best ? `${s.typing.best} WPM` : "—", `${s.typing.runs} run${s.typing.runs === 1 ? "" : "s"} · best at 90%+ accuracy`, "/skills"],
    ["Focus sessions", String(s.focus), `${s.focus * 25} minutes of focused study`, "/study"],
  ];
  const earned = hub.badges.filter(b => b.earned);
  return <>
    <section className="overview-grid" aria-label="Progress in every lab">{tiles.map(([label, big, small, href]) => <Link key={label} href={href} className="overview-tile"><small>{label}</small><strong>{big}</strong><span>{small}</span></Link>)}</section>
    <section className="panel section-gap" aria-labelledby="badges-heading"><div className="row between"><h2 id="badges-heading">Badges</h2><span className="tag">{earned.length} / {hub.badges.length} earned</span></div>
      <p className="muted">Earned by doing, not by clicking. Each badge shows how close you are.</p>
      <ul className="badge-shelf">{hub.badges.map(b => <li key={b.id} className={b.earned ? "is-earned" : undefined}><span className="badge-medal" aria-hidden="true">{b.earned ? "🏅" : "○"}</span><strong>{b.title}</strong><small>{b.detail}</small><span className="badge-progress">{b.earned ? "Earned" : b.progress}</span></li>)}</ul>
    </section>
  </>;
}
