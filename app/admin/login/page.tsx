import Link from 'next/link';
import {redirect} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {getCurrentAdmin} from '@/lib/auth';
import {Brand} from '@/components/site-shell';
import {LoginForm} from '@/components/admin-ui';
export const dynamic='force-dynamic';
export const metadata={title:'管理员登录'};
export default async function LoginPage(){if(await getCurrentAdmin())redirect('/admin');return <main className="login-page"><div className="login-heading"><Brand/></div><div className="login-card"><h1>管理你的产品库</h1><p>登录后即可维护产品资料与上架状态。</p><LoginForm/></div><Link className="back-link" href="/"><ArrowLeft size={14}/>返回产品库</Link></main>}
