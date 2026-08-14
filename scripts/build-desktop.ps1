# =====================================================
# PaceCoach 桌面版构建脚本（Windows）
# 用法: powershell -ExecutionPolicy Bypass -File scripts/build-desktop.ps1
# 产物: desktop/release/PaceCoach Setup*.exe 与 PaceCoach*.exe (portable)
# =====================================================
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> [1/6] 构建 Next.js standalone..." -ForegroundColor Cyan
bun run build
if ($LASTEXITCODE -ne 0) { throw "bun run build 失败" }

Write-Host "==> [2/6] 准备 desktop/server（standalone 运行目录）..." -ForegroundColor Cyan
if (Test-Path "desktop\server") { Remove-Item "desktop\server" -Recurse -Force }
New-Item -ItemType Directory -Path "desktop\server" -Force | Out-Null
Copy-Item ".next\standalone\*" "desktop\server\" -Recurse -Force

# 数据库随包携带（首次启动复制到用户目录）
if (Test-Path "db\custom.db") {
  New-Item -ItemType Directory -Path "desktop\server\db" -Force | Out-Null
  Copy-Item "db\custom.db" "desktop\server\db\custom.db" -Force
}

# 移除 standalone 内联的 .env（路径固定不通用），由 main.js 按配置动态注入环境变量
if (Test-Path "desktop\server\.env") { Remove-Item "desktop\server\.env" -Force }

Write-Host "==> [3/6] 集成 DsBridge.exe（识图网关一键启动）..." -ForegroundColor Cyan
$dsbridgeSrc = "F:\project\ds-multimodal-bridge\dist\DsBridge.exe"
if (Test-Path $dsbridgeSrc) {
  if (Test-Path "desktop\dsbridge") { Remove-Item "desktop\dsbridge" -Recurse -Force }
  New-Item -ItemType Directory -Path "desktop\dsbridge" -Force | Out-Null
  Copy-Item $dsbridgeSrc "desktop\dsbridge\DsBridge.exe" -Force
  Write-Host "    已内置 DsBridge.exe（识图网关）"
} else {
  Write-Host "    ⚠️ 未找到 DsBridge.exe（$dsbridgeSrc），跳过内置（识图将使用内置 OCR 兜底）"
}

Write-Host "==> [4/6] 生成应用图标..." -ForegroundColor Cyan
if (-not (Test-Path "desktop\build\icon.ico")) {
  python scripts\make-icon.py
}

Write-Host "==> [5/6] 安装 electron / electron-builder..." -ForegroundColor Cyan
Set-Location "$root\desktop"
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
bun install
if ($LASTEXITCODE -ne 0) { throw "bun install 失败" }

# 补丁：Windows Defender 会拦截 exe 写入导致 addWinAsarIntegrity 报 UNKNOWN，
# 跳过 ASAR 完整性写入（不影响本地使用）
$electronWin = "node_modules\app-builder-lib\out\electron\electronWin.js"
if (Test-Path $electronWin) {
  $content = Get-Content $electronWin -Raw
  if ($content -notmatch "PaceCoach.*skip integrity") {
    $patched = $content -replace 'async function addWinAsarIntegrity\(executablePath, asarIntegrity\) \{', 'async function addWinAsarIntegrity(executablePath, asarIntegrity) { return; // [PaceCoach] skip integrity'
    Set-Content -Path $electronWin -Value $patched -NoNewline -Encoding UTF8
    Write-Host "    已应用 electron-builder 补丁（跳过 ASAR 完整性写入）"
  }
}

Write-Host "==> [6/6] 打包桌面应用..." -ForegroundColor Cyan
bun run dist
if ($LASTEXITCODE -ne 0) { throw "electron-builder 打包失败" }

Write-Host ""
Write-Host "✅ 完成！产物位于: desktop\release\" -ForegroundColor Green
Get-ChildItem "release" -Filter "*.exe" | ForEach-Object { Write-Host "   - $($_.Name) ($([math]::Round($_.Length/1MB,1)) MB)" }
