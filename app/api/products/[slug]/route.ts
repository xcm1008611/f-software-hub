import { getProductBySlug } from '@/lib/store';
import { handle,json } from '@/lib/http';
export const dynamic='force-dynamic';
export function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){return handle(async()=>{const {slug}=await params;const product=getProductBySlug(slug);return product?json({product}):json({error:'产品不存在或已下架'},404);});}
