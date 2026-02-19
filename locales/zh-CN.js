const zhCN = {
  app: {
    title: '磁盘空间可视化工具'
  },
  buttons: {
    scan: '开始扫描',
    refresh: '刷新',
    clearCache: '清除缓存',
    help: '?'
  },
  labels: {
    selectPath: '选择路径:',
    totalSize: '总大小:',
    files: '文件数:',
    folders: '文件夹数:'
  },
  placeholders: {
    pathInput: '输入磁盘路径，如 C:\\ 或 D:\\projects',
    driveSelect: '选择磁盘...',
    treeSearch: '搜索文件...'
  },
  status: {
    ready: '就绪',
    scanning: '扫描中...',
    scanningProgress: '扫描中... {scanned}/{total}',
    scanComplete: '扫描完成',
    fromCache: '已从缓存加载 (点击刷新按钮强制更新)',
    forceRefresh: '强制刷新中...',
    cacheCleared: '缓存已清除',
    clearCacheFailed: '清除缓存失败: {error}',
    clearCacheError: '清除缓存出错: {error}',
    pleaseEnterPath: '请输入路径',
    scanFailed: '扫描失败: {error}',
    scanError: '扫描出错: {error}'
  },
  panels: {
    largeFiles: '大文件列表',
    fileDirectory: '文件目录'
  },
  placeholders: {
    pathInput: '输入磁盘路径，如 C:\\ 或 D:\\projects',
    driveSelect: '选择磁盘...',
    treeSearch: '搜索文件...',
    pleaseScan: '请输入路径并点击"开始扫描"按钮',
    scanning: '正在扫描，请稍候...',
    scanningTree: '正在扫描...',
    showLargeFiles: '扫描后显示大文件',
    showFileDirectory: '扫描后显示文件目录',
    emptyOrInaccessible: '该路径为空或无法访问',
    scanFailed: '扫描失败: {error}',
    scanError: '扫描出错',
    noData: '无数据',
    noLargeFiles: '未找到大文件'
  },
  tooltip: {
    file: '文件',
    folder: '文件夹'
  },
  help: {
    title: '使用说明',
    features: '功能介绍',
    featuresDesc: '本工具用于可视化磁盘空间占用情况，使用矩形树图（Treemap）方式展示文件和文件夹的大小分布。',
    steps: '使用步骤',
    step1: '选择路径: 在输入框中输入要扫描的磁盘路径（如 C:\\ 或 D:\\projects），或从下拉菜单中选择磁盘。',
    step2: '开始扫描: 点击"开始扫描"按钮，程序将递归扫描指定路径下的所有文件和文件夹。',
    step3: '查看结果: 扫描完成后，界面将显示矩形树图，每个矩形代表一个文件或文件夹，面积与大小成正比。',
    step4: '交互操作:',
    step4_1: '鼠标悬停在矩形上可查看详细信息',
    step4_2: '点击矩形可在资源管理器中打开对应文件/文件夹位置',
    visualization: '可视化说明',
    viz1: '矩形大小: 表示文件/文件夹占用空间大小，越大占用越多',
    viz2: '颜色深浅: 表示层级深度，最深可显示3层嵌套',
    viz3: '边框粗细: 表示是否为文件夹（粗边框为文件夹）',
    notes: '注意事项',
    note1: '扫描大型磁盘可能需要较长时间，请耐心等待',
    note2: '某些系统文件夹可能无法访问，会被自动跳过',
    note3: '建议以管理员权限运行以获取完整的扫描结果',
    shortcuts: '快捷键',
    shortcut1: 'Enter: 在路径输入框中按回车开始扫描',
    shortcut2: 'Esc: 关闭帮助窗口'
  },
  lang: {
    switch: '切换语言',
    zh: '中文',
    en: 'EN'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = zhCN;
}
