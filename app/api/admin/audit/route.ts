import { authorizeRequest } from '@/lib/auth';
import { listAudit } from '@/lib/store';
import { handle,json } from '@/lib/http';
export const dynamic='force-dynamic';
export function GET(request:Request){return handle(()=>{authorizeRequest(request);return json({entries:listAudit()});});}
