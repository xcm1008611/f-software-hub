import { assertSameOrigin,authorizeRequest } from '@/lib/auth';
import { updateCategory } from '@/lib/store';
import { handle,json,readJson } from '@/lib/http';
export function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return handle(async()=>{assertSameOrigin(request);const admin=authorizeRequest(request);const {id}=await params;return json({category:updateCategory(id,await readJson(request),admin)});});}
