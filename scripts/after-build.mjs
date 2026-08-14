// 构建后处理：把静态资源复制到 standalone 目录（跨平台，替代 Windows 不可用的 cp -r）
// - standalone 模式：.next/static -> .next/standalone/.next/static，public -> .next/standalone/public
// - export 模式（APK 静态导出）：无需额外复制，直接输出 out/
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const standalone = path.join(root, '.next', 'standalone')

if (fs.existsSync(standalone)) {
  // 1. .next/static -> .next/standalone/.next/static
  const staticSrc = path.join(root, '.next', 'static')
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, path.join(standalone, '.next', 'static'), { recursive: true })
  }
  // 2. public -> .next/standalone/public
  if (fs.existsSync(path.join(root, 'public'))) {
    fs.cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true })
  }
  console.log('[after-build] standalone assets copied ✓')
} else {
  console.log('[after-build] export mode - static output in out/ ✓')
}
