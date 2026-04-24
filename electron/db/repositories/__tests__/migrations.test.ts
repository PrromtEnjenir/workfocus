import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../../migrations/runner'
import { SettingsRepo } from '../settings.repo'

describe('runMigrations', () => {
  it('tworzy wszystkie tabele bez błędów', () => {
    const db = new Database(':memory:')
    expect(() => runMigrations(db)).not.toThrow()

    // Sprawdź czy kluczowe tabele istnieją
    const tables = db
      .prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      )
      .all()
      .map((r) => r.name)

    expect(tables).toContain('tasks')
    expect(tables).toContain('tags')
    expect(tables).toContain('reminders')
    expect(tables).toContain('pomodoro_sessions')
    expect(tables).toContain('settings')
    expect(tables).toContain('task_changelog')
    expect(tables).toContain('task_history')
    expect(tables).toContain('ritual_logs')
    expect(tables).toContain('decision_log')

    db.close()
  })

  it('migracja jest idempotentna — drugi run nie sypie błędem', () => {
    const db = new Database(':memory:')
    expect(() => {
      runMigrations(db)
      runMigrations(db)
    }).not.toThrow()
    db.close()
  })

  it('domyślne ustawienia są wstawione po migracji', () => {
    const db = new Database(':memory:')
    runMigrations(db)

    const theme = db
      .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
      .get('theme')

    expect(theme?.value).toBe('"system"')
    db.close()
  })
})

describe('SettingsRepo', () => {
  let db: Database.Database
  let repo: SettingsRepo

  beforeEach(() => {
    db = new Database(':memory:')
    runMigrations(db)
    repo = new SettingsRepo(db)
  })

  it('odczytuje domyślny theme', () => {
    expect(repo.get('theme')).toBe('system')
  })

  it('zapisuje i odczytuje wartość', () => {
    repo.set('theme', 'dark')
    expect(repo.get('theme')).toBe('dark')
  })

  it('nadpisuje istniejącą wartość', () => {
    repo.set('pomodoroMinutes', 30)
    repo.set('pomodoroMinutes', 45)
    expect(repo.get('pomodoroMinutes')).toBe(45)
  })

  it('getAll zwraca wszystkie domyślne klucze', () => {
    const all = repo.getAll()
    expect(all).toHaveProperty('theme')
    expect(all).toHaveProperty('language')
    expect(all).toHaveProperty('pomodoroMinutes')
    expect(all).toHaveProperty('defaultArea')
  })

  it('zwraca null dla nieistniejącego klucza', () => {
    expect(repo.get('nieistniejacy_klucz')).toBeNull()
  })
})
