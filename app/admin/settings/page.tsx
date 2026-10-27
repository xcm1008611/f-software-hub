import {requireAdmin} from '@/lib/auth';
import {AdminShell} from '@/components/admin-shell';
import {PasswordForm} from '@/components/admin-ui';
export const dynamic='force-dynamic';
export const metadata={title:'账号设置'};
export default async function SettingsPage(){const admin=await requireAdmin();return <AdminShell active="settings" username={admin.username}><div className="page-heading"><div><h1>账号设置</h1><p>保护管理账号，定期更新登录密码。</p></div></div><section className="settings-panel"><div><h2>修改密码</h2><p>当前账号：{admin.username}</p><p>更新密码后，需要重新登录管理后台。</p></div><PasswordForm/></section></AdminShell>}
