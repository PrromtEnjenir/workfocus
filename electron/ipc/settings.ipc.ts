import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { SettingsRepo } from '../db/repositories/settings.repo'

export function registerSettingsIpc(db: Database.Database): void {
  const repo = new SettingsRepo(db)

  ipcMain.handle('settings:get', (_event, { key }: { key: string }) => {
    return repo.get(key)
  })

  ipcMain.handle('settings:set', (_event, { key, value }: { key: string; value: unknown }) => {
    repo.set(key, value)
  })

  ipcMain.handle('settings:getAll', () => {
    return repo.getAll()
  })
}
