import {requireAdmin} from '@/lib/auth';
import {AdminShell} from '@/components/admin-shell';
import {ActivityList} from '@/components/admin-tools';
export const dynamic='force-dynamic';
export const metadata={title:'操作记录'};
export default async function ActivityPage(){const admin=await requireAdmin();return <AdminShell active="activity" username={admin.username}><div className="page-heading"><div><h1>操作记录</h1><p>查看产品资料、上架状态和分类的最近变更。</p></div></div><ActivityList/></AdminShell>}
