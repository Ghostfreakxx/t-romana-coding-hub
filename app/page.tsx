import Link from "next/link";

const labs = [
  {
    title: "Coding Lab",
    icon: "💻",
    description:
      "Build websites, calculators, quizzes and mini browser apps using HTML, CSS and JavaScript.",
    href: "/coding",
    status: "Ready",
  },
  {
    title: "College Hub",
    icon: "🎓",
    description:
      "Explore your real college syllabus by department, semester, paper and unit.",
    href: "/college",
    status: "Building",
  },
  {
    title: "PDF Study Lab",
    icon: "📄",
    description:
      "Open study material, read alongside your notes and build better revision material.",
    href: "/study",
    status: "Building",
  },
  {
    title: "Reasoning Lab",
    icon: "🧩",
    description:
      "Learn CUET reasoning through hints, explanations, practice questions and tests.",
    href: "/reasoning",
    status: "Building",
  },
  {
    title: "Driving Lab",
    icon: "🚗",
    description:
      "Learn four-wheeler controls, gears, road signs, parking basics and driving situations.",
    href: "/driving",
    status: "Building",
  },
  {
    title: "Basic Skills",
    icon: "🛠️",
    description:
      "Learn practical computer, internet, email, documents, spreadsheets, CV and everyday skills.",
    href: "/skills",
    status: "Building",
  },
  {
    title: "Electrical Basics",
    icon: "⚡",
    description:
      "Understand electricity, household components, safety and basic troubleshooting concepts.",
    href: "/electrical",
    status: "Building",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">

        <header className="mb-12">
          <div className="mb-5 inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
            Learn • Try • Understand • Build
          </div>

          <h1 className="max-w-5xl text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">
            T. ROMANA
            <span className="block text-zinc-500">
              SKILLS HUB
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
            Learn things you can actually use.
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
            Practical learning for students who want to understand,
            build and solve problems independently.
          </p>
        </header>

        <section className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
            Know Your Own
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            MIZO
          </h2>

          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
            Technology can help us learn about the world.
            But we should never become strangers to our own.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500 sm:text-base">
            Study the Mizo language. Read Mizo literature.
            Know our history, culture and society.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500 sm:text-base">
            AI can assist learning, but it cannot inherit a language,
            preserve a memory, or carry an identity for us.
          </p>

          <div className="mt-6 border-l-2 border-zinc-600 pl-5">
            <p className="text-xl font-black leading-8 sm:text-2xl">
              Some knowledge prepares you for an examination.
            </p>

            <p className="mt-1 text-xl font-black leading-8 text-zinc-400 sm:text-2xl">
              Some knowledge tells you who you are.
            </p>
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
            Learn from the world. Know your roots.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => {
            const active =
              lab.status === "Ready" ||
              lab.status === "Building";

            const content = (
              <article className="group flex h-full min-h-[270px] flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-zinc-600">
                <div>
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <span className="text-4xl">
                      {lab.icon}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        lab.status === "Ready"
                          ? "bg-white text-black"
                          : "border border-zinc-700 text-zinc-500"
                      }`}
                    >
                      {lab.status}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black tracking-tight">
                    {lab.title}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-zinc-500">
                    {lab.description}
                  </p>
                </div>

                <div className="mt-8 text-sm font-bold text-white">
                  {lab.status === "Ready"
                    ? "Enter Lab →"
                    : "Open Section →"}
                </div>
              </article>
            );

            return active ? (
              <Link
                key={lab.title}
                href={lab.href}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={lab.title}>
                {content}
              </div>
            );
          })}
        </section>

        <section className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
            The Idea
          </p>

          <p className="mt-4 max-w-4xl text-2xl font-black leading-9 sm:text-4xl sm:leading-[1.2]">
            Do not just memorize something.
            Learn enough to use it.
          </p>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
            Every section is built around learning by doing:
            understand the idea, try it yourself, make mistakes,
            correct them and keep moving.
          </p>
        </section>

        <footer className="py-10 text-center text-xs text-zinc-700">
          T. Romana Skills Hub • Built for learning
        </footer>

      </section>
    </main>
  );
}