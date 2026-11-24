import type { Code } from "@/lib/code";

/** Checks run in order on the same page, so later checks see the clicks made by earlier ones. A check runs inside the sandboxed preview after the student's code. `run` is the body of an async function returning true or false. */
export type ChallengeTest = { name: string; hint: string; run: string };
export type Challenge = { id: string; title: string; level: "HTML" | "CSS" | "JavaScript"; goal: string; steps: string[]; starter: Code; tests: ChallengeTest[] };

const $ = (sel: string) => `document.querySelector(${JSON.stringify(sel)})`;
const text = (sel: string) => `((${$(sel)}||{}).textContent||"").trim()`;
const setValue = (sel: string, value: string) => `{const el=${$(sel)};el.value=${JSON.stringify(value)};el.dispatchEvent(new Event("input",{bubbles:true}));}`;

export const challenges: Challenge[] = [
  {
    id: "hello", title: "Say hello", level: "HTML",
    goal: "Introduce yourself with a heading and a short paragraph.",
    steps: ["Change the h1 to your own name.", "Add a <p> under it with at least five words about you."],
    starter: { html: "<h1>Your name</h1>\n<!-- Add a paragraph below this line -->\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; }\n", js: "" },
    tests: [
      { name: "The page has an h1 heading", hint: "Keep the <h1> … </h1> tags.", run: `return !!${$("h1")};` },
      { name: "The heading shows your name", hint: "Replace “Your name” with your real or nickname.", run: `const t=${text("h1")};return t.length>1&&t.toLowerCase()!=="your name";` },
      { name: "A paragraph with at least five words", hint: "Write <p>I study … at T. Romana College.</p>", run: `const p=${$("p")};return !!p&&p.textContent.trim().split(/\\s+/).length>=5;` },
    ],
  },
  {
    id: "style", title: "Give it style", level: "CSS",
    goal: "Use CSS to colour the page and centre the heading.",
    steps: ["Give body a background colour.", "Give h1 a text colour.", "Centre the h1 with text-align."],
    starter: { html: "<h1>Welcome to my page</h1>\n<p>CSS decides how things look.</p>\n", css: "body {\n  font-family: system-ui, sans-serif;\n}\n\nh1 {\n\n}\n", js: "" },
    tests: [
      { name: "The body has a background colour", hint: "Inside body { } add background: #e8f5e9; (any colour except white).", run: `const c=getComputedStyle(document.body).backgroundColor;return c!=="rgba(0, 0, 0, 0)"&&c!=="rgb(255, 255, 255)";` },
      { name: "The heading has its own colour", hint: "Inside h1 { } add color: darkgreen;", run: `return getComputedStyle(${$("h1")}).color!=="rgb(0, 0, 0)";` },
      { name: "The heading is centred", hint: "Inside h1 { } add text-align: center;", run: `return getComputedStyle(${$("h1")}).textAlign==="center";` },
    ],
  },
  {
    id: "list", title: "Lists and links", level: "HTML",
    goal: "Make a list of your favourite foods and a link to a website you like.",
    steps: ["Inside the <ul>, add at least three <li> items.", "Add an <a href=\"https://…\"> link with clear link text."],
    starter: { html: "<h1>My favourites</h1>\n<ul>\n  \n</ul>\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; }\n", js: "" },
    tests: [
      { name: "At least three list items", hint: "Each item goes in <li>…</li> inside the <ul>.", run: `return document.querySelectorAll("ul li").length>=3;` },
      { name: "No empty list items", hint: "Write something inside every <li>.", run: `return [...document.querySelectorAll("li")].every(li=>li.textContent.trim().length>0);` },
      { name: "A link with an address and text", hint: "Example: <a href=\"https://trcollege.edu.in\">Our college</a>", run: `const a=${$("a[href]")};return !!a&&/^https?:\\/\\//.test(a.getAttribute("href"))&&a.textContent.trim().length>2;` },
    ],
  },
  {
    id: "counter", title: "Click counter", level: "JavaScript",
    goal: "Make the button add one to the number every time it is clicked.",
    steps: ["Select the button and the number with document.querySelector.", "Listen for the “click” event.", "Add 1 to a count variable and show it in #count."],
    starter: { html: "<h1>Cups of tea today: <span id=\"count\">0</span></h1>\n<button id=\"add\">Add one</button>\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; }\nbutton { font-size: 18px; padding: 10px 18px; }\n", js: "// 1. Select #add and #count\n// 2. Make a variable: let count = 0;\n// 3. On click: count = count + 1; then show it\n" },
    tests: [
      { name: "The number starts at 0", hint: "Keep <span id=\"count\">0</span> in the HTML.", run: `return ${text("#count")}==="0";` },
      { name: "One click shows 1", hint: "Use button.addEventListener(\"click\", () => { … }).", run: `${$("#add")}.click();return ${text("#count")}==="1";` },
      { name: "Two more clicks show 3", hint: "Change the variable, then set countEl.textContent = count.", run: `${$("#add")}.click();${$("#add")}.click();return ${text("#count")}==="3";` },
    ],
  },
  {
    id: "greeting", title: "Greeting machine", level: "JavaScript",
    goal: "Greet whoever types their name, and help people who forget to type one.",
    steps: ["When #greet is clicked, read the value of #name.", "Show “Hello, NAME!” in #message.", "If the box is empty, show a message asking for a name instead."],
    starter: { html: "<label for=\"name\">Your name</label>\n<input id=\"name\">\n<button id=\"greet\">Greet me</button>\n<p id=\"message\"></p>\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; }\n", js: "const input = document.querySelector(\"#name\");\nconst button = document.querySelector(\"#greet\");\nconst message = document.querySelector(\"#message\");\n\n// Your code here\n" },
    tests: [
      { name: "Greets the name that was typed", hint: "message.textContent = `Hello, ${input.value}!`;", run: `${setValue("#name", "Mawii")}${$("#greet")}.click();return ${text("#message")}.includes("Mawii");` },
      { name: "Uses the latest name", hint: "Read input.value inside the click listener, not before it.", run: `${setValue("#name", "Lalthan")}${$("#greet")}.click();return ${text("#message")}.includes("Lalthan");` },
      { name: "Helps when the box is empty", hint: "if (input.value.trim() === \"\") { message.textContent = \"Please type your name.\"; }", run: `${setValue("#name", "  ")}${$("#greet")}.click();const t=${text("#message")};return t.length>0&&!/hello,?\\s*!?$/i.test(t);` },
    ],
  },
  {
    id: "theme", title: "Dark mode switch", level: "JavaScript",
    goal: "A button that switches the page between light and dark.",
    steps: ["Write a body.dark rule in CSS with a dark background and light text.", "On click of #theme, toggle the “dark” class on document.body."],
    starter: { html: "<h1>Night reader</h1>\n<p>Some people like to read with a dark background.</p>\n<button id=\"theme\">Switch theme</button>\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; background: white; color: #222; }\n\n/* Add a body.dark rule here */\n", js: "// Use document.body.classList.toggle(\"dark\")\n" },
    tests: [
      { name: "Clicking adds the dark class", hint: "document.querySelector(\"#theme\").addEventListener(\"click\", …)", run: `${$("#theme")}.click();return document.body.classList.contains("dark");` },
      { name: "Clicking again removes it", hint: "Use classList.toggle, which adds or removes.", run: `${$("#theme")}.click();return !document.body.classList.contains("dark");` },
      { name: "Dark mode really looks different", hint: "Add body.dark { background: #111; color: #eee; }", run: `const before=getComputedStyle(document.body).backgroundColor;document.body.classList.add("dark");const after=getComputedStyle(document.body).backgroundColor;document.body.classList.remove("dark");return before!==after;` },
    ],
  },
  {
    id: "array", title: "Lists from data", level: "JavaScript",
    goal: "Turn a JavaScript array into list items on the page.",
    steps: ["Put at least four subject names in the subjects array.", "Loop over the array with for…of or forEach.", "For each one, create an <li>, set its text and append it to #subjects."],
    starter: { html: "<h1>My subjects</h1>\n<ul id=\"subjects\"></ul>\n<p id=\"total\"></p>\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; }\n", js: "const subjects = [\"Political Science\"];\nconst list = document.querySelector(\"#subjects\");\n\n// Loop and add an <li> for each subject\n\n// Bonus: show \"4 subjects\" in #total\n" },
    tests: [
      { name: "At least four subjects appear", hint: "Add more names to the array, then loop over it.", run: `return document.querySelectorAll("#subjects li").length>=4;` },
      { name: "The list is built by JavaScript", hint: "Keep <ul id=\"subjects\"></ul> empty in the HTML and create the items with document.createElement(\"li\").", run: `return typeof subjects!=="undefined"&&Array.isArray(subjects)&&document.querySelectorAll("#subjects li").length===subjects.length;` },
      { name: "Bonus: #total shows the count", hint: "total.textContent = subjects.length + \" subjects\";", run: `return typeof subjects!=="undefined"&&${text("#total")}.includes(String(subjects.length));` },
    ],
  },
  {
    id: "tip", title: "Restaurant tip calculator", level: "JavaScript",
    goal: "Work out the tip for a bill and show it with two decimal places.",
    steps: ["Read #bill and #percent as numbers (Number(input.value)).", "tip = bill × percent ÷ 100.", "Show it in #tip with tip.toFixed(2)."],
    starter: { html: "<h1>Tip calculator</h1>\n<label>Bill (₹) <input id=\"bill\" type=\"number\" value=\"500\"></label>\n<label>Tip % <input id=\"percent\" type=\"number\" value=\"10\"></label>\n<button id=\"calc\">Calculate</button>\n<p>Tip: ₹<span id=\"tip\">0.00</span></p>\n", css: "body { font-family: system-ui, sans-serif; padding: 24px; }\nlabel { display: block; margin: 8px 0; }\n", js: "// Calculate when #calc is clicked\n" },
    tests: [
      { name: "₹200 at 10 % gives ₹20.00", hint: "Remember Number() — input values are text.", run: `${setValue("#bill", "200")}${setValue("#percent", "10")}${$("#calc")}.click();return ${text("#tip")}==="20.00";` },
      { name: "₹375 at 15 % gives ₹56.25", hint: "375 × 15 ÷ 100 = 56.25", run: `${setValue("#bill", "375")}${setValue("#percent", "15")}${$("#calc")}.click();return ${text("#tip")}==="56.25";` },
      { name: "Always two decimal places", hint: "Use tip.toFixed(2) so 30 shows as 30.00.", run: `${setValue("#bill", "300")}${setValue("#percent", "10")}${$("#calc")}.click();return ${text("#tip")}==="30.00";` },
    ],
  },
];
