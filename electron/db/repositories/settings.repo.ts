import { BaseRepo } from './base.repo'

export class SettingsRepo extends BaseRepo {
  get(key: string): unknown {
    const row = this.db
      .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
      .get(key)

    if (!row) return null
    return JSON.parse(row.value)
  }

  set(key: string, value: unknown): void {
    this.db
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      )
      .run(key, JSON.stringify(value))
  }

  getAll(): Record<string, unknown> {
    const rows = this.db
      .prepare<[], { key: string; value: string }>('SELECT key, value FROM settings')
      .all()

    return Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]))
  }
}
