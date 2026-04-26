// electron/ipc/stats.ipc.ts
import type Database from 'better-sqlite3'
import { ipcMain } from 'electron'
import { StatsRepo } from '../db/repositories/stats.repo'
import type { Area } from '@/shared/types/global.types'

export function registerStatsIpc(db: Database.Database): void {
  const repo = new StatsRepo(db)

  ipcMain.handle('stats:streak', (_, payload?: { area?: Area }) => {
    return repo.getStreak(payload?.area)
  })

  ipcMain.handle('stats:efficiency', (_, payload?: { area?: Area }) => {
    return repo.getEfficiency(payload?.area)
  })

  ipcMain.handle('stats:weeklyThroughput', (_, payload: { weeks: number; area?: Area }) => {
    return repo.getWeeklyThroughput(payload.weeks, payload.area)
  })

  ipcMain.handle('stats:timePerTag', (_, payload: { days: number; area?: Area }) => {
    return repo.getTimePerTag(payload.days, payload.area)
  })

  ipcMain.handle('stats:estimationAccuracy', (_, payload?: { area?: Area }) => {
    return repo.getEstimationAccuracy(payload?.area)
  })
}
