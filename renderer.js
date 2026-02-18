const pathInput = document.getElementById('pathInput');
const driveSelect = document.getElementById('driveSelect');
const scanBtn = document.getElementById('scanBtn');
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

async function init() {
  await loadDrives();
  setupEventListeners();
}

async function loadDrives() {
  try {
    const result = await window.electronAPI.getDrives();
    if (result.success && result.drives.length > 0) {
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
  scanBtn.addEventListener('click', startScan);
  
  pathInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      startScan();
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
}

async function startScan() {
  const path = pathInput.value.trim();
  if (!path) {
    statusText.textContent = '请输入路径';
    return;
  }
  
  scanBtn.disabled = true;
  statusText.textContent = '扫描中...';
  progressBar.style.width = '0%';
  progressBar.classList.add('active');
  
  treemapContainer.innerHTML = '<div class="placeholder"><p>正在扫描，请稍候...</p></div>';
  treeContent.innerHTML = '<div class="placeholder"><p>正在扫描...</p></div>';
  
  try {
    const result = await window.electronAPI.scanDirectory(path);
    
    if (result.success) {
      currentData = result.data;
      statusText.textContent = '扫描完成';
      updateInfo(result.data);
      renderTreemap(result.data);
      renderTree(result.data);
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
    treemap.innerHTML = '<div class="placeholder"><p>该路径为空或无法访问</p></div>';
    treemapContainer.appendChild(treemap);
    return;
  }
  
  const totalSize = data.size || 1;
  const cells = squarify(data.children, { x: 0, y: 0, width, height }, totalSize, 0);
  
  cells.forEach(cell => {
    const div = createCellElement(cell);
    treemap.appendChild(div);
  });
  
  treemapContainer.appendChild(treemap);
}

function squarify(children, rect, totalSize, depth) {
  if (!children || children.length === 0 || depth >= MAX_DEPTH) {
    return [];
  }
  
  const cells = [];
  const sortedChildren = [...children].sort((a, b) => b.size - a.size);
  
  const validChildren = sortedChildren.filter(c => c.size > 0);
  if (validChildren.length === 0) return cells;
  
  const childrenTotal = validChildren.reduce((sum, c) => sum + c.size, 0);
  if (childrenTotal === 0) return cells;
  
  layoutRow(validChildren, rect, childrenTotal, depth, cells);
  
  return cells;
}

function layoutRow(children, rect, totalSize, depth, cells) {
  if (children.length === 0) return;
  
  const width = rect.width;
  const height = rect.height;
  
  if (width <= 0 || height <= 0) return;
  
  let currentX = rect.x;
  let currentY = rect.y;
  
  const isHorizontal = width >= height;
  
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const ratio = child.size / totalSize;
    
    let cellWidth, cellHeight;
    
    if (isHorizontal) {
      cellWidth = Math.max(MIN_CELL_SIZE, width * ratio);
      cellHeight = height;
    } else {
      cellWidth = width;
      cellHeight = Math.max(MIN_CELL_SIZE, height * ratio);
    }
    
    if (cellWidth < MIN_CELL_SIZE || cellHeight < MIN_CELL_SIZE) continue;
    
    const colorIndex = depth % COLORS.length;
    const shadeIndex = Math.min(i % 3, 2);
    const color = COLORS[colorIndex][shadeIndex];
    
    const cell = {
      x: currentX,
      y: currentY,
      width: cellWidth,
      height: cellHeight,
      data: child,
      depth: depth,
      color: color
    };
    
    cells.push(cell);
    
    if (child.children && child.children.length > 0 && depth < MAX_DEPTH - 1) {
      const padding = 4;
      const innerRect = {
        x: currentX + padding,
        y: currentY + padding,
        width: cellWidth - padding * 2,
        height: cellHeight - padding * 2
      };
      const innerCells = squarify(child.children, innerRect, child.size, depth + 1);
      cells.push(...innerCells);
    }
    
    if (isHorizontal) {
      currentX += cellWidth;
    } else {
      currentY += cellHeight;
    }
  }
}

function createCellElement(cell) {
  const div = document.createElement('div');
  div.className = 'treemap-cell ' + (cell.data.isFile ? 'file' : 'folder');
  div.style.left = cell.x + 'px';
  div.style.top = cell.y + 'px';
  div.style.width = cell.width + 'px';
  div.style.height = cell.height + 'px';
  div.style.backgroundColor = cell.color;
  
  if (cell.width > 60 && cell.height > 40) {
    const labelContainer = document.createElement('div');
    labelContainer.style.display = 'flex';
    labelContainer.style.flexDirection = 'column';
    labelContainer.style.alignItems = 'center';
    labelContainer.style.justifyContent = 'center';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = truncateText(cell.data.name, cell.width / 8);
    labelContainer.appendChild(label);
    
    if (cell.width > 80 && cell.height > 50) {
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
    <div class="tooltip-type">${data.isFile ? '文件' : '文件夹'}</div>
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
    treeContent.innerHTML = '<div class="placeholder"><p>无数据</p></div>';
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

window.addEventListener('resize', () => {
  if (currentData) {
    renderTreemap(currentData);
  }
});

init();
