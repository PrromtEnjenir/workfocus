interface Window {
  electronAPI: {
    invoke: (channel: string, data?: unknown) => Promise<unknown>
    on: (channel: string, cb: (...args: unknown[]) => void) => () => void
    windowMinimize?: () => void
    windowMaximize?: () => void
    windowClose?: () => void
    onWindowMaximized?: (cb: (isMax: boolean) => void) => () => void
  }
}