# 📱 PaceOn Android APK 本地打包完整指南

本指南详细说明如何将 PaceOn 项目从云端拉取到本地电脑，并打包成 Android APK 安装到手机。

---

## 📋 整体流程概览

```
云端项目 → 本地电脑（安装环境） → 构建 Web 静态文件 → Capacitor 打包 → Android APK → 安装到手机
```

PaceOn 是 Next.js 全栈应用（前端 + API + 数据库）。打包 APK 有两种方案：

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| **方案 A：PWA** | 浏览器"添加到主屏幕"，无需打包 | 日常使用，最简单 |
| **方案 B：Capacitor APK** | 打包成原生 APK，可上架商店 | 需要原生应用体验 |

> ⚠️ **重要**：Capacitor 静态导出不支持 API 路由和数据库。APK 版本需要搭配远程服务器（方案 B-2），或使用 PWA（方案 A，功能完整）。

---

## 方案 A：PWA（推荐，最简单）

PWA 不需要任何打包工具，用户直接从手机浏览器安装。

### 步骤

1. **部署应用到公网**（或使用 ngrok 内网穿透）
   ```bash
   # 本地开发服务器 + ngrok 穿透
   bun run dev
   # 另一个终端
   ngrok http 3000
   ```

2. **手机浏览器访问应用 URL**

3. **安装到主屏幕**：
   - **Android Chrome**：菜单 ⋮ → "添加到主屏幕" / "安装应用"
   - **iOS Safari**：分享 → "添加到主屏幕"

4. **从主屏幕启动**，全屏沉浸式体验，支持离线缓存

---

## 方案 B：Capacitor 打包 Android APK

### 第一步：环境准备（约 30 分钟）

#### 1.1 安装 Node.js + Bun

```bash
# 安装 Node.js 18+（如已有可跳过）
# macOS: brew install node
# Windows: https://nodejs.org 下载安装

# 安装 Bun（包管理器）
# macOS / Linux:
curl -fsSL https://bun.sh/install | bash

# Windows:
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证
bun --version
```

#### 1.2 安装 Java JDK 17+

```bash
# macOS: brew install openjdk@17
# Windows: https://adoptium.net 下载 JDK 17

# 验证
java -version
# 应显示 openjdk version "17.x.x"
```

#### 1.3 安装 Android Studio

1. 下载：https://developer.android.com/studio
2. 安装时勾选 "Android SDK"、"Android SDK Platform"、"Android Virtual Device"
3. 首次启动时，按向导完成 SDK 安装

#### 1.4 配置环境变量

**macOS / Linux**（`~/.bashrc` 或 `~/.zshrc` 添加）：
```bash
# Android SDK 路径（根据实际安装位置调整）
export ANDROID_HOME=$HOME/Library/Android/sdk   # macOS
# export ANDROID_HOME=$HOME/Android/Sdk          # Linux

export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Java
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "/usr/lib/jvm/java-17-openjdk")
```

**Windows**（系统环境变量）：
```
ANDROID_HOME=C:\Users\你的用户名\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x
PATH 追加: %ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin
```

验证：
```bash
adb version          # Android Debug Bridge
java -version        # Java
echo $ANDROID_HOME   # SDK 路径
```

---

### 第二步：拉取代码到本地

#### 2.1 获取代码

当前项目在云端沙箱中，你需要将代码传输到本地。有三种方式：

**方式 1：Git 推送到 GitHub（推荐）**

在云端沙箱中：
```bash
cd /home/z/my-project

# 初始化并推送到你的 GitHub 仓库
git add -A
git commit -m "PaceOn 完整项目"
git remote add origin https://github.com/你的用户名/paceon.git
git branch -M main
git push -u origin main
```

在本地电脑中：
```bash
git clone https://github.com/你的用户名/paceon.git
cd paceon
```

**方式 2：打包下载**

在云端沙箱中：
```bash
cd /home/z/my-project
# 排除 node_modules 和 .next，打包其余文件
tar --exclude='node_modules' --exclude='.next' --exclude='db/*.db' -czf paceon.tar.gz .
```

下载 `paceon.tar.gz` 到本地，解压：
```bash
mkdir paceon
cd paceon
tar -xzf ../paceon.tar.gz
```

**方式 3：SCP/SFTP 直传**

```bash
# 从云端复制到本地（需 SSH 访问）
scp -r cloud-server:/home/z/my-project ./paceon
```

#### 2.2 安装依赖

```bash
cd paceon
bun install
```

#### 2.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env，配置数据库和 AI API
```

`.env` 文件内容：
```bash
# 数据库（本地开发用）
DATABASE_URL=file:./db/custom.db

# AI API 配置（必填，用于 VLM 识别和 LLM 分析）
ZAI_BASE_URL=https://api.z.ai/api/paas/v4
ZAI_API_KEY=你的_z_ai_api_key
```

> 获取 Z.ai API Key：访问 https://z.ai 注册账号，在控制台获取 API Key

#### 2.4 初始化数据库

```bash
bun run db:push
```

#### 2.5 验证本地运行

```bash
bun run dev
# 浏览器打开 http://localhost:3000，确认功能正常
```

---

### 第三步：构建 Android APK

#### 3.1 方案 B-1：纯前端 APK（无 API，仅查看已缓存数据）

如果你的 APK 只需要展示静态内容（不需要 AI 功能和数据库），可以直接打包：

```bash
# 一键打包
bash scripts/build-android.sh
```

> ⚠️ 此方案 APK 内无 API 路由，AI 识别/点评/课表生成等功能不可用。仅适合展示用途。

#### 3.2 方案 B-2：前端 APK + 远程服务器（推荐，功能完整）

这是**推荐方案**：APK 作为前端客户端，连接你部署的远程服务器 API。

**步骤 1：部署服务器到公网**

选择一个云服务器（阿里云/腾讯云/Vercel/Railway 等），部署 PaceOn：

```bash
# 在服务器上
git clone https://github.com/你的用户名/paceon.git
cd paceon
bun install
bun run db:push

# 配置 .env
# ZAI_BASE_URL=https://api.z.ai/api/paas/v4
# ZAI_API_KEY=你的key

# 启动服务
bun run dev  # 或用 pm2 守护进程
```

假设服务器地址为 `https://api.your-domain.com`。

**步骤 2：配置 APK 连接远程服务器**

在本地项目创建移动端构建配置：

```bash
# 创建移动端专用环境变量文件
cat > .env.mobile << 'EOF'
NEXT_PUBLIC_API_BASE=https://api.your-domain.com
EOF
```

**步骤 3：修改构建脚本**

编辑 `scripts/build-android.sh`，在构建前加载移动端环境变量：

```bash
# 在 "步骤 2: 构建" 前添加
cp .env .env.bak
cat .env .env.mobile > .env.combined
mv .env.combined .env
```

**步骤 4：打包**

```bash
bash scripts/build-android.sh
```

脚本会自动：
1. 切换 Next.js 为静态导出模式（`output: export`）
2. 构建静态文件到 `out/` 目录
3. 同步到 Capacitor Android 项目
4. 构建 debug APK

**步骤 5：获取 APK**

构建成功后，APK 位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### 第四步：安装到手机

#### 4.1 方式 1：ADB 安装（需 USB 调试）

1. 手机开启「开发者选项」→「USB 调试」
2. USB 连接电脑
3. 安装：
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

#### 4.2 方式 2：直接传输安装

1. 将 APK 文件传到手机（微信/邮件/云盘/U盘）
2. 手机文件管理器找到 APK，点击安装
3. 如提示"未知来源"，允许安装

---

### 第五步：构建 Release 版本（可选，用于发布）

Debug 版本无需签名，但不能发布到应用商店。Release 版本需要签名密钥：

#### 5.1 生成签名密钥

```bash
keytool -genkey -v -keystore paceon.keystore -alias paceon -keyalg RSA -keysize 2048 -validity 10000

# 按提示输入：
# 密码：你的密码
# 姓名、组织等信息
```

#### 5.2 配置 Gradle 签名

编辑 `android/app/build.gradle`，在 `android {}` 块内添加：

```gradle
signingConfigs {
    release {
        storeFile file('../../paceon.keystore')
        storePassword '你的密码'
        keyAlias 'paceon'
        keyPassword '你的密码'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### 5.3 构建 Release APK

```bash
cd android
./gradlew assembleRelease
```

产物：`android/app/build/outputs/apk/release/app-release.apk`

#### 5.4 生成 AAB（应用商店格式）

```bash
cd android
./gradlew bundleRelease
```

产物：`android/app/build/outputs/bundle/release/app-release.aab`

可上传到 Google Play 商店。

---

## 🔧 常见问题

### Q: 构建报错 "SDK location not found"

**A**: 创建 `android/local.properties` 文件：
```
sdk.dir=/Users/你的用户名/Library/Android/sdk    # macOS
sdk.dir=C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk    # Windows
```

### Q: 构建报错 "Java version not supported"

**A**: 确保 JDK 17+，检查 `java -version`。Capacitor 8 需要 JDK 17+。

### Q: APK 闪退

**A**: 检查 `capacitor.config.ts` 的 `webDir` 是否为 `out`，确认 `out/` 目录有 `index.html`。

### Q: APK 内功能不可用（API 报错）

**A**: 静态导出不支持 API 路由。使用方案 B-2（远程服务器），或使用 PWA 方案。

### Q: 如何查看 APK 日志

```bash
adb logcat | grep -i "capacitor\|chrome\|console"
```

### Q: 如何更新 APK 内的 Web 代码

```bash
# 修改代码后重新打包
bun run build  # 需切换为 export 模式
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## 📁 项目关键文件说明

| 文件 | 说明 |
|------|------|
| `capacitor.config.ts` | Capacitor 配置（应用 ID、启动画面、状态栏等） |
| `scripts/build-android.sh` | 一键打包脚本 |
| `public/manifest.json` | PWA 应用清单 |
| `public/sw.js` | Service Worker（离线缓存） |
| `.env.example` | 环境变量模板 |
| `src/lib/mobile-api.ts` | 移动端 API 配置（远程服务器地址） |
| `src/lib/ai-config.ts` | AI API 配置加载器 |

---

## 🚀 快速开始清单

```
☑ 1. 安装 Bun + JDK 17 + Android Studio
☑ 2. 配置 ANDROID_HOME 和 JAVA_HOME 环境变量
☑ 3. git clone 项目到本地
☑ 4. bun install
☑ 5. cp .env.example .env，填入 ZAI_API_KEY
☑ 6. bun run db:push
☑ 7. bun run dev 验证功能正常
☑ 8. bash scripts/build-android.sh
☑ 9. adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**最简方案（PWA）**：只需步骤 1-7，然后手机浏览器打开 → 添加到主屏幕。

---

## 📞 技术支持

如遇问题，请检查：
1. 环境变量配置（`echo $ANDROID_HOME`、`java -version`）
2. 依赖安装完整（`bun install` 无报错）
3. 数据库初始化（`bun run db:push` 成功）
4. 本地 dev 运行正常（`bun run dev` 可访问）
5. 构建脚本执行无报错（`bash scripts/build-android.sh`）
