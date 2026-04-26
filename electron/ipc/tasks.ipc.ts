import type Database from 'better-sqlite3'
import { ipcMain } from 'electron'
import type {
  Area,
  CompletionMeta,
  CreateTaskDTO,
  TaskFilters,
  UpdateTaskDTO,
} from '@/shared/types/global.types'
import { TasksRepo } from '../db/repositories/tasks.repo'
import { RemindersRepo } from '../db/repositories/reminders.repo'
import { SettingsRepo } from '../db/repositories/settings.repo'

export function registerTasksIpc(db: Database.Database): void {
  const repo = new TasksRepo(db)
  const remindersRepo = new RemindersRepo(db)
  const settingsRepo = new SettingsRepo(db)

  ipcMain.handle(
    'tasks:getAll',
    (_, { area, filters }: { area: Area; filters?: TaskFilters }) => {
      return repo.getAll(area, filters)
    }
  )

  ipcMain.handle('tasks:getById', (_, { id }: { id: string }) => {
    return repo.getById(id)
  })

  ipcMain.handle('tasks:create', (_, data: CreateTaskDTO) => {
    const task = repo.create(data)
    console.log('[tasks:create] type:', task.type)  // ← dodaj

    // Auto follow-up reminder dla email i waiting_for
    if (task.type === 'email' || task.type === 'waiting_for') {
      try {
        const followupDays = settingsRepo.get('followupDefaultDays') as number ?? 3
        const remindAt = new Date()
        remindAt.setDate(remindAt.getDate() + followupDays)
        remindAt.setHours(9, 0, 0, 0)
        console.log('[tasks:create] followupDays:', followupDays, 'remindAt:', remindAt.toISOString())
        const reminder = remindersRepo.create({
          taskId: task.id,
          remindAt: remindAt.toISOString(),
          type: 'followup',
          followupAfterDays: followupDays,
        })
        console.log('[tasks:create] reminder utworzony:', reminder.id)
      } catch (err) {
        console.error('[tasks:create] błąd tworzenia remindera:', err)
      }
    }

    return task
  })

  ipcMain.handle(
    'tasks:update',
    (_, { id, data }: { id: string; data: UpdateTaskDTO }) => {
      return repo.update(id, data)
    }
  )

  ipcMain.handle(
    'tasks:complete',
    (_, { id, meta }: { id: string; meta: CompletionMeta }) => {
      repo.complete(id, meta)
    }
  )

  ipcMain.handle('tasks:delete', (_, { id }: { id: string }) => {
    repo.softDelete(id)
  })

  ipcMain.handle(
    'tasks:snooze',
    (_, { id, until }: { id: string; until: string }) => {
      repo.snooze(id, until)
    }
  )

  ipcMain.handle('tasks:someday', (_, { id }: { id: string }) => {
    repo.setSomeday(id)
  })

  ipcMain.handle('tasks:cancel', (_, { id }: { id: string }) => {
    repo.cancel(id)
  })
}
