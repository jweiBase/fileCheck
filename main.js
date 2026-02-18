const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

app.setPath('userData', path.join(__dirname, 'app-data'));

let mainWindow;

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
}

app.whenReady().then(() => {
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

ipcMain.handle('scan-directory', async (event, dirPath) => {
  try {
    const result = await scanDirectory(dirPath, 0, 3);
    return { success: true, data: result };
  } catch (error) {
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

async function scanDirectory(dirPath, currentDepth, maxDepth) {
  const stats = fs.statSync(dirPath);
  
  if (stats.isFile()) {
    return {
      name: path.basename(dirPath),
      path: dirPath,
      size: stats.size,
      isFile: true,
      modified: stats.mtime
    };
  }

  const result = {
    name: path.basename(dirPath) || dirPath,
    path: dirPath,
    size: 0,
    isFile: false,
    children: [],
    modified: stats.mtime
  };

  if (currentDepth >= maxDepth) {
    result.size = getDirectorySizeSync(dirPath);
    return result;
  }

  let children = [];
  try {
    children = fs.readdirSync(dirPath);
  } catch (e) {
    return result;
  }

  for (const child of children) {
    const childPath = path.join(dirPath, child);
    try {
      const childResult = await scanDirectory(childPath, currentDepth + 1, maxDepth);
      result.children.push(childResult);
      result.size += childResult.size;
    } catch (e) {
      // Skip inaccessible files/folders
    }
  }

  result.children.sort((a, b) => b.size - a.size);
  
  return result;
}

function getDirectorySizeSync(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          size += stats.size;
        } else {
          size += getDirectorySizeSync(filePath);
        }
      } catch (e) {
        // Skip
      }
    }
  } catch (e) {
    // Skip
  }
  return size;
}
