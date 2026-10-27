CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE products (
 id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, company TEXT NOT NULL,
 website_url TEXT NOT NULL, logo_path TEXT, tagline TEXT NOT NULL, description TEXT NOT NULL,
 category_id TEXT NOT NULL REFERENCES categories(id), tags TEXT NOT NULL DEFAULT '[]', use_cases TEXT NOT NULL DEFAULT '[]', features TEXT NOT NULL DEFAULT '[]',
 cautions TEXT NOT NULL DEFAULT '', pricing_type TEXT NOT NULL CHECK(pricing_type IN ('free','freemium','trial','paid','contact','unknown')),
 pricing_note TEXT NOT NULL DEFAULT '', chinese INTEGER NOT NULL DEFAULT 0 CHECK(chinese IN(0,1)), featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN(0,1)),
 sort_order INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','published','unpublished')),
 source_url TEXT NOT NULL, verified_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX product_public_order ON products(status, sort_order);
CREATE INDEX product_category ON products(category_id);
CREATE TABLE admins (id TEXT PRIMARY KEY NOT NULL, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY NOT NULL, admin_id TEXT NOT NULL REFERENCES admins(id), expires_at INTEGER NOT NULL);
CREATE INDEX session_expiry ON sessions(expires_at);
CREATE TABLE login_limits (key TEXT PRIMARY KEY NOT NULL, failures INTEGER NOT NULL DEFAULT 0, window_start INTEGER NOT NULL, blocked_until INTEGER NOT NULL DEFAULT 0);
CREATE TABLE audit (id TEXT PRIMARY KEY NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX audit_time ON audit(created_at);
CREATE TABLE metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
