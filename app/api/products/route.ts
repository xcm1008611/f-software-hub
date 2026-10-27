import { listProducts } from '@/lib/store';
import { handle,json,parseFilters } from '@/lib/http';
export const dynamic='force-dynamic';
export function GET(request:Request){return handle(()=>json(listProducts(parseFilters(request))));}
