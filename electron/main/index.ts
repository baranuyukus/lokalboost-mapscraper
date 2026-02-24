import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'os'
import { join } from 'path'
import * as dotenv from 'dotenv'
import { AuthManager } from './auth'
import { scraperManager } from './scraper'
import { locationService } from './location-service'

// Determine if we are in production (packaged) mode
const isPackaged = app.isPackaged

// Load .env from different locations
if (!isPackaged) {
    dotenv.config({ path: join(process.cwd(), '.env') })
} else {
    dotenv.config({ path: join(process.resourcesPath, '.env') })
}

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Paths
const DIST_PATH = isPackaged
    ? join(process.resourcesPath, 'app.asar', 'dist')
    : join(__dirname, '../..')

const PUBLIC_PATH = isPackaged
    ? join(process.resourcesPath, 'app.asar', 'dist')
    : join(__dirname, '../../public')

let win: BrowserWindow | null = null
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL as string
const indexHtml = join(DIST_PATH, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'LokalBoost - Google Maps Scraper',
        width: 1280,
        height: 850,
        icon: join(PUBLIC_PATH, 'favicon.ico'),
        webPreferences: {
            preload,
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(url)
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // Open links in external browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })
}

app.whenReady().then(async () => {
    await createWindow();
    if (win) {
        const authManager = new AuthManager(win);
        authManager.registerHandlers();
        await authManager.init();

        // Location service
        locationService.load(process.cwd());
        locationService.registerHandlers();

        // Scraper
        scraperManager.setWindow(win);
        scraperManager.registerHandlers();
    }
})

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
