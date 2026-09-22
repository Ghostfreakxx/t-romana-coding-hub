"use client";
import Shell from '@/components/shell';
export default function ErrorPage({reset}:{reset:()=>void}){return <Shell eyebrow="Something went wrong" title="Let’s try that again." intro="We could not open this section. Your saved browser data has not been deliberately removed."><button onClick={reset} className="btn">Try again</button></Shell>}
