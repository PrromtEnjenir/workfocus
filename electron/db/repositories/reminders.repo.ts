// electron/db/repositories/reminders.repo.ts
import type Database from 'better-sqlite3'
import { BaseRepo } from './base.repo'
import type {
  ReminderModel,
  ReminderWithTask,
  CreateReminderDTO,
  ReminderType,
} from '@/shared/types/global.types'

interface ReminderRow {
  id: string
  task_id: string
  remind_at: string
  type: ReminderType
  recurrence_days: number | null
  followup_after_days: number | null
  dismissed_at: string | null
  fired_at: string | null
  created_at: string
}

function rowToModel(row: ReminderRow): ReminderModel {
  return {
    id: row.id,
    taskId: row.task_id,
    remindAt: row.remind_at,
    type: row.type,
    recurrenceDays: row.recurrence_days,
    followupAfterDays: row.followup_after_days,
    dismissedAt: row.dismissed_at,
    firedAt: row.fired_at,
    createdAt: row.created_at,
  }
}

export class RemindersRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  create(dto: CreateReminderDTO): ReminderModel {
    const id = this.newId()
    const now = this.now()

    this.db
      .prepare(
        `INSERT INTO reminders (id, task_id, remind_at, type, recurrence_days, followup_after_days, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        dto.taskId,
        dto.remindAt,
        dto.type,
        dto.recurrenceDays ?? null,
        dto.followupAfterDays ?? null,
        now
      )

    return this.getById(id)!
  }

  getById(id: string): ReminderModel | null {
    const row = this.db
      .prepare(`SELECT * FROM reminders WHERE id = ?`)
      .get(id) as ReminderRow | undefined

    return row ? rowToModel(row) : null
  }

  // Wywoływane przez scheduler co minutę
  getDue(): ReminderWithTask[] {
    const now = this.now()

    const rows = this.db
      .prepare(
        `SELECT r.*, t.title as task_title, t.area as task_area
         FROM reminders r
         JOIN tasks t ON t.id = r.task_id
         WHERE r.dismissed_at IS NULL
           AND r.remind_at <= ?
           AND r.fired_at IS NULL
           AND t.deleted_at IS NULL
           AND t.status IN ('active', 'someday')
         ORDER BY r.remind_at ASC`
      )
      .all(now) as Array<ReminderRow & { task_title: string; task_area: string }>

    return rows.map((row) => ({
      ...rowToModel(row),
      taskTitle: row.task_title,
      taskArea: row.task_area,
    }))
  }

  getToday(): ReminderWithTask[] {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const rows = this.db
      .prepare(
        `SELECT r.*, t.title as task_title, t.area as task_area
         FROM reminders r
         JOIN tasks t ON t.id = r.task_id
         WHERE r.dismissed_at IS NULL
           AND r.remind_at BETWEEN ? AND ?
           AND t.deleted_at IS NULL
           AND t.status IN ('active', 'someday')
         ORDER BY r.remind_at ASC`
      )
      .all(startOfDay.toISOString(), endOfDay.toISOString()) as Array<
      ReminderRow & { task_title: string; task_area: string }
    >

    return rows.map((row) => ({
      ...rowToModel(row),
      taskTitle: row.task_title,
      taskArea: row.task_area,
    }))
  }

  getUpcoming(days: number = 7): ReminderWithTask[] {
    const now = this.now()
    const future = new Date()
    future.setDate(future.getDate() + days)

    const rows = this.db
      .prepare(
        `SELECT r.*, t.title as task_title, t.area as task_area
         FROM reminders r
         JOIN tasks t ON t.id = r.task_id
         WHERE r.dismissed_at IS NULL
           AND r.remind_at BETWEEN ? AND ?
           AND t.deleted_at IS NULL
           AND t.status IN ('active', 'someday')
         ORDER BY r.remind_at ASC
         LIMIT 20`
      )
      .all(now, future.toISOString()) as Array<
      ReminderRow & { task_title: string; task_area: string }
    >

    return rows.map((row) => ({
      ...rowToModel(row),
      taskTitle: row.task_title,
      taskArea: row.task_area,
    }))
  }

  getByTaskId(taskId: string): ReminderModel[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM reminders
         WHERE task_id = ? AND dismissed_at IS NULL
         ORDER BY remind_at ASC`
      )
      .all(taskId) as ReminderRow[]

    return rows.map(rowToModel)
  }

  markFired(id: string): void {
    const now = this.now()
    const reminder = this.getById(id)
    if (!reminder) return

    if (reminder.type === 'recurring' && reminder.recurrenceDays) {
      const nextDate = new Date(reminder.remindAt)
      nextDate.setDate(nextDate.getDate() + reminder.recurrenceDays)
      this.db
        .prepare(`UPDATE reminders SET fired_at = ?, remind_at = ? WHERE id = ?`)
        .run(now, nextDate.toISOString(), id)
    } else {
      this.db
        .prepare(`UPDATE reminders SET fired_at = ? WHERE id = ?`)
        .run(now, id)
    }
  }

  dismiss(id: string): void {
    this.db
      .prepare(`UPDATE reminders SET dismissed_at = ? WHERE id = ?`)
      .run(this.now(), id)
  }

  snooze(id: string, until: string): void {
    this.db
      .prepare(`UPDATE reminders SET remind_at = ?, fired_at = NULL WHERE id = ?`)
      .run(until, id)
  }

  countPendingFollowups(area?: string): number {
    const now = this.now()

    if (area) {
      const result = this.db
        .prepare(
          `SELECT COUNT(*) as count
           FROM reminders r
           JOIN tasks t ON t.id = r.task_id
           WHERE r.type = 'followup'
             AND r.dismissed_at IS NULL
             AND r.fired_at IS NULL
             AND r.remind_at <= ?
             AND t.area = ?
             AND t.deleted_at IS NULL
             AND t.status = 'active'`
        )
        .get(now, area) as { count: number }
      return result.count
    }

    const result = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM reminders r
         JOIN tasks t ON t.id = r.task_id
         WHERE r.type = 'followup'
           AND r.dismissed_at IS NULL
           AND r.fired_at IS NULL
           AND r.remind_at <= ?
           AND t.deleted_at IS NULL
           AND t.status = 'active'`
      )
      .get(now) as { count: number }
    return result.count
  }
}
