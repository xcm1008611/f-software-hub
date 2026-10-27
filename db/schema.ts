import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), name: text('name').notNull(),
  description: text('description').notNull().default(''), sortOrder: integer('sort_order').notNull().default(0),
});
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), name: text('name').notNull(),
  company: text('company').notNull(), websiteUrl: text('website_url').notNull(), logoPath: text('logo_path'),
  tagline: text('tagline').notNull(), description: text('description').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  tags: text('tags', { mode:'json' }).$type<string[]>().notNull().default([]),
  useCases: text('use_cases', { mode:'json' }).$type<string[]>().notNull().default([]),
  features: text('features', { mode:'json' }).$type<string[]>().notNull().default([]),
  cautions: text('cautions').notNull().default(''), pricingType: text('pricing_type').notNull(),
  pricingNote: text('pricing_note').notNull().default(''), chinese: integer('chinese', {mode:'boolean'}).notNull().default(false),
  featured: integer('featured', {mode:'boolean'}).notNull().default(false), sortOrder: integer('sort_order').notNull().default(0),
  status: text('status').notNull().default('draft'), sourceUrl: text('source_url').notNull(),
  verifiedAt: text('verified_at').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, table => [index('product_public_order').on(table.status, table.sortOrder),index('product_category').on(table.categoryId)]);
export const admins = sqliteTable('admins', {
  id:text('id').primaryKey(), username:text('username').notNull().unique(), passwordHash:text('password_hash').notNull(), createdAt:text('created_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
  tokenHash:text('token_hash').primaryKey(), adminId:text('admin_id').notNull().references(()=>admins.id), expiresAt:integer('expires_at').notNull(),
});
export const audit = sqliteTable('audit', {
  id:text('id').primaryKey(), actor:text('actor').notNull(), action:text('action').notNull(), entityType:text('entity_type').notNull(), entityId:text('entity_id').notNull(), detail:text('detail').notNull(), createdAt:text('created_at').notNull(),
});
