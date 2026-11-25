# T. Romana Skills Hub

T. Romana Skills Hub is a browser-first learning site for Govt. T. Romana College students. It combines a coding playground with a college syllabus navigator, prepared TRC study guides, practical skills, reasoning practice, driving theory and electrical-safety lessons.

## What is included

- Coding Studio with seven starters, eight auto-checked coding challenges (HTML, CSS and JavaScript, each with hints and tests that click and type in the sandboxed preview), live preview and Ctrl/Cmd+Enter to run, a CodeMirror editor, up to 16 locally saved projects, responsive preview sizes, a console, image embedding, project backups and HTML exports. Previous Coding Lab drafts remain recoverable.
- College Hub with the supplied MZU course catalogue for Political Science, Sociology, Public Administration, History, English, Education, Economics and Value Added Courses. Save your own semester so the hub opens there; each paper shows how many of its note topics you have revised (matched by paper code), links to the next topic and to its past questions, and takes an exam date. The exam planner counts down and works out how many topics to revise per day.
- Notes Library with the prepared TRC Batch 1, Batch 2, Batch 3 and VAC DOCX guides.
- Read all the guides inside the College Hub or on individual guide pages, with topic search, short/long note filters and optional downloads. Each topic can be read aloud (browser speech, adjustable speed), given your own note, or turned into a spaced-repetition revision card in the Study Lab’s “From the Notes library” notebook.
- Official syllabus PDFs supplied for Political Science, Sociology, Public Administration, History, English, Education and VAC.
- PDF Study Lab with local-only PDF reading, notebook saving, revision cards with spaced-repetition review (cards return after 1, 3, 7, 14, 30 and 60 days; forgotten cards return the same day), a Pomodoro focus timer and backups.
- Reasoning, Basic Skills, Driving and Electrical learning paths with practice questions and explanations. The Reasoning gym also generates unlimited questions across ten aptitude topics with worked answers, a timed 10-question speed round and saved per-topic accuracy.
- Site-wide search (press `/` or Ctrl/Cmd+K, or tap Search) across labs, lessons, MZU courses, question-bank papers, guides and every note topic. Results link straight to the course, paper or note section.
- A study streak on the home page and a 20-week study calendar on My progress. A day counts when the student saves something on the hub (a revised topic, lesson, quiz, project or note); opening pages or changing reader settings does not count.
- A compact menu on phones instead of a sideways-scrolling link strip.
- Question Bank extras: tick “I can answer this” on likely questions (progress per paper), a “Related note” link from each question to the closest note topic, search across every past question in a subject, and a timed practice test with answer outlines and self-marking.
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

- Driving: five 1.2 km courses (including a mountain pass whose hairpin bends push a fast car wide, and a school zone with a zebra crossing, walking pedestrians and a school gate) rendered with Three.js/WebGL2, moving cars, trees, buildings, curved roads, optional shadows, chase/driver cameras and day/rain/night lighting. Touch wheel, direction buttons and pedals support multiple pointers. Stop/speed checkpoints, braking distance, score feedback and saved best results give practice a purpose. Turn indicators (buttons or Q/E) are checked on every lane change, a live gap readout coaches the two-second following rule, and a synthesized engine, indicator ticks and horn can be switched off. A 2D canvas view is available when 3D initialization fails. This is an arcade model, not realistic vehicle training. Balanced graphics limits pixel density; detailed mode adds shadows. Physical phone testing is still needed across devices.
- Basic Skills: guitar (13 chords, a metronome-paced chord-change trainer with seven common progressions, and reference notes for tuning a real guitar), piano and drum pads with lessons; a piano song trainer (public-domain melodies with the next key highlighted) and an ear trainer; a six-drum, 16-step beat sequencer with starter grooves, swing, per-track mute, audio-clock timing, melody and bass piano rolls in a pentatonic scale (key, mood and a “surprise me” melody), WAV export of four loops and pattern import/export; touch-typing lessons (home row to numbers and sentences) with an on-screen keyboard showing the next key and finger, a timer that starts on the first key, saved personal bests and history, and drills built from your own trouble keys; a small spreadsheet with safe formula evaluation; and email rehearsal that never sends mail. Sound starts after a user gesture and stops when its workspace is unmounted. No microphone is used.
- Electrical: an interactive series/parallel circuit workbench, a “predict before you measure” Ohm’s-law game with worked answers, a resistor colour-code trainer (read or paint the bands, E12 values), virtual voltage probes, branch readings, three experiments with verification and downloadable observations. Nine battery-appliance cases retain simulated diagnostics and locally saved completion. It does not teach mains repair.
- PDF decoder: PDF.js extracts searchable text locally. Tools: search the whole PDF with highlighted matches, a heading outline, a multiple-choice quiz made from key sentences (missed questions can become revision cards), page read-aloud and word count / reading time. The decoder selects key source sentences, finds terms in context and builds cloze recall cards with page numbers. Outputs can be added to existing notebooks or downloaded as text. It is extractive summarization, not generative AI, and does not perform OCR. Limits: 25 MB, 250 pages, 2 million extracted characters.

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
