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

export type EmailDraft = { to: string; subject: string; body: string; attachment: boolean };
export type EmailCheck = { ok: boolean; label: string; tip: string };
type Rule = { label: string; tip: string; test: (d: EmailDraft) => boolean };
const has = (re: RegExp) => (d: EmailDraft) => re.test(d.body);
export const EMAIL_SCENARIOS: Record<string, { title: string; brief: string; to: string; needsAttachment: boolean; rules: Rule[]; model: { subject: string; body: string } }> = {
  assignment: { title: "Submit an assignment", to: "teacher@example.edu", needsAttachment: true,
    brief: "Send your Political Science assignment on federalism to your teacher, Dr. Lalrinpuii, before the deadline. Attach the file.",
    rules: [
      { label: "Says what is attached", tip: "Mention the assignment and that it is attached.", test: has(/assignment|submission|submit/i) },
      { label: "Names the paper or topic", tip: "Say which subject or topic, e.g. “POLS 103 assignment on federalism”.", test: has(/political|pols|federal|topic|paper/i) },
      { label: "Asks for a reply if needed", tip: "Ask the teacher to tell you if anything needs to change.", test: has(/let me know|please confirm|any changes|feedback|acknowledge/i) },
    ], model: { subject: "POLS 103 assignment submission – Federalism in India", body: "Dear Dr. Lalrinpuii,\n\nI am submitting my POLS 103 assignment on “Federalism in India”, which is attached as a PDF. Please let me know if it opens correctly or if any changes are needed.\n\nThank you for your time.\n\nYours sincerely,\nMawii Ralte\nBA Semester III, Roll No. 24" } },
  leave: { title: "Apply for leave", to: "principal@example.edu", needsAttachment: false,
    brief: "Ask the Principal for two days’ leave (Thursday and Friday) because you have fever. Say you will catch up on missed classes.",
    rules: [
      { label: "Gives the reason", tip: "Say why you need leave, briefly (e.g. fever).", test: has(/fever|ill|sick|unwell|medical|doctor|family|emergency/i) },
      { label: "Gives the dates", tip: "Say exactly which days, e.g. “Thursday 4 and Friday 5 December”.", test: has(/\b(mon|tues|wednes|thurs|fri|satur|sun)day\b|\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\b\d{1,2}[/.-]\d{1,2}\b|\bfrom\b.*\bto\b/i) },
      { label: "Asks politely", tip: "Request leave: “I request you to kindly grant me leave…”.", test: has(/kindly|request|grant|permission|may i|could you/i) },
      { label: "Says how you will catch up", tip: "Show responsibility: say you will collect notes or catch up.", test: has(/catch up|cover|notes|missed|make up/i) },
    ], model: { subject: "Leave application – 4 and 5 December (fever)", body: "Dear Sir,\n\nI have had a high fever since last night and the doctor has advised two days of rest. I request you to kindly grant me leave on Thursday 4 and Friday 5 December.\n\nI will collect notes from my classmates and catch up on the classes I miss.\n\nThank you.\n\nYours faithfully,\nLalthan Zama\nBA Semester V, History" } },
  reference: { title: "Ask for a recommendation", to: "teacher@example.edu", needsAttachment: true,
    brief: "Ask your English teacher for a recommendation letter for a scholarship. Say what it is for, give the deadline and attach your CV.",
    rules: [
      { label: "Says what you need", tip: "Ask clearly for a recommendation or reference letter.", test: has(/recommend|reference|letter/i) },
      { label: "Explains what it is for", tip: "Name the scholarship, course or job.", test: has(/scholarship|programme|program|course|job|internship|admission/i) },
      { label: "Gives the deadline", tip: "Say when it is needed, so the teacher can plan.", test: has(/deadline|by\s|before|due|\b\d{1,2}(st|nd|rd|th)?\s+\w+/i) },
      { label: "Makes it easy to say yes", tip: "Offer help: attach your CV or offer to meet.", test: has(/attached|cv|resume|meet|discuss|any information/i) },
    ], model: { subject: "Request for a recommendation letter – State merit scholarship", body: "Dear Ma’am,\n\nI am applying for the State Merit Scholarship for postgraduate study, and I would be grateful if you could write a recommendation letter for me. You taught me English Literature in Semesters III and IV.\n\nThe letter is needed by 15 December. I have attached my CV and the scholarship details, and I am happy to meet if you need any information.\n\nThank you for considering my request.\n\nWith regards,\nRuatfela\nBA Semester V, English" } },
  interview: { title: "Reply to an interview invitation", to: "hr@example.com", needsAttachment: false,
    brief: "A company has invited you to an interview on Monday at 10:30 am. Reply to thank them and confirm that you will attend.",
    rules: [
      { label: "Thanks them", tip: "Begin by thanking them for the invitation.", test: has(/thank/i) },
      { label: "Confirms attendance", tip: "Say clearly that you will attend or confirm.", test: has(/confirm|will attend|will be there|happy to attend|look forward/i) },
      { label: "Repeats the date and time", tip: "Repeat “Monday at 10:30 am” so there is no mix-up.", test: has(/monday|10[:.]30/i) },
    ], model: { subject: "Re: Interview invitation – confirming Monday 10:30 am", body: "Dear Ms. Sangi,\n\nThank you for inviting me to interview for the Office Assistant position. I am happy to confirm that I will attend on Monday at 10:30 am at your Aizawl office.\n\nI look forward to meeting you.\n\nKind regards,\nMalsawma\nPhone: 98XXXXXX12" } },
  complaint: { title: "Complain about a service", to: "support@example.net", needsAttachment: false,
    brief: "Your home internet has not worked for three days. Write to the provider’s support team. Give your account number, describe the problem and ask them to fix it.",
    rules: [
      { label: "Gives your account number", tip: "Include an account or customer number (any digits for practice).", test: has(/\d{4,}/) },
      { label: "Describes the problem", tip: "Say what is wrong: “no internet connection”.", test: has(/not working|no internet|no connection|down|stopped|problem|issue/i) },
      { label: "Says since when", tip: "Say how long: “since Monday” or “for three days”.", test: has(/since|for (two|three|four|\d+) days|days|yesterday/i) },
      { label: "Asks for a clear action", tip: "Ask for what you want: repair, a technician visit or a refund for the days lost.", test: has(/fix|repair|resolve|technician|refund|restore|compensat/i) },
    ], model: { subject: "No internet for 3 days – account 4471 2093", body: "Dear Support Team,\n\nMy home internet (account number 4471 2093) has not worked since Monday morning. The router lights are on, but there is no connection, and restarting it has not helped.\n\nPlease send a technician to repair the connection as soon as possible, and adjust my bill for the days without service.\n\nThank you,\nC. Lalremruati\nChaltlang, Aizawl · 98XXXXXX45" } },
};
const TEXT_SPEAK = /\b(u|ur|plz|pls|thx|thnx|coz|cuz|gonna|wanna|okk+|sry|tmrw|bcoz)\b/i;
/** Checks every draft for the basics, then for what this scenario needs. */
export function checkEmail(scenarioId: string, d: EmailDraft): EmailCheck[] {
  const sc = EMAIL_SCENARIOS[scenarioId], words = d.body.trim().split(/\s+/).filter(Boolean).length;
  const capsWords = (d.body.match(/\b[A-Z]{4,}\b/g) ?? []).length;
  const common: Rule[] = [
    { label: "Correct recipient", tip: `Send it to ${sc.to}.`, test: x => x.to.trim().toLowerCase() === sc.to },
    { label: "Specific subject line", tip: "Say what the email is about in a few words; “Hi” or “Urgent” alone is not enough.", test: x => x.subject.trim().length >= 10 && !/^(hi|hello|urgent|important|mail|email|request)[\s!.]*$/i.test(x.subject.trim()) },
    { label: "Respectful greeting", tip: "Start with “Dear …,” (or “Hello …,” for a less formal reader).", test: x => /^(dear|respected|hello|good (morning|afternoon|evening))\b/i.test(x.body.trim()) },
    { label: "Polite closing and your name", tip: "End with “Thank you” or “Yours sincerely”, then your name on the next line.", test: x => /(thank|regards|sincerely|faithfully)[\s\S]*\n\s*\S/i.test(x.body) },
    { label: "Right length", tip: words < 40 ? "Add a little more context (aim for 40–200 words)." : "Shorten it: busy readers prefer under 200 words.", test: () => words >= 40 && words <= 200 },
    { label: "Professional tone", tip: "Avoid text-speak (u, plz, thx), ALL CAPS and “!!”.", test: x => !TEXT_SPEAK.test(x.body) && capsWords < 2 && !/!!|\?\?/.test(x.body + x.subject) },
  ];
  if (sc.needsAttachment) common.push({ label: "File attached", tip: "This email needs an attachment. Tick the attach box.", test: x => x.attachment });
  return [...common, ...sc.rules].map(r => ({ ok: r.test(d), label: r.label, tip: r.tip }));
}
