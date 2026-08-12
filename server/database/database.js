import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const databasePath = resolve(process.env.DATABASE_PATH || 'storage/upelkes.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })
export const db = new DatabaseSync(databasePath)
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')

db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
const directory = new URL('./migrations/', import.meta.url)
for (const name of readdirSync(directory).filter((file) => file.endsWith('.sql')).sort()) {
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get(name)) {
    db.exec(readFileSync(new URL(name, directory), 'utf8'))
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(name)
  }
}

export function transaction(callback) { db.exec('BEGIN'); try { const result = callback(); db.exec('COMMIT'); return result } catch (error) { db.exec('ROLLBACK'); throw error } }
