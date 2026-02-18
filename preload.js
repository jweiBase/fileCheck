const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirectory: (dirPath) => ipcRenderer.invoke('scan-directory', dirPath),
  openInExplorer: (filePath) => ipcRenderer.invoke('open-in-explorer', filePath),
  getDrives: () => ipcRenderer.invoke('get-drives')
});
