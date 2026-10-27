import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
export default function NotFound(){return <SiteShell><div className="empty-state not-found"><h1>这个页面暂时不可用</h1><p>产品可能尚未上架、已下架，或链接已发生变化。</p><Link className="button primary" href="/products">返回产品库</Link></div></SiteShell>}
