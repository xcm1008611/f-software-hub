import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync,writeFileSync,mkdirSync,readdirSync,copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';

const temp=mkdtempSync(join(tmpdir(),'f-hub-backend-'));
process.env.DATA_DIR=temp;process.env.APP_ORIGIN='http://127.0.0.1:3180';
const db=await import('../lib/db');
const store=await import('../lib/store');
const auth=await import('../lib/auth');
const {productSchema}=await import('../lib/validation');
const adminRoutes=await import('../app/api/admin/products/route');
const productRoutes=await import('../app/api/admin/products/[id]/route');
const publicRoutes=await import('../app/api/products/[slug]/route');
const loginRoutes=await import('../app/api/admin/login/route');
const uploadRoutes=await import('../app/api/admin/uploads/route');
const sharp=(await import('sharp')).default;
const password='Initial-Only-Testing-12345!';
auth.initializeAdmin(password);
const firstLogin=auth.login('admin',password);
const admin=firstLogin.admin;
const cookie=auth.SESSION_COOKIE+'='+firstLogin.token;
const category=store.createCategory({slug:'research',name:'选品研究',description:'研究市场',sortOrder:0},admin);
const base={slug:'example-tool',name:'选品研究工具',company:'示例厂商',websiteUrl:'https://example.com',logoPath:null,tagline:'搜索跨境市场',description:'支持市场与竞品研究。',categoryId:category.id,tags:['选品'],useCases:['跨境电商'],features:['关键词研究'],cautions:'核实数据来源',pricingType:'trial',pricingNote:'详见官网',chinese:true,featured:false,sortOrder:0,status:'draft',sourceUrl:'https://example.com/about',verifiedAt:'2026-10-27'};
function request(path:string,method='GET',body?:unknown,withAuth=true,origin='http://127.0.0.1:3180'){
  return new Request('http://127.0.0.1:3180'+path,{method,headers:{...(withAuth?{cookie}:{}),...(method!=='GET'?{'content-type':'application/json',origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});
}
after(()=>{db.closeDatabase();rmSync(temp,{recursive:true,force:true});});

test('草稿、上架、编辑、下架、再次上架，公开查询与旧链接一致',async()=>{
  const created=await adminRoutes.POST(request('/api/admin/products','POST',base));assert.equal(created.status,201);
  const {product}=await created.json();assert.equal(store.listProducts().total,0);
  assert.equal((await publicRoutes.GET(request('/api/products/example-tool'),{params:Promise.resolve({slug:'example-tool'})})).status,404);
  for(const status of ['published','unpublished','published']){
    const result=await productRoutes.PATCH(request('/api/admin/products/'+product.id,'PATCH',{status}),{params:Promise.resolve({id:product.id})});assert.equal(result.status,200);
    assert.equal(store.listProducts().total,status==='published'?1:0);
    assert.equal((await publicRoutes.GET(request('/api/products/example-tool'),{params:Promise.resolve({slug:'example-tool'})})).status,status==='published'?200:404);
  }
  const edit=await productRoutes.PATCH(request('/api/admin/products/'+product.id,'PATCH',{name:'新的产品名'}),{params:Promise.resolve({id:product.id})});assert.equal(edit.status,200);
  assert.equal(store.getProductBySlug('example-tool')?.name,'新的产品名');
  assert.equal(store.listProducts({q:'关键词',chinese:true,pricing:'trial',category:'research'}).total,1);
  assert.equal(store.listProducts({q:'不匹配'}).total,0);
  assert.equal(store.listProducts({q:"%' OR 1=1 --"}).total,0);
  assert.equal(store.listProducts({page:999}).page,1);
});
test('后台读写与跨站写入在服务端被拒绝',async()=>{
  assert.equal((await adminRoutes.GET(request('/api/admin/products','GET',undefined,false))).status,401);
  assert.equal((await adminRoutes.POST(request('/api/admin/products','POST',base,false))).status,401);
  assert.equal((await adminRoutes.POST(request('/api/admin/products','POST',base,true,'https://evil.example'))).status,403);
  assert.equal((await loginRoutes.POST(request('/api/admin/login','POST',{username:'admin',password},false,'https://evil.example'))).status,403);
  assert.equal(auth.sessionAdmin('forged'),null);
});
test('严格校验地址、未知字段、状态和分类；重复标识返回冲突',async()=>{
  assert.throws(()=>productSchema.parse({...base,websiteUrl:'javascript:alert(1)'}));
  assert.throws(()=>productSchema.parse({...base,logoPath:'/etc/passwd'}));
  assert.throws(()=>productSchema.parse({...base,status:'deleted'}));
  assert.throws(()=>productSchema.parse({...base,isAdmin:true}));
  assert.equal((await adminRoutes.POST(request('/api/admin/products','POST',base))).status,409);
  assert.equal((await adminRoutes.POST(request('/api/admin/products','POST',{...base,slug:'unknown-cat',categoryId:'missing'}))).status,404);
});
test('Logo 校验真实格式，重编码持久化，拒绝伪造与超大输入',async()=>{
  const bytes=await sharp({create:{width:32,height:32,channels:3,background:'#1b6e66'}}).png().toBuffer();
  const form=new FormData();form.set('file',new File([new Uint8Array(bytes)],'logo.png',{type:'image/png'}));
  const result=await uploadRoutes.POST(new Request('http://127.0.0.1:3180/api/admin/uploads',{method:'POST',headers:{cookie,origin:process.env.APP_ORIGIN!},body:form}));
  assert.equal(result.status,201);const {path}=await result.json();assert.match(path,/^\/uploads\/[a-f0-9-]+\.webp$/);
  assert.ok(readFileSync(join(temp,path)).length>0);
  const fake=new FormData();fake.set('file',new File(['<svg onload="alert(1)"/>'],'fake.png',{type:'image/png'}));
  assert.equal((await uploadRoutes.POST(new Request('http://127.0.0.1:3180/api/admin/uploads',{method:'POST',headers:{cookie,origin:process.env.APP_ORIGIN!},body:fake}))).status,415);
  const large=new FormData();large.set('file',new File([new Uint8Array(2*1024*1024+1)],'large.png',{type:'image/png'}));
  assert.equal((await uploadRoutes.POST(new Request('http://127.0.0.1:3180/api/admin/uploads',{method:'POST',headers:{cookie,origin:process.env.APP_ORIGIN!},body:large}))).status,413);
});
test('数据库关闭重开保留产品、会话与审计；种子只导入一次',()=>{
  const before=store.listProducts({},true).total;db.closeDatabase();assert.equal(store.listProducts({},true).total,before);assert.ok(auth.sessionAdmin(firstLogin.token));assert.ok(store.listAudit().length>=5);
  assert.equal(store.importCatalog({categories:[],products:[]}).imported,true);
  assert.equal(store.importCatalog({categories:[],products:[{...base,slug:'should-not-import'}]}).imported,false);
  assert.equal(store.listProducts({},true).total,before);
});
test('在线备份包含有效数据库和图片，可解压恢复',()=>{
  const backupDir=join(temp,'test-backups');
  const result=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/backup.ts'],{cwd:resolve('.'),env:{...process.env,BACKUP_DIR:backupDir},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);const {backup}=JSON.parse(result.stdout.trim());
  const restored=join(temp,'restored');mkdirSync(restored);assert.equal(spawnSync('tar',['-xzf',backup,'-C',restored]).status,0);
  const copy=new Database(join(restored,'hub.sqlite'),{readonly:true});assert.equal(copy.pragma('integrity_check',{simple:true}),'ok');assert.ok((copy.prepare('SELECT count(*) n FROM products').get() as {n:number}).n>0);copy.close();
});
test('打包失败不会留下半成品或淘汰已有成功备份',()=>{
  const backupDir=join(temp,'failed-backups');mkdirSync(backupDir);
  const successfulDirectory=join(temp,'test-backups');
  const validArchive=join(successfulDirectory,readdirSync(successfulDirectory).find(name=>name.endsWith('.tar.gz'))!);
  const contents=readFileSync(validArchive);
  const saved=Array.from({length:7},(_,index)=>`f-hub-backup-2026-10-${String(index+1).padStart(2,'0')}T00-00-00-000Z-100.tar.gz`);
  for(const name of saved)copyFileSync(validArchive,join(backupDir,name));
  const fakeBin=join(temp,'failed-tar-bin');mkdirSync(fakeBin);
  writeFileSync(join(fakeBin,'tar'),'#!/bin/sh\nprintf partial > "$2"\nprintf "No space left on device\\n" >&2\nexit 2\n',{mode:0o700});
  const result=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/backup.ts'],{cwd:resolve('.'),env:{...process.env,BACKUP_DIR:backupDir,PATH:fakeBin+':'+process.env.PATH},encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/No space left on device/);
  assert.deepEqual(readdirSync(backupDir).sort(),saved.sort());
  for(const name of saved)assert.deepEqual(readFileSync(join(backupDir,name)),contents);
});
test('归档校验失败也不会晋升为正式备份或轮转旧备份',()=>{
  const backupDir=join(temp,'invalid-backups');mkdirSync(backupDir);
  const successfulDirectory=join(temp,'test-backups');
  const validArchive=join(successfulDirectory,readdirSync(successfulDirectory).find(name=>name.endsWith('.tar.gz'))!);
  const saved='f-hub-backup-2026-10-01T00-00-00-000Z-100.tar.gz';copyFileSync(validArchive,join(backupDir,saved));
  const fakeBin=join(temp,'invalid-tar-bin');mkdirSync(fakeBin);
  writeFileSync(join(fakeBin,'tar'),'#!/bin/sh\nif [ "$1" = "-czf" ]; then\n  printf invalid > "$2"\n  exit 0\nfi\nprintf "archive validation failed\\n" >&2\nexit 2\n',{mode:0o700});
  const result=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/backup.ts'],{cwd:resolve('.'),env:{...process.env,BACKUP_DIR:backupDir,PATH:fakeBin+':'+process.env.PATH},encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/archive validation failed/);
  assert.deepEqual(readdirSync(backupDir),[saved]);assert.deepEqual(readFileSync(join(backupDir,saved)),readFileSync(validArchive));
});
test('持久化登录限速不可被伪造IP绕过；密码重置撤销会话',async()=>{
  for(let i=0;i<5;i++)assert.throws(()=>auth.login('admin','wrong-password'),/账号或密码不正确/);
  db.closeDatabase();assert.throws(()=>auth.login('admin',password),/登录尝试过多/);
  const forged=request('/api/admin/login','POST',{username:'admin',password},false);forged.headers.set('x-forwarded-for','1.2.3.4');assert.equal((await loginRoutes.POST(forged)).status,429);
  auth.resetAdminPassword('Changed-Testing-Password-54321!');assert.equal(auth.sessionAdmin(firstLogin.token),null);
  assert.ok(auth.login('admin','Changed-Testing-Password-54321!').admin);
});
