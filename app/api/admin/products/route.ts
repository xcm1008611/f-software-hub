import { assertSameOrigin,authorizeRequest } from '@/lib/auth';
import { createProduct,listProducts } from '@/lib/store';
import { handle,json,readJson,parseFilters } from '@/lib/http';
export const dynamic='force-dynamic';
export function GET(request:Request){return handle(()=>{authorizeRequest(request);return json(listProducts(parseFilters(request,true),true));});}
export function POST(request:Request){return handle(async()=>{assertSameOrigin(request);const admin=authorizeRequest(request);return json({product:createProduct(await readJson(request),admin)},201);});}
