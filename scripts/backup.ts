import { mkdir, mkdtemp, writeFile, cp, readdir, stat, rm, chmod, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { getSqlite,uploadsDirectory } from '../lib/db';

const backupDir=resolve(process.env.BACKUP_DIR || '.runtime/backups');
let temp:string|undefined;
let partial:string|undefined;
try {
  await mkdir(backupDir,{recursive:true,mode:0o700});
  temp=await mkdtemp(join(backupDir,'.f-hub-backup-'));
  await getSqlite().backup(join(temp,'hub.sqlite'));
  const snapshot=new Database(join(temp,'hub.sqlite'),{readonly:true,fileMustExist:true});
  try { if(snapshot.pragma('integrity_check',{simple:true})!=='ok')throw new Error('备份数据库完整性校验失败'); }
  finally { snapshot.close(); }
  if(existsSync(uploadsDirectory()))await cp(uploadsDirectory(),join(temp,'uploads'),{recursive:true});
  await writeFile(join(temp,'manifest.json'),JSON.stringify({format:1,application:'f-software-hub',createdAt:new Date().toISOString(),database:'hub.sqlite',uploads:'uploads'},null,2),{mode:0o600});
  const filename=`f-hub-backup-${new Date().toISOString().replace(/[:.]/g,'-')}-${process.pid}.tar.gz`;
  const archive=join(backupDir,filename);
  // Only completed, verified archives may enter retention. A failed tar must never evict a good backup.
  partial=archive+'.partial';
  const result=spawnSync('tar',['-czf',partial,'-C',temp,'.'],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr||'打包失败');
  await chmod(partial,0o600);
  const verification=spawnSync('tar',['-tzf',partial],{encoding:'utf8'});
  if(verification.status!==0)throw new Error(verification.stderr||'备份归档校验失败');
  const entries=verification.stdout.split('\n').map(entry=>entry.replace(/^\.\//,''));
  if(!entries.includes('hub.sqlite')||!entries.includes('manifest.json'))throw new Error('备份归档缺少数据库或清单');
  await rename(partial,archive);
  partial=undefined;
  const archives=await Promise.all((await readdir(backupDir)).filter(f=>/^f-hub-backup-[0-9TZ.-]+-[0-9]+\.tar\.gz$/.test(f)).map(async f=>({name:f,mtime:(await stat(join(backupDir,f))).mtimeMs})));
  archives.sort((a,b)=>b.mtime-a.mtime);
  for(const old of archives.slice(7))await rm(join(backupDir,old.name));
  console.log(JSON.stringify({backup:archive,retained:Math.min(archives.length,7)}));
}catch(error){console.error('备份失败：',error instanceof Error?error.message:'未知错误');process.exitCode=1;}
finally{
  if(partial)await rm(partial,{force:true});
  if(temp)await rm(temp,{recursive:true,force:true});
}
