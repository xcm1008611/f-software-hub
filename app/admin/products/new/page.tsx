import {requireAdmin} from '@/lib/auth';
import {listCategories} from '@/lib/store';
import {AdminShell} from '@/components/admin-shell';
import {ProductEditor} from '@/components/product-editor';
export const dynamic='force-dynamic';
export const metadata={title:'新增产品'};
export default async function NewProduct(){const admin=await requireAdmin();return <AdminShell username={admin.username}><ProductEditor categories={listCategories()}/></AdminShell>}
