// electron/ipc/reminders.ipc.ts
import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { RemindersRepo } from '../db/repositories/reminders.repo'
import type { CreateReminderDTO } from '@/shared/types/global.types'

export function registerRemindersIpc(db: Database.Database): void {
  const repo = new RemindersRepo(db)

  ipcMain.handle('reminders:getToday', () => {
    return repo.getToday()
  })

  ipcMain.handle('reminders:getUpcoming', (_, { days }: { days?: number }) => {
    return repo.getUpcoming(days)
  })

  ipcMain.handle('reminders:getByTask', (_, { taskId }: { taskId: string }) => {
    return repo.getByTaskId(taskId)
  })

  ipcMain.handle('reminders:create', (_, data: CreateReminderDTO) => {
    return repo.create(data)
  })

  ipcMain.handle('reminders:dismiss', (_, { id }: { id: string }) => {
    repo.dismiss(id)
  })

  ipcMain.handle('reminders:snooze', (_, { id, until }: { id: string; until: string }) => {
    repo.snooze(id, until)
  })

  ipcMain.handle('reminders:countFollowups', (_, { area }: { area?: string }) => {
    return repo.countPendingFollowups(area)
  })
}
