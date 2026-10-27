import { resetAdminPassword } from '../lib/auth';
let input='';
if(process.stdin.isTTY){console.error('请通过标准输入传入新密码，例如使用密码管理器或交互式隐藏输入后管道传入。密码不会被输出。');process.exitCode=1;}
else {
  for await(const chunk of process.stdin){input+=chunk;if(input.length>1024){console.error('密码输入过长');process.exit(1);}}
  try{const password=input.replace(/[\r\n]+$/,'');resetAdminPassword(password);input='';console.log('管理员密码已更新，所有登录会话已撤销。');}
  catch(error){console.error(error instanceof Error?error.message:'密码重置失败');process.exitCode=1;}
}
