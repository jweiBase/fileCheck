// 获取DOM元素
const pathInput = document.getElementById('pathInput');
const driveSelect = document.getElementById('driveSelect');
const scanBtn = document.getElementById('scanBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const treemapContainer = document.getElementById('treemapContainer');
const tooltip = document.getElementById('tooltip');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeBtn = document.querySelector('.close-btn');
const totalSizeEl = document.getElementById('totalSize');
const fileCountEl = document.getElementById('fileCount');
const folderCountEl = document.getElementById('folderCount');
const treeContent = document.getElementById('treeContent');
const treeSearch = document.getElementById('treeSearch');
const largeFilesContent = document.getElementById('largeFilesContent');
const languageSelect = document.getElementById('languageSelect');

let currentLanguage = 'zh-CN';
let translations = {};

// 硬编码语言数据，用于测试
const hardcodedTranslations = {
  'zh-CN': {
    "app": {
      "title": "磁盘空间可视化工具",
      "header": "磁盘空间可视化工具"
    },
    "controls": {
      "selectPath": "选择路径:",
      "selectDrive": "选择磁盘...",
      "scan": "开始扫描",
      "refresh": "🔄 刷新",
      "refreshTooltip": "强制刷新（忽略缓存）",
      "clearCacheTooltip": "清除所有缓存",
      "help": "使用说明"
    },
    "status": {
      "ready": "就绪",
      "scanning": "扫描中...",
      "forceRefreshing": "强制刷新中...",
      "scanningPlaceholder": "正在扫描，请稍候...",
      "scanningTree": "正在扫描...",
      "scanComplete": "扫描完成",
      "fromCache": "已从缓存加载 (点击刷新按钮强制更新)",
      "enterPath": "请输入路径",
      "cacheCleared": "缓存已清除"
    },
    "info": {
      "totalSize": "总大小:",
      "fileCount": "文件数:",
      "folderCount": "文件夹数:"
    },
    "panels": {
      "treemapPlaceholder": "请输入路径并点击\"开始扫描\"按钮",
      "treemapEmpty": "该路径为空或无法访问",
      "largeFiles": "大文件列表",
      "largeFilesPlaceholder": "扫描后显示大文件",
      "largeFilesEmpty": "未找到大文件",
      "directoryTree": "文件目录",
      "directoryTreePlaceholder": "扫描后显示文件目录",
      "directoryTreeEmpty": "无数据",
      "treeSearch": "搜索文件..."
    },
    "tooltip": {
      "file": "文件",
      "folder": "文件夹"
    },
    "language": {
      "zhCN": "中文",
      "enUS": "English"
    }
  },
  'en-US': {
    "app": {
      "title": "Disk Space Visualizer",
      "header": "Disk Space Visualizer"
    },
    "controls": {
      "selectPath": "Select Path:",
      "selectDrive": "Select Drive...",
      "scan": "Start Scan",
      "refresh": "🔄 Refresh",
      "refreshTooltip": "Force refresh (ignore cache)",
      "clearCacheTooltip": "Clear all cache",
      "help": "Usage Instructions"
    },
    "status": {
      "ready": "Ready",
      "scanning": "Scanning...",
      "forceRefreshing": "Force refreshing...",
      "scanningPlaceholder": "Scanning, please wait...",
      "scanningTree": "Scanning...",
      "scanComplete": "Scan complete",
      "fromCache": "Loaded from cache (click refresh button to force update)",
      "enterPath": "Please enter path",
      "cacheCleared": "Cache cleared"
    },
    "info": {
      "totalSize": "Total Size:",
      "fileCount": "File Count:",
      "folderCount": "Folder Count:"
    },
    "panels": {
      "treemapPlaceholder": "Please enter path and click \"Start Scan\" button",
      "treemapEmpty": "This path is empty or inaccessible",
      "largeFiles": "Large Files",
      "largeFilesPlaceholder": "Large files will be displayed after scanning",
      "largeFilesEmpty": "No large files found",
      "directoryTree": "Directory Tree",
      "directoryTreePlaceholder": "Directory tree will be displayed after scanning",
      "directoryTreeEmpty": "No data",
      "treeSearch": "Search files..."
    },
    "tooltip": {
      "file": "File",
      "folder": "Folder"
    },
    "language": {
      "zhCN": "中文",
      "enUS": "English"
    }
  }
};

function loadTranslations(lang) {
  // 返回硬编码的语言数据
  return hardcodedTranslations[lang] || {};
}

function setLanguage(lang) {
  currentLanguage = lang;
  translations = loadTranslations(lang);
  updateUIWithTranslations();
  localStorage.setItem('preferredLanguage', lang);
}

function updateUIWithTranslations() {
  if (!translations) return;
  
  // Update app title and header
  document.title = translations.app?.title || 'Disk Space Visualizer';
  document.querySelector('header h1').textContent = translations.app?.header || 'Disk Space Visualizer';
  
  // Update language selector options
  let langSelect = languageSelect;
  if (!langSelect) {
    langSelect = document.getElementById('languageSelect');
  }
  
  if (langSelect) {
    langSelect.options[0].text = translations.language?.zhCN || '中文';
    langSelect.options[1].text = translations.language?.enUS || 'English';
  }
  
  // Update controls
  document.querySelector('label[for="pathInput"]').textContent = translations.controls?.selectPath || 'Select Path:';
  document.getElementById('driveSelect').options[0].text = translations.controls?.selectDrive || 'Select Drive...';
  scanBtn.textContent = translations.controls?.scan || 'Start Scan';
  refreshBtn.textContent = translations.controls?.refresh || '🔄 Refresh';
  refreshBtn.title = translations.controls?.refreshTooltip || 'Force refresh (ignore cache)';
  clearCacheBtn.title = translations.controls?.clearCacheTooltip || 'Clear all cache';
  helpBtn.title = translations.controls?.help || 'Usage Instructions';
  
  // Update path input placeholder
  document.getElementById('pathInput').placeholder = currentLanguage === 'zh-CN' ? '输入磁盘路径，如 C:\\ 或 D:\\projects' : 'Enter disk path, e.g., C:\\ or D:\\projects';
  
  // Update status text - always update regardless of current text
  if (statusText.textContent === '就绪' || statusText.textContent === 'Ready') {
    statusText.textContent = translations.status?.ready || 'Ready';
  } else if (statusText.textContent === '扫描中...' || statusText.textContent === 'Scanning...') {
    statusText.textContent = translations.status?.scanning || 'Scanning...';
  } else if (statusText.textContent === '强制刷新中...' || statusText.textContent === 'Force refreshing...') {
    statusText.textContent = translations.status?.forceRefreshing || 'Force refreshing...';
  } else if (statusText.textContent === '扫描完成' || statusText.textContent === 'Scan complete') {
    statusText.textContent = translations.status?.scanComplete || 'Scan complete';
  } else if (statusText.textContent === '请输入路径' || statusText.textContent === 'Please enter path') {
    statusText.textContent = translations.status?.enterPath || 'Please enter path';
  } else if (statusText.textContent === '缓存已清除' || statusText.textContent === 'Cache cleared') {
    statusText.textContent = translations.status?.cacheCleared || 'Cache cleared';
  }
  
  // Update info panel
  document.querySelectorAll('.info-label')[0].textContent = translations.info?.totalSize || 'Total Size:';
  document.querySelectorAll('.info-label')[1].textContent = translations.info?.fileCount || 'File Count:';
  document.querySelectorAll('.info-label')[2].textContent = translations.info?.folderCount || 'Folder Count:';
  
  // Update panels
  document.querySelector('.large-files-header span').textContent = translations.panels?.largeFiles || 'Large Files';
  document.querySelector('.tree-header span').textContent = translations.panels?.directoryTree || 'Directory Tree';
  treeSearch.placeholder = translations.panels?.treeSearch || 'Search files...';
  
  // Update help modal
  document.querySelector('.modal-header h2').textContent = translations.help?.title || 'Usage Instructions';
  document.querySelectorAll('.modal-body h3')[0].textContent = translations.help?.features || 'Features';
  document.querySelectorAll('.modal-body h3')[1].textContent = translations.help?.steps || 'Usage Steps';
  document.querySelectorAll('.modal-body h3')[2].textContent = translations.help?.visualization || 'Visualization Instructions';
  document.querySelectorAll('.modal-body h3')[3].textContent = translations.help?.notes || 'Notes';
  document.querySelectorAll('.modal-body h3')[4].textContent = translations.help?.shortcuts || 'Shortcuts';
  
  document.querySelectorAll('.modal-body p')[0].textContent = translations.help?.featuresDesc || 'This tool is used to visualize disk space usage, displaying file size distribution using treemap visualization.';
  document.querySelectorAll('.modal-body ol li')[0].innerHTML = `<strong>${translations.help?.step1 || 'Select Path:'}</strong> ${translations.help?.step1Desc || 'Enter the disk path to scan (e.g., C:\\ or D:\\projects) in the input box, or select a drive from the dropdown menu.'}`;
  document.querySelectorAll('.modal-body ol li')[1].innerHTML = `<strong>${translations.help?.step2 || 'Start Scan:'}</strong> ${translations.help?.step2Desc || 'Click the "Start Scan" button, and the program will recursively scan all files and folders under the specified path.'}`;
  document.querySelectorAll('.modal-body ol li')[2].innerHTML = `<strong>${translations.help?.step3 || 'View Results:'}</strong> ${translations.help?.step3Desc || 'After scanning is complete, the interface will display a treemap, where each rectangle represents a file or folder, with area proportional to size.'}`;
  document.querySelectorAll('.modal-body ol li')[3].innerHTML = `<strong>${translations.help?.step4 || 'Interaction:'}</strong>`;
  document.querySelectorAll('.modal-body ul')[0].innerHTML = `
    <li>${translations.help?.step4a || 'Hover over rectangles to view detailed information'}</li>
    <li>${translations.help?.step4b || 'Click rectangles to open the corresponding file/folder location in Explorer'}</li>
  `;
  document.querySelectorAll('.modal-body ul')[1].innerHTML = `
    <li><strong>${translations.help?.size || 'Rectangle Size:'}</strong> ${translations.help?.sizeDesc || 'Represents file/folder space usage, larger means more usage'}</li>
    <li><strong>${translations.help?.color || 'Color Depth:'}</strong> ${translations.help?.colorDesc || 'Represents hierarchy depth, up to 3 levels of nesting can be displayed'}</li>
    <li><strong>${translations.help?.border || 'Border Thickness:'}</strong> ${translations.help?.borderDesc || 'Indicates whether it is a folder (thick border for folders)'}</li>
  `;
  document.querySelectorAll('.modal-body ul')[2].innerHTML = `
    <li>${translations.help?.note1 || 'Scanning large disks may take a long time, please be patient'}</li>
    <li>${translations.help?.note2 || 'Some system folders may be inaccessible and will be automatically skipped'}</li>
    <li>${translations.help?.note3 || 'It is recommended to run with administrator privileges to get complete scan results'}</li>
  `;
  document.querySelectorAll('.modal-body ul')[3].innerHTML = `
    <li><strong>${translations.help?.shortcutEnter || 'Enter:'}</strong> ${translations.help?.shortcutEnterDesc || 'Press Enter in the path input box to start scanning'}</li>
    <li><strong>${translations.help?.shortcutEsc || 'Esc:'}</strong> ${translations.help?.shortcutEscDesc || 'Close help window'}</li>
  `;
  
  // Update placeholders
  const placeholders = document.querySelectorAll('.placeholder p');
  placeholders.forEach(placeholder => {
    // 根据占位符的父元素ID或位置来确定应该使用哪个翻译键
    const parentElement = placeholder.parentElement;
    
    // 检查父元素是否是特定面板的占位符
    if (parentElement.parentElement.id === 'treemapContainer') {
      // 树图容器的占位符
      if (placeholder.textContent.includes('请输入路径') || placeholder.textContent.includes('Please enter path') || 
          placeholder.textContent.includes('该路径为空') || placeholder.textContent.includes('This path is empty') ||
          placeholder.textContent.includes('正在扫描，请稍候') || placeholder.textContent.includes('Scanning, please wait')) {
        // 根据内容类型选择合适的翻译
        if (placeholder.textContent.includes('正在扫描') || placeholder.textContent.includes('Scanning')) {
          placeholder.textContent = translations.status?.scanningPlaceholder || 'Scanning, please wait...';
        } else if (placeholder.textContent.includes('该路径为空') || placeholder.textContent.includes('This path is empty')) {
          placeholder.textContent = translations.panels?.treemapEmpty || 'This path is empty or inaccessible';
        } else {
          placeholder.textContent = translations.panels?.treemapPlaceholder || 'Please enter path and click "Start Scan" button';
        }
      }
    } else if (parentElement.parentElement.id === 'largeFilesContent') {
      // 大文件面板的占位符
      if (placeholder.textContent.includes('扫描后显示大文件') || placeholder.textContent.includes('Large files will be displayed') ||
          placeholder.textContent.includes('未找到大文件') || placeholder.textContent.includes('No large files found')) {
        if (placeholder.textContent.includes('未找到') || placeholder.textContent.includes('No large files')) {
          placeholder.textContent = translations.panels?.largeFilesEmpty || 'No large files found';
        } else {
          placeholder.textContent = translations.panels?.largeFilesPlaceholder || 'Large files will be displayed after scanning';
        }
      }
    } else if (parentElement.parentElement.id === 'treeContent') {
      // 目录树面板的占位符
      if (placeholder.textContent.includes('扫描后显示文件目录') || placeholder.textContent.includes('Directory tree will be displayed') ||
          placeholder.textContent.includes('无数据') || placeholder.textContent.includes('No data') ||
          placeholder.textContent.includes('正在扫描...') || placeholder.textContent.includes('Scanning...')) {
        if (placeholder.textContent.includes('正在扫描') || placeholder.textContent.includes('Scanning')) {
          placeholder.textContent = translations.status?.scanningTree || 'Scanning...';
        } else if (placeholder.textContent.includes('无数据') || placeholder.textContent.includes('No data')) {
          placeholder.textContent = translations.panels?.directoryTreeEmpty || 'No data';
        } else {
          placeholder.textContent = translations.panels?.directoryTreePlaceholder || 'Directory tree will be displayed after scanning';
        }
      }
    }
  });
  
  // Update tooltip text
  document.querySelectorAll('.tooltip-type').forEach(el => {
    if (el.textContent === '文件' || el.textContent === 'File') {
      el.textContent = translations.tooltip?.file || 'File';
    } else if (el.textContent === '文件夹' || el.textContent === 'Folder') {
      el.textContent = translations.tooltip?.folder || 'Folder';
    }
  });
}

function getTranslation(key, defaultValue = '') {
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  return value || defaultValue;
}

const MAX_DEPTH = 3;
const MIN_CELL_SIZE = 30;
const COLORS = [
  ['#4fc3f7', '#29b6f6', '#03a9f4'],
  ['#81c784', '#66bb6a', '#4caf50'],
  ['#ffb74d', '#ffa726', '#ff9800'],
  ['#f06292', '#ec407a', '#e91e63'],
  ['#ba68c8', '#ab47bc', '#9c27b0'],
  ['#4dd0e1', '#26c6da', '#00bcd4'],
  ['#aed581', '#9ccc65', '#8bc34a'],
  ['#ff8a65', '#ff7043', '#ff5722']
];

let currentData = null;
let removeProgressListener = null;

async function init() {
  await loadDrives();
  setupEventListeners();
  setupProgressListener();
  
  // Initialize language
  const savedLanguage = localStorage.getItem('preferredLanguage') || 'zh-CN';
  setLanguage(savedLanguage);
  
  // Update language selector
  if (languageSelect) {
    languageSelect.value = savedLanguage;
  }
}

function setupProgressListener() {
  if (removeProgressListener) {
    removeProgressListener();
  }
  
  removeProgressListener = window.electronAPI.onScanProgress((data) => {
    if (data.total > 0) {
      const percent = Math.round((data.scanned / data.total) * 100);
      progressBar.style.width = percent + '%';
      statusText.textContent = `扫描中... ${data.scanned}/${data.total}`;
    }
  });
}

async function loadDrives() {
  try {
    // 清空现有的磁盘选项，只保留第一个默认选项
    const driveSelectElement = document.getElementById('driveSelect');
    if (driveSelectElement) {
      // 保存第一个默认选项
      const defaultOption = driveSelectElement.options[0];
      // 清空所有选项
      driveSelectElement.innerHTML = '';
      // 重新添加默认选项
      driveSelectElement.appendChild(defaultOption);
      
      const result = await window.electronAPI.getDrives();
      if (result.success && result.drives.length > 0) {
        result.drives.forEach(drive => {
          const option = document.createElement('option');
          option.value = drive;
          option.textContent = drive;
          driveSelectElement.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Failed to load drives:', error);
  }
}

function setupEventListeners() {
  scanBtn.addEventListener('click', () => startScan(false));
  
  refreshBtn.addEventListener('click', () => startScan(true));
  
  clearCacheBtn.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.clearCache();
      if (result.success) {
        statusText.textContent = getTranslation('status.cacheCleared', 'Cache cleared');
        setTimeout(() => {
          statusText.textContent = getTranslation('status.ready', 'Ready');
        }, 2000);
      } else {
        statusText.textContent = getTranslation('status.cacheClearFailed', 'Failed to clear cache: ') + result.error;
      }
    } catch (error) {
      statusText.textContent = getTranslation('status.cacheClearError', 'Error clearing cache: ') + error.message;
    }
  });
  
  pathInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      startScan(false);
    }
  });
  
  driveSelect.addEventListener('change', () => {
    if (driveSelect.value) {
      pathInput.value = driveSelect.value;
    }
  });
  
  helpBtn.addEventListener('click', () => {
    helpModal.classList.add('active');
  });
  
  closeBtn.addEventListener('click', () => {
    helpModal.classList.remove('active');
  });
  
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.remove('active');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal.classList.contains('active')) {
      helpModal.classList.remove('active');
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = e.clientX + 15 + 'px';
      tooltip.style.top = e.clientY + 15 + 'px';
    }
  });
  
  treeSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterTree(searchTerm);
  });
  
  // Language selector event
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      setLanguage(selectedLang);
    });
  }
}

async function startScan(forceRefresh = false) {
  const path = pathInput.value.trim();
  if (!path) {
    statusText.textContent = getTranslation('status.enterPath', 'Please enter path');
    return;
  }
  
  scanBtn.disabled = true;
  refreshBtn.disabled = true;
  clearCacheBtn.disabled = true;
  statusText.textContent = forceRefresh ? getTranslation('status.forceRefreshing', 'Force refreshing...') : getTranslation('status.scanning', 'Scanning...');
  progressBar.style.width = '0%';
  progressBar.classList.add('active');
  
  treemapContainer.innerHTML = `<div class="placeholder"><p>${getTranslation('status.scanningPlaceholder', 'Scanning, please wait...')}</p></div>`;
  treeContent.innerHTML = `<div class="placeholder"><p>${getTranslation('status.scanningTree', 'Scanning...')}</p></div>`;
  
  try {
    const result = await window.electronAPI.scanDirectory(path, forceRefresh);
    
    if (result.success) {
        currentData = result.data;
        if (result.fromCache) {
          statusText.textContent = getTranslation('status.fromCache', 'Loaded from cache (click refresh button to force update)');
        } else {
          statusText.textContent = getTranslation('status.scanComplete', 'Scan complete');
        }
        updateInfo(result.data);
        renderTreemap(result.data);
        renderTree(result.data);
        renderLargeFiles(result.data);
    } else {
      statusText.textContent = '扫描失败: ' + result.error;
      treemapContainer.innerHTML = '<div class="placeholder"><p>扫描失败: ' + result.error + '</p></div>';
      treeContent.innerHTML = '<div class="placeholder"><p>扫描失败</p></div>';
    }
  } catch (error) {
    statusText.textContent = '扫描出错: ' + error.message;
    treemapContainer.innerHTML = '<div class="placeholder"><p>扫描出错: ' + error.message + '</p></div>';
    treeContent.innerHTML = '<div class="placeholder"><p>扫描出错</p></div>';
  } finally {
    scanBtn.disabled = false;
    refreshBtn.disabled = false;
    clearCacheBtn.disabled = false;
    progressBar.classList.remove('active');
    progressBar.style.width = '100%';
    setTimeout(() => {
      progressBar.style.width = '0%';
    }, 500);
  }
}

function updateInfo(data) {
  totalSizeEl.textContent = formatSize(data.size);
  const counts = countFilesAndFolders(data);
  fileCountEl.textContent = counts.files.toLocaleString();
  folderCountEl.textContent = counts.folders.toLocaleString();
}

function countFilesAndFolders(data) {
  let files = 0;
  let folders = 0;
  
  function count(node) {
    if (node.isFile) {
      files++;
    } else {
      folders++;
      if (node.children) {
        node.children.forEach(child => count(child));
      }
    }
  }
  
  count(data);
  return { files, folders };
}

function renderTreemap(data) {
  treemapContainer.innerHTML = '';
  
  const containerRect = treemapContainer.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height;
  
  const treemap = document.createElement('div');
  treemap.className = 'treemap';
  treemap.style.width = width + 'px';
  treemap.style.height = height + 'px';
  
  if (!data.children || data.children.length === 0) {
    treemap.innerHTML = `<div class="placeholder"><p>${getTranslation('panels.treemapEmpty', 'This path is empty or inaccessible')}</p></div>`;
    treemapContainer.appendChild(treemap);
    return;
  }
  
  const cells = squarify(data.children, { x: 0, y: 0, width, height }, 0);
  
  cells.forEach(cell => {
    const div = createCellElement(cell);
    treemap.appendChild(div);
  });
  
  treemapContainer.appendChild(treemap);
}

function squarify(children, rect, depth) {
  if (!children || children.length === 0 || depth >= MAX_DEPTH) {
    return [];
  }
  
  const sortedChildren = [...children].sort((a, b) => b.size - a.size);
  const validChildren = sortedChildren.filter(c => c.size > 0);
  
  if (validChildren.length === 0) return [];
  
  const totalSize = validChildren.reduce((sum, c) => sum + c.size, 0);
  if (totalSize === 0) return [];
  
  return layoutSquarify(validChildren, rect, totalSize, depth);
}

function layoutSquarify(children, rect, totalSize, depth) {
  const cells = [];
  let remainingRect = { ...rect };
  let remainingChildren = [...children];
  let remainingTotal = totalSize;
  
  while (remainingChildren.length > 0 && remainingRect.width > 0 && remainingRect.height > 0) {
    const isHorizontal = remainingRect.width >= remainingRect.height;
    
    let row = [];
    let rowSize = 0;
    let bestRatio = Infinity;
    
    for (let i = 0; i < remainingChildren.length; i++) {
      const testRow = remainingChildren.slice(0, i + 1);
      const testRowSize = testRow.reduce((sum, c) => sum + c.size, 0);
      
      const ratio = calculateWorstRatio(testRow, testRowSize, remainingRect, isHorizontal);
      
      if (ratio <= bestRatio) {
        row = testRow;
        rowSize = testRowSize;
        bestRatio = ratio;
      } else {
        break;
      }
    }
    
    if (row.length === 0) {
      row = [remainingChildren[0]];
      rowSize = row[0].size;
    }
    
    const rowCells = layoutRow(row, remainingRect, rowSize, remainingTotal, depth, isHorizontal);
    cells.push(...rowCells);
    
    const rowArea = (remainingRect.width * remainingRect.height) * (rowSize / remainingTotal);
    const rowThickness = rowArea / (isHorizontal ? remainingRect.width : remainingRect.height);
    
    if (isHorizontal) {
      remainingRect.y += rowThickness;
      remainingRect.height -= rowThickness;
    } else {
      remainingRect.x += rowThickness;
      remainingRect.width -= rowThickness;
    }
    
    remainingChildren = remainingChildren.slice(row.length);
    remainingTotal -= rowSize;
  }
  
  return cells;
}

function calculateWorstRatio(row, rowSize, rect, isHorizontal) {
  const totalArea = rect.width * rect.height;
  const rowArea = totalArea * (rowSize / rect.width / rect.height * (isHorizontal ? rect.height : rect.width));
  
  const rowThickness = isHorizontal 
    ? rowArea / rect.width 
    : rowArea / rect.height;
  
  let worstRatio = 0;
  
  for (const child of row) {
    const childArea = totalArea * (child.size / (rect.width * rect.height));
    const childWidth = isHorizontal ? (child.size / rowSize) * rect.width : rowThickness;
    const childHeight = isHorizontal ? rowThickness : (child.size / rowSize) * rect.height;
    
    const ratio = Math.max(childWidth / childHeight, childHeight / childWidth);
    worstRatio = Math.max(worstRatio, ratio);
  }
  
  return worstRatio;
}

function layoutRow(row, rect, rowSize, totalSize, depth, isHorizontal) {
  const cells = [];
  
  const totalArea = rect.width * rect.height;
  const rowAreaFraction = rowSize / totalSize;
  const rowThickness = isHorizontal 
    ? rect.height * rowAreaFraction
    : rect.width * rowAreaFraction;
  
  let offset = isHorizontal ? rect.x : rect.y;
  
  row.forEach((child, index) => {
    const childAreaFraction = child.size / rowSize;
    
    let cellWidth, cellHeight, cellX, cellY;
    
    if (isHorizontal) {
      cellWidth = rect.width * childAreaFraction;
      cellHeight = rowThickness;
      cellX = offset;
      cellY = rect.y;
      offset += cellWidth;
    } else {
      cellWidth = rowThickness;
      cellHeight = rect.height * childAreaFraction;
      cellX = rect.x;
      cellY = offset;
      offset += cellHeight;
    }
    
    if (cellWidth < MIN_CELL_SIZE || cellHeight < MIN_CELL_SIZE) return;
    
    const colorIndex = depth % COLORS.length;
    const shadeIndex = index % 3;
    const color = COLORS[colorIndex][shadeIndex];
    
    const cell = {
      x: cellX,
      y: cellY,
      width: cellWidth,
      height: cellHeight,
      data: child,
      depth: depth,
      color: color
    };
    
    cells.push(cell);
    
    if (child.children && child.children.length > 0 && depth < MAX_DEPTH - 1) {
      const padding = 3;
      const innerRect = {
        x: cellX + padding,
        y: cellY + padding,
        width: cellWidth - padding * 2,
        height: cellHeight - padding * 2
      };
      
      if (innerRect.width > MIN_CELL_SIZE && innerRect.height > MIN_CELL_SIZE) {
        const innerCells = squarify(child.children, innerRect, depth + 1);
        cells.push(...innerCells);
      }
    }
  });
  
  return cells;
}

function createCellElement(cell) {
  const div = document.createElement('div');
  div.className = 'treemap-cell ' + (cell.data.isFile ? 'file' : 'folder');
  div.style.left = cell.x + 'px';
  div.style.top = cell.y + 'px';
  div.style.width = cell.width + 'px';
  div.style.height = cell.height + 'px';
  div.style.backgroundColor = cell.color;
  
  const area = cell.width * cell.height;
  const minArea = 800;
  const aspectRatio = Math.max(cell.width / cell.height, cell.height / cell.width);
  
  if (area >= minArea) {
    const labelContainer = document.createElement('div');
    labelContainer.className = 'label-container';
    
    const isVertical = cell.height > cell.width * 1.5;
    
    if (isVertical && cell.height > 60) {
      labelContainer.style.writingMode = 'vertical-rl';
      labelContainer.style.textOrientation = 'mixed';
      labelContainer.style.flexDirection = 'column-reverse';
    }
    
    labelContainer.style.display = 'flex';
    labelContainer.style.flexDirection = isVertical ? 'column-reverse' : 'column';
    labelContainer.style.alignItems = 'center';
    labelContainer.style.justifyContent = 'center';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    labelContainer.style.padding = '2px';
    
    const label = document.createElement('div');
    label.className = 'label';
    
    const maxChars = isVertical 
      ? Math.floor(cell.height / 12) 
      : Math.floor(cell.width / 7);
    label.textContent = truncateText(cell.data.name, Math.max(3, maxChars));
    labelContainer.appendChild(label);
    
    const showSize = isVertical 
      ? (cell.width > 35 && cell.height > 80)
      : (cell.width > 50 && cell.height > 35);
    
    if (showSize) {
      const sizeLabel = document.createElement('div');
      sizeLabel.className = 'size-label';
      sizeLabel.textContent = formatSize(cell.data.size);
      labelContainer.appendChild(sizeLabel);
    }
    
    div.appendChild(labelContainer);
  }
  
  div.addEventListener('mouseenter', (e) => showTooltip(e, cell.data));
  div.addEventListener('mouseleave', hideTooltip);
  div.addEventListener('click', () => openInExplorer(cell.data.path));
  
  return div;
}

function showTooltip(e, data) {
  tooltip.innerHTML = `
    <div class="tooltip-name">${escapeHtml(data.name)}</div>
    <div class="tooltip-path">${escapeHtml(data.path)}</div>
    <div class="tooltip-size">${formatSize(data.size)}</div>
    <div class="tooltip-type">${data.isFile ? (translations.tooltip?.file || 'File') : (translations.tooltip?.folder || 'Folder')}</div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.left = e.clientX + 15 + 'px';
  tooltip.style.top = e.clientY + 15 + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

async function openInExplorer(path) {
  try {
    await window.electronAPI.openInExplorer(path);
  } catch (error) {
    console.error('Failed to open in explorer:', error);
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  
  if (i === 0) {
    return size + ' ' + units[i];
  }
  return size.toFixed(2) + ' ' + units[i];
}

function truncateText(text, maxLength) {
  maxLength = Math.max(5, Math.floor(maxLength));
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTree(data) {
  treeContent.innerHTML = '';
  
  if (!data) {
    treeContent.innerHTML = `<div class="placeholder"><p>${getTranslation('panels.directoryTreeEmpty', 'No data')}</p></div>`;
    return;
  }
  
  const treeRoot = document.createElement('div');
  treeRoot.className = 'tree-root';
  
  const rootItem = createTreeItem(data, 0);
  treeRoot.appendChild(rootItem);
  
  treeContent.appendChild(treeRoot);
  
  const rootToggle = rootItem.querySelector('.tree-toggle');
  if (rootToggle) {
    toggleTreeItem(rootToggle);
  }
}

function createTreeItem(node, depth) {
  const container = document.createElement('div');
  container.className = 'tree-node';
  container.dataset.path = node.path;
  
  const item = document.createElement('div');
  item.className = 'tree-item ' + (node.isFile ? 'file' : 'folder');
  item.dataset.path = node.path;
  
  const hasChildren = node.children && node.children.length > 0;
  
  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle' + (hasChildren ? '' : ' hidden');
  toggle.innerHTML = '▶';
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTreeItem(toggle);
  });
  item.appendChild(toggle);
  
  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.innerHTML = node.isFile ? '📄' : '📁';
  item.appendChild(icon);
  
  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = node.name;
  name.title = node.name;
  item.appendChild(name);
  
  const size = document.createElement('span');
  size.className = 'tree-size';
  size.textContent = formatSize(node.size);
  item.appendChild(size);
  
  item.addEventListener('click', () => {
    document.querySelectorAll('.tree-item.active').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    openInExplorer(node.path);
  });
  
  container.appendChild(item);
  
  if (hasChildren) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    
    const sortedChildren = [...node.children].sort((a, b) => {
      if (a.isFile !== b.isFile) {
        return a.isFile ? 1 : -1;
      }
      return b.size - a.size;
    });
    
    sortedChildren.forEach(child => {
      const childItem = createTreeItem(child, depth + 1);
      childrenContainer.appendChild(childItem);
    });
    
    container.appendChild(childrenContainer);
  }
  
  return container;
}

function toggleTreeItem(toggle) {
  toggle.classList.toggle('expanded');
  const childrenContainer = toggle.closest('.tree-node').querySelector('.tree-children');
  if (childrenContainer) {
    childrenContainer.classList.toggle('expanded');
  }
}

function filterTree(searchTerm) {
  const allItems = treeContent.querySelectorAll('.tree-item');
  
  if (!searchTerm) {
    allItems.forEach(item => {
      item.classList.remove('highlighted');
      const node = item.closest('.tree-node');
      if (node) {
        node.style.display = '';
      }
    });
    return;
  }
  
  allItems.forEach(item => {
    const name = item.querySelector('.tree-name').textContent.toLowerCase();
    const isMatch = name.includes(searchTerm);
    const node = item.closest('.tree-node');
    
    if (isMatch) {
      item.classList.add('highlighted');
      if (node) node.style.display = '';
      
      let parent = node ? node.parentElement : null;
      while (parent && parent.classList.contains('tree-children')) {
        parent.classList.add('expanded');
        const toggle = parent.previousElementSibling?.querySelector('.tree-toggle');
        if (toggle) toggle.classList.add('expanded');
        parent = parent.parentElement?.parentElement;
        if (parent && parent.classList.contains('tree-children')) {
          // continue
        } else {
          break;
        }
      }
    } else {
      item.classList.remove('highlighted');
    }
  });
  
  const nodes = treeContent.querySelectorAll('.tree-node');
  nodes.forEach(node => {
    const item = node.querySelector('.tree-item');
    const isHighlighted = item && item.classList.contains('highlighted');
    const hasHighlightedChild = node.querySelector('.tree-item.highlighted') !== null;
    
    if (!isHighlighted && !hasHighlightedChild) {
      const name = item.querySelector('.tree-name').textContent.toLowerCase();
      if (!name.includes(searchTerm)) {
        node.style.display = 'none';
      }
    } else {
      node.style.display = '';
    }
  });
}

function collectLargeFiles(data, maxCount = 10) {
  const largeFiles = [];
  
  function traverse(node) {
    if (node.isFile) {
      largeFiles.push(node);
    } else if (node.children) {
      node.children.forEach(child => traverse(child));
    }
  }
  
  traverse(data);
  
  return largeFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, maxCount);
}

function renderLargeFiles(data) {
  largeFilesContent.innerHTML = '';
  
  if (!data) {
    largeFilesContent.innerHTML = `<div class="placeholder"><p>${getTranslation('panels.directoryTreeEmpty', 'No data')}</p></div>`;
    return;
  }
  
  const largeFiles = collectLargeFiles(data);
  
  if (largeFiles.length === 0) {
    largeFilesContent.innerHTML = `<div class="placeholder"><p>${getTranslation('panels.largeFilesEmpty', 'No large files found')}</p></div>`;
    return;
  }
  
  largeFiles.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'large-file-item';
    fileItem.dataset.path = file.path;
    
    const fileName = document.createElement('div');
    fileName.className = 'large-file-name';
    fileName.textContent = file.name;
    
    const filePath = document.createElement('div');
    filePath.className = 'large-file-path';
    filePath.textContent = file.path;
    
    const fileSize = document.createElement('div');
    fileSize.className = 'large-file-size';
    fileSize.textContent = formatSize(file.size);
    
    fileItem.appendChild(fileName);
    fileItem.appendChild(filePath);
    fileItem.appendChild(fileSize);
    
    fileItem.addEventListener('click', () => {
      openInExplorer(file.path);
    });
    
    largeFilesContent.appendChild(fileItem);
  });
}

window.addEventListener('resize', () => {
  if (currentData) {
    renderTreemap(currentData);
  }
});

// Ensure DOM is fully loaded before initializing
window.addEventListener('DOMContentLoaded', async () => {
  await init();
});
