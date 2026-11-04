import type { Metadata } from "next";
import Shell from "@/components/shell";
import QuestionBank from "@/components/question-bank";

export const metadata: Metadata = { title: "Question Bank", description: "Past MZU undergraduate semester exam questions, with repeated questions and probable-question lists." };

export default function QuestionsPage() {
  return <Shell eyebrow="MZU question bank" title="Past exam questions, sorted for you." intro="See which questions MZU has already asked in your papers, how often and in which years. Study the repeated ones first, then practise with full past papers.">
    <p className="notice">Built from past papers collected from Govt. Hrangbana College and MZU: CBCS exams from 2022, 2023, 2025 and 2026, and NEP 2020 exams from 2025 and 2026. A question counts as repeated when the same or very similar question appeared in two or more exams. Every original paper can be downloaded as a PDF. The syllabus changes over time, so always check your current syllabus.</p>
    <div className="section-gap" />
    <QuestionBank />
  </Shell>;
}
