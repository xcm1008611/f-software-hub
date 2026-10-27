// Add a reviewed catalog batch through the authenticated admin API.
// Defaults to a dry run. Existing products are always skipped, never overwritten.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { productSchema } from '../lib/validation.ts';

const file = process.argv[2];
assert.ok(file && !file.startsWith('--'), '用法：node --import tsx scripts/import-products.mjs <资料JSON> [--apply]');
const apply = process.argv.includes('--apply');
const base = process.env.IMPORT_ORIGIN || 'http://127.0.0.1:3180';
const destination = new URL(base);
assert.ok(['127.0.0.1', 'localhost'].includes(destination.hostname), '请先通过 SSH 隧道连接；此脚本仅向本机入口发送管理员凭据。');
assert.ok(['http:', 'https:'].includes(destination.protocol));
assert.ok(!destination.username && !destination.password && destination.pathname === '/');
const source = JSON.parse(readFileSync(file, 'utf8'));
assert.ok(Array.isArray(source.products) && source.products.length > 0);
assert.equal(new Set(source.products.map(p => p.slug)).size, source.products.length, '批次中不能出现重复地址标识');
let cookie = '';
const report = { file: basename(file), at: new Date().toISOString(), applied: apply, created: [], skipped: [] };
mkdirSync('outputs', { recursive: true });
const reportFile = `outputs/import-${basename(file, '.json')}-${apply ? 'applied' : 'dry-run'}.json`;
const save = () => writeFileSync(reportFile, JSON.stringify(report, null, 2));

async function request(path, method = 'GET', body) {
  const response = await fetch(base.replace(/\/$/, '') + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Origin: destination.origin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}：${response.status} ${data.error || '请求失败'}`);
  return { response, data };
}

try {
  const password = readFileSync(process.env.IMPORT_PASSWORD_FILE || '.runtime/admin-initial-password', 'utf8').trim();
  const login = await request('/api/admin/login', 'POST', { username: 'admin', password });
  cookie = login.response.headers.get('set-cookie')?.split(';')[0] || '';
  assert.ok(cookie, '未获得管理员会话');
  const { categories } = (await request('/api/admin/categories')).data;
  // Validate every record before performing the first write.
  const products = source.products.map(input => {
    const category = categories.find(c => c.id === input.categoryId || c.slug === input.categoryId);
    assert.ok(category, `${input.name}：找不到分类 ${input.categoryId}`);
    return productSchema.parse({ ...input, categoryId: category.id });
  });
  const existing = new Set();
  for (let page = 1; ; page++) {
    const data = (await request(`/api/admin/products?pageSize=100&page=${page}`)).data;
    for (const product of data.products) existing.add(product.slug);
    if (page * data.pageSize >= data.total) break;
  }
  for (const product of products) {
    if (existing.has(product.slug)) {
      report.skipped.push({ slug: product.slug, reason: '已存在，保留后台资料与状态' });
      console.log('SKIP ' + product.name);
    } else if (apply) {
      const { product: created } = (await request('/api/admin/products', 'POST', product)).data;
      report.created.push({ id: created.id, slug: created.slug, name: created.name, status: created.status });
      existing.add(created.slug);
      console.log('CREATED ' + created.name);
    } else {
      report.created.push({ slug: product.slug, name: product.name, status: product.status });
      console.log('READY ' + product.name);
    }
    save();
  }
  console.log(JSON.stringify({ apply, added: report.created.length, skipped: report.skipped.length, report: reportFile }));
} catch (error) {
  save();
  throw error;
} finally {
  if (cookie) await request('/api/admin/logout', 'POST', {}).catch(() => {});
}
