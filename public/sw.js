// PaceCoach Service Worker - 离线缓存与快速加载
const CACHE_NAME = 'pacecoach-v1'
const STATIC_CACHE = 'pacecoach-static-v1'
const DYNAMIC_CACHE = 'pacecoach-dynamic-v1'

// 静态资源（应用壳）
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
]

// 安装：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// 请求拦截策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 请求：网络优先，失败时尝试缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 只缓存成功的 GET 请求
          if (request.method === 'GET' && response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // 网络失败时尝试缓存
          return caches.match(request)
        })
    )
    return
  }

  // 静态资源：缓存优先
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // 后台更新缓存
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, response)
              })
            }
          }).catch(() => {})
          return cached
        }
        // 无缓存，网络请求
        return fetch(request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        }).catch(() => {
          // 离线回退
          if (request.destination === 'document') {
            return caches.match('/')
          }
        })
      })
    )
  }
})

// 消息通信：手动更新缓存
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
