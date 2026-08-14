'use client'

import { useEffect } from 'react'

/**
 * PWA Service Worker 注册组件
 * 在客户端挂载时注册 sw.js，实现离线缓存
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker 注册成功:', registration.scope)
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker 注册失败:', err)
        })
    }
  }, [])

  return null
}
