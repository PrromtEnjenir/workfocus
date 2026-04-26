// electron/db/repositories/stats.repo.ts
import type Database from 'better-sqlite3'
import { BaseRepo } from './base.repo'
import type {
  Area,
  StreakData,
  EstimationAccuracy,
  WeeklyThroughput,
  TimePerTag,
} from '@/shared/types/global.types'

interface StreakRow {
  completed_day: string
}

interface EfficiencyRow {
  ratio: number | null
}

interface ThroughputRow {
  week_start: string
  count: number
}

interface TimePerTagRow {
  tag_name: string | null
  total_minutes: number
}

interface AccuracyRow {
  tag_name: string | null
  tag_id: string | null
  avg_estimated: number | null
  avg_actual: number | null
  ratio: number | null
  sample_count: number
}

export class StatsRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  /**
   * Streak = ile kolejnych dni (wstecz od dziś/wczoraj) był ukończony >= 1 task.
   * Nie karamy za brak tasków dziś jeśli wczoraj był streak — liczymy od wczoraj.
   */
  getStreak(area?: Area): StreakData {
    const areaClause = area ? `AND area = '${area}'` : ''

    const rows = this.db.prepare(`
      SELECT DISTINCT substr(completed_at, 1, 10) AS completed_day
      FROM task_history
      WHERE 1=1 ${areaClause}
      ORDER BY completed_day DESC
    `).all() as StreakRow[]

    if (rows.length === 0) {
      return { current: 0, best: 0, todayDone: false }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStr = today.toISOString().slice(0, 10)
    const days = new Set(rows.map((r) => r.completed_day))
    const todayDone = days.has(todayStr)

    // Jeśli dziś brak — zacznij liczyć od wczoraj
    let current = 0
    let cursor = todayDone ? new Date(today) : new Date(today.getTime() - 86400_000)

    while (true) {
      const dayStr = cursor.toISOString().slice(0, 10)
      if (!days.has(dayStr)) break
      current++
      cursor = new Date(cursor.getTime() - 86400_000)
    }

    // Best streak
    let best = 0
    let tempStreak = 1
    const sortedDays = Array.from(days).sort()

    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1])
      const curr = new Date(sortedDays[i])
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400_000)

      if (diffDays === 1) {
        tempStreak++
      } else {
        best = Math.max(best, tempStreak)
        tempStreak = 1
      }
    }
    best = Math.max(best, tempStreak, current)

    return { current, best, todayDone }
  }

  /**
   * Efficiency = średni actual/estimated * 100 z ostatnich 30 dni.
   * 100 = idealnie. <100 = szybciej. >100 = wolniej.
   * null jeśli brak danych.
   */
  getEfficiency(area?: Area): number | null {
    const conditions: string[] = [
      'actual_minutes IS NOT NULL',
      'estimated_minutes IS NOT NULL',
      'estimated_minutes > 0',
      `completed_at >= ?`,
    ]
    const params: unknown[] = [new Date(Date.now() - 30 * 86400_000).toISOString()]

    if (area) {
      conditions.push('area = ?')
      params.push(area)
    }

    const row = this.db.prepare(`
      SELECT AVG(CAST(actual_minutes AS REAL) / estimated_minutes) AS ratio
      FROM task_history
      WHERE ${conditions.join(' AND ')}
    `).get(...params) as EfficiencyRow

    if (row?.ratio == null) return null
    return Math.round(row.ratio * 100)
  }

  getWeeklyThroughput(weeks: number, area?: Area): WeeklyThroughput[] {
    const conditions: string[] = [`completed_at >= ?`]
    const params: unknown[] = [new Date(Date.now() - weeks * 7 * 86400_000).toISOString()]

    if (area) {
      conditions.push('area = ?')
      params.push(area)
    }

    const rows = this.db.prepare(`
      SELECT
        strftime('%Y-%W', completed_at) AS week_start,
        COUNT(*) AS count
      FROM task_history
      WHERE ${conditions.join(' AND ')}
      GROUP BY week_start
      ORDER BY week_start ASC
    `).all(...params) as ThroughputRow[]

    return rows.map((r) => ({ weekStart: r.week_start, count: r.count }))
  }

  getTimePerTag(days: number, area?: Area): TimePerTag[] {
    const conditions: string[] = ['ps.completed = 1', 'ps.started_at >= ?']
    const params: unknown[] = [new Date(Date.now() - days * 86400_000).toISOString()]

    if (area) {
      conditions.push('t.area = ?')
      params.push(area)
    }

    const rows = this.db.prepare(`
      SELECT
        tg.name AS tag_name,
        SUM(ps.planned_minutes) AS total_minutes
      FROM pomodoro_sessions ps
      LEFT JOIN tasks t ON t.id = ps.task_id
      LEFT JOIN tags tg ON tg.id = t.tag_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY tg.name
      ORDER BY total_minutes DESC
    `).all(...params) as TimePerTagRow[]

    return rows.map((r) => ({
      tagName: r.tag_name ?? 'Bez tagu',
      totalMinutes: r.total_minutes,
    }))
  }

  getEstimationAccuracy(area?: Area): EstimationAccuracy[] {
    const conditions: string[] = [
      'th.actual_minutes IS NOT NULL',
      'th.estimated_minutes IS NOT NULL',
      'th.estimated_minutes > 0',
    ]
    const params: unknown[] = []

    if (area) {
      conditions.push('th.area = ?')
      params.push(area)
    }

    const rows = this.db.prepare(`
      SELECT
        tg.name AS tag_name,
        th.tag_id,
        AVG(th.estimated_minutes) AS avg_estimated,
        AVG(th.actual_minutes) AS avg_actual,
        AVG(CAST(th.actual_minutes AS REAL) / th.estimated_minutes) AS ratio,
        COUNT(*) AS sample_count
      FROM task_history th
      LEFT JOIN tags tg ON tg.id = th.tag_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY th.tag_id
      ORDER BY sample_count DESC
    `).all(...params) as AccuracyRow[]

    return rows.map((r) => ({
      tagName: r.tag_name ?? 'Bez tagu',
      tagId: r.tag_id,
      avgEstimated: r.avg_estimated ?? 0,
      avgActual: r.avg_actual ?? 0,
      ratio: r.ratio ?? 1,
      sampleCount: r.sample_count,
    }))
  }
}
