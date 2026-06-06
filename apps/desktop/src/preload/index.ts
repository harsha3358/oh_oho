import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('jarvisAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
});
