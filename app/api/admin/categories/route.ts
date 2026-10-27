import { assertSameOrigin,authorizeRequest } from '@/lib/auth';
import { createCategory,listCategories } from '@/lib/store';
import { handle,json,readJson } from '@/lib/http';
export const dynamic='force-dynamic';
export function GET(request:Request){return handle(()=>{authorizeRequest(request);return json({categories:listCategories()});});}
export function POST(request:Request){return handle(async()=>{assertSameOrigin(request);const admin=authorizeRequest(request);return json({category:createCategory(await readJson(request),admin)},201);});}
