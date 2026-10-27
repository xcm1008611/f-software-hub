import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {requireAdmin} from '@/lib/auth';
import {getProductById} from '@/lib/store';
import {AdminShell} from '@/components/admin-shell';
import {ProductDetail} from '@/components/products';
import {statusLabels} from '@/lib/types';
export const dynamic='force-dynamic';
export const metadata={title:'产品预览'};
export default async function PreviewProduct({params}:{params:Promise<{id:string}>}){const admin=await requireAdmin();const {id}=await params;const p=getProductById(id);if(!p)notFound();return <AdminShell username={admin.username}><div className="preview-banner"><span>管理员预览 · {statusLabels[p.status]} · 展示已保存的内容</span><Link href={`/admin/products/${p.id}/edit`}><ArrowLeft size={14}/>继续编辑</Link></div><ProductDetail product={p} preview/></AdminShell>}
