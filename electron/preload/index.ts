import { contextBridge, ipcRenderer } from 'electron'

/**
 * Lokal Boost - Electron Preload Script
 * 
 * Bu dosya, React uygulaması ile Electron main process 
 * arasındaki güvenli iletişimi sağlar.
 */

// IPC API'yi window.ipcRenderer olarak expose et
contextBridge.exposeInMainWorld('ipcRenderer', {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (event, ...args) => listener(...args))
    },
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel)
    }
})
