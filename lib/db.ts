import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as schema from '../db/schema';

export function dataDirectory() { return resolve(process.env.DATA_DIR || '.runtime'); }
export function uploadsDirectory() { return join(dataDirectory(), 'uploads'); }
const connections = new Map<string, Database.Database>();
export function getSqlite() {
  const directory = dataDirectory();
  const cached = connections.get(directory);
  if (cached) return cached;
  mkdirSync(directory, {recursive:true, mode:0o700});
  mkdirSync(uploadsDirectory(), {recursive:true, mode:0o700});
  const db = new Database(join(directory, 'hub.sqlite'));
  db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON'); db.pragma('busy_timeout = 5000');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)');
  const migrations = resolve(process.env.MIGRATIONS_DIR || 'db/migrations');
  for (const file of readdirSync(migrations).filter(f=>/^\d+.*\.sql$/.test(f)).sort()) {
    if (!db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(file)) {
      db.transaction(()=> { db.exec(readFileSync(join(migrations,file),'utf8')); db.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run(file,new Date().toISOString()); })();
    }
  }
  connections.set(directory, db);
  return db;
}
export function getDb() { return drizzle(getSqlite(), {schema}); }
export function closeDatabase() { const key=dataDirectory(); connections.get(key)?.close(); connections.delete(key); }
