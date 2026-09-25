# T. Romana Skills Hub

T. Romana Skills Hub is a browser-first learning site for Govt. T. Romana College students. It combines a coding playground with a college syllabus navigator, prepared TRC study guides, practical skills, reasoning practice, driving theory and electrical-safety lessons.

## What is included

- Coding Studio with seven starters, a CodeMirror editor, up to 16 locally saved projects, responsive preview sizes, a console, image embedding, project backups and HTML exports. Previous Coding Lab drafts remain recoverable.
- College Hub with the supplied MZU course catalogue for Political Science, Sociology, Public Administration, History, English, Education, Economics and Value Added Courses.
- Notes Library with the prepared TRC Batch 1, Batch 2, Batch 3 and VAC DOCX guides.
- Read all 24 guides inside the College Hub or on individual guide pages, with topic search, short/long note filters and optional downloads.
- Official syllabus PDFs supplied for Political Science, Sociology, Public Administration, History, English, Education and VAC.
- PDF Study Lab with local-only PDF reading, notebook saving, revision cards and backups.
- Reasoning, Basic Skills, Driving and Electrical learning paths with practice questions and explanations.
- Browser-only progress tracking with downloadable backups. No account or server database is required.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Before committing changes, run:

```bash
npm run lint
npm run test:labs
npm run build
```

Notes, syllabus PDFs and progress files are study resources. Students should confirm current course coverage and examination instructions with their department and teachers.

## College branding and online notes

The college masthead image is copied unchanged from https://trcollege.edu.in/images/logo.png, linked from the official college homepage (retrieved 23 September 2026). Its original proportions and wording are retained. The Mizo language message below it belongs to this learning hub.

Online note JSON is extracted from the existing DOCX guides; it does not introduce new study content. After changing a guide or its entry in `data/notes.ts`, regenerate the reader files with `python scripts/build-note-readers.py`. The extraction preserves paragraph text, heading context and tables.

## Interactive labs

- Driving: three 1.2 km courses rendered with Three.js/WebGL2, moving cars, trees, buildings, curved roads, optional shadows, chase/driver cameras and day/rain/night lighting. Touch wheel, direction buttons and pedals support multiple pointers. Stop/speed checkpoints, braking distance, score feedback and saved best results give practice a purpose. A 2D canvas view is available when 3D initialization fails. This is an arcade model, not realistic vehicle training. Balanced graphics limits pixel density; detailed mode adds shadows. Physical phone testing is still needed across devices.
- Basic Skills: guitar, piano and drum pads with lessons; a four-track, 16-step beat sequencer with pattern import/export; typing practice; a small spreadsheet with safe formula evaluation; and email rehearsal that never sends mail. Sound starts after a user gesture and stops when its workspace is unmounted. No microphone is used.
- Electrical: an interactive series/parallel circuit workbench, virtual voltage probes, branch readings, three experiments with verification and downloadable observations. Nine battery-appliance cases retain simulated diagnostics and locally saved completion. It does not teach mains repair.
- PDF decoder: PDF.js extracts searchable text locally. The decoder selects key source sentences, finds terms in context and builds cloze recall cards with page numbers. Outputs can be added to existing notebooks or downloaded as text. It is extractive summarization, not generative AI, and does not perform OCR. Limits: 25 MB, 250 pages, 2 million extracted characters.

`predev` and `prebuild` copy PDF.js worker, character maps and font assets from the installed package to `public/pdfjs`. These generated assets are ignored by Git and ESLint and must be regenerated when the dependency changes. Run the npm scripts rather than invoking `next build` directly.

## Using a student's own AI

The Coding Studio provides a prompt builder and a reviewed code-import workflow. A student copies a brief to their own ChatGPT, Gemini or other AI chat, then pastes the response back. There is no built-in model, paid API requirement, credential collection, automatic transmission or promise of unlimited AI. Current-code inclusion is opt-in. The interface links to ChatGPT and Gemini; their accounts and limits apply. Official references checked September 2026: https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq and https://support.google.com/gemini/answer/16275805.

The studio runs plain HTML/CSS/JavaScript front-end projects, not npm, Python, databases, payments or backend services. Preview uses an opaque-origin `sandbox="allow-scripts"` iframe plus restrictive CSP. Network resources and browser storage are unavailable there. Console messages are bounded and accepted only from the active preview window/channel. Imported code is staged for review, never automatically executed. Downloaded HTML runs outside the hub's sandbox. Student projects are not automatically published.

`test:labs` verifies calculation correctness, checkpoint transitions, project validation and AI-response parsing. It is not a browser/device compatibility test.
