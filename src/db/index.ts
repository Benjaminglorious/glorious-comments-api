import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { migrate } from './schema';

const dbPath =
  process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'comments.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db: Database.Database = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

migrate(db);

export default db;
