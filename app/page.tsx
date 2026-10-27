import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SiteShell, EmptyState } from '@/components/site-shell';
import { ProductGrid, CategoryRail, SearchForm, ProductLogo } from '@/components/products';
import { listProducts } from '@/lib/store';
export const dynamic = 'force-dynamic';
export default function HomePage() {
  const data = listProducts({pageSize:100});
  const recommended = data.products.filter(p=>p.featured).slice(0,6);
  const featured = recommended.length ? recommended : data.products.slice(0,6);
  const latest = listProducts({sort:'latest',pageSize:6}).products;
  return <SiteShell><section className="discovery-intro"><div className="intro-top"><div><h1>为出海生意，找到合适的软件</h1><p>从选品、获客到履约，少一点试错，多一点合适。</p></div><div className="catalog-summary"><strong>{data.total}</strong><span>款软件，按工作场景整理</span></div></div><SearchForm/><div className="quick-search"><span>从需求开始</span>{['图片','CRM','独立站','ERP'].map(q=><Link key={q} href={`/products?q=${encodeURIComponent(q)}`}>{q} <ArrowUpRight size={12}/></Link>)}</div></section><div className="directory-layout"><CategoryRail categories={data.categories}/><div className="directory-content"><section><div className="section-heading"><div><h2>值得先了解</h2><p>从日常出海工作中常用的工具开始。</p></div><Link href="/products">全部软件 <ArrowRight size={15}/></Link></div>{featured.length ? <ProductGrid products={featured}/> : <EmptyState title="产品库正在整理" description="完成收录后，软件会在这里展示。"/>}</section><section className="latest-section"><div className="section-heading"><div><h2>最新收录</h2><p>刚加入工具库的软件，留给下一次选择。</p></div><Link href="/products?sort=latest">查看全部 <ArrowRight size={15}/></Link></div><div className="latest-grid">{latest.map(p=><Link href={`/products/${p.slug}`} key={p.id} className="latest-product"><ProductLogo product={p}/><div><strong>{p.name}</strong><span>{p.tagline}</span></div><ArrowUpRight size={16}/></Link>)}</div></section></div></div><section className="closing-note"><div><h2>好工具，应该和你的工作对得上。</h2><p>我们整理用途、收费方式和使用限制，让选择有据可依。</p></div><Link href="/about">了解收录标准 <ArrowRight size={16}/></Link></section></SiteShell>;
}
