import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assertSameOrigin,authorizeRequest } from '@/lib/auth';
import { uploadsDirectory,getSqlite } from '@/lib/db';
import { addAudit } from '@/lib/store';
import { handle,json,boundedBody } from '@/lib/http';
import { ApiError } from '@/lib/errors';
export function POST(request:Request){return handle(async()=>{
  assertSameOrigin(request);const admin=authorizeRequest(request);
  if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))throw new ApiError('请以文件上传方式提交',415);
  const body=await boundedBody(request,2*1024*1024+65536);
  let form:FormData;try{form=await new Response(new Uint8Array(body),{headers:{'content-type':request.headers.get('content-type')!}}).formData();}catch{throw new ApiError('上传表单格式不正确');}
  const file=form.get('file');if(!(file instanceof File))throw new ApiError('请选择图片');
  if(file.size>2*1024*1024)throw new ApiError('图片最大为 2 MB',413);
  const buffer=Buffer.from(await file.arrayBuffer());
  const mime=buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':buffer[0]===255&&buffer[1]===216&&buffer[2]===255?'image/jpeg':buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'?'image/webp':null;
  if(!mime||file.type!==mime)throw new ApiError('仅支持真实的 PNG、JPEG 或 WebP 图片',415);
  let output:Buffer;try{const image=sharp(buffer,{limitInputPixels:16_000_000,animated:false});const metadata=await image.metadata();if((metadata.pages||1)>1)throw new Error('animated');output=await image.rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).webp({quality:86}).toBuffer();}catch{throw new ApiError('图片无法解析、尺寸过大或包含多帧，请更换图片');}
  getSqlite();const filename=randomUUID()+'.webp';await writeFile(join(uploadsDirectory(),filename),output,{flag:'wx',mode:0o600});
  addAudit(admin.username,'upload','media',filename,'上传产品 Logo');return json({path:'/uploads/'+filename},201);
});}
