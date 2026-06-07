import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveSecret: (key: string, value: string) => ipcRenderer.invoke('secure-store-set', key, value),
  getSecret: (key: string) => ipcRenderer.invoke('secure-store-get', key),
  onGlobalHotkey: (callback: () => void) => ipcRenderer.on('trigger-listening', callback),
  onNavigate: (callback: (route: string) => void) => ipcRenderer.on('navigate', (_event, route) => callback(route))
});
