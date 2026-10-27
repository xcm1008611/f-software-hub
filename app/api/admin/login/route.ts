import { assertSameOrigin,login,sessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { handle,json,readJson } from '@/lib/http';
import { addAudit } from '@/lib/store';
export function POST(request:Request){return handle(async()=>{assertSameOrigin(request);const input=loginSchema.parse(await readJson(request));const result=login(input.username,input.password);addAudit(result.admin.username,'login','admin',result.admin.id,'管理员登录');return json({admin:result.admin},200,{'Set-Cookie':sessionCookie(result.token)});});}
