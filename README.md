# T. Romana Skills Hub

T. Romana Skills Hub is a browser-first learning site for Govt. T. Romana College students. It combines a coding playground with a college syllabus navigator, prepared TRC study guides, practical skills, reasoning practice, driving theory and electrical-safety lessons.

## What is included

- Coding Lab with HTML, CSS and JavaScript starter projects, sandboxed live preview, local saving and project export/import.
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
npm run build
```

Notes, syllabus PDFs and progress files are study resources. Students should confirm current course coverage and examination instructions with their department and teachers.

## College branding and online notes

The college masthead image is copied unchanged from https://trcollege.edu.in/images/logo.png, linked from the official college homepage (retrieved 23 September 2026). Its original proportions and wording are retained. The Mizo language message below it belongs to this learning hub.

Online note JSON is extracted from the existing DOCX guides; it does not introduce new study content. After changing a guide or its entry in `data/notes.ts`, regenerate the reader files with `python scripts/build-note-readers.py`. The extraction preserves paragraph text, heading context and tables.
