import type Database from 'better-sqlite3'
import { registerSettingsIpc } from './settings.ipc'
import { registerTagsIpc } from './tags.ipc'
import { registerTasksIpc } from './tasks.ipc'

export function registerAllIpcHandlers(db: Database.Database): void {
  registerSettingsIpc(db)
  registerTagsIpc(db)
  registerTasksIpc(db)
  // Kolejne handlery dodawane tutaj w miarę budowania modułów:
  // registerRemindersIpc(db)
  // registerPomodoroIpc(db)
  // registerHistoryIpc(db)
  // registerRitualsIpc(db)
  // registerStatsIpc(db)
  // registerExportIpc(db)
  // registerDecisionsIpc(db)
}
