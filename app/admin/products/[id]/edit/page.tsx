import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {getProductById,listCategories} from '@/lib/store';
import {AdminShell} from '@/components/admin-shell';
import {ProductEditor} from '@/components/product-editor';
export const dynamic='force-dynamic';
export const metadata={title:'编辑产品'};
export default async function EditProduct({params}:{params:Promise<{id:string}>}){const admin=await requireAdmin();const {id}=await params;const p=getProductById(id);if(!p)notFound();return <AdminShell username={admin.username}><ProductEditor key={p.id} product={p} categories={listCategories()}/></AdminShell>}
