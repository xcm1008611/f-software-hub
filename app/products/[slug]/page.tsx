import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { ProductDetail, ProductGrid } from '@/components/products';
import { getProductBySlug, listProducts } from '@/lib/store';
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const p=getProductBySlug(slug); return {title:p?.name || '软件暂不可用',description:p?.tagline}; }
export default async function DetailPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const p=getProductBySlug(slug); if(!p || p.status!=='published') notFound();
  const related=listProducts({category:p.category?.slug,pageSize:4}).products.filter(v=>v.id!==p.id).slice(0,3);
  return <SiteShell active="products"><nav className="breadcrumbs" aria-label="面包屑"><Link href="/products">产品库</Link><ChevronRight size={13}/>{p.category && <><Link href={`/products?category=${p.category.slug}`}>{p.category.name}</Link><ChevronRight size={13}/></>}<span>{p.name}</span></nav><ProductDetail product={p}/>{related.length>0 && <section className="related-section"><div className="section-heading"><h2>同场景，还可以看看</h2><Link href={`/products?category=${p.category?.slug || ''}`}>浏览分类</Link></div><ProductGrid products={related}/></section>}</SiteShell>;
}
