export type Lab = { n: string; icon: string; title: string; desc: string; href: string; tag: string; keywords: string };

export const labs: Lab[] = [
  { n: "01", icon: "</>", title: "Coding Studio", desc: "Build your own websites and browser apps. Bring code from your AI, edit, preview and export.", href: "/coding", tag: "7 starters + your own projects", keywords: "html css javascript web editor code programming" },
  { n: "02", icon: "▤", title: "College Hub", desc: "Find your department and semester. Follow your syllabus and keep study notes.", href: "/college", tag: "7 subjects + VAC", keywords: "syllabus semester department course paper mzu" },
  { n: "03", icon: "✎", title: "Notes Library", desc: "Read every TRC study guide online, search across all subjects, track what you have revised and test yourself.", href: "/notes", tag: "24 guides · search + revision tracker", keywords: "study guide notes revise read docx" },
  { n: "04", icon: "?", title: "Question Bank", desc: "Past MZU semester questions by subject and paper. See what repeats, get our guess paper for the next exam and download past papers.", href: "/questions", tag: "Repeats + guess papers + PDFs", keywords: "exam past papers previous year questions guess mzu repeated" },
  { n: "05", icon: "▧", title: "PDF Study Lab", desc: "Extract PDF text, create summaries with page references, and keep notes and revision cards.", href: "/study", tag: "PDF decoder + notebooks", keywords: "pdf summary notebook flashcards revision" },
  { n: "06", icon: "◇", title: "Reasoning Lab", desc: "Find patterns, follow clues and test your reasoning with clear explanations.", href: "/reasoning", tag: "Practice + test mode", keywords: "aptitude logic puzzles cuet quiz" },
  { n: "07", icon: "↗", title: "Driving Lab", desc: "Explore three 3D practice courses with traffic, weather, touch controls and checkpoints.", href: "/driving", tag: "Drive + reflect", keywords: "car road traffic simulator 3d licence" },
  { n: "08", icon: "⌘", title: "Basic Skills", desc: "Play instruments, compose beats, practise typing and learn spreadsheet and email skills.", href: "/skills", tag: "Music + digital workshops", keywords: "guitar piano drums beat typing spreadsheet email music" },
  { n: "09", icon: "ϟ", title: "Electrical Workshop", desc: "Build virtual series and parallel circuits, read a simulated meter and solve appliance faults.", href: "/electrical", tag: "Build, measure, repair", keywords: "circuit battery voltage meter appliance repair" },
];

export const extraPages = [
  { title: "My progress", href: "/progress", desc: "Lessons, quiz results, study streak and backups.", keywords: "streak calendar backup restore results" },
  { title: "Get the app", href: "/install", desc: "Install the hub on your phone or computer and use it offline.", keywords: "install pwa offline phone" },
];
