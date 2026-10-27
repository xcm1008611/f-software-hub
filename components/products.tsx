import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, ExternalLink, Search } from 'lucide-react';
import type { Product, Category, ProductList } from '@/lib/types';
import { pricingLabels } from '@/lib/types';

export function ProductLogo({ product, large = false }: { product: Pick<Product,'name'|'logoPath'>; large?: boolean }) {
  const initial = product.name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '').slice(0, 2).toUpperCase() || 'F';
  return <span className={`product-logo${large ? ' large' : ''}`}>{product.logoPath ? <img src={product.logoPath} alt="" width={large ? 72 : 44} height={large ? 72 : 44}/> : <span aria-hidden="true">{initial}</span>}</span>;
}
export function ProductCard({ product }: { product: Product }) {
  return <article className="product-card"><div className="product-card-head"><ProductLogo product={product}/><div><Link className="product-name" href={`/products/${product.slug}`}>{product.name}</Link><p className="product-company">{product.company || product.category?.name}</p></div><ArrowUpRight className="card-arrow" size={17}/></div><p className="product-tagline">{product.tagline}</p><div className="tag-row">{product.tags.slice(0, 3).map(tag => <span key={tag} className="tag">{tag}</span>)}</div><div className="card-bottom"><span>{pricingLabels[product.pricingType]}</span><Link href={`/products/${product.slug}`} aria-label={`查看 ${product.name} 详情`}>查看详情 <ArrowRight size={13}/></Link></div></article>;
}
export function ProductGrid({ products }: { products: Product[] }) {
  return <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>;
}
export function queryHref(base: string, values: Record<string, string|undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  return `${base}${params.size ? `?${params}` : ''}`;
}
export function CategoryRail({ categories, selected, params = {}, counts = {} }: { categories: Category[]; selected?: string; params?: Record<string,string|undefined>; counts?: Record<string,number> }) {
  return <aside className="category-rail" aria-label="按工作场景浏览"><p className="rail-title">按工作场景找</p><nav><Link aria-current={!selected ? 'page' : undefined} href={queryHref('/products', {...params, category:undefined,page:undefined})}><span>全部软件</span><ArrowUpRight size={14}/></Link>{categories.map(c=><Link key={c.id} aria-current={selected === c.slug ? 'page' : undefined} href={queryHref('/products',{...params,category:c.slug,page:undefined})}><span>{c.name}</span>{counts[c.id] !== undefined ? <small>{counts[c.id]}</small> : <ArrowRight size={13}/>}</Link>)}</nav><div className="rail-note"><Check size={16}/><p>了解功能，也了解限制。<br/>软件资料附有官网来源。</p><Link href="/about">我们的收录方式 <ArrowUpRight size={12}/></Link></div></aside>;
}
export function SearchForm({ value = '', compact = false }: { value?: string; compact?: boolean }) {
  return <form action="/products" className={`search-form${compact ? ' compact' : ''}`} role="search"><label className="sr-only" htmlFor={compact ? 'compact-search':'main-search'}>搜索软件、场景或工作需求</label><Search size={20} strokeWidth={1.7}/><input id={compact ? 'compact-search':'main-search'} name="q" defaultValue={value} maxLength={100} placeholder="搜索软件、场景或工作需求"/><button type="submit">找软件 <ArrowRight size={16}/></button></form>;
}
export function Pagination({ data, params, base = '/products' }: { data: ProductList; params: Record<string,string|undefined>; base?: string }) {
  const pages = Math.ceil(data.total/data.pageSize);
  if (pages <= 1) return null;
  const visible = Array.from({length:pages},(_,i)=>i+1).filter(n=>n===1 || n===pages || Math.abs(n-data.page)<=1);
  return <nav className="pagination" aria-label="产品列表分页"><span>共 {data.total} 款 · 第 {data.page} / {pages} 页</span><div>{data.page>1 && <Link className="page-button" href={queryHref(base,{...params,page:String(data.page-1)})}>上一页</Link>}{visible.map((n,i)=><span key={n}>{i>0 && n-visible[i-1]>1 && <span className="page-gap">…</span>}<Link className={`page-button${n===data.page?' selected':''}`} aria-current={n===data.page?'page':undefined} href={queryHref(base,{...params,page:String(n)})}>{n}</Link></span>)}{data.page<pages && <Link className="page-button" href={queryHref(base,{...params,page:String(data.page+1)})}>下一页</Link>}</div></nav>;
}
export function ProductDetail({ product, preview = false }: { product: Product; preview?: boolean }) {
  return <><section className="detail-intro"><ProductLogo product={product} large/><div className="detail-title"><p>{product.category?.name || '软件资料'}{preview && ' · 管理员预览'}</p><h1>{product.name}</h1><span>{product.tagline}</span></div><a className="button primary" href={product.websiteUrl} target="_blank" rel="noopener noreferrer">访问官网 <ArrowUpRight size={16}/></a></section><div className="detail-grid"><div className="detail-content"><section className="prose-section"><h2>它能帮你做什么</h2>{product.description.split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}{product.features.length>0 && <ul className="feature-list">{product.features.map(f=><li key={f}><Check size={17}/><span>{f}</span></li>)}</ul>}</section><section className="prose-section"><h2>适合这些工作</h2>{product.useCases.length ? <ul className="use-case-list">{product.useCases.map(c=><li key={c}>{c}</li>)}</ul> : <p>可前往官网了解更具体的适用场景。</p>}</section><section className="prose-section"><h2>选择前，先了解</h2><p>{product.cautions || '请结合实际需求试用，并在官网确认当前功能、服务范围与使用条款。'}</p></section></div><aside className="detail-facts"><h2>软件信息</h2><dl><div><dt>提供方</dt><dd>{product.company || '查看官网'}</dd></div><div><dt>收费方式</dt><dd>{pricingLabels[product.pricingType]}</dd></div><div><dt>中文支持</dt><dd>{product.chinese ? '有中文资料 / 支持':'中文支持待核实'}</dd></div><div><dt>资料核对</dt><dd>{product.verifiedAt ? product.verifiedAt.slice(0,10) : '尚未标注'}</dd></div></dl>{product.pricingNote && <p className="fact-note">{product.pricingNote}</p>}<div className="tag-row">{product.tags.map(t=><span key={t} className="tag">{t}</span>)}</div><a className="source-link" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">查看官方资料来源 <ExternalLink size={13}/></a><p className="source-disclaimer">根据官方公开资料整理。功能、价格与服务范围可能变化，请以官网为准。</p></aside></div></>;
}
