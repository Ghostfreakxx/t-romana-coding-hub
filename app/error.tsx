"use client";
import { useEffect } from "react";
import Shell from "@/components/shell";
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("Page error:", error); }, [error]);
  return <Shell eyebrow="Something went wrong" title="Let’s try that again." intro="We could not open this section. Your saved browser data has not been deliberately removed.">
    <div className="row"><button onClick={() => retry()} className="btn">Try again</button><button onClick={() => window.location.reload()} className="btn secondary">Reload page</button></div>
    {error.digest && <p className="small muted section-gap">Error reference: {error.digest}</p>}
  </Shell>;
}
