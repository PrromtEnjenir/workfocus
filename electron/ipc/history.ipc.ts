// electron/ipc/history.ipc.ts
import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { HistoryRepo } from '../db/repositories/history.repo'
import type { Area, HistoryFilters } from '@/shared/types/global.types'

export function registerHistoryIpc(db: Database.Database): void {
  const repo = new HistoryRepo(db)

  ipcMain.handle('history:getAll', (_, { area, filters }: { area: Area; filters?: HistoryFilters }) => {
    return repo.getAll(area, filters)
  })

  ipcMain.handle('history:getById', (_, { id }: { id: string }) => {
    return repo.getById(id)
  })
}
