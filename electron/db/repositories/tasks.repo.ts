import type Database from 'better-sqlite3'
import type {
  Area,
  CompletionMeta,
  CreateTaskDTO,
  FrictionReason,
  TaskFilters,
  TaskModel,
  TaskStatus,
  TaskType,
  UpdateTaskDTO,
} from '@/shared/types/global.types'
import { BaseRepo } from './base.repo'

interface TaskRow {
  id: string
  title: string
  type: string
  status: string
  area: string
  tag_id: string | null
  important: number
  urgent: number
  pain_score: number
  energy_required: string | null
  estimated_minutes: number | null
  actual_minutes: number | null
  deadline: string | null
  waiting_for_person: string | null
  notes: string | null
  parent_task_id: string | null
  depends_on_task_id: string | null
  created_at: string
  completed_at: string | null
  updated_at: string
  deleted_at: string | null
}

function rowToModel(row: TaskRow): TaskModel {
  return {
    id: row.id,
    title: row.title,
    type: row.type as TaskType,
    status: row.status as TaskStatus,
    area: row.area as Area,
    tagId: row.tag_id,
    important: row.important === 1,
    urgent: row.urgent === 1,
    painScore: row.pain_score,
    energyRequired: row.energy_required as TaskModel['energyRequired'],
    estimatedMinutes: row.estimated_minutes,
    actualMinutes: row.actual_minutes,
    deadline: row.deadline,
    waitingForPerson: row.waiting_for_person,
    notes: row.notes,
    parentTaskId: row.parent_task_id,
    dependsOnTaskId: row.depends_on_task_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

// Priorytety: important=1 i urgent=1 → najwyżej, potem pain_score
const SORT_ORDER = `
  ORDER BY
    (important + urgent) DESC,
    pain_score DESC,
    created_at ASC
`

export class TasksRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  getAll(area: Area, filters?: TaskFilters): TaskModel[] {
    const conditions: string[] = [
      'deleted_at IS NULL',
      'area = ?',
    ]
    const params: unknown[] = [area]

    // Status — domyślnie tylko active
    const status = filters?.status ?? 'active'
    conditions.push('status = ?')
    params.push(status)

    if (filters?.tagId) {
      conditions.push('tag_id = ?')
      params.push(filters.tagId)
    }

    if (filters?.type) {
      conditions.push('type = ?')
      params.push(filters.type)
    }

    if (filters?.search) {
      conditions.push('(title LIKE ? OR notes LIKE ?)')
      const term = `%${filters.search}%`
      params.push(term, term)
    }

    if (filters?.deadlineBefore) {
      conditions.push('deadline <= ?')
      params.push(filters.deadlineBefore)
    }

    const sql = `
      SELECT * FROM tasks
      WHERE ${conditions.join(' AND ')}
      ${SORT_ORDER}
    `

    const rows = this.db.prepare(sql).all(...params) as TaskRow[]
    return rows.map(rowToModel)
  }

  getById(id: string): TaskModel | null {
    const row = this.db
      .prepare(`SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`)
      .get(id) as TaskRow | undefined

    return row ? rowToModel(row) : null
  }

  create(data: CreateTaskDTO): TaskModel {
    const id = this.newId()
    const now = this.now()

    this.db
      .prepare(
        `INSERT INTO tasks (
          id, title, type, status, area, tag_id,
          important, urgent, pain_score, energy_required,
          estimated_minutes, deadline, waiting_for_person,
          notes, depends_on_task_id, created_at, updated_at
        ) VALUES (
          ?, ?, ?, 'active', ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?
        )`
      )
      .run(
        id,
        data.title,
        data.type,
        data.area,
        data.tagId ?? null,
        data.important ? 1 : 0,
        data.urgent ? 1 : 0,
        data.painScore ?? 5,
        data.energyRequired ?? null,
        data.estimatedMinutes ?? null,
        data.deadline ?? null,
        data.waitingForPerson ?? null,
        data.notes ?? null,
        data.dependsOnTaskId ?? null,
        now,
        now
      )

    return this.getById(id)!
  }

  update(id: string, data: UpdateTaskDTO): TaskModel {
    const existing = this.getById(id)
    if (!existing) throw new Error(`Task ${id} nie istnieje`)

    const now = this.now()
    const fields: string[] = ['updated_at = ?']
    const params: unknown[] = [now]

    // Mapowanie pól DTO → kolumny SQL
    const fieldMap: Record<keyof UpdateTaskDTO, string> = {
      title: 'title',
      type: 'type',
      area: 'area',
      tagId: 'tag_id',
      important: 'important',
      urgent: 'urgent',
      painScore: 'pain_score',
      energyRequired: 'energy_required',
      estimatedMinutes: 'estimated_minutes',
      deadline: 'deadline',
      waitingForPerson: 'waiting_for_person',
      notes: 'notes',
      dependsOnTaskId: 'depends_on_task_id',
    }

    for (const [key, col] of Object.entries(fieldMap) as [keyof UpdateTaskDTO, string][]) {
      if (data[key] === undefined) continue

      fields.push(`${col} = ?`)
      const val = data[key]

      // boolean → 0/1 dla SQLite
      if (key === 'important' || key === 'urgent') {
        params.push(val ? 1 : 0)
      } else {
        params.push(val ?? null)
      }

      // Loguj zmiany do changelog
      const oldVal = String(existing[key as keyof TaskModel] ?? '')
      const newVal = String(val ?? '')
      if (oldVal !== newVal) {
        this.logChange(id, key, oldVal || null, newVal || null)
      }
    }

    params.push(id)
    this.db
      .prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`)
      .run(...params)

    return this.getById(id)!
  }

  complete(id: string, meta: CompletionMeta): void {
    const existing = this.getById(id)
    if (!existing) throw new Error(`Task ${id} nie istnieje`)

    const now = this.now()

    // Aktualizuj task
    this.db
      .prepare(
        `UPDATE tasks SET
          status = 'completed',
          completed_at = ?,
          actual_minutes = ?,
          updated_at = ?
         WHERE id = ?`
      )
      .run(now, meta.actualMinutes ?? null, now, id)

    // Zapisz do historii
    this.db
      .prepare(
        `INSERT INTO task_history (
          id, task_id, title, tag_id, area,
          estimated_minutes, actual_minutes,
          post_mortem, friction_reason, priority_accurate,
          completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        this.newId(),
        id,
        existing.title,
        existing.tagId,
        existing.area,
        existing.estimatedMinutes,
        meta.actualMinutes ?? null,
        meta.postMortem ?? null,
        meta.frictionReason ?? 'none' satisfies FrictionReason,
        meta.priorityAccurate !== undefined ? (meta.priorityAccurate ? 1 : 0) : null,
        now
      )
  }

  softDelete(id: string): void {
    super.softDelete('tasks', id)
  }

  snooze(id: string, until: string): void {
    // Snooze = specjalny reminder, task dostaje updated_at
    // Właściwa logika remindera będzie w reminders.repo
    // Tu tylko aktualizujemy updated_at żeby nie psuć sortowania
    this.db
      .prepare(`UPDATE tasks SET updated_at = ? WHERE id = ?`)
      .run(this.now(), id)
  }

  setSomeday(id: string): void {
    this.db
      .prepare(`UPDATE tasks SET status = 'someday', updated_at = ? WHERE id = ?`)
      .run(this.now(), id)
  }

  cancel(id: string): void {
    this.db
      .prepare(`UPDATE tasks SET status = 'cancelled', updated_at = ? WHERE id = ?`)
      .run(this.now(), id)
  }
}
