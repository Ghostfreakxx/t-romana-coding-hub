# MZU Question Bank data

`papers.json` holds every BA question paper extracted from the uploads in `OLD QUESTION COLLEGE/`
(PDFs and the Google Drive ZIP exports): subject, scheme (CBCS / NEP), year, semester, paper code,
title and the questions of each section (A objective, B short answer, C long answer).

The site reads the generated files in `public/question-bank/` (one per subject plus `index.json`).

## Adding more papers

1. Upload the new PDFs or ZIPs into `OLD QUESTION COLLEGE/`.
2. Make sure `pdftotext` (poppler-utils) and `tesseract` (tesseract-ocr) are installed. Scanned papers are read with OCR,
   which is cached in `.cache/qbank-ocr/` (not committed).
3. Run `npm run qbank`. This re-extracts `papers.json` and rebuilds the repeated-question data.

Only the hub's subjects are kept: Political Science, Sociology, Public Administration, History, English, Education,
Economics and the Value Added Courses. Add a subject in `KEEP` (scripts/extract-question-papers.py) and `NAMES`
(scripts/build-question-bank.py) to include more, such as Geography or Psychology.

A question counts as repeated when the same or a very similar question (same key words) appears in two or more
exams of the same paper. Exams are grouped by paper title, so a paper that moved between CBCS and NEP is kept together.

## Guess papers (next-exam predictions)

`scripts/build-question-bank.py` also writes a guess paper for every paper (`forecast` in each subject file):
the five most likely questions and, for each unit, two long and two short guesses (MZU papers give an OR choice).

Questions are ranked by how many past exams asked them, with extra weight for long answers and for questions asked
as both short and long. Near-duplicate guesses are skipped.

The method is checked every time the data is rebuilt: for each paper with exams from two or more years, the latest exam is
hidden, guessed from the earlier ones, and the result is stored in `public/question-bank/index.json` (`forecast`).
With the current 313 papers: about 37% of the top-5 guesses came in the hidden exam, against 21% for a random past
question. Labels are calibrated the same way: a long answer asked 3+ times came about 62% of the time ("High chance"),
a long answer asked twice about 41% ("Good chance"), anything else about 17% ("Possible").
