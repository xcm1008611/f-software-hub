import Link from 'next/link';
import { ArrowUpRight, Compass, Globe2 } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand" aria-label="F 出海工具库首页"><span className="brand-mark" aria-hidden="true">F</span><span><strong>出海工具库</strong>{!compact && <small>跨境电商 · 外贸软件选型</small>}</span></Link>;
}
export function SiteShell({ children, active = 'home' }: { children: React.ReactNode; active?: string }) {
  return <><a className="skip-link" href="#main">跳到主要内容</a><header className="site-header"><div className="header-inner"><Brand /><nav className="site-nav" aria-label="主导航"><Link aria-current={active === 'home' ? 'page' : undefined} href="/">发现软件</Link><Link aria-current={active === 'products' ? 'page' : undefined} href="/products">产品库</Link><Link aria-current={active === 'latest' ? 'page' : undefined} href="/products?sort=latest">最新收录</Link><Link aria-current={active === 'about' ? 'page' : undefined} href="/about">关于收录</Link></nav><Link className="admin-entry" href="/admin">管理后台 <ArrowUpRight size={14}/></Link></div></header><main id="main" className="main-wrap">{children}</main><footer className="site-footer"><div><Brand compact/><p>从一个工作需求，找到一款合适的软件。</p></div><div className="footer-note"><span><Globe2 size={15}/> 专注跨境电商与外贸</span><Link href="/about">收录说明 <ArrowUpRight size={13}/></Link></div></footer></>;
}
export function EmptyState({ title = '没有找到匹配的软件', description = '试试其他关键词，或减少筛选条件。', reset = '/products' }: { title?: string; description?: string; reset?: string }) {
  return <div className="empty-state"><Compass size={30} strokeWidth={1.3}/><h2>{title}</h2><p>{description}</p><Link className="button secondary" href={reset}>浏览全部软件</Link></div>;
}
