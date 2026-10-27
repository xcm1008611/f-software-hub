import {requireAdmin} from '@/lib/auth';
import {listCategories} from '@/lib/store';
import {AdminShell} from '@/components/admin-shell';
import {CategoryManager} from '@/components/admin-tools';
export const dynamic='force-dynamic';
export const metadata={title:'分类管理'};
export default async function CategoriesPage(){const admin=await requireAdmin();return <AdminShell active="categories" username={admin.username}><div className="page-heading"><div><h1>分类管理</h1><p>维护工作场景，让用户更容易找到软件。</p></div></div><CategoryManager initial={listCategories()}/></AdminShell>}
