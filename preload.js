const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirectory: (dirPath, forceRefresh = false) => 
    ipcRenderer.invoke('scan-directory', dirPath, forceRefresh),
  openInExplorer: (filePath) => ipcRenderer.invoke('open-in-explorer', filePath),
  getDrives: () => ipcRenderer.invoke('get-drives'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  getCacheInfo: (dirPath) => ipcRenderer.invoke('get-cache-info', dirPath),
  onScanProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('scan-progress', listener);
    return () => ipcRenderer.removeListener('scan-progress', listener);
  }
});
