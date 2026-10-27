import Link from 'next/link';
import { ArrowUpRight, Boxes, FolderTree, History, Settings } from 'lucide-react';
import { Brand } from './site-shell';
import { LogoutButton } from './admin-ui';
const links=[{href:'/admin',label:'产品管理',icon:Boxes},{href:'/admin/categories',label:'分类管理',icon:FolderTree},{href:'/admin/activity',label:'操作记录',icon:History},{href:'/admin/settings',label:'账号设置',icon:Settings}];
export function AdminShell({children,active='products',username='admin'}:{children:React.ReactNode;active?:string;username?:string}){
  return <div className="admin-shell"><a className="skip-link" href="#admin-main">跳到管理内容</a><aside className="admin-sidebar"><Brand compact/><p className="admin-scope">运营工作台</p><nav aria-label="后台导航">{links.map((l,i)=>{const Icon=l.icon;return <Link href={l.href} aria-current={active===['products','categories','activity','settings'][i]?'page':undefined} key={l.href}><Icon size={18}/>{l.label}</Link>})}</nav><div className="admin-sidebar-bottom"><Link href="/" target="_blank">查看前台 <ArrowUpRight size={15}/></Link><div className="admin-user"><span>{username}<small>管理员</small></span><LogoutButton/></div></div></aside><main id="admin-main" className="admin-main">{children}</main></div>;
}
