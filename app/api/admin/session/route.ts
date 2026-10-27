import { authorizeRequest } from '@/lib/auth';
import { handle,json } from '@/lib/http';
export const dynamic='force-dynamic';
export function GET(request:Request){return handle(()=>json({admin:authorizeRequest(request)}));}
