// electron/services/scheduler.service.ts
import * as cron from 'node-cron'
import type { BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import { RemindersRepo } from '../db/repositories/reminders.repo'
import type { FiredReminderPayload } from '@/shared/types/global.types'

type WindowGetter = () => BrowserWindow | null

let schedulerTask: cron.ScheduledTask | null = null

export function startScheduler(db: Database.Database, getWindow: WindowGetter): void {
  if (schedulerTask) {
    console.warn('[Scheduler] Już uruchomiony — pomijam')
    return
  }

  const repo = new RemindersRepo(db)

  // Restart recovery — sprawdź od razu, nie czekaj minuty
  checkDue(repo, getWindow)

  schedulerTask = cron.schedule('* * * * *', () => {
    checkDue(repo, getWindow)
  })

  console.log('[Scheduler] Uruchomiony')
}

export function stopScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop()
    schedulerTask = null
    console.log('[Scheduler] Zatrzymany')
  }
}

function checkDue(repo: RemindersRepo, getWindow: WindowGetter): void {
  try {
    const due = repo.getDue()
    if (due.length === 0) return

    const win = getWindow()

    for (const reminder of due) {
      // Oznacz PRZED wysłaniem — przy crashu renderera nie chcemy zapętlenia
      repo.markFired(reminder.id)

      if (win && !win.isDestroyed()) {
        const payload: FiredReminderPayload = {
          id: reminder.id,
          taskId: reminder.taskId,
          taskTitle: reminder.taskTitle,
          taskArea: reminder.taskArea,
          type: reminder.type,
          remindAt: reminder.remindAt,
        }
        win.webContents.send('reminder:fired', payload)

        // Follow-up = ważniejszy — migaj ikoną w pasku zadań
        if (reminder.type === 'followup' && win.isMinimized()) {
          win.flashFrame(true)
        }
      }

      console.log(`[Scheduler] fired: "${reminder.taskTitle}" (${reminder.type})`)
    }
  } catch (err) {
    console.error('[Scheduler] Błąd:', err)
  }
}
