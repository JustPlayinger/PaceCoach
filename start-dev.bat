@echo off
chcp 65001 >nul
title PaceOn - Full Version Development Server

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%"
set "PORT=3000"

echo ==========================================
echo 🚀 启动 PaceOn 完整版开发服务器
echo ==========================================
echo.

where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: bun 未安装或不在 PATH 中
    echo    请先安装 bun: https://bun.sh/
    pause
    exit /b 1
)

echo ✅ 检测到 bun 已安装

echo.
echo ==========================================
echo 📦 安装依赖
echo ==========================================
cd /d "%PROJECT_DIR%"
bun install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

echo.
echo ==========================================
echo 🚀 启动开发服务器 (端口: %PORT%)
echo ==========================================

start "" bun run dev

echo.
echo ⏳ 等待服务器启动...
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo 🌐 打开浏览器
echo ==========================================
start "" http://localhost:%PORT%

echo.
echo 🎉 PaceOn 完整版已启动!
echo 💡 浏览器窗口应该会自动打开
echo 💡 按 Ctrl+C 停止服务器
echo ==========================================

pause