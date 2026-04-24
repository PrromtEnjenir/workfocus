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

export function registerTasksIpc(db: Database.Database): void {
  const repo = new TasksRepo(db)

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
    return repo.create(data)
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
