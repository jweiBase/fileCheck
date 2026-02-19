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
const langBtn = document.getElementById('langBtn');

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
  i18n.init();
  updateAllText();
  updateLangButton();
  await loadDrives();
  setupEventListeners();
  setupProgressListener();
  
  i18n.onChange(() => {
    updateAllText();
    updateLangButton();
    if (currentData) {
      renderTree(currentData);
      renderLargeFiles(currentData);
    }
  });
}

function updateAllText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n.t(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = i18n.t(key);
  });
  
  document.title = i18n.t('app.title');
  document.documentElement.lang = i18n.getCurrentLang();
}

function updateLangButton() {
  langBtn.textContent = '🌐 ' + i18n.getLangLabel();
  langBtn.title = i18n.t('lang.switch');
}

function setupProgressListener() {
  if (removeProgressListener) {
    removeProgressListener();
  }
  
  removeProgressListener = window.electronAPI.onScanProgress((data) => {
    if (data.total > 0) {
      const percent = Math.round((data.scanned / data.total) * 100);
      progressBar.style.width = percent + '%';
      statusText.textContent = i18n.t('status.scanningProgress', { scanned: data.scanned, total: data.total });
    }
  });
}

async function loadDrives() {
  try {
    const result = await window.electronAPI.getDrives();
    if (result.success && result.drives.length > 0) {
      driveSelect.innerHTML = '<option value="">' + i18n.t('placeholders.driveSelect') + '</option>';
      result.drives.forEach(drive => {
        const option = document.createElement('option');
        option.value = drive;
        option.textContent = drive;
        driveSelect.appendChild(option);
      });
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
        statusText.textContent = i18n.t('status.cacheCleared');
        setTimeout(() => {
          statusText.textContent = i18n.t('status.ready');
        }, 2000);
      } else {
        statusText.textContent = i18n.t('status.clearCacheFailed', { error: result.error });
      }
    } catch (error) {
      statusText.textContent = i18n.t('status.clearCacheError', { error: error.message });
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
  
  langBtn.addEventListener('click', async () => {
    await i18n.toggleLanguage();
  });
}

async function startScan(forceRefresh = false) {
  const path = pathInput.value.trim();
  if (!path) {
    statusText.textContent = i18n.t('status.pleaseEnterPath');
    return;
  }
  
  scanBtn.disabled = true;
  refreshBtn.disabled = true;
  clearCacheBtn.disabled = true;
  statusText.textContent = forceRefresh ? i18n.t('status.forceRefresh') : i18n.t('status.scanning');
  progressBar.style.width = '0%';
  progressBar.classList.add('active');
  
  treemapContainer.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.scanning') + '</p></div>';
  treeContent.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.scanningTree') + '</p></div>';
  
  try {
    const result = await window.electronAPI.scanDirectory(path, forceRefresh);
    
    if (result.success) {
        currentData = result.data;
        if (result.fromCache) {
          statusText.textContent = i18n.t('status.fromCache');
        } else {
          statusText.textContent = i18n.t('status.scanComplete');
        }
        updateInfo(result.data);
        renderTreemap(result.data);
        renderTree(result.data);
        renderLargeFiles(result.data);
    } else {
      statusText.textContent = i18n.t('status.scanFailed', { error: result.error });
      treemapContainer.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.scanFailed', { error: result.error }) + '</p></div>';
      treeContent.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.scanError') + '</p></div>';
    }
  } catch (error) {
    statusText.textContent = i18n.t('status.scanError', { error: error.message });
    treemapContainer.innerHTML = '<div class="placeholder"><p>' + i18n.t('status.scanError', { error: error.message }) + '</p></div>';
    treeContent.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.scanError') + '</p></div>';
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
    treemap.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.emptyOrInaccessible') + '</p></div>';
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
    <div class="tooltip-type">${data.isFile ? i18n.t('tooltip.file') : i18n.t('tooltip.folder')}</div>
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
    treeContent.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.noData') + '</p></div>';
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
    largeFilesContent.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.noData') + '</p></div>';
    return;
  }
  
  const largeFiles = collectLargeFiles(data);
  
  if (largeFiles.length === 0) {
    largeFilesContent.innerHTML = '<div class="placeholder"><p>' + i18n.t('placeholders.noLargeFiles') + '</p></div>';
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

init();
