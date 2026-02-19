const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const CACHE_DIR = path.join(app.getPath('userData'), 'scan-cache');
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000;

let mainWindow;
let scanningPaths = new Set();

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.loadFile('index.html');
  
  // Open developer tools to see console logs
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ensureCacheDir();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function getCacheKey(dirPath) {
  return crypto.createHash('md5').update(dirPath.toLowerCase()).digest('hex');
}

function getCachePath(cacheKey) {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

function loadCache(dirPath) {
  try {
    ensureCacheDir();
    const cacheKey = getCacheKey(dirPath);
    const cachePath = getCachePath(cacheKey);
    
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    
    const cacheContent = fs.readFileSync(cachePath, 'utf8');
    const cacheData = JSON.parse(cacheContent);
    
    if (!cacheData || !cacheData.data) {
      return null;
    }
    
    const cacheTime = cacheData.timestamp || 0;
    if (Date.now() - cacheTime > CACHE_EXPIRE_TIME) {
      return null;
    }
    
    return cacheData;
  } catch (e) {
    console.error('Load cache error:', e.message);
    return null;
  }
}

function saveCache(dirPath, data) {
  try {
    ensureCacheDir();
    const cacheKey = getCacheKey(dirPath);
    const cachePath = getCachePath(cacheKey);
    
    const cacheData = {
      path: dirPath,
      timestamp: Date.now(),
      data: data
    };
    
    fs.writeFileSync(cachePath, JSON.stringify(cacheData), 'utf8');
  } catch (e) {
    console.error('Save cache error:', e.message);
  }
}

function checkFolderModified(cachedData, currentPath) {
  try {
    if (!cachedData || !cachedData.path) {
      return true;
    }
    
    const stats = fs.statSync(currentPath);
    const currentMtime = stats.mtime.getTime();
    const cachedMtime = cachedData.modified || 0;
    
    if (currentMtime > cachedMtime) {
      return true;
    }
    
    return false;
  } catch (e) {
    return true;
  }
}

ipcMain.handle('scan-directory', async (event, dirPath, forceRefresh = false) => {
  try {
    if (scanningPaths.has(dirPath)) {
      return { success: false, error: '正在扫描该路径' };
    }
    
    scanningPaths.add(dirPath);
    
    if (!forceRefresh) {
      const cachedResult = loadCache(dirPath);
      
      if (cachedResult && cachedResult.data) {
        const isModified = checkFolderModified(cachedResult.data, dirPath);
        
        if (!isModified) {
          scanningPaths.delete(dirPath);
          return { success: true, data: cachedResult.data, fromCache: true };
        }
      }
    }
    
    const result = await scanDirectoryParallel(dirPath, 0, 3, event);
    
    saveCache(dirPath, result);
    
    scanningPaths.delete(dirPath);
    return { success: true, data: result, fromCache: false };
  } catch (error) {
    scanningPaths.delete(dirPath);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-in-explorer', async (event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-drives', async () => {
  try {
    const drives = [];
    if (process.platform === 'win32') {
      for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const drivePath = `${letter}:\\`;
        try {
          fs.accessSync(drivePath, fs.constants.R_OK);
          drives.push(drivePath);
        } catch (e) {
          // Drive not accessible
        }
      }
    }
    return { success: true, drives };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-cache', async () => {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        } catch (e) {
          // Ignore
        }
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-cache-info', async (event, dirPath) => {
  try {
    const cachedResult = loadCache(dirPath);
    if (cachedResult) {
      return {
        success: true,
        hasCache: true,
        timestamp: cachedResult.timestamp,
        path: cachedResult.path
      };
    }
    return { success: true, hasCache: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 监听渲染进程的日志消息
ipcMain.on('log', (event, message) => {
  console.log('[Renderer]', message);
});

async function scanDirectoryParallel(dirPath, currentDepth, maxDepth, event) {
  let stats;
  try {
    stats = fs.statSync(dirPath);
  } catch (e) {
    return {
      name: path.basename(dirPath),
      path: dirPath,
      size: 0,
      isFile: true,
      modified: 0
    };
  }
  
  if (stats.isFile()) {
    return {
      name: path.basename(dirPath),
      path: dirPath,
      size: stats.size,
      isFile: true,
      modified: stats.mtime.getTime()
    };
  }

  const result = {
    name: path.basename(dirPath) || dirPath,
    path: dirPath,
    size: 0,
    isFile: false,
    children: [],
    modified: stats.mtime.getTime()
  };

  if (currentDepth >= maxDepth) {
    result.size = await getDirectorySizeFast(dirPath);
    return result;
  }

  let children = [];
  try {
    children = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return result;
  }

  const batchSize = 20;
  const batches = [];
  
  for (let i = 0; i < children.length; i += batchSize) {
    batches.push(children.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const promises = batch.map(child => {
      const childPath = path.join(dirPath, child.name);
      return scanDirectoryParallel(childPath, currentDepth + 1, maxDepth, event)
        .catch(() => null);
    });
    
    const results = await Promise.all(promises);
    
    for (const childResult of results) {
      if (childResult) {
        result.children.push(childResult);
        result.size += childResult.size;
      }
    }
    
    if (event && currentDepth === 0) {
      event.sender.send('scan-progress', {
        scanned: result.children.length,
        total: children.length
      });
    }
  }

  result.children.sort((a, b) => b.size - a.size);
  
  return result;
}

async function getDirectorySizeFast(dirPath) {
  let size = 0;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < entries.length; i += batchSize) {
      batches.push(entries.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const promises = batch.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        try {
          if (entry.isFile()) {
            const stats = fs.statSync(fullPath);
            return stats.size;
          } else if (entry.isDirectory()) {
            return await getDirectorySizeFast(fullPath);
          }
        } catch (e) {
          return 0;
        }
        return 0;
      });
      
      const sizes = await Promise.all(promises);
      size += sizes.reduce((sum, s) => sum + s, 0);
    }
  } catch (e) {
    // Skip
  }
  
  return size;
}
