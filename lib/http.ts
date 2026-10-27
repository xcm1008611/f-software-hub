import { ZodError } from 'zod';
import { ApiError } from './errors';
import type { ProductFilters } from './types';
import { pricingSchema,statusSchema } from './validation';
export function json(value:unknown,status=200,headers:Record<string,string>={}) {return Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});}
export async function boundedBody(request:Request,limit:number) {
  const declared=Number(request.headers.get('content-length')||0);if(declared>limit)throw new ApiError('提交内容过大',413);
  const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new ApiError('提交内容过大',413);}chunks.push(value);}
  return Buffer.concat(chunks);
}
export async function readJson(request:Request) {if(!request.headers.get('content-type')?.includes('application/json'))throw new ApiError('请使用 JSON 提交',415);try{return JSON.parse((await boundedBody(request,128*1024)).toString('utf8'));}catch(error){if(error instanceof ApiError)throw error;throw new ApiError('JSON 格式不正确');}}
export function parseFilters(request:Request,admin=false):ProductFilters {
  const p=new URL(request.url).searchParams;const page=Number(p.get('page')||1),pageSize=Number(p.get('pageSize')||12);
  if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>100)throw new ApiError('分页参数不正确');
  const filters:ProductFilters={q:p.get('q')?.slice(0,120),category:p.get('category')||undefined,chinese:p.get('chinese')==='1',page,pageSize};
  if(p.get('pricing'))filters.pricing=pricingSchema.parse(p.get('pricing'));
  const sort=p.get('sort');if(sort&&sort!=='recommended'&&sort!=='latest')throw new ApiError('排序参数不正确');filters.sort=(sort||'recommended') as ProductFilters['sort'];
  if(admin&&p.get('status'))filters.status=statusSchema.parse(p.get('status'));
  return filters;
}
export async function handle(action:()=>Response|Promise<Response>):Promise<Response> {try{return await action();}catch(error){
  if(error instanceof ApiError)return json({error:error.message},error.status);
  if(error instanceof ZodError)return json({error:error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).slice(0,4).join('；')},400);
  if(error instanceof Error&&error.message.includes('UNIQUE constraint'))return json({error:'标识已存在，请使用其他英文标识'},409);
  if(error instanceof Error&&['分类不存在','产品不存在'].includes(error.message))return json({error:error.message},404);
  if(error instanceof Error&&error.message==='没有需要更新的内容')return json({error:error.message},400);
  console.error('Request failed:',error instanceof Error?error.name:'UnknownError');return json({error:'服务暂时不可用，请稍后重试'},500);
}}
