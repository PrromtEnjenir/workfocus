// electron/ipc/registry.ts
import type Database from 'better-sqlite3'
import { registerSettingsIpc } from './settings.ipc'
import { registerTagsIpc } from './tags.ipc'
import { registerTasksIpc } from './tasks.ipc'
import { registerRemindersIpc } from './reminders.ipc'
import { registerHistoryIpc } from './history.ipc'
import { registerPomodoroIpc } from './pomodoro.ipc'

export function registerAllIpcHandlers(db: Database.Database): void {
  registerSettingsIpc(db)
  registerTagsIpc(db)
  registerTasksIpc(db)
  registerRemindersIpc(db)
  registerHistoryIpc(db)
  registerPomodoroIpc(db)
  // registerRitualsIpc(db)
  // registerStatsIpc(db)
  // registerExportIpc(db)
  // registerDecisionsIpc(db)
}
