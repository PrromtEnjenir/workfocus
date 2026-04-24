import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './db/database'
import { registerAllIpcHandlers } from './ipc/registry'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'WorkFocus',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  // Ukryj menu bar — to nie przeglądarka
  mainWindow.setMenuBarVisibility(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray(): void {
  // Minimalistyczna ikona — zastąp własnym plikiem w assets/
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
    { type: 'separator' },
    {
      label: 'Zamknij',
      click: () => {
        app.quit()
      },
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
  // Globalny quick capture — działa poza aplikacją
  const captureRegistered = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    // TODO: Faza 3 — quick capture mini-okno
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('shortcut:quickCapture')
    }
  })

  if (!captureRegistered) {
    console.warn('[Shortcuts] Ctrl+Shift+Space już zajęty przez inną aplikację')
  }
}

app.whenReady().then(() => {
  const db = initDatabase()
  registerAllIpcHandlers(db)

  createWindow()
  createTray()
  registerGlobalShortcuts()
})

// Zamykaj handlery przy wyjściu
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})

// Na macOS standardowe zachowanie — nie zamykaj apki gdy zamknięte okno
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
