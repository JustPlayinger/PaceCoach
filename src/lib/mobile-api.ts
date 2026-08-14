/**
 * 移动端 API 配置
 *
 * APK 版本作为纯前端客户端，所有 API 请求发送到远程服务器。
 * 在打包前设置此地址，或在应用启动时通过 localStorage 配置。
 */

// 远程 API 基础地址
// 打包前修改为你的服务器地址，如 'https://your-server.com'
// 或在应用「数据管理」Tab 中动态配置
const DEFAULT_API_BASE = ''

/**
 * 获取 API 基础地址
 * 优先级：localStorage > 环境变量 > 默认值
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pacecoach-api-base')
    if (stored) return stored
  }
  return process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE
}

/**
 * 设置 API 基础地址（用户在设置页配置）
 */
export function setApiBase(url: string): void {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('pacecoach-api-base', url)
    } else {
      localStorage.removeItem('pacecoach-api-base')
    }
  }
}

/**
 * 构建完整 API URL
 * 若配置了远程地址，则拼接；否则使用相对路径（同源）
 */
export function apiUrl(path: string): string {
  const base = getApiBase()
  if (base) {
    return base.replace(/\/$/, '') + path
  }
  return path
}

/**
 * 是否为移动端 APK 模式（无本地 API）
 */
export function isMobileApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!window.Capacitor || !!getApiBase()
}
