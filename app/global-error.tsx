"use client";
import { useEffect } from "react";
// Replaces the root layout when it fails, so global styles are not available here.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("App error:", error); }, [error]);
  const button = { padding: "12px 18px", borderRadius: 10, border: "1px solid #b8d4a0", background: "#d6ef91", color: "#10241f", fontWeight: 700, cursor: "pointer", marginRight: 10 } as const;
  return <html lang="en"><body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f2420", color: "#eef4ea", fontFamily: "system-ui, sans-serif", padding: 24 }}>
    <title>Something went wrong | T. Romana Skills Hub</title>
    <main style={{ maxWidth: 520 }}>
      <p style={{ letterSpacing: 2, fontSize: 12, opacity: .7 }}>T. ROMANA SKILLS HUB</p>
      <h1>The hub could not start.</h1>
      <p>Your notes and progress are stored in this browser and have not been removed. Try again, or reload the page.</p>
      <button style={button} onClick={() => retry()}>Try again</button>
      <button style={{ ...button, background: "transparent", color: "#eef4ea" }} onClick={() => window.location.reload()}>Reload page</button>
      {error.digest && <p style={{ fontSize: 12, opacity: .6 }}>Error reference: {error.digest}</p>}
    </main>
  </body></html>;
}
