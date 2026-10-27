import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { categories, products, audit } from '../db/schema';
import { getDb, getSqlite } from './db';
import { productSchema, categorySchema } from './validation';
import type { Product, ProductFilters, ProductList, Category, Admin, ProductStatus } from './types';

export function listCategories():Category[] { return getDb().select().from(categories).orderBy(asc(categories.sortOrder),asc(categories.name)).all(); }
function hydrate(row:typeof products.$inferSelect):Product {
  return {...row, pricingType:row.pricingType as Product['pricingType'],status:row.status as ProductStatus, category:getDb().select().from(categories).where(eq(categories.id,row.categoryId)).get()};
}
export function listProducts(filters:ProductFilters={}, admin=false):ProductList {
  const db=getDb(); const conditions:SQL[]=[];
  if(!admin) conditions.push(eq(products.status,'published'));
  else if(filters.status) conditions.push(eq(products.status,filters.status));
  if(filters.category) { const cat=db.select().from(categories).where(eq(categories.slug,filters.category)).get(); conditions.push(eq(products.categoryId,cat?.id || '__missing_category__')); }
  if(filters.chinese) conditions.push(eq(products.chinese,true));
  if(filters.pricing) conditions.push(eq(products.pricingType,filters.pricing));
  const query=(filters.q||'').trim().slice(0,120);
  if(query) for(const term of query.split(/\s+/).slice(0,8)) {
    const escaped=term.toLowerCase().replace(/[!%_]/g, '!$&');
    conditions.push(sql`lower(${products.name} || ' ' || ${products.company} || ' ' || ${products.tagline} || ' ' || ${products.description} || ' ' || ${products.tags} || ' ' || ${products.useCases} || ' ' || ${products.features}) LIKE ${'%'+escaped+'%'} ESCAPE '!'`);
  }
  const where=conditions.length?and(...conditions):undefined;
  const total=db.select({count:sql<number>`count(*)`}).from(products).where(where).get()!.count;
  const pageSize=Math.min(100,Math.max(1,Math.trunc(filters.pageSize||12)));
  const page=Math.min(Math.max(1,Math.trunc(filters.page||1)),Math.max(1,Math.ceil(total/pageSize)));
  const order=filters.sort==='latest'?[desc(products.createdAt),asc(products.id)]:[desc(products.featured),asc(products.sortOrder),desc(products.createdAt),asc(products.id)];
  const rows=db.select().from(products).where(where).orderBy(...order).limit(pageSize).offset((page-1)*pageSize).all();
  const result:ProductList={products:rows.map(hydrate),total,page,pageSize,categories:listCategories()};
  if(admin) { result.statusCounts={draft:0,published:0,unpublished:0}; for(const row of db.select({status:products.status,count:sql<number>`count(*)`}).from(products).groupBy(products.status).all()) result.statusCounts[row.status as ProductStatus]=row.count; }
  return result;
}
export function getProductBySlug(slug:string,includePrivate=false):Product|null {
  const row=getDb().select().from(products).where(includePrivate?eq(products.slug,slug):and(eq(products.slug,slug),eq(products.status,'published'))).get();
  return row?hydrate(row):null;
}
export function getProductById(id:string):Product|null { const row=getDb().select().from(products).where(eq(products.id,id)).get(); return row?hydrate(row):null; }
export function addAudit(actor:string,action:string,entityType:string,entityId:string,detail:string) {
  getDb().insert(audit).values({id:randomUUID(),actor,action,entityType,entityId,detail:detail.slice(0,2000),createdAt:new Date().toISOString()}).run();
}
export function listAudit() { return getDb().select().from(audit).orderBy(desc(audit.createdAt)).limit(200).all(); }
export function createProduct(input:unknown,admin:Admin):Product {
  const parsed=productSchema.parse(input); const db=getDb();
  if(!db.select().from(categories).where(eq(categories.id,parsed.categoryId)).get()) throw new Error('分类不存在');
  const now=new Date().toISOString(); const id=randomUUID();
  db.transaction(tx=>{tx.insert(products).values({...parsed,id,createdAt:now,updatedAt:now}).run();addAudit(admin.username,'create','product',id,`新增产品：${parsed.name}`);});
  return getProductById(id)!;
}
export function updateProduct(id:string,input:unknown,admin:Admin):Product {
  const existing=getProductById(id); if(!existing) throw new Error('产品不存在');
  const validated=productSchema.partial().parse(input);
  // Zod defaults still run inside partial objects; only explicitly submitted keys are updates.
  const partial=Object.fromEntries(Object.keys(input as object).map(key=>[key,validated[key as keyof typeof validated]]));
  if(Object.keys(partial).length===0) throw new Error('没有需要更新的内容');
  const {id:_,category,createdAt,updatedAt,...base}=existing;
  const parsed=productSchema.parse({...base,...partial}); const db=getDb();
  if(!db.select().from(categories).where(eq(categories.id,parsed.categoryId)).get()) throw new Error('分类不存在');
  db.transaction(tx=> {tx.update(products).set({...parsed,updatedAt:new Date().toISOString()}).where(eq(products.id,id)).run();addAudit(admin.username,parsed.status!==existing.status?parsed.status:'update','product',id,`${existing.name}：${parsed.status!==existing.status?existing.status+' → '+parsed.status:'编辑资料'}`);});
  return getProductById(id)!;
}
export function createCategory(input:unknown,admin:Admin):Category {
  const parsed=categorySchema.parse(input);const item={...parsed,id:randomUUID()};
  getDb().transaction(tx=>{tx.insert(categories).values(item).run();addAudit(admin.username,'create','category',item.id,`新增分类：${item.name}`);}); return item;
}
export function updateCategory(id:string,input:unknown,admin:Admin):Category {
  const db=getDb(),existing=db.select().from(categories).where(eq(categories.id,id)).get();if(!existing)throw new Error('分类不存在');
  const validated=categorySchema.partial().parse(input);const partial=Object.fromEntries(Object.keys(input as object).map(key=>[key,validated[key as keyof typeof validated]]));const {id:_,...base}=existing;const parsed=categorySchema.parse({...base,...partial});
  db.transaction(tx=>{tx.update(categories).set(parsed).where(eq(categories.id,id)).run();addAudit(admin.username,'update','category',id,`编辑分类：${parsed.name}`);});return {...parsed,id};
}
export function importCatalog(catalog:{categories:unknown[];products:unknown[]}) {
  const db=getDb(),native=getSqlite();
  if(native.prepare('SELECT value FROM metadata WHERE key = ?').get('initial_catalog'))return {imported:false};
  db.transaction(tx=>{
    for(const input of catalog.categories) {const {id,...values}=input as Category;const parsed=categorySchema.parse(values);tx.insert(categories).values({...parsed,id:id||randomUUID()}).onConflictDoNothing().run();}
    for(const input of catalog.products) {const {id,category,createdAt,updatedAt,...values}=input as Product;const parsed=productSchema.parse(values);const now=new Date().toISOString();tx.insert(products).values({...parsed,id:id||randomUUID(),createdAt:createdAt||now,updatedAt:updatedAt||now}).onConflictDoNothing({target:products.slug}).run();}
    native.prepare('INSERT INTO metadata (key,value) VALUES (?,?)').run('initial_catalog',new Date().toISOString());
  });return {imported:true};
}
