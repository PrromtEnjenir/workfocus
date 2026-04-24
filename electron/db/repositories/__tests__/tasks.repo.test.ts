import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../migrations/runner'
import { TasksRepo } from '../tasks.repo'
import { TagsRepo } from '../tags.repo'

describe('TasksRepo', () => {
  let db: Database.Database
  let repo: TasksRepo

  beforeEach(() => {
    db = new Database(':memory:')
    runMigrations(db)
    repo = new TasksRepo(db)
  })

  it('tworzy zadanie z domyślnymi wartościami', () => {
    const task = repo.create({ title: 'Test', type: 'task', area: 'work' })

    expect(task.id).toBeDefined()
    expect(task.title).toBe('Test')
    expect(task.status).toBe('active')
    expect(task.painScore).toBe(5)
    expect(task.important).toBe(false)
    expect(task.urgent).toBe(false)
    expect(task.deletedAt).toBeNull()
  })

  it('tworzy zadanie z pełnymi danymi', () => {
    const task = repo.create({
      title: 'Pełny task',
      type: 'email',
      area: 'work',
      important: true,
      urgent: false,
      painScore: 8,
      estimatedMinutes: 30,
      deadline: '2026-05-01',
      notes: 'Notatka',
    })

    expect(task.type).toBe('email')
    expect(task.important).toBe(true)
    expect(task.painScore).toBe(8)
    expect(task.estimatedMinutes).toBe(30)
    expect(task.deadline).toBe('2026-05-01')
  })

  it('zwraca listę tylko aktywnych tasków danego area', () => {
    repo.create({ title: 'Work 1', type: 'task', area: 'work' })
    repo.create({ title: 'Work 2', type: 'task', area: 'work' })
    repo.create({ title: 'Personal', type: 'task', area: 'personal' })

    const workTasks = repo.getAll('work')
    expect(workTasks).toHaveLength(2)
    expect(workTasks.every((t) => t.area === 'work')).toBe(true)
  })

  it('soft-delete nie zwraca zadania w getAll', () => {
    const task = repo.create({ title: 'Do usunięcia', type: 'task', area: 'work' })
    repo.softDelete(task.id)

    const tasks = repo.getAll('work')
    expect(tasks.find((t) => t.id === task.id)).toBeUndefined()

    // Ale getById nadal powinno zwrócić (z deleted_at)
    // Uwaga: getById filtruje też deleted_at, więc null jest ok
    const found = repo.getById(task.id)
    expect(found).toBeNull()
  })

  it('update modyfikuje pola i loguje changelog', () => {
    const task = repo.create({ title: 'Stary tytuł', type: 'task', area: 'work' })
    const updated = repo.update(task.id, { title: 'Nowy tytuł', painScore: 9 })

    expect(updated.title).toBe('Nowy tytuł')
    expect(updated.painScore).toBe(9)

    // Sprawdź changelog
    const changes = db
      .prepare(`SELECT * FROM task_changelog WHERE task_id = ? ORDER BY changed_at`)
      .all(task.id) as Array<{ field: string; old_value: string; new_value: string }>

    expect(changes.some((c) => c.field === 'title' && c.new_value === 'Nowy tytuł')).toBe(true)
    expect(changes.some((c) => c.field === 'painScore' && c.new_value === '9')).toBe(true)
  })

  it('complete zapisuje do task_history', () => {
    const task = repo.create({
      title: 'Do zamknięcia',
      type: 'task',
      area: 'work',
      estimatedMinutes: 60,
    })

    repo.complete(task.id, {
      actualMinutes: 45,
      frictionReason: 'none',
      priorityAccurate: true,
      postMortem: 'Poszło dobrze',
    })

    const history = db
      .prepare(`SELECT * FROM task_history WHERE task_id = ?`)
      .get(task.id) as { actual_minutes: number; friction_reason: string; post_mortem: string }

    expect(history).toBeDefined()
    expect(history.actual_minutes).toBe(45)
    expect(history.friction_reason).toBe('none')
    expect(history.post_mortem).toBe('Poszło dobrze')

    // Task powinien mieć status completed
    const completedTask = db
      .prepare(`SELECT status FROM tasks WHERE id = ?`)
      .get(task.id) as { status: string }
    expect(completedTask.status).toBe('completed')
  })

  it('filtruje po typie', () => {
    repo.create({ title: 'Task', type: 'task', area: 'work' })
    repo.create({ title: 'Email', type: 'email', area: 'work' })
    repo.create({ title: 'Waiting', type: 'waiting_for', area: 'work' })

    const emails = repo.getAll('work', { type: 'email' })
    expect(emails).toHaveLength(1)
    expect(emails[0]!.type).toBe('email')
  })

  it('sortuje wg imp+pil+pain malejąco', () => {
    repo.create({ title: 'Niski ból', type: 'task', area: 'work', painScore: 2 })
    repo.create({ title: 'Wysoki ból', type: 'task', area: 'work', painScore: 9 })
    repo.create({
      title: 'Ważny i pilny',
      type: 'task',
      area: 'work',
      important: true,
      urgent: true,
      painScore: 3,
    })

    const tasks = repo.getAll('work')
    expect(tasks[0]!.title).toBe('Ważny i pilny')
    expect(tasks[1]!.title).toBe('Wysoki ból')
    expect(tasks[2]!.title).toBe('Niski ból')
  })
})

describe('TagsRepo', () => {
  let db: Database.Database
  let tagsRepo: TagsRepo

  beforeEach(() => {
    db = new Database(':memory:')
    runMigrations(db)
    tagsRepo = new TagsRepo(db)
  })

  it('tworzy tag', () => {
    const tag = tagsRepo.create({ name: 'Teamcenter', color: '#3b82f6', area: 'work' })
    expect(tag.id).toBeDefined()
    expect(tag.name).toBe('Teamcenter')
  })

  it('soft-delete tagu ukrywa go z listy', () => {
    const tag = tagsRepo.create({ name: 'Do usunięcia', color: '#ef4444', area: 'work' })
    tagsRepo.delete(tag.id)
    const tags = tagsRepo.getAll('work')
    expect(tags.find((t) => t.id === tag.id)).toBeUndefined()
  })

  it('update zmienia kolor tagu', () => {
    const tag = tagsRepo.create({ name: 'Tag', color: '#ff0000', area: 'work' })
    const updated = tagsRepo.update(tag.id, { color: '#00ff00' })
    expect(updated.color).toBe('#00ff00')
    expect(updated.name).toBe('Tag') // niezmienione
  })
})
