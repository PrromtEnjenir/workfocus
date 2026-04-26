import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from '../../electron/db/database'
import { registerAllIpcHandlers } from '../../electron/ipc/registry'

let mainWindow: BrowserWindow | null = null
let focusWindow: BrowserWindow | null = null
let captureWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'WorkFocus',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0612',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  mainWindow.setMenuBarVisibility(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })

  mainWindow.on('maximize', () =>
    mainWindow?.webContents.send('window:maximized', true))
  mainWindow.on('unmaximize', () =>
    mainWindow?.webContents.send('window:maximized', false))
}

function registerWindowControls(): void {
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())
}

function createFocusWindow(): void {
  if (focusWindow && !focusWindow.isDestroyed()) {
    focusWindow.show()
    focusWindow.focus()
    return
  }

  focusWindow = new BrowserWindow({
    width: 320,
    height: 420,
    minWidth: 280,
    minHeight: 360,
    title: 'WorkFocus — Focus Mode',
    alwaysOnTop: true,
    frame: false,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    focusWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/focus-mode`)
  } else {
    focusWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/focus-mode',
    })
  }

  focusWindow.once('ready-to-show', () => focusWindow?.show())
  focusWindow.on('closed', () => { focusWindow = null })
}

function createCaptureWindow(): void {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.show()
    captureWindow.focus()
    return
  }

  captureWindow = new BrowserWindow({
    width: 480,
    height: 260,
    minWidth: 400,
    minHeight: 220,
    title: 'WorkFocus — Quick Capture',
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    captureWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/quick-capture`)
  } else {
    captureWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/quick-capture',
    })
  }

  captureWindow.once('ready-to-show', () => {
    captureWindow?.show()
    captureWindow?.focus()
  })

  captureWindow.on('blur', () => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      captureWindow.close()
    }
  })

  captureWindow.on('closed', () => { captureWindow = null })
}

function createTray(): void {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Pokaż WorkFocus',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      },
    },
    {
      label: 'Quick Capture',
      click: () => createCaptureWindow(),
    },
    {
      label: 'Focus Mode',
      click: () => createFocusWindow(),
    },
    { type: 'separator' },
    {
      label: 'Zamknij',
      click: () => app.quit(),
    },
  ])

  tray.setToolTip('WorkFocus')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function registerGlobalShortcuts(): void {
  const captureRegistered = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    createCaptureWindow()
  })
  if (!captureRegistered) {
    console.warn('[Shortcuts] Ctrl+Shift+Space już zajęty')
  }

  const focusRegistered = globalShortcut.register('CommandOrControl+Shift+F', () => {
    createFocusWindow()
  })
  if (!focusRegistered) {
    console.warn('[Shortcuts] Ctrl+Shift+F już zajęty')
  }
}

function registerBroadcastHandlers(): void {
  ipcMain.on('timer:broadcast', (event, payload) => {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (win.webContents.id !== event.sender.id && !win.isDestroyed()) {
        win.webContents.send('timer:sync', payload)
      }
    }
  })

  ipcMain.on('focus-window:open', () => createFocusWindow())
  ipcMain.on('focus-window:close', () => {
    if (focusWindow && !focusWindow.isDestroyed()) focusWindow.close()
  })

  ipcMain.on('capture-window:close', () => {
    if (captureWindow && !captureWindow.isDestroyed()) captureWindow.close()
  })

  ipcMain.on('capture-window:taskCreated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tasks:refresh')
    }
    if (captureWindow && !captureWindow.isDestroyed()) {
      captureWindow.close()
    }
  })
}

app.whenReady().then(() => {
  const db = initDatabase()
  registerAllIpcHandlers(db)
  registerWindowControls()
  registerBroadcastHandlers()

  createWindow()
  createTray()
  registerGlobalShortcuts()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
