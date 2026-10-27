import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { uploadsDirectory } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}){
  const {filename}=await params;if(!/^[a-f0-9-]{36}\.webp$/.test(filename))return new Response(null,{status:404});
  try{const bytes=await readFile(join(uploadsDirectory(),filename));return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}catch{return new Response(null,{status:404});}
}
