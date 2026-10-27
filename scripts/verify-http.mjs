import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

const base = process.env.TEST_ORIGIN || 'http://127.0.0.1:3180';
const password = readFileSync(process.env.TEST_PASSWORD_FILE || '.runtime/admin-initial-password', 'utf8').trim();
let cookie = '';
const checks = [];
async function request(path, {method='GET',body,auth=true,origin=base}={}) {
 const headers = {Origin:origin};
 if (auth && cookie) headers.Cookie=cookie;
 if (body && !(body instanceof FormData)) headers['Content-Type']='application/json';
 const response = await fetch(base+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,redirect:'manual'});
 const text=await response.text();
 let data;try{data=JSON.parse(text)}catch{data=text}
 return {response,data};
}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
let productId, slug, logoPath;
await check('健康检查',async()=>assert.equal((await request('/api/health')).response.status,200));
await check('匿名无法读取后台和写入产品',async()=>{
 assert.equal((await request('/api/admin/products',{auth:false})).response.status,401);
 assert.ok([401,403].includes((await request('/api/admin/products',{method:'POST',body:{name:'unauthorized'},auth:false})).response.status));
 const r=await request('/admin',{auth:false});
 const redirected=[302,303,307,308].includes(r.response.status)||
   (r.response.status===200&&typeof r.data==='string'&&r.data.includes('id="__next-page-redirect"')&&r.data.includes('url=/admin/login')&&!r.data.includes('class="product-table"'));
 assert.ok(redirected,'未登录的后台页面必须跳转登录且不包含产品管理内容');
});
await check('登录拒绝跨站来源',async()=>assert.equal((await request('/api/admin/login',{method:'POST',origin:'https://invalid.example',body:{username:'admin',password}})).response.status,403));
await check('管理员登录与安全Cookie',async()=>{
 const r=await request('/api/admin/login',{method:'POST',body:{username:'admin',password}});
 assert.equal(r.response.status,200,JSON.stringify(r.data));
 const set=r.response.headers.get('set-cookie');assert.ok(set && /httponly/i.test(set) && /samesite=strict/i.test(set));cookie=set.split(';')[0];
 assert.equal((await request('/api/admin/session')).response.status,200);
});
await check('非法链接与跨站写入被拒绝',async()=>{
 assert.equal((await request('/api/admin/products',{method:'POST',origin:'https://invalid.example',body:{}})).response.status,403);
 assert.equal((await request('/api/admin/products',{method:'POST',body:{name:'bad',websiteUrl:'javascript:alert(1)'}})).response.status,400);
});
const categories=(await request('/api/admin/categories')).data.categories;
await check('分类读取',async()=>assert.ok(Array.isArray(categories)&&categories.length>=8));
await check('Logo拒绝伪装图片和超大文件',async()=>{
 const bad=new FormData();bad.append('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/png'}),'fake.png');
 assert.ok([400,415,422].includes((await request('/api/admin/uploads',{method:'POST',body:bad})).response.status));
 const big=new FormData();big.append('file',new Blob([new Uint8Array(2*1024*1024+1)],{type:'image/png'}),'large.png');
 assert.ok([400,413].includes((await request('/api/admin/uploads',{method:'POST',body:big})).response.status));
});
await check('真实Logo上传和读取',async()=>{
 const png=await sharp({create:{width:32,height:32,channels:3,background:'#1b6e66'}}).png().toBuffer();
 const form=new FormData();form.append('file',new Blob([new Uint8Array(png)],{type:'image/png'}),'verification.png');
 const r=await request('/api/admin/uploads',{method:'POST',body:form});assert.ok([200,201].includes(r.response.status),JSON.stringify(r.data));
 logoPath=r.data.path;assert.match(logoPath,/^\/uploads\//);
 const image=await fetch(base+logoPath);assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/^image\//);
});
await check('创建草稿且公开接口不可见',async()=>{
 slug='verification-'+randomUUID();
 const input={slug,name:'验收测试软件',company:'验收测试',websiteUrl:'https://example.com',logoPath,tagline:'用于验证上下架与持久化的测试记录',description:'自动验收记录，测试后将清理。',categoryId:categories[0].id,tags:['验收专用'],useCases:['流程验证'],features:['验证上下架'],cautions:'测试数据',pricingType:'free',pricingNote:'测试记录',chinese:true,featured:false,sortOrder:9999,status:'draft',sourceUrl:'https://example.com',verifiedAt:'2026-10-27'};
 const r=await request('/api/admin/products',{method:'POST',body:input});assert.equal(r.response.status,201,JSON.stringify(r.data));productId=r.data.product.id;
 assert.equal((await request('/api/products/'+slug,{auth:false})).response.status,404);
 assert.equal((await request('/api/products?q='+encodeURIComponent(slug),{auth:false})).data.total,0);
});
await check('上架后搜索与详情可见',async()=>{
 assert.equal((await request('/api/admin/products/'+productId,{method:'PATCH',body:{status:'published'}})).response.status,200);
 assert.equal((await request('/api/products/'+slug,{auth:false})).data.product.id,productId);
 const r=await request('/api/products?q='+encodeURIComponent('验收测试软件')+'&chinese=1&pricing=free&category='+categories[0].slug,{auth:false});assert.equal(r.data.total,1);
 assert.equal((await request('/products/'+slug,{auth:false})).response.status,200);
});
await check('修改名称保留详情链接',async()=>{
 const r=await request('/api/admin/products/'+productId,{method:'PATCH',body:{name:'验收测试软件已更新'}});assert.equal(r.response.status,200);
 const updated=(await request('/api/products/'+slug,{auth:false})).data.product;assert.equal(updated.name,'验收测试软件已更新');assert.equal(updated.slug,slug);
});
await check('下架后接口及旧详情页面隐藏',async()=>{
 assert.equal((await request('/api/admin/products/'+productId,{method:'PATCH',body:{status:'unpublished'}})).response.status,200);
 assert.equal((await request('/api/products/'+slug,{auth:false})).response.status,404);
 assert.equal((await request('/products/'+slug,{auth:false})).response.status,404);
 assert.equal((await request('/api/products?q='+encodeURIComponent('验收测试软件'),{auth:false})).data.total,0);
 assert.equal((await request('/api/admin/products/'+productId)).data.product.status,'unpublished');
});
await check('重新上架可恢复',async()=>{
 await request('/api/admin/products/'+productId,{method:'PATCH',body:{status:'published'}});
 assert.equal((await request('/api/products/'+slug,{auth:false})).response.status,200);
});
await check('空结果与分页',async()=>{
 assert.equal((await request('/api/products?q=zz-nothing-987345',{auth:false})).data.total,0);
 const r=await request('/api/products?page=2',{auth:false});assert.equal(r.response.status,200);assert.ok(Array.isArray(r.data.products));
});
await check('操作日志',async()=>assert.ok((await request('/api/admin/audit')).data.entries.some(x=>x.entityId===productId)));
await check('退出后会话失效',async()=>{
 assert.equal((await request('/api/admin/logout',{method:'POST',body:{}})).response.status,200);
 assert.equal((await request('/api/admin/session')).response.status,401);
});
mkdirSync('outputs',{recursive:true});
writeFileSync('outputs/http-verification.json',JSON.stringify({at:new Date().toISOString(),base,checks,productId,slug,logoPath},null,2));
console.log(JSON.stringify({checks:checks.length,productId,slug,logoPath}));
