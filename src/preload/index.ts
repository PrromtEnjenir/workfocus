// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, data?: unknown) =>
    ipcRenderer.invoke(channel, data),

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
    return () => ipcRenderer.removeAllListeners(channel)
  },

  send: (channel: string, data?: unknown) =>
    ipcRenderer.send(channel, data),

  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
  onWindowMaximized: (cb: (isMax: boolean) => void) => {
    ipcRenderer.on('window:maximized', (_, isMax) => cb(isMax as boolean))
    return () => ipcRenderer.removeAllListeners('window:maximized')
  },
})
