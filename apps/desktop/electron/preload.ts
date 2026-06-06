const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveSecret: (key: string, value: string) => ipcRenderer.invoke('secure-store-set', key, value),
  getSecret: (key: string) => ipcRenderer.invoke('secure-store-get', key)
});
