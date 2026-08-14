/**
 * PaceOn 桌面版主进程
 *
 * 架构：
 *  - 内置 Next.js standalone 服务器（.next/standalone 打包为 resources/server）
 *  - 用 Electron 内置 Node（ELECTRON_RUN_AS_NODE=1）作为子进程启动服务器
 *  - 首启时弹出设置窗口填写 DeepSeek API Key / DsBridge 网关地址
 *  - 配置与数据库存放在 userData 目录（可写），保证打包后仍可运行
 */
const { app, BrowserWindow, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const net = require('net')

let serverProcess = null
let mainWindow = null
let settingsWindow = null
let appUrl = null

const isPackaged = app.isPackaged
const serverDir = isPackaged
  ? path.join(process.resourcesPath, 'server')
  : path.join(__dirname, 'server')
const dsbridgeDir = isPackaged
  ? path.join(process.resourcesPath, 'dsbridge')
  : path.join(__dirname, 'dsbridge')
const userDataDir = app.getPath('userData')
const configPath = path.join(userDataDir, 'config.json')
const dbPath = path.join(userDataDir, 'custom.db')

// ---------- 配置读写 ----------

function defaultConfig() {
  return {
    deepseekApiKey: '',
    deepseekApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    visionApiUrl: 'http://127.0.0.1:8901/v1/chat/completions',
    port: 0, // 0 = 自动选空闲端口
    autoStartDsBridge: false, // 随 PaceOn 自动启动 DsBridge
    dsbridgePort: 8901,
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8').replace(/^\uFEFF/, '')
      return { ...defaultConfig(), ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error('[config] 读取失败:', e.message)
  }
  return defaultConfig()
}

function saveConfig(cfg) {
  fs.mkdirSync(userDataDir, { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8')
}

// ---------- DsBridge 多模态网关管理 ----------

let dsbridgeProcess = null

function getDsBridgeConfigPath() {
  const base = process.env.LOCALAPPDATA || process.env.APPDATA || ''
  return path.join(base, 'DsBridge', 'config.json')
}

/** 把 PaceOn 的 DeepSeek key 写入 DsBridge 配置（明文兼容，DsBridge 会自动识别） */
function writeDsBridgeConfig(deepseekApiKey, deepseekApiUrl) {
  const cfgPath = getDsBridgeConfigPath()
  try {
    let cfg = {}
    if (fs.existsSync(cfgPath)) {
      cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8').replace(/^\uFEFF/, ''))
    }
    cfg.deepseek = cfg.deepseek || {}
    cfg.deepseek.api_key = deepseekApiKey || ''
    if (deepseekApiUrl) cfg.deepseek.base_url = deepseekApiUrl.replace(/\/chat\/completions$/, '')
    cfg.gateway = cfg.gateway || {}
    cfg.gateway.host = '127.0.0.1'
    cfg.gateway.port = 8901
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true })
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf-8')
    console.log('[dsbridge] 已写入 DeepSeek key 到', cfgPath)
    return true
  } catch (e) {
    console.error('[dsbridge] 写入配置失败:', e.message)
    return false
  }
}

async function getDsBridgeHealth(port = 8901) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2500) })
    if (res.ok) {
      const d = await res.json()
      return { running: true, status: d.status || 'ok', version: d.version || '' }
    }
  } catch {}
  return { running: false }
}

async function waitDsBridgeReady(port, timeoutMs = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const h = await getDsBridgeHealth(port)
    if (h.running) return true
    await new Promise((r) => setTimeout(r, 800))
  }
  return false
}

function findDsBridgeExe() {
  const exe = path.join(dsbridgeDir, 'DsBridge.exe')
  return fs.existsSync(exe) ? exe : null
}

/** 一键启动 DsBridge 网关 */
async function startDsBridge(cfg = loadConfig()) {
  const port = cfg.dsbridgePort || 8901
  const health = await getDsBridgeHealth(port)
  if (health.running) return { ok: true, already: true, message: 'DsBridge 已在运行' }

  if (!cfg.deepseekApiKey) {
    return { ok: false, message: '请先在设置中填写 DeepSeek API Key' }
  }

  // 1. 同步 DeepSeek key 到 DsBridge 配置
  writeDsBridgeConfig(cfg.deepseekApiKey, cfg.deepseekApiUrl)

  // 2. 启动网关
  const exe = findDsBridgeExe()
  if (exe) {
    dsbridgeProcess = spawn(exe, ['serve'], { stdio: 'ignore' })
    console.log('[dsbridge] 启动内置 DsBridge.exe ->', exe)
  } else {
    dsbridgeProcess = spawn('python', ['-m', 'dsbridge', 'serve'], { stdio: 'ignore' })
    console.log('[dsbridge] 未找到内置 exe，尝试 python -m dsbridge serve')
  }

  if (dsbridgeProcess) {
    dsbridgeProcess.on('exit', (code, signal) => {
      console.log('[dsbridge] 进程退出', code, signal)
      dsbridgeProcess = null
    })
  }

  // 3. 等待就绪
  const ready = await waitDsBridgeReady(port)
  if (!ready) {
    return { ok: false, message: 'DsBridge 启动超时，请查看 DsBridge 日志' }
  }
  return { ok: true, message: 'DsBridge 已启动 ✅' }
}

function stopDsBridge() {
  if (dsbridgeProcess) {
    try { dsbridgeProcess.kill() } catch {}
    dsbridgeProcess = null
  }
  return true
}

// ---------- 初始化数据 ----------

function ensureDatabase() {
  fs.mkdirSync(userDataDir, { recursive: true })
  if (!fs.existsSync(dbPath)) {
    const seed = path.join(serverDir, 'db', 'custom.db')
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, dbPath)
      console.log('[db] 已初始化数据库 ->', dbPath)
    } else {
      console.warn('[db] 未找到种子数据库，将创建空库')
    }
  }
  return dbPath
}

// ---------- 端口 ----------

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url + '/api/runner', { signal: AbortSignal.timeout(3000) })
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

// ---------- 服务器 ----------

async function startServer(cfg) {
  const port = cfg.port && cfg.port > 0 ? cfg.port : await findFreePort()
  const db = ensureDatabase()
  const serverJs = path.join(serverDir, 'server.js')

  if (!fs.existsSync(serverJs)) {
    throw new Error(`未找到服务器文件：${serverJs}\n请先运行 scripts/build-desktop.ps1 构建 server/`)
  }

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: 'file:' + db.replace(/\\/g, '/'),
    DEEPSEEK_API_KEY: cfg.deepseekApiKey || '',
    DEEPSEEK_API_URL: cfg.deepseekApiUrl || 'https://api.deepseek.com/v1/chat/completions',
    DEEPSEEK_VISION_API_URL: cfg.visionApiUrl || 'http://127.0.0.1:8901/v1/chat/completions',
  }

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: serverDir,
    env,
    stdio: 'pipe',
  })

  serverProcess.stdout.on('data', (d) => console.log('[server]', String(d).trim()))
  serverProcess.stderr.on('data', (d) => console.error('[server]', String(d).trim()))
  serverProcess.on('exit', (code, signal) => {
    console.log('[server] exited', code, signal)
    serverProcess = null
  })

  appUrl = `http://127.0.0.1:${port}`
  const ready = await waitForServer(appUrl)
  if (!ready) {
    throw new Error(`服务器启动超时（${appUrl}）`)
  }
  return appUrl
}

function stopServer() {
  if (serverProcess) {
    try { serverProcess.kill() } catch {}
    serverProcess = null
  }
}

// ---------- 窗口 ----------

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'PaceOn · 智能长跑训练助手',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true },
  })
  mainWindow.loadURL(appUrl)
  mainWindow.on('closed', () => { mainWindow = null })
}

function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.focus(); return }
  settingsWindow = new BrowserWindow({
    width: 560,
    height: 540,
    title: 'PaceOn 设置',
    resizable: false,
    parent: mainWindow || undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'))
  settingsWindow.on('closed', () => { settingsWindow = null })
}

// ---------- IPC ----------

ipcMain.handle('config:get', () => loadConfig())
ipcMain.handle('config:save', (_e, cfg) => {
  saveConfig(cfg)
  return { ok: true }
})
ipcMain.handle('dsbridge:status', async (_e, port) => getDsBridgeHealth(port || (loadConfig().dsbridgePort || 8901)))
ipcMain.handle('dsbridge:start', async () => startDsBridge(loadConfig()))
ipcMain.handle('dsbridge:stop', () => {
  stopDsBridge()
  return { ok: true }
})
ipcMain.handle('dsbridge:config', () => {
  writeDsBridgeConfig(loadConfig().deepseekApiKey, loadConfig().deepseekApiUrl)
  return { ok: true }
})

// ---------- 启动 ----------

app.whenReady().then(async () => {
  const cfg = loadConfig()

  // 若勾选"随 PaceOn 自动启动"，在后台拉起 DsBridge 网关（不阻塞服务器启动）
  if (cfg.autoStartDsBridge && cfg.deepseekApiKey) {
    const h = await getDsBridgeHealth(cfg.dsbridgePort || 8901)
    if (!h.running) {
      startDsBridge(cfg).then((r) => console.log('[dsbridge] 自动启动结果:', r.message))
    }
  }

  if (!cfg.deepseekApiKey) {
    // 首次使用：先让用户配置 API Key
    createSettingsWindow()
    await new Promise((resolve) => {
      ipcMain.once('config:ready', resolve)
    })
  }

  try {
    appUrl = await startServer(loadConfig())
    createMainWindow()
    if (settingsWindow) settingsWindow.close()
  } catch (e) {
    dialogError(`启动失败：${e.message}`)
    app.quit()
  }
})

app.on('before-quit', () => {
  stopServer()
  stopDsBridge()
})

app.on('window-all-closed', () => {
  app.quit()
})

// 简单的错误提示（避免在 app.whenReady 前使用 dialog）
function dialogError(msg) {
  const { dialog } = require('electron')
  if (mainWindow) dialog.showMessageBox(mainWindow, { type: 'error', message: msg })
  else dialog.showMessageBox({ type: 'error', message: msg })
}
