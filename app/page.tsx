"use client";

import { useMemo, useState } from "react";

type Tab = "html" | "css" | "js";
type ProjectKey =
  | "calculator"
  | "quiz"
  | "counter"
  | "website"
  | "blank";

type Project = {
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
};

const projects: Record<ProjectKey, Project> = {
  calculator: {
    name: "Calculator",
    description: "Build a working calculator with four basic operations.",

    html: `<div class="calculator">
  <h2>My First Calculator</h2>

  <input id="num1" type="number" placeholder="First number">
  <input id="num2" type="number" placeholder="Second number">

  <div class="buttons">
    <button onclick="calculate('add')">+</button>
    <button onclick="calculate('subtract')">−</button>
    <button onclick="calculate('multiply')">×</button>
    <button onclick="calculate('divide')">÷</button>
  </div>

  <h3 id="result">Result: 0</h3>
</div>`,

    css: `body {
  font-family: Arial, sans-serif;
  background: #f4f4f5;
  text-align: center;
  padding: 30px;
}

.calculator {
  max-width: 350px;
  margin: auto;
  background: white;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.10);
}

input {
  width: 90%;
  padding: 12px;
  margin: 8px;
  font-size: 16px;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
}

.buttons {
  margin-top: 15px;
}

button {
  width: 55px;
  height: 55px;
  margin: 5px;
  font-size: 22px;
  border: none;
  border-radius: 10px;
  background: #18181b;
  color: white;
  cursor: pointer;
}

h3 {
  margin-top: 20px;
}`,

    js: `function calculate(operation) {
  const num1 = Number(document.getElementById("num1").value);
  const num2 = Number(document.getElementById("num2").value);

  let answer;

  if (operation === "add") {
    answer = num1 + num2;
  }

  if (operation === "subtract") {
    answer = num1 - num2;
  }

  if (operation === "multiply") {
    answer = num1 * num2;
  }

  if (operation === "divide") {
    answer = num2 !== 0
      ? num1 / num2
      : "Cannot divide by zero";
  }

  document.getElementById("result").innerText =
    "Result: " + answer;
}`,
  },

  quiz: {
    name: "Quiz",
    description: "Create a simple Political Science quiz.",

    html: `<div class="quiz">
  <h2>Political Science Quiz</h2>

  <p>
    Who is known as the Father of Political Science?
  </p>

  <button onclick="checkAnswer('Plato')">
    Plato
  </button>

  <button onclick="checkAnswer('Aristotle')">
    Aristotle
  </button>

  <button onclick="checkAnswer('Marx')">
    Karl Marx
  </button>

  <h3 id="result">Choose an answer</h3>
</div>`,

    css: `body {
  font-family: Arial, sans-serif;
  background: #f4f4f5;
  text-align: center;
  padding: 30px;
}

.quiz {
  max-width: 420px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 20px;
}

button {
  display: block;
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: none;
  border-radius: 10px;
  background: #18181b;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

h3 {
  margin-top: 20px;
}`,

    js: `function checkAnswer(answer) {
  const result = document.getElementById("result");

  if (answer === "Aristotle") {
    result.innerText = "Correct! 🎉";
  } else {
    result.innerText = "Try again.";
  }
}`,
  },

  counter: {
    name: "Counter",
    description: "Learn JavaScript by changing a number.",

    html: `<div class="counter">
  <h2>Student Counter</h2>

  <h1 id="number">0</h1>

  <button onclick="decrease()">−</button>
  <button onclick="increase()">+</button>
  <button onclick="resetCounter()">Reset</button>
</div>`,

    css: `body {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 40px;
  background: #f4f4f5;
}

.counter {
  max-width: 350px;
  margin: auto;
  padding: 30px;
  background: white;
  border-radius: 20px;
}

#number {
  font-size: 60px;
}

button {
  padding: 12px 18px;
  margin: 5px;
  border: none;
  border-radius: 10px;
  background: #18181b;
  color: white;
  font-size: 18px;
  cursor: pointer;
}`,

    js: `let count = 0;

function increase() {
  count++;
  document.getElementById("number").innerText = count;
}

function decrease() {
  count--;
  document.getElementById("number").innerText = count;
}

function resetCounter() {
  count = 0;
  document.getElementById("number").innerText = count;
}`,
  },

  website: {
    name: "Website",
    description: "Build your own modern personal website.",

    html: `<nav>
  <div class="logo">MY WEBSITE</div>

  <div class="links">
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#projects">Projects</a>
    <a href="#contact">Contact</a>
  </div>
</nav>

<section id="home" class="hero">

  <p class="small-title">
    WELCOME TO MY WEBSITE
  </p>

  <h1>
    Hello, I'm
    <span>Your Name</span>
  </h1>

  <p class="intro">
    I built this website using my phone,
    AI and T. Romana Coding Hub.
  </p>

  <button onclick="exploreWebsite()">
    Explore My Website
  </button>

</section>

<section id="about" class="section">

  <p class="section-label">
    ABOUT
  </p>

  <h2>About Me</h2>

  <p>
    I am a college student learning how
    technology, AI and programming can
    help me create new things.
  </p>

</section>

<section id="projects" class="section">

  <p class="section-label">
    MY WORK
  </p>

  <h2>Projects</h2>

  <div class="cards">

    <div class="card">
      <h3>Project One</h3>
      <p>
        Describe your first project here.
      </p>
    </div>

    <div class="card">
      <h3>Project Two</h3>
      <p>
        Describe your second project here.
      </p>
    </div>

    <div class="card">
      <h3>Project Three</h3>
      <p>
        Describe your third project here.
      </p>
    </div>

  </div>

</section>

<section id="contact" class="section contact">

  <p class="section-label">
    CONTACT
  </p>

  <h2>Let's Connect</h2>

  <p>
    Replace this with your own
    contact information.
  </p>

  <button onclick="sayHello()">
    Say Hello
  </button>

  <p id="message"></p>

</section>

<footer>
  Built with T. Romana Coding Hub
</footer>`,

    css: `* {
  box-sizing: border-box;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0a0a0a;
  color: white;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 7%;
  border-bottom: 1px solid #27272a;
}

.logo {
  font-weight: 900;
  letter-spacing: 2px;
}

.links {
  display: flex;
  gap: 20px;
}

.links a {
  color: #a1a1aa;
  text-decoration: none;
  font-size: 14px;
}

.links a:hover {
  color: white;
}

.hero {
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 8%;
  background:
    radial-gradient(
      circle at top right,
      #27272a,
      #0a0a0a 50%
    );
}

.small-title,
.section-label {
  color: #71717a;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 3px;
}

.hero h1 {
  max-width: 700px;
  margin: 10px 0;
  font-size: 55px;
  line-height: 1.05;
}

.hero h1 span {
  color: #a1a1aa;
}

.intro {
  max-width: 550px;
  color: #a1a1aa;
  font-size: 18px;
  line-height: 1.7;
}

button {
  width: fit-content;
  margin-top: 15px;
  padding: 13px 20px;
  border: none;
  border-radius: 10px;
  background: white;
  color: black;
  font-weight: bold;
  cursor: pointer;
}

.section {
  padding: 70px 8%;
  border-top: 1px solid #27272a;
}

.section h2 {
  margin-top: 8px;
  font-size: 35px;
}

.section > p:not(.section-label) {
  max-width: 650px;
  color: #a1a1aa;
  line-height: 1.7;
}

.cards {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 15px;
  margin-top: 30px;
}

.card {
  padding: 25px;
  border: 1px solid #27272a;
  border-radius: 15px;
  background: #18181b;
}

.card p {
  color: #a1a1aa;
  line-height: 1.6;
}

.contact {
  text-align: center;
}

.contact > p {
  margin-left: auto;
  margin-right: auto;
}

.contact button {
  margin-left: auto;
  margin-right: auto;
}

#message {
  margin: 20px auto 0;
  color: white;
}

footer {
  padding: 30px;
  border-top: 1px solid #27272a;
  text-align: center;
  color: #52525b;
  font-size: 12px;
}

@media (max-width: 650px) {
  nav {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
  }

  .links {
    width: 100%;
    gap: 12px;
    overflow-x: auto;
  }

  .hero {
    min-height: 430px;
  }

  .hero h1 {
    font-size: 40px;
  }

  .cards {
    grid-template-columns: 1fr;
  }
}`,

    js: `function exploreWebsite() {
  document
    .getElementById("about")
    .scrollIntoView({
      behavior: "smooth"
    });
}

function sayHello() {
  document.getElementById("message").innerText =
    "Hello! 👋 You just used JavaScript on your own website.";
}`,
  },

  blank: {
    name: "Blank Project",
    description: "Start from nothing and build your own idea.",

    html: `<h1>My Project</h1>
<p>Start building here.</p>`,

    css: `body {
  font-family: Arial, sans-serif;
  padding: 30px;
}`,

    js: `// Write your JavaScript here`,
  },
};

const challenges = [
  "Change the title and make the project yours.",
  "Change the design without asking AI.",
  "Add one new feature using ChatGPT.",
  "Break something on purpose, then fix it.",
  "Build something your teacher did not ask for.",
];

export default function Home() {
  const [activeTab, setActiveTab] =
    useState<Tab>("html");

  const [selectedProject, setSelectedProject] =
    useState<ProjectKey>("calculator");

  const firstProject = projects.calculator;

  const [html, setHtml] =
    useState(firstProject.html);

  const [css, setCss] =
    useState(firstProject.css);

  const [js, setJs] =
    useState(firstProject.js);

  const [outputHTML, setOutputHTML] =
    useState(firstProject.html);

  const [outputCSS, setOutputCSS] =
    useState(firstProject.css);

  const [outputJS, setOutputJS] =
    useState(firstProject.js);

  const srcDoc = useMemo(() => {
    const safeJs = outputJS.replace(
      /<\/script>/gi,
      "<\\/script>"
    );

    return `
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <style>
            ${outputCSS}
          </style>

        </head>

        <body>

          ${outputHTML}

          <script>

            window.onerror = function(
              message,
              source,
              line
            ) {

              const box =
                document.createElement("div");

              box.style.margin = "20px";
              box.style.padding = "15px";
              box.style.background = "#fee2e2";
              box.style.color = "#991b1b";
              box.style.borderRadius = "12px";
              box.style.fontFamily = "Arial";

              box.innerText =
                "JavaScript Error: " +
                message +
                " — line " +
                line;

              document.body.appendChild(box);
            };

            try {

              ${safeJs}

            } catch (error) {

              const box =
                document.createElement("div");

              box.style.margin = "20px";
              box.style.padding = "15px";
              box.style.background = "#fee2e2";
              box.style.color = "#991b1b";
              box.style.borderRadius = "12px";
              box.style.fontFamily = "Arial";

              box.innerText =
                "JavaScript Error: " +
                error;

              document.body.appendChild(box);
            }

          </script>

        </body>

      </html>
    `;
  }, [outputHTML, outputCSS, outputJS]);

  function loadProject(
    projectKey: ProjectKey
  ) {
    const project = projects[projectKey];

    setSelectedProject(projectKey);

    setHtml(project.html);
    setCss(project.css);
    setJs(project.js);

    setOutputHTML(project.html);
    setOutputCSS(project.css);
    setOutputJS(project.js);

    setActiveTab("html");
  }

  function runCode() {
    setOutputHTML(html);
    setOutputCSS(css);
    setOutputJS(js);
  }

  function resetCode() {
    loadProject(selectedProject);
  }

  function clearCode() {
    setHtml("");
    setCss("");
    setJs("");

    setOutputHTML("");
    setOutputCSS("");
    setOutputJS("");
  }

  function getCurrentValue() {
    if (activeTab === "html") {
      return html;
    }

    if (activeTab === "css") {
      return css;
    }

    return js;
  }

  function updateCurrentValue(
    value: string
  ) {
    if (activeTab === "html") {
      setHtml(value);
    }

    if (activeTab === "css") {
      setCss(value);
    }

    if (activeTab === "js") {
      setJs(value);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">

        <header className="mb-8">

          <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
            No account • No installation • Just code
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            T. ROMANA
            <span className="block text-zinc-400">
              CODING HUB
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Learn. Build. Experiment.
          </p>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
            AI can help you write code.
            Your job is to understand
            what you are building.
          </p>

        </header>

        <section className="mb-7">

          <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">
            Choose a starter project
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">

            {(Object.keys(projects) as ProjectKey[])
              .map((key) => {

                const project = projects[key];

                return (
                  <button
                    key={key}
                    onClick={() =>
                      loadProject(key)
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedProject === key
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-900 text-white hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-black">
                      {project.name}
                    </p>

                    <p
                      className={`mt-2 text-xs leading-5 ${
                        selectedProject === key
                          ? "text-zinc-600"
                          : "text-zinc-500"
                      }`}
                    >
                      {project.description}
                    </p>
                  </button>
                );
              })}

          </div>

        </section>

        <div className="grid gap-5 lg:grid-cols-2">

          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-3 py-3">

              <div className="flex gap-2">

                {(["html", "css", "js"] as Tab[])
                  .map((tab) => (

                    <button
                      key={tab}
                      onClick={() =>
                        setActiveTab(tab)
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                        activeTab === tab
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {tab === "html"
                        ? "HTML"
                        : tab === "css"
                        ? "CSS"
                        : "JavaScript"}
                    </button>

                  ))}

              </div>

              <span className="text-xs text-zinc-500">
                {
                  projects[selectedProject]
                    .name
                }
              </span>

            </div>

            <textarea
              value={getCurrentValue()}
              onChange={(e) =>
                updateCurrentValue(
                  e.target.value
                )
              }
              spellCheck={false}
              className="min-h-[430px] w-full resize-none bg-zinc-950 p-4 font-mono text-[13px] leading-6 text-zinc-200 outline-none sm:text-sm"
            />

            <div className="flex flex-wrap gap-2 border-t border-zinc-800 p-3">

              <button
                onClick={runCode}
                className="min-w-[140px] flex-1 rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition active:scale-[0.98]"
              >
                ▶ Run Code
              </button>

              <button
                onClick={resetCode}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-200"
              >
                Reset
              </button>

              <button
                onClick={clearCode}
                className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-400"
              >
                Clear
              </button>

            </div>

          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-white">

            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-black">

              <div>

                <p className="text-xs font-black uppercase tracking-wider">
                  Live Preview
                </p>

                <p className="text-xs text-zinc-500">
                  Your program appears here
                </p>

              </div>

              <div className="flex gap-1">

                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />

              </div>

            </div>

            <iframe
              title="Coding Preview"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="h-[560px] w-full bg-white"
            />

          </section>

        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
              Ask ChatGPT
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Try this prompt:
            </p>

            <div className="mt-3 rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-400">

              I am a beginner learning
              programming on my phone.
              Help me modify my HTML,
              CSS and JavaScript project.

              Keep everything compatible
              with a browser-only coding
              playground.

              Give HTML, CSS and
              JavaScript separately and
              explain the changes in
              simple English.

            </div>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
              Coding Challenges
            </p>

            <div className="mt-3 space-y-3">

              {challenges.map(
                (challenge, index) => (

                  <div
                    key={challenge}
                    className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                  >

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-black">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-zinc-400">
                      {challenge}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
            The Rule
          </p>

          <p className="mt-3 text-xl font-black leading-8 sm:text-2xl">
            You do not need to know
            how to build everything.
          </p>

          <p className="mt-1 text-xl font-black leading-8 text-zinc-400 sm:text-2xl">
            You need to know how to
            figure out how to build it.
          </p>

        </section>

        <footer className="py-8 text-center text-xs text-zinc-600">
          T. Romana Coding Hub • Built for learning
        </footer>

      </section>

    </main>
  );
}