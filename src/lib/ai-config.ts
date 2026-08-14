/**
 * AI 配置加载器
 *
 * z-ai-web-dev-sdk 通过 .z-ai-config 文件读取 baseUrl 和 apiKey。
 * 本模块支持通过环境变量 ZAI_BASE_URL 和 ZAI_API_KEY 覆盖配置，
 * 在应用启动时自动写入 .z-ai-config（若环境变量存在且配置文件缺失）。
 *
 * 配置优先级（从高到低）：
 * 1. 环境变量 ZAI_BASE_URL / ZAI_API_KEY
 * 2. 项目根目录 .z-ai-config 文件
 * 3. 用户主目录 ~/.z-ai-config
 * 4. /etc/.z-ai-config
 */

import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), '.z-ai-config')

interface ZaiConfig {
  baseUrl: string
  apiKey: string
  chatId?: string
  userId?: string
  token?: string
}

let cachedConfig: ZaiConfig | null = null

/**
 * 确保 AI 配置可用。
 * 若环境变量 ZAI_BASE_URL 和 ZAI_API_KEY 存在，且本地 .z-ai-config 不存在，
 * 则自动创建配置文件，使 SDK 能读取自定义 API 端点。
 */
export function ensureAiConfig(): void {
  if (cachedConfig) return

  const envBaseUrl = process.env.ZAI_BASE_URL
  const envApiKey = process.env.ZAI_API_KEY
  const envChatId = process.env.ZAI_CHAT_ID
  const envUserId = process.env.ZAI_USER_ID

  // 如果环境变量齐全，写入/覆盖本地配置文件
  if (envBaseUrl && envApiKey) {
    const config: ZaiConfig = {
      baseUrl: envBaseUrl,
      apiKey: envApiKey,
    }
    if (envChatId) config.chatId = envChatId
    if (envUserId) config.userId = envUserId

    try {
      // 仅在配置文件不存在或内容不同时写入，避免频繁 IO
      let needWrite = true
      if (fs.existsSync(CONFIG_PATH)) {
        try {
          const existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
          if (existing.baseUrl === config.baseUrl && existing.apiKey === config.apiKey) {
            needWrite = false
          }
        } catch {
          // 文件损坏，需要重写
        }
      }
      if (needWrite) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 })
        console.log('[AI Config] 已从环境变量生成 .z-ai-config')
      }
      cachedConfig = config
    } catch (e) {
      console.warn('[AI Config] 写入配置文件失败:', (e as Error).message)
    }
  }
}

/**
 * 获取当前 AI 配置（脱敏，不返回 apiKey 明文）
 */
export function getAiConfigStatus(): { configured: boolean; source: string; baseUrl?: string; hasApiKey: boolean } {
  // 检查环境变量
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    return {
      configured: true,
      source: '环境变量 (ZAI_BASE_URL / ZAI_API_KEY)',
      baseUrl: process.env.ZAI_BASE_URL,
      hasApiKey: true,
    }
  }
  // 检查项目配置文件
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
      return {
        configured: true,
        source: '.z-ai-config（项目根目录）',
        baseUrl: config.baseUrl,
        hasApiKey: !!config.apiKey,
      }
    } catch {
      // 文件损坏
    }
  }
  // 检查 /etc/.z-ai-config（系统级）
  const etcPath = '/etc/.z-ai-config'
  if (fs.existsSync(etcPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(etcPath, 'utf-8'))
      return {
        configured: true,
        source: '/etc/.z-ai-config（系统级）',
        baseUrl: config.baseUrl,
        hasApiKey: !!config.apiKey,
      }
    } catch {
      // 文件损坏
    }
  }
  return { configured: false, source: '未配置', hasApiKey: false }
}
