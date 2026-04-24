import type Database from 'better-sqlite3'
import { ipcMain } from 'electron'
import type { Area, CreateTagDTO } from '@/shared/types/global.types'
import { TagsRepo } from '../db/repositories/tags.repo'

export function registerTagsIpc(db: Database.Database): void {
  const repo = new TagsRepo(db)

  ipcMain.handle('tags:getAll', (_, { area }: { area: Area }) => {
    return repo.getAll(area)
  })

  ipcMain.handle('tags:create', (_, data: CreateTagDTO) => {
    return repo.create(data)
  })

  ipcMain.handle(
    'tags:update',
    (_, { id, data }: { id: string; data: Partial<CreateTagDTO> }) => {
      return repo.update(id, data)
    }
  )

  ipcMain.handle('tags:delete', (_, { id }: { id: string }) => {
    repo.delete(id)
  })
}
