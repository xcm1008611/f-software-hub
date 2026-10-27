import { assertSameOrigin,authorizeRequest,changePassword,sessionCookie } from '@/lib/auth';
import { passwordSchema } from '@/lib/validation';
import { handle,json,readJson } from '@/lib/http';
import { addAudit } from '@/lib/store';
export function POST(request:Request){return handle(async()=>{assertSameOrigin(request);const admin=authorizeRequest(request);const input=passwordSchema.parse(await readJson(request));changePassword(admin,input.currentPassword,input.newPassword);addAudit(admin.username,'password','admin',admin.id,'管理员修改密码，所有会话已撤销');return json({ok:true},200,{'Set-Cookie':sessionCookie('',true)});});}
