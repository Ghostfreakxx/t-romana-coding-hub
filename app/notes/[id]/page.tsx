import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/shell";
import NoteReader from "@/components/note-reader";
import { noteResources } from "@/data/notes";

export const dynamicParams = false;

export function generateStaticParams() {
  return noteResources.map(note => ({ id: note.id }));
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = noteResources.find(resource => resource.id === id);
  if (!note) notFound();
  return <Shell eyebrow="College study notes" title={note.label} intro={note.semesters}>
    <div className="row"><Link className="btn secondary" href="/college">Back to College</Link><Link className="btn secondary" href="/notes">All study guides</Link></div>
    <NoteReader resources={[note]} />
  </Shell>;
}
