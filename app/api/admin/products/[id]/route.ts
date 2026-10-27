import { assertSameOrigin,authorizeRequest } from '@/lib/auth';
import { getProductById,updateProduct } from '@/lib/store';
import { handle,json,readJson } from '@/lib/http';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export function GET(request:Request,{params}:Context){return handle(async()=>{authorizeRequest(request);const {id}=await params;const product=getProductById(id);return product?json({product}):json({error:'产品不存在'},404);});}
export function PATCH(request:Request,{params}:Context){return handle(async()=>{assertSameOrigin(request);const admin=authorizeRequest(request);const {id}=await params;return json({product:updateProduct(id,await readJson(request),admin)});});}
