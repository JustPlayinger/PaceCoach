/**
 * 离线模式入口（纯前端离线 APK）
 *
 * 在 Capacitor APK / 静态导出环境下启用：
 *  - 初始化 sql.js 本地数据库（IndexedDB 持久化）
 *  - 拦截 /api/* 请求走本地 handler（DeepSeek 直连 + 本地 OCR）
 *  - 配置 DeepSeek key（localStorage）
 */
import { initOfflineDb } from './db'
import { buildRouteMap, patchFetchOffline } from './router'
import { getDeepseekConfig, setDeepseekConfig } from './config'

let initialized = false

export function isCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as unknown as { Capacitor?: unknown }).Capacitor
}

export function isOfflineModeEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem('pacecoach-offline-mode') === '1' || isCapacitorApp()
}

export function setOfflineMode(on: boolean): void {
  if (typeof localStorage === 'undefined') return
  if (on) localStorage.setItem('pacecoach-offline-mode', '1')
  else localStorage.removeItem('pacecoach-offline-mode')
}

/** 初始化离线模式（幂等） */
export async function initOfflineMode(): Promise<boolean> {
  if (initialized) return true
  if (!isOfflineModeEnabled()) return false
  if (typeof window === 'undefined') return false

  await initOfflineDb()
  buildRouteMap()
  patchFetchOffline()
  initialized = true
  console.log('[offline] 离线模式已启用（本地数据 + DeepSeek 直连）')

  if (!getDeepseekConfig().apiKey) {
    console.warn('[offline] 尚未配置 DeepSeek API Key，AI 功能不可用（数据管理仍可用）')
  }
  return true
}

export { getDeepseekConfig, setDeepseekConfig }