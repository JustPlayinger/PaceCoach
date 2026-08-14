/**
 * 离线 API 路由分发器
 *
 * 拦截浏览器 /api/* 请求，在本地用 sql.js + DeepSeek 直连实现全部业务。
 */
import { registerCoreHandlers, registerWeekSessionHandlers, json } from './handlers/core'
import { registerComputeHandlers } from './handlers/compute'
import { registerAiHandlers } from './handlers/ai'
import type { ApiRequest, Handler } from './types'

const routeMap = new Map<string, Handler>()
const patternRoutes: { pattern: RegExp; handler: Handler }[] = []

export function buildRouteMap(): void {
  registerCoreHandlers(routeMap)
  registerWeekSessionHandlers(routeMap)
  registerComputeHandlers(routeMap)
  registerAiHandlers(routeMap)

  // 预编译带 [id] 的动态路由
  for (const [key, handler] of routeMap.entries()) {
    if (key.includes('[id]')) {
      const [method, path] = key.split(' ')
      const regex = new RegExp('^' + method + ' ' + path.replace(/\[id\]/g, '([^/]+)') + '$')
      patternRoutes.push({ pattern: regex, handler })
    }
  }
}

function findHandler(method: string, pathname: string): { handler: Handler; id?: string } | null {
  const exact = routeMap.get(`${method} ${pathname}`)
  if (exact) return { handler: exact }
  for (const { pattern, handler } of patternRoutes) {
    const m = pattern.exec(`${method} ${pathname}`)
    if (m) return { handler, id: m[1] }
  }
  return null
}

async function dispatch(req: ApiRequest): Promise<Response> {
  const found = findHandler(req.method, req.pathname)
  if (!found) return json({ error: `Not found: ${req.method} ${req.pathname}` }, 404)
  if (found.id) req.params.id = found.id
  return found.handler(req)
}

function parseBody(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

/** 启用离线 API 拦截（需先 initOfflineDb） */
export function patchFetchOffline(): void {
  if (typeof window === 'undefined') return
  const original = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: string
    let method = (init?.method || 'GET').toUpperCase()
    let body: string | null = null

    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.toString()
    } else {
      url = input.url
      if (!init && input.method) method = input.method.toUpperCase()
    }

    // 仅拦截同源 /api/* 请求；已带完整 URL（远程）的不拦截
    if (url.startsWith('/api/')) {
      const [pathname, queryStr] = url.split('?')
      const query = new URLSearchParams(queryStr || '')
      if (init?.body && typeof init.body === 'string') body = init.body

      const req: ApiRequest = { method, pathname, query, body: parseBody(body), params: {} }
      return dispatch(req).catch((e) => json({ error: (e as Error).message || '离线 API 错误' }, 500))
    }

    return original(input, init)
  }
}