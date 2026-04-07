import { app, BrowserWindow, shell, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc-handlers'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#0a0f0d',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ── Auto-updater ────────────────────────────────────────────────────────
function setupAutoUpdater(window: BrowserWindow): void {
  if (is.dev) return // Skip in dev mode

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    window.webContents.send('updater:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    })

    dialog.showMessageBox(window, {
      type: 'info',
      title: 'Update Available',
      message: `Plume ${info.version} is available. Download now?`,
      detail: 'The update will be installed when you restart.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate()
        window.webContents.send('updater:downloading', {})
      }
    })
  })

  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('updater:ready', {})

    dialog.showMessageBox(window, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. Restart to apply?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (err) => {
    window.webContents.send('updater:error', { error: err.message })
  })

  // Check for updates 3 seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 3000)
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.plume.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()
  registerIpcHandlers(mainWindow)
  setupAutoUpdater(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
