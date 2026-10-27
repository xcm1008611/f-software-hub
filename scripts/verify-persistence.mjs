import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Run after verify-http.mjs, then repeat across restarts, deployments and rollback.
const report = JSON.parse(readFileSync('outputs/http-verification.json', 'utf8'));
const base = process.env.TEST_ORIGIN || report.base;
const response = await fetch(base + '/api/products/' + report.slug);
assert.equal(response.status, 200);
const { product } = await response.json();
assert.equal(product.id, report.productId);
assert.equal(product.name, '验收测试软件已更新');
assert.equal(product.logoPath, report.logoPath);
const image = await fetch(base + report.logoPath);
assert.equal(image.status, 200);
const bytes = Buffer.from(await image.arrayBuffer());
assert.ok(bytes.length > 0);
const catalog = await (await fetch(base + '/api/products')).json();
assert.equal(catalog.total, 25, '初始 24 款产品和 1 条验收记录均应保留');
console.log(JSON.stringify({
  check: 'product-and-image-persistence',
  passed: true,
  total: catalog.total,
  productId: product.id,
  imageSha256: createHash('sha256').update(bytes).digest('hex'),
}));
