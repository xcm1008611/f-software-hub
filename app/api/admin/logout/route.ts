import { assertSameOrigin,authorizeRequest,revokeToken,requestToken,sessionCookie } from '@/lib/auth';
import { handle,json } from '@/lib/http';
export function POST(request:Request){return handle(()=>{assertSameOrigin(request);authorizeRequest(request);revokeToken(requestToken(request));return json({ok:true},200,{'Set-Cookie':sessionCookie('',true)});});}
