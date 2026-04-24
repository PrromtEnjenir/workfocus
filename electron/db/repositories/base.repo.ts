import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export class BaseRepo {
  constructor(protected db: Database.Database) {}

  protected newId(): string {
    return randomUUID()
  }

  protected now(): string {
    return new Date().toISOString()
  }

  protected softDelete(table: string, id: string): void {
    this.db
      .prepare(`UPDATE ${table} SET deleted_at = ? WHERE id = ?`)
      .run(this.now(), id)
  }

  protected logChange(
    taskId: string,
    field: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    this.db
      .prepare(
        `INSERT INTO task_changelog (id, task_id, field, old_value, new_value, changed_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(this.newId(), taskId, field, oldValue, newValue, this.now())
  }

  // Pomocnicza do budowania WHERE dla active rekordów z area filter
  protected activeWhere(area?: string): { clause: string; params: string[] } {
    const conditions: string[] = ['deleted_at IS NULL']
    const params: string[] = []

    if (area) {
      conditions.push('area = ?')
      params.push(area)
    }

    return {
      clause: `WHERE ${conditions.join(' AND ')}`,
      params,
    }
  }
}
