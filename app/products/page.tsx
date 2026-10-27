import Link from 'next/link';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SiteShell, EmptyState } from '@/components/site-shell';
import { ProductGrid, CategoryRail, Pagination, queryHref } from '@/components/products';
import { listProducts } from '@/lib/store';
import { pricingLabels, type PricingType } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const metadata = {title:'产品库'};
export default async function ProductsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])) as Record<string,string|undefined>;
  const pricing = params.pricing && Object.hasOwn(pricingLabels,params.pricing) ? params.pricing as PricingType : undefined;
  const data = listProducts({q:params.q,category:params.category,chinese:params.chinese==='1',pricing,sort:params.sort==='latest'?'latest':'recommended',page:Math.max(1,Number(params.page)||1),pageSize:12});
  const selected = data.categories.find(c=>c.slug===params.category);
  const title = params.q ? `搜索“${params.q.slice(0,30)}”` : selected?.name || (params.sort==='latest'?'最新收录':'产品库');
  return <SiteShell active={params.sort==='latest'?'latest':'products'}><div className="page-heading"><div><h1>{title}</h1><p>{selected?.description || '从实际工作需求出发，筛选适合你的软件。'}</p></div><span className="result-total">{data.total} 款软件</span></div><div className="directory-layout"><CategoryRail categories={data.categories} selected={params.category} params={params}/><div className="directory-content"><form className="filter-panel" action="/products"><div className="filter-search"><Search size={18}/><label className="sr-only" htmlFor="catalog-search">搜索软件</label><input id="catalog-search" type="search" name="q" defaultValue={params.q} placeholder="名称、关键词或工作场景" maxLength={100}/><button className="button primary" type="submit">搜索</button></div>{params.category && <input type="hidden" name="category" value={params.category}/>}<div className="filter-options"><span className="filter-label"><SlidersHorizontal size={15}/> 筛选</span><label className="checkbox-label"><input type="checkbox" name="chinese" value="1" defaultChecked={params.chinese==='1'}/>有中文资料</label><label><span className="sr-only">收费方式</span><select name="pricing" defaultValue={pricing || ''}><option value="">全部收费方式</option>{Object.entries(pricingLabels).map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label><label><span className="sr-only">排序方式</span><select name="sort" defaultValue={params.sort==='latest'?'latest':'recommended'}><option value="recommended">推荐优先</option><option value="latest">最新收录</option></select></label><button className="text-button" type="submit">应用筛选</button>{(params.q || params.category || pricing || params.chinese) && <Link className="clear-filters" href="/products"><X size={13}/>重置</Link>}</div></form><div className="results-heading"><p>找到 <strong>{data.total}</strong> 款软件</p>{selected && <Link href={queryHref('/products',{...params,category:undefined,page:undefined})} className="selected-filter">{selected.name}<X size={13}/></Link>}</div>{data.products.length ? <ProductGrid products={data.products}/> : <EmptyState/>}<Pagination data={data} params={params}/></div></div></SiteShell>;
}
