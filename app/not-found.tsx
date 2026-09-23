import Link from 'next/link';
import Shell from '@/components/shell';
export default function NotFound(){return <Shell eyebrow="404" title="This page is not here." intro="The link may have changed. Choose a lab from the navigation or return to the hub."><Link href="/" className="btn">Back to the hub</Link></Shell>}
