import type Database from 'better-sqlite3'
import migration001 from './001_initial.sql?raw'

interface MigrationRow {
  version: number
}

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  { version: 1, sql: migration001 },
]

export function runMigrations(db: Database.Database): void {
  // Tabela kontrolna migracji
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const getApplied = db.prepare<[], MigrationRow>(
    'SELECT version FROM _migrations ORDER BY version'
  )
  const applied = new Set(getApplied.all().map((r) => r.version))

  const insertMigration = db.prepare<[number, string], void>(
    'INSERT INTO _migrations (version, applied_at) VALUES (?, ?)'
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue

    db.exec(migration.sql)
    insertMigration.run(migration.version, new Date().toISOString())

    console.log(`[DB] Migracja ${migration.version} zastosowana`)
  }
}
