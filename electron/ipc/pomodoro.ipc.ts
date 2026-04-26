// electron/ipc/pomodoro.ipc.ts
import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { PomodoroRepo } from '../db/repositories/pomodoro.repo'

export function registerPomodoroIpc(db: Database.Database): void {
  const repo = new PomodoroRepo(db)

  ipcMain.handle('pomodoro:start', (_, { taskId, minutes }: { taskId: string | null; minutes?: number }) => {
    return repo.start(taskId, minutes)
  })

  ipcMain.handle('pomodoro:stop', (_, { sessionId, completed, interruptedReason }: {
    sessionId: string
    completed: boolean
    interruptedReason?: string
  }) => {
    repo.stop(sessionId, completed, interruptedReason)
  })

  ipcMain.handle('pomodoro:parkingLot', (_, { sessionId, note }: { sessionId: string; note: string }) => {
    repo.addParkingLot(sessionId, note)
  })

  ipcMain.handle('pomodoro:history', (_, { taskId }: { taskId?: string }) => {
    return repo.getHistory(taskId)
  })

  ipcMain.handle('pomodoro:statsToday', () => {
    return {
      sessions: repo.countCompletedToday(),
      focusMinutes: repo.focusMinutesToday(),
    }
  })
}
