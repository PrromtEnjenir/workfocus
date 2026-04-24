import { contextBridge, ipcRenderer } from 'electron'

// Typy kanałów — bezpieczna whitelist
const ALLOWED_CHANNELS = new Set([
  'tasks:getAll',
  'tasks:getById',
  'tasks:create',
  'tasks:update',
  'tasks:complete',
  'tasks:delete',
  'tasks:snooze',
  'reminders:getToday',
  'reminders:create',
  'reminders:dismiss',
  'pomodoro:start',
  'pomodoro:stop',
  'pomodoro:parkingLot',
  'pomodoro:history',
  'stats:weeklyThroughput',
  'stats:estimationAccuracy',
  'stats:timePerTag',
  'stats:streak',
  'history:getAll',
  'history:getById',
  'rituals:getLog',
  'rituals:save',
  'settings:get',
  'settings:set',
  'settings:getAll',
  'export:json',
  'export:csv',
  'export:markdown',
  'decisions:getAll',
  'decisions:create',
  'decisions:delete',
  'tags:getAll',
  'tags:create',
  'tags:update',
  'tags:delete',
])

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, data?: unknown): Promise<unknown> => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`Niedozwolony kanał IPC: ${channel}`))
    }
    return ipcRenderer.invoke(channel, data)
  },

  // Nasłuchiwanie zdarzeń z main process (np. przypomnienie odpalił cron)
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      throw new Error(`Niedozwolony kanał IPC: ${channel}`)
    }
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
      callback(...args)
    }
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
})
