export type NoteResource = {
  id: string;
  department: string;
  label: string;
  semesters: string;
  file: string;
  format: "docx";
};

export type SyllabusResource = {
  department: string;
  label: string;
  file: string;
};

export const noteResources: NoteResource[] = [
  { id: "political-science-1", department: "political-science", label: "Political Science Batch 1", semesters: "Semesters I and II", file: "/notes/political-science-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "political-science-2", department: "political-science", label: "Political Science Batch 2", semesters: "Semesters III and IV", file: "/notes/political-science-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "political-science-3", department: "political-science", label: "Political Science Batch 3", semesters: "Semesters V and VI", file: "/notes/political-science-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "sociology-1", department: "sociology", label: "Sociology Batch 1", semesters: "Semesters I and II", file: "/notes/sociology-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "sociology-2", department: "sociology", label: "Sociology Batch 2", semesters: "Semesters III and IV", file: "/notes/sociology-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "sociology-3", department: "sociology", label: "Sociology Batch 3", semesters: "Semesters V and VI", file: "/notes/sociology-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "public-administration-1", department: "public-administration", label: "Public Administration Batch 1", semesters: "Semesters I and II", file: "/notes/public-administration-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "public-administration-2", department: "public-administration", label: "Public Administration Batch 2", semesters: "Semesters III and IV", file: "/notes/public-administration-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "public-administration-3", department: "public-administration", label: "Public Administration Batch 3", semesters: "Semesters V and VI", file: "/notes/public-administration-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "history-1", department: "history", label: "History Batch 1", semesters: "Semesters I and II", file: "/notes/history-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "history-2", department: "history", label: "History Batch 2", semesters: "Semesters III and IV", file: "/notes/history-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "history-3", department: "history", label: "History Batch 3", semesters: "Semesters V and VI", file: "/notes/history-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "english-1", department: "english", label: "English Batch 1", semesters: "Semesters I and II", file: "/notes/english-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "english-2", department: "english", label: "English Batch 2", semesters: "Semesters III and IV", file: "/notes/english-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "english-3", department: "english", label: "English Batch 3", semesters: "Semesters V and VI", file: "/notes/english-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "education-1", department: "education", label: "Education Batch 1", semesters: "Semesters I and II", file: "/notes/education-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "education-2", department: "education", label: "Education Batch 2", semesters: "Semesters III and IV", file: "/notes/education-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "education-3", department: "education", label: "Education Batch 3", semesters: "Semesters V and VI", file: "/notes/education-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "economics-1", department: "economics", label: "Economics Batch 1", semesters: "Semesters I and II", file: "/notes/economics-batch-1-semester-i-ii-trc-notes.docx", format: "docx" },
  { id: "economics-2", department: "economics", label: "Economics Batch 2", semesters: "Semesters III and IV", file: "/notes/economics-batch-2-semester-iii-iv-trc-notes.docx", format: "docx" },
  { id: "economics-3", department: "economics", label: "Economics Batch 3", semesters: "Semesters V and VI", file: "/notes/economics-batch-3-semester-v-vi-trc-notes.docx", format: "docx" },
  { id: "vac-1", department: "vac", label: "VAC 101 Notes", semesters: "Universal Human Values", file: "/notes/vac-batch-1-vac101-universal-human-values-trc-notes.docx", format: "docx" },
  { id: "vac-2", department: "vac", label: "VAC 102 Notes", semesters: "Understanding India", file: "/notes/vac-batch-2-vac102-understanding-india-trc-notes.docx", format: "docx" },
  { id: "vac-3", department: "vac", label: "VAC 103 Notes", semesters: "Environmental Science", file: "/notes/vac-batch-3-vac103-environmental-science-trc-notes.docx", format: "docx" },
];

export const syllabusResources: SyllabusResource[] = [
  { department: "political-science", label: "Political Science syllabus", file: "/syllabus/political-science-docx.pdf" },
  { department: "sociology", label: "Sociology syllabus", file: "/syllabus/sociology-docx.pdf" },
  { department: "public-administration", label: "Public Administration syllabus", file: "/syllabus/public-administration-docx.pdf" },
  { department: "history", label: "History syllabus", file: "/syllabus/history-docx.pdf" },
  { department: "english", label: "English syllabus", file: "/syllabus/english-docx.pdf" },
  { department: "education", label: "Education syllabus", file: "/syllabus/education-docx.pdf" },
  { department: "vac", label: "Value Added Course syllabus", file: "/syllabus/value-added-course-syllabus.pdf" },
];

export function notesForDepartment(department: string) {
  return noteResources.filter((resource) => resource.department === department);
}
