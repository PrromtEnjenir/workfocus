import BetterSqlite3 from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './migrations/runner'

let db: BetterSqlite3.Database | null = null

export function initDatabase(): BetterSqlite3.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'workfocus.db')
  console.log(`[DB] Ścieżka: ${dbPath}`)

  db = new BetterSqlite3(dbPath)

  // WAL mode — lepsza wydajność przy odczytach równoległych
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  runMigrations(db)

  console.log('[DB] Baza zainicjowana')
  return db
}

export function getDatabase(): BetterSqlite3.Database {
  if (!db) throw new Error('Baza nie zainicjowana — wywołaj initDatabase() w main.ts')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('[DB] Baza zamknięta')
  }
}
