import { z } from 'zod';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { uploadsDirectory } from './db';

const text = (max:number,min=0) => z.string().trim().min(min).max(max);
const url = text(2048,1).refine(value=>{try { const u=new URL(value); return ['https:','http:'].includes(u.protocol) && !u.username && !u.password; } catch {return false;}},'请输入有效的 http 或 https 链接');
const list = z.array(text(100,1)).max(20);
export const statusSchema = z.enum(['draft','published','unpublished']);
export const pricingSchema = z.enum(['free','freemium','trial','paid','contact','unknown']);
export const productSchema = z.object({
  slug:text(100,1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'标识仅支持小写英文字母、数字和连字符'),
  name:text(120,1), company:text(160,1), websiteUrl:url, logoPath:z.string().nullable().default(null).refine(value=>!value || /^\/uploads\/[a-f0-9-]+\.webp$/.test(value),'请上传产品 Logo').refine(value=>!value||existsSync(join(uploadsDirectory(),value.split('/').pop()!)),'Logo 文件不存在'),
  tagline:text(240,1), description:text(16000,1), categoryId:text(120,1), tags:list.default([]), useCases:list.default([]), features:list.default([]),
  cautions:text(4000).default(''), pricingType:pricingSchema.default('unknown'), pricingNote:text(2000).default(''), chinese:z.boolean().default(false), featured:z.boolean().default(false),
  sortOrder:z.number().int().min(-100000).max(100000).default(0), status:statusSchema.default('draft'), sourceUrl:url,
  verifiedAt:text(40,1).refine(v=>/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v)&&!Number.isNaN(Date.parse(v)),'请输入有效的核对日期'),
}).strict();
export const categorySchema = z.object({slug:text(100,1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),name:text(80,1),description:text(500).default(''),sortOrder:z.number().int().min(-100000).max(100000).default(0)}).strict();
export const loginSchema=z.object({username:text(80,1),password:z.string().min(1).max(256)}).strict();
export const passwordSchema=z.object({currentPassword:z.string().min(1).max(256),newPassword:z.string().min(12,'密码至少 12 位').max(256)}).strict();
