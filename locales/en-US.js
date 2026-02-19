const enUS = {
  app: {
    title: 'Disk Space Visualizer'
  },
  buttons: {
    scan: 'Start Scan',
    refresh: 'Refresh',
    clearCache: 'Clear Cache',
    help: '?'
  },
  labels: {
    selectPath: 'Select Path:',
    totalSize: 'Total Size:',
    files: 'Files:',
    folders: 'Folders:'
  },
  placeholders: {
    pathInput: 'Enter disk path, e.g. C:\\ or D:\\projects',
    driveSelect: 'Select drive...',
    treeSearch: 'Search files...'
  },
  status: {
    ready: 'Ready',
    scanning: 'Scanning...',
    scanningProgress: 'Scanning... {scanned}/{total}',
    scanComplete: 'Scan Complete',
    fromCache: 'Loaded from cache (click refresh to force update)',
    forceRefresh: 'Force refreshing...',
    cacheCleared: 'Cache cleared',
    clearCacheFailed: 'Failed to clear cache: {error}',
    clearCacheError: 'Error clearing cache: {error}',
    pleaseEnterPath: 'Please enter a path',
    scanFailed: 'Scan failed: {error}',
    scanError: 'Scan error: {error}'
  },
  panels: {
    largeFiles: 'Large Files',
    fileDirectory: 'File Directory'
  },
  placeholders: {
    pathInput: 'Enter disk path, e.g. C:\\ or D:\\projects',
    driveSelect: 'Select drive...',
    treeSearch: 'Search files...',
    pleaseScan: 'Enter a path and click "Start Scan"',
    scanning: 'Scanning, please wait...',
    scanningTree: 'Scanning...',
    showLargeFiles: 'Large files will appear after scan',
    showFileDirectory: 'File directory will appear after scan',
    emptyOrInaccessible: 'Path is empty or inaccessible',
    scanFailed: 'Scan failed: {error}',
    scanError: 'Scan error',
    noData: 'No data',
    noLargeFiles: 'No large files found'
  },
  tooltip: {
    file: 'File',
    folder: 'Folder'
  },
  help: {
    title: 'User Guide',
    features: 'Features',
    featuresDesc: 'This tool visualizes disk space usage using a Treemap to display the size distribution of files and folders.',
    steps: 'How to Use',
    step1: 'Select Path: Enter the disk path to scan (e.g. C:\\ or D:\\projects), or select a drive from the dropdown.',
    step2: 'Start Scan: Click "Start Scan" button to recursively scan all files and folders under the specified path.',
    step3: 'View Results: After scanning, a treemap will be displayed where each rectangle represents a file or folder, with area proportional to size.',
    step4: 'Interactions:',
    step4_1: 'Hover over rectangles to view detailed information',
    step4_2: 'Click rectangles to open the file/folder location in Explorer',
    visualization: 'Visualization Guide',
    viz1: 'Rectangle Size: Represents file/folder space usage, larger means more space',
    viz2: 'Color Depth: Indicates hierarchy depth, up to 3 nested levels',
    viz3: 'Border Width: Indicates if it\'s a folder (thick border = folder)',
    notes: 'Notes',
    note1: 'Scanning large disks may take a while, please be patient',
    note2: 'Some system folders may be inaccessible and will be skipped',
    note3: 'Running as administrator is recommended for complete scan results',
    shortcuts: 'Keyboard Shortcuts',
    shortcut1: 'Enter: Press in path input to start scan',
    shortcut2: 'Esc: Close help window'
  },
  lang: {
    switch: 'Switch Language',
    zh: '中文',
    en: 'EN'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = enUS;
}
