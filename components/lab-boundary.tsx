"use client";
import { useEffect } from "react";
import { catchError, type ErrorInfo } from "next/error";

function Report({ name, error }: { name: string; error: unknown }) {
  // Keeps the real cause in the browser console for debugging; students see a plain message.
  useEffect(() => { console.error(`[${name}] crashed:`, error); }, [name, error]);
  return null;
}

function LabFallback({ name }: { name: string }, { error, retry }: ErrorInfo) {
  const digest = error && typeof error === "object" && "digest" in error && typeof error.digest === "string" ? error.digest : "";
  return <section className="panel" role="alert">
    <Report name={name} error={error} />
    <p className="eyebrow">{name} stopped</p>
    <h2>This tool hit a problem.</h2>
    <p>The rest of the page still works, and your saved browser data has not been removed. Try again, or reload the page if it keeps happening.</p>
    <div className="row section-gap">
      <button className="btn" onClick={() => retry()}>Try again</button>
      <button className="btn secondary" onClick={() => window.location.reload()}>Reload page</button>
    </div>
    {digest && <p className="small muted section-gap">Error reference: {digest}</p>}
  </section>;
}

/** Wrap a heavy interactive lab so one crash does not take down the lessons and quiz around it. */
const LabBoundary = catchError(LabFallback);
export default LabBoundary;
