import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getSqlite } from '../lib/db';
import { initializeAdmin } from '../lib/auth';
import { importCatalog } from '../lib/store';

try {
  getSqlite();
  const admin=initializeAdmin(process.env.ADMIN_INITIAL_PASSWORD);
  const catalog=JSON.parse(readFileSync(resolve(process.env.SEED_FILE || 'data/catalog.json'),'utf8'));
  if(!Array.isArray(catalog.categories)||!Array.isArray(catalog.products))throw new Error('种子文件需要 categories 和 products 数组');
  const seed=importCatalog(catalog);
  console.log(JSON.stringify({database:'ready',administrator:admin.created?'created':'preserved',catalog:seed.imported?'imported':'preserved'}));
} catch(error) {
  console.error('数据库初始化失败：',error instanceof Error?error.message:'未知错误');process.exitCode=1;
}
