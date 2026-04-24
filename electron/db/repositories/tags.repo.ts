import type Database from 'better-sqlite3'
import type { Area, CreateTagDTO, TagModel } from '@/shared/types/global.types'
import { BaseRepo } from './base.repo'

interface TagRow {
  id: string
  name: string
  color: string
  area: string
  created_at: string
  deleted_at: string | null
}

function rowToModel(row: TagRow): TagModel {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    area: row.area as Area,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  }
}

export class TagsRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  getAll(area: Area): TagModel[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM tags
         WHERE area = ? AND deleted_at IS NULL
         ORDER BY name ASC`
      )
      .all(area) as TagRow[]

    return rows.map(rowToModel)
  }

  getById(id: string): TagModel | null {
    const row = this.db
      .prepare(`SELECT * FROM tags WHERE id = ? AND deleted_at IS NULL`)
      .get(id) as TagRow | undefined

    return row ? rowToModel(row) : null
  }

  create(data: CreateTagDTO): TagModel {
    const id = this.newId()
    const now = this.now()

    this.db
      .prepare(
        `INSERT INTO tags (id, name, color, area, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, data.name, data.color, data.area, now)

    return this.getById(id)!
  }

  update(id: string, data: Partial<CreateTagDTO>): TagModel {
    const existing = this.getById(id)
    if (!existing) throw new Error(`Tag ${id} nie istnieje`)

    // Budujemy SET dynamicznie tylko dla przekazanych pól
    const fields: string[] = []
    const params: unknown[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      params.push(data.name)
    }
    if (data.color !== undefined) {
      fields.push('color = ?')
      params.push(data.color)
    }

    if (fields.length === 0) return existing

    params.push(id)
    this.db
      .prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`)
      .run(...params)

    return this.getById(id)!
  }

  delete(id: string): void {
    this.softDelete('tags', id)
  }
}
