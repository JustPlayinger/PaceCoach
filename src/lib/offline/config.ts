/**
 * 离线模式配置（浏览器端）
 * DeepSeek API key 等本地配置，存 localStorage。
 */
const KEY_API = 'paceon-ds-api-key'
const KEY_URL = 'paceon-ds-api-url'

export interface DeepseekConfig {
  apiKey: string
  apiUrl: string
}

export function getDeepseekConfig(): DeepseekConfig {
  if (typeof localStorage === 'undefined') {
    return { apiKey: '', apiUrl: 'https://api.deepseek.com/v1/chat/completions' }
  }
  return {
    apiKey: localStorage.getItem(KEY_API) || '',
    apiUrl: localStorage.getItem(KEY_URL) || 'https://api.deepseek.com/v1/chat/completions',
  }
}

export function setDeepseekConfig(apiKey: string, apiUrl?: string): void {
  if (typeof localStorage === 'undefined') return
  if (apiKey) localStorage.setItem(KEY_API, apiKey)
  if (apiUrl) localStorage.setItem(KEY_URL, apiUrl)
}