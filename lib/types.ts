export type ProductStatus = 'draft' | 'published' | 'unpublished';
export type PricingType = 'free' | 'freemium' | 'trial' | 'paid' | 'contact' | 'unknown';
export interface Category { id: string; slug: string; name: string; description: string; sortOrder: number; }
export interface Product {
 id: string; slug: string; name: string; company: string; websiteUrl: string; logoPath: string | null;
 tagline: string; description: string; categoryId: string; category?: Category;
 tags: string[]; useCases: string[]; features: string[]; cautions: string;
 pricingType: PricingType; pricingNote: string; chinese: boolean; featured: boolean; sortOrder: number;
 status: ProductStatus; sourceUrl: string; verifiedAt: string; createdAt: string; updatedAt: string;
}
export type ProductInput = Omit<Product, 'id'|'category'|'createdAt'|'updatedAt'>;
export interface ProductFilters { q?: string; category?: string; chinese?: boolean; pricing?: PricingType; sort?: 'recommended'|'latest'; page?: number; pageSize?: number; status?: ProductStatus; }
export interface ProductList { products: Product[]; total: number; page: number; pageSize: number; categories: Category[]; statusCounts?: Record<ProductStatus, number>; }
export interface Admin { id: string; username: string; }
export interface AuditEntry { id: string; actor: string; action: string; entityType: string; entityId: string; detail: string; createdAt: string; }
export const pricingLabels: Record<PricingType,string> = {free:'免费使用',freemium:'有免费方案',trial:'提供试用',paid:'付费使用',contact:'联系询价',unknown:'查看官网'};
export const statusLabels: Record<ProductStatus,string> = {draft:'草稿',published:'已上架',unpublished:'已下架'};
