// electron/db/repositories/history.repo.ts
import type Database from 'better-sqlite3'
import { BaseRepo } from './base.repo'
import type {
  Area,
  FrictionReason,
  HistoryFilters,
  TaskHistoryEntry,
} from '@/shared/types/global.types'

interface HistoryRow {
  id: string
  task_id: string
  title: string
  tag_id: string | null
  area: string
  estimated_minutes: number | null
  actual_minutes: number | null
  post_mortem: string | null
  friction_reason: string | null
  priority_accurate: number | null
  completed_at: string
}

function rowToModel(row: HistoryRow): TaskHistoryEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    tagId: row.tag_id,
    area: row.area as Area,
    estimatedMinutes: row.estimated_minutes,
    actualMinutes: row.actual_minutes,
    postMortem: row.post_mortem,
    frictionReason: row.friction_reason as FrictionReason | null,
    priorityAccurate: row.priority_accurate === null ? null : row.priority_accurate === 1,
    completedAt: row.completed_at,
  }
}

export class HistoryRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  getAll(area: Area, filters?: HistoryFilters): TaskHistoryEntry[] {
    const conditions: string[] = ['area = ?']
    const params: unknown[] = [area]

    if (filters?.tagId) {
      conditions.push('tag_id = ?')
      params.push(filters.tagId)
    }

    if (filters?.from) {
      conditions.push('completed_at >= ?')
      params.push(filters.from)
    }

    if (filters?.to) {
      conditions.push('completed_at <= ?')
      params.push(filters.to)
    }

    const sql = `
      SELECT * FROM task_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY completed_at DESC
      LIMIT 100
    `

    const rows = this.db.prepare(sql).all(...params) as HistoryRow[]
    return rows.map(rowToModel)
  }

  getById(id: string): TaskHistoryEntry | null {
    const row = this.db
      .prepare(`SELECT * FROM task_history WHERE id = ?`)
      .get(id) as HistoryRow | undefined

    return row ? rowToModel(row) : null
  }
}
