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
npm run test:pwa
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

## Installable app and offline behaviour

Open `/install` for iPhone/iPad, Android and desktop installation instructions. The web manifest uses standalone display, stable app identity and launch shortcuts. PNG icons (192, 512, Apple 180 and a padded maskable icon) reuse the college crest from the existing official masthead. `prepare-pwa.mjs` creates these assets and a versioned worker during predev/prebuild; do not edit the generated files.

The worker registers in production only. It keeps the home shell, recently opened HTML pages, loaded Next static assets, branding and online note JSON. It never caches POST, cross-origin requests, API responses or Next RSC responses as documents. PDF/DOCX downloads and external AI are not offline bundles. Availability depends on prior loading and browser storage; this is not a guarantee that every feature works offline.

Online document navigation checks the network first and falls back to saved HTML or the offline guide. Hashed JS/CSS are cache-first. Page/asset/note caches are bounded. A content hash rotates cache names between releases. Updates wait for the student's **Reload to update** action and do not force a reload. Existing local study data is separate from these caches.

`test:pwa` exercises offline navigation, uncached fallbacks, asset reuse with deployment query strings, RSC/API/cross-origin exclusions, server-error recovery, cache cleanup, explicit activation and icon dimensions. `npm ci --dry-run --offline` checks package-lock consistency.

Visual refinements include instanced road scenery to reduce GPU draw calls, procedural asphalt, rounded car bodies, rotating wheels, roadside lamps, route thumbnails, a route map and speed dial. The compatibility canvas follows the selected course and shows checkpoints. Context loss pauses driving and selects the compatibility view. Music gains an acoustic guitar illustration, layered piano keys, drum skins/cymbal surfaces and simultaneous note highlights. Guitar timers are cleaned up, shortcuts respect editing controls, and music suspends when hidden. The electrical bench has clickable and keyboard-operable probe points, resistor colour bands matching the chosen values, a meter face and drawn appliance parts.

Device checks still needed: real iPhone/Android install flow, storage eviction, touch combinations and GPU rendering/performance. The cloud test browser disables WebGL; the compatibility view can be verified there. PWA implementation references: https://nextjs.org/docs/app/guides/progressive-web-apps and https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable.
