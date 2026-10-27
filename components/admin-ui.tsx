'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {LogOut, LoaderCircle} from 'lucide-react';
import type {ProductStatus} from '@/lib/types';

export async function apiRequest<T>(url:string, init:RequestInit = {}):Promise<T>{
  const response=await fetch(url,{...init,headers:{...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers}});
  const data=await response.json().catch(()=>({error:'服务暂时无法响应，请稍后再试。'}));
  if(!response.ok) throw new Error(data.error || '操作未完成，请稍后再试。');
  return data;
}
export function LogoutButton(){const [busy,setBusy]=useState(false);const [error,setError]=useState(''); const router=useRouter();return <><button type="button" className="icon-button" aria-label="退出登录" title="退出登录" disabled={busy} onClick={async()=>{setBusy(true);try{await apiRequest('/api/admin/logout',{method:'POST'});router.push('/admin/login');router.refresh();}catch(e){setError((e as Error).message);setBusy(false);}}}><LogOut size={17}/></button>{error&&<span role="alert" className="inline-error">{error}</span>}</>}
export function StatusButton({id,status,small=false,onChanged}:{id:string;status:ProductStatus;small?:boolean;onChanged?:()=>void}){
  const router=useRouter(); const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const next:ProductStatus=status==='published'?'unpublished':'published';
  return <span className="status-action"><button className={small?'table-action':'button secondary'} disabled={busy} type="button" onClick={async()=>{setError('');setBusy(true);try{await apiRequest(`/api/admin/products/${id}`,{method:'PATCH',body:JSON.stringify({status:next})});onChanged?.();router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{busy?<LoaderCircle className="spin" size={14}/>:null}{busy?'处理中':status==='published'?'下架':'上架'}</button>{error&&<span className="inline-error" role="alert">{error}</span>}</span>;
}
export function LoginForm(){
  const router=useRouter();const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  return <form className="stack-form" onSubmit={async e=>{e.preventDefault();setError('');setBusy(true);const f=new FormData(e.currentTarget);try{await apiRequest('/api/admin/login',{method:'POST',body:JSON.stringify({username:f.get('username'),password:f.get('password')})});router.push('/admin');router.refresh();}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}><label>管理员账号<input name="username" autoComplete="username" defaultValue="admin" required maxLength={80}/></label><label>密码<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>{error&&<div className="form-error" role="alert">{error}</div>}<button className="button primary" disabled={busy}>{busy?'正在登录…':'登录管理后台'}</button><p className="form-help">此入口仅供网站运营人员使用。</p></form>;
}
export function PasswordForm(){
 const [error,setError]=useState('');const [success,setSuccess]=useState(false);const [busy,setBusy]=useState(false);const router=useRouter();
 return <form className="stack-form password-form" onSubmit={async e=>{e.preventDefault();setError('');setSuccess(false);const form=e.currentTarget;const f=new FormData(form);if(f.get('newPassword')!==f.get('confirm')){setError('两次输入的新密码不一致。');return;}setBusy(true);try{await apiRequest('/api/admin/password',{method:'POST',body:JSON.stringify({currentPassword:f.get('currentPassword'),newPassword:f.get('newPassword')})});setSuccess(true);form.reset();router.refresh();}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}><label>当前密码<input type="password" name="currentPassword" required autoComplete="current-password" maxLength={256}/></label><label>新密码<input type="password" name="newPassword" minLength={12} maxLength={256} required autoComplete="new-password"/><small>至少 12 个字符，建议使用独立的长密码。</small></label><label>再次输入新密码<input type="password" name="confirm" required minLength={12} maxLength={256} autoComplete="new-password"/></label>{error&&<div className="form-error" role="alert">{error}</div>}{success&&<div className="form-success" role="status">密码已更新。请使用新密码重新登录。<a href="/admin/login">前往登录</a></div>}<button className="button primary" disabled={busy}>{busy?'正在保存…':'更新密码'}</button></form>;
}
