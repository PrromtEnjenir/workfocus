// electron/db/repositories/pomodoro.repo.ts
import type Database from 'better-sqlite3'
import { BaseRepo } from './base.repo'
import type { PomodoroSession } from '@/shared/types/global.types'

interface PomodoroRow {
  id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  planned_minutes: number
  completed: number
  interrupted_reason: string | null
  parking_lot: string | null
  created_at: string
}

function rowToModel(row: PomodoroRow): PomodoroSession {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    plannedMinutes: row.planned_minutes,
    completed: row.completed === 1,
    interruptedReason: row.interrupted_reason,
    parkingLot: row.parking_lot ? (JSON.parse(row.parking_lot) as string[]) : [],
    createdAt: row.created_at,
  }
}

export class PomodoroRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  // Tworzy nową sesję i zwraca ją
  start(taskId: string | null, plannedMinutes: number = 25): PomodoroSession {
    const id = this.newId()
    const now = this.now()

    this.db
      .prepare(
        `INSERT INTO pomodoro_sessions (id, task_id, started_at, planned_minutes, completed, parking_lot, created_at)
         VALUES (?, ?, ?, ?, 0, '[]', ?)`
      )
      .run(id, taskId, now, plannedMinutes, now)

    return this.getById(id)!
  }

  // Kończy sesję — completed=true jeśli dobiegła końca, false jeśli przerwana
  stop(id: string, completed: boolean, interruptedReason?: string): void {
    this.db
      .prepare(
        `UPDATE pomodoro_sessions
         SET ended_at = ?, completed = ?, interrupted_reason = ?
         WHERE id = ?`
      )
      .run(this.now(), completed ? 1 : 0, interruptedReason ?? null, id)
  }

  // Dopisz notatkę do parking lot (nie przerywa sesji)
  addParkingLot(id: string, note: string): void {
    const session = this.getById(id)
    if (!session) return

    const updated = [...session.parkingLot, note]
    this.db
      .prepare(`UPDATE pomodoro_sessions SET parking_lot = ? WHERE id = ?`)
      .run(JSON.stringify(updated), id)
  }

  getById(id: string): PomodoroSession | null {
    const row = this.db
      .prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`)
      .get(id) as PomodoroRow | undefined

    return row ? rowToModel(row) : null
  }

  // Historia sesji — opcjonalnie filtrowana po tasku
  getHistory(taskId?: string): PomodoroSession[] {
    const rows = taskId
      ? (this.db
          .prepare(`SELECT * FROM pomodoro_sessions WHERE task_id = ? ORDER BY started_at DESC LIMIT 50`)
          .all(taskId) as PomodoroRow[])
      : (this.db
          .prepare(`SELECT * FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 50`)
          .all() as PomodoroRow[])

    return rows.map(rowToModel)
  }

  // Ile sesji ukończono dziś — do StatCards
  countCompletedToday(): { completed: number; total: number } {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const result = this.db
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(completed) as completed
         FROM pomodoro_sessions
         WHERE started_at >= ?`
      )
      .get(startOfDay.toISOString()) as { total: number; completed: number | null }

    return {
      total: result.total,
      completed: result.completed ?? 0,
    }
  }

  // Suma minut focus dziś — do StatCards
  focusMinutesToday(): number {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const result = this.db
      .prepare(
        `SELECT SUM(planned_minutes) as total
         FROM pomodoro_sessions
         WHERE started_at >= ? AND completed = 1`
      )
      .get(startOfDay.toISOString()) as { total: number | null }

    return result.total ?? 0
  }
}
