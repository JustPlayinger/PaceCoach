/**
 * 客户端 API 基址补丁
 *
 * 用途：APK / 静态导出模式下，把浏览器发出的 /api/* 请求转发到
 * 可配置的远程 PaceCoach 服务器（localStorage 中的 pacecoach-api-base）。
 * 桌面/同源模式（未配置 base）下，fetch 行为完全不变。
 *
 * 在 page.tsx 模块加载时调用 patchFetch() 一次即可。
 */
import { getApiBase } from './mobile-api'

export function patchFetch(): void {
  if (typeof window === 'undefined') return
  const base = getApiBase()
  if (!base) return

  const originalFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: string
    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.toString()
    } else if (input && typeof input.url === 'string') {
      url = input.url
    } else {
      return originalFetch(input, init)
    }

    if (url.startsWith('/api/')) {
      const full = base.replace(/\/+$/, '') + url
      return originalFetch(full, init)
    }
    return originalFetch(input, init)
  }
}
