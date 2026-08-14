#!/bin/bash
# PaceCoach Android 打包脚本
# 使用方法: bash scripts/build-android.sh
#
# 前置条件:
# 1. 安装 Android Studio + Android SDK
# 2. 设置 ANDROID_HOME 环境变量
# 3. 安装 Java JDK 17+
#
# 此脚本会:
# 1. 临时切换 Next.js 为静态导出模式
# 2. 构建静态文件到 out/
# 3. 同步到 Capacitor Android 项目
# 4. 构建 Android APK

set -e

echo "🏃 PaceCoach Android 打包"
echo "========================="

# 检查依赖
if ! command -v bun &> /dev/null; then
  echo "❌ 未安装 bun，请先安装: https://bun.sh"
  exit 1
fi

# 步骤 1: 临时修改 next.config 为静态导出 + 临时移开 API 路由（静态导出不支持 route.ts）
echo "📦 步骤 1/4: 配置静态导出..."
cp next.config.ts next.config.ts.bak
mv src/app/api /tmp/paceon-api-backup 2>/dev/null || true
cat > next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  trailingSlash: true,
};

export default nextConfig;
EOF

# 步骤 2: 构建 Next.js 静态文件
echo "🏗️  步骤 2/4: 构建静态文件..."
bun run build 2>&1 | tail -5

# 恢复原始配置
mv /tmp/paceon-api-backup src/app/api 2>/dev/null || true
mv next.config.ts.bak next.config.ts
echo "✅ 静态文件已生成到 out/"

# 步骤 3: 添加 Android 平台（如果尚未添加）
if [ ! -d "android" ]; then
  echo "📱 步骤 3/4: 添加 Android 平台..."
  npx cap add android
else
  echo "📱 步骤 3/4: Android 平台已存在"
fi

# 同步资源
echo "🔄 同步资源到 Android..."
npx cap sync android

# 步骤 4: 构建 APK
echo "🔨 步骤 4/4: 构建 APK..."
cd android
./gradlew assembleDebug 2>&1 | tail -10

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo ""
  echo "✅ APK 构建成功!"
  echo "📁 APK 位置: android/$APK_PATH"
  echo ""
  echo "📲 安装到设备: adb install $APK_PATH"
  echo ""
  echo "📦 构建 Release 版本（需要签名密钥）:"
  echo "   cd android && ./gradlew assembleRelease"
else
  echo "❌ APK 构建失败，请检查错误信息"
  exit 1
fi
