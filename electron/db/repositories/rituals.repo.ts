// electron/db/repositories/rituals.repo.ts
import { BaseRepo } from './base.repo'
import type Database from 'better-sqlite3'
import type { RitualLog, RitualLogDTO } from '../../../src/renderer/bridge/api'

// Jeśli importujesz typy z innego miejsca — dostosuj ścieżkę

export class RitualsRepo extends BaseRepo {
  constructor(db: Database.Database) {
    super(db)
  }

  getLog(date: string): RitualLog | null {
    const row = this.db.prepare(`
      SELECT * FROM ritual_logs WHERE date = ?
    `).get(date) as RawRitualLog | undefined

    if (!row) return null
    return this.toModel(row)
  }

  save(data: RitualLogDTO): RitualLog {
    const existing = this.db.prepare(`
      SELECT id FROM ritual_logs WHERE date = ?
    `).get(data.date) as { id: string } | undefined

    const now = this.now()
    const winsJson = data.wins && data.wins.length > 0
      ? JSON.stringify(data.wins)
      : null

    if (existing) {
      // Update istniejącego logu
      this.db.prepare(`
        UPDATE ritual_logs
        SET energy_level = ?,
            notes = ?,
            wins = ?,
            completed_at = ?
        WHERE id = ?
      `).run(
        data.energyLevel ?? null,
        data.notes ?? null,
        winsJson,
        now,
        existing.id
      )

      return this.getLog(data.date)!
    }

    // Insert nowego logu
    const id = this.newId()
    this.db.prepare(`
      INSERT INTO ritual_logs (id, type, date, energy_level, notes, wins, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.type,
      data.date,
      data.energyLevel ?? null,
      data.notes ?? null,
      winsJson,
      now
    )

    return this.getLog(data.date)!
  }

  private toModel(row: RawRitualLog): RitualLog {
    return {
      id: row.id,
      type: row.type as RitualLog['type'],
      date: row.date,
      energyLevel: row.energy_level,
      notes: row.notes,
      wins: row.wins,
      completedAt: row.completed_at,
    }
  }
}

interface RawRitualLog {
  id: string
  type: string
  date: string
  energy_level: string | null
  notes: string | null
  wins: string | null
  completed_at: string
}
