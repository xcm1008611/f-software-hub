import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSqlite } from './db';
import { ApiError } from './errors';
import type { Admin } from './types';

export const SESSION_COOKIE='fhub_session';
const TTL=8*60*60*1000;
export function appOrigin() { return new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:3180').origin; }
export function assertSameOrigin(request:Request) { if(request.headers.get('origin')!==appOrigin())throw new ApiError('请求来源不受信任，请从管理页面重试',403); }
export function hashPassword(password:string) {
  if(password.length<12 || password.length>256)throw new ApiError('密码需为 12 至 256 位');
  const salt=randomBytes(16).toString('hex');
  const hash=scryptSync(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});
  return `scrypt$32768$8$3$${salt}$${hash.toString('hex')}`;
}
export function verifyPassword(password:string,stored:string) {
  try { const [method,n,r,p,salt,hex]=stored.split('$'); if(method!=='scrypt'||!salt||!/^[a-f0-9]{128}$/.test(hex||''))return false;
    const expected=Buffer.from(hex,'hex');const actual=scryptSync(password,salt,expected.length,{N:Number(n),r:Number(r),p:Number(p),maxmem:64*1024*1024});
    return timingSafeEqual(expected,actual);
  }catch{return false;}
}
function tokenHash(token:string) {return createHash('sha256').update(token).digest('hex');}
export function initializeAdmin(password?:string) {
  const db=getSqlite();if(db.prepare('SELECT id FROM admins LIMIT 1').get())return {created:false};
  if(!password)throw new Error('首次初始化必须提供 ADMIN_INITIAL_PASSWORD（至少 12 位），不会生成默认密码');
  db.prepare('INSERT INTO admins(id,username,password_hash,created_at) VALUES(?,?,?,?)').run(randomUUID(),'admin',hashPassword(password),new Date().toISOString());
  return {created:true};
}
export function sessionAdmin(token?:string|null):Admin|null {
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const row=getSqlite().prepare('SELECT admins.id, admins.username FROM sessions JOIN admins ON admins.id=sessions.admin_id WHERE token_hash=? AND expires_at>?').get(tokenHash(token),Date.now()) as Admin|undefined;
  return row||null;
}
export async function getCurrentAdmin():Promise<Admin|null> {return sessionAdmin((await cookies()).get(SESSION_COOKIE)?.value);}
export async function requireAdmin():Promise<Admin> {const admin=await getCurrentAdmin();if(!admin)redirect('/admin/login');return admin;}
export function requestToken(request:Request) {return (request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);}
export function authorizeRequest(request:Request):Admin {const admin=sessionAdmin(requestToken(request));if(!admin)throw new ApiError('请先登录管理员账号',401);return admin;}
type Limit={failures:number;window_start:number;blocked_until:number};
function limitState(key:string) {return getSqlite().prepare('SELECT failures,window_start,blocked_until FROM login_limits WHERE key=?').get(key) as Limit|undefined;}
function bumpLimit(key:string,max:number) {
  const now=Date.now(); const previous=limitState(key); const fresh=!previous || now-previous.window_start>15*60*1000;
  const failures=fresh?1:previous.failures+1; const start=fresh?now:previous.window_start; const blocked=failures>=max?now+15*60*1000:0;
  getSqlite().prepare('INSERT INTO login_limits(key,failures,window_start,blocked_until) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,window_start=excluded.window_start,blocked_until=excluded.blocked_until').run(key,failures,start,blocked);
}
const DUMMY='scrypt$32768$8$3$778def791dc58003cabbb97316a45854$'+ '0'.repeat(128);
export function login(username:string,password:string) {
  const normalized=username.toLowerCase();const key='user:'+normalized;const now=Date.now();
  if([limitState(key),limitState('global')].some(limit=>limit&&limit.blocked_until>now))throw new ApiError('登录尝试过多，请 15 分钟后重试',429);
  const db=getSqlite();const row=db.prepare('SELECT id,username,password_hash FROM admins WHERE username=?').get(normalized) as (Admin&{password_hash:string})|undefined;
  const valid=verifyPassword(password,row?.password_hash||DUMMY);
  if(!row||!valid){bumpLimit(key,5);bumpLimit('global',50);throw new ApiError('账号或密码不正确',401);}
  db.prepare('DELETE FROM login_limits WHERE key=?').run(key);db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
  const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(tokenHash(token),row.id,now+TTL);
  return {token,admin:{id:row.id,username:row.username}};
}
export function revokeToken(token?:string) {if(token)getSqlite().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));}
export function resetAdminPassword(password:string) {
  const db=getSqlite();const row=db.prepare('SELECT id FROM admins WHERE username=?').get('admin') as {id:string}|undefined;
  if(!row)throw new Error('管理员尚未初始化');
  const hash=hashPassword(password);
  db.transaction(()=>{db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(hash,row.id);db.prepare('DELETE FROM sessions WHERE admin_id=?').run(row.id);db.prepare('DELETE FROM login_limits').run();})();
}
export function changePassword(admin:Admin,current:string,next:string) {
  const db=getSqlite();const row=db.prepare('SELECT password_hash FROM admins WHERE id=?').get(admin.id) as {password_hash:string}|undefined;
  const key='password:'+admin.id;if((limitState(key)?.blocked_until||0)>Date.now())throw new ApiError('尝试过多，请 15 分钟后重试',429);
  if(!row||!verifyPassword(current,row.password_hash)){bumpLimit(key,5);throw new ApiError('当前密码不正确',400);}
  if(current===next)throw new ApiError('新密码不能与当前密码相同');
  resetAdminPassword(next);
}
export function sessionCookie(token:string,clear=false) {
  return `${SESSION_COOKIE}=${clear?'':token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:TTL/1000}${appOrigin().startsWith('https:')?'; Secure':''}`;
}
