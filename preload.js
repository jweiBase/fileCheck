const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

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
  },
  log: (message) => {
    ipcRenderer.send('log', message);
  },
  loadTranslation: (lang) => {
    try {
      const filePath = path.join(__dirname, 'locales', lang + '.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      console.error('Error loading translation:', error);
      return null;
    }
  }
});
