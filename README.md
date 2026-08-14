# PaceCoach · 智能长跑训练指导系统

> AI 驱动的长跑训练助手 —— 课表管理、训练数据智能识别、AI 点评与课表生成、全方位训练数据分析

PaceCoach 是一个面向长跑爱好者（5K / 10K / 半马 / 全马）的智能训练指导系统。AI 层全部基于 **DeepSeek API**（文本对话/点评/课表生成）。由于 DeepSeek 无多模态能力，截图识图采用**双路径**：优先通过本地 **DsBridge 多模态网关**（OCR/视觉模型 → 文本 → DeepSeek），网关不可用时自动降级为内置 **tesseract.js OCR + 模板解析**。支持桌面版（Electron）与 Android APK。

## ✨ 核心特性

### 🤖 AI 智能能力（5 大）
- **截图识图（双路径）**：上传跑步 App 长图（华为运动健康/Garmin/Strava/Keep 等），自动提取距离、时长、配速、心率、步频、步幅、爬升、卡路里、VO2max、心率恢复、触地时间、垂直振幅、左右平衡等 20+ 项数据
  - **路径① DsBridge 网关**（推荐）：本地 OpenAI 兼容网关，图片 → OCR/视觉模型（可读折线图）→ 文本 → DeepSeek，识别最完整
  - **路径② 内置 OCR 兜底**：tesseract.js（中文+英文）服务端识别 + 模板/正则解析，离线可用、零额外依赖
- **折线图趋势识别**：DsBridge 路径下可提取心率/配速/步频/海拔曲线（15-25 个采样点）并生成趋势分析描述
- **LLM 训练点评**：对比计划与实际完成，分析完成度、强度匹配、心率区间、疲劳管理，给出评分与建议
- **LLM 课表生成**：基于跑者档案 + 目标赛事 + 上周完成情况 + 上周点评，周期化生成下周训练课表；支持本周微调
- **🆕 对话式课表生成**：与 AI 教练自由对话，AI 主动询问身体状况、停跑恢复、伤病、时间安排等特殊情况，收集完整信息后生成量身定制的个性化课表

### 📊 17 大功能模块
| 模块 | 功能 |
|------|------|
| 🏠 本周课表 | 今日训练焦点卡片 + 赛事倒计时 + 周概览进度环 + 每日训练卡片（含编辑/热身指导） |
| 📤 上传数据 | 拖拽上传截图 + AI 智能识别 + 可编辑表单 + 5 类折线图可视化 + 数据校验 + 跑鞋关联 |
| 🧠 AI 点评 | 生成本周点评（含折线图趋势分析）+ **🆕 对话式课表生成** + 快速生成 + 本周微调 |
| 📈 趋势分析 | 周跑量/配速/心率/RPE/体感趋势图 + 训练类型分布 + 心率区间分布 + 完成率 |
| 🛡️ 负荷管理 | ACWR 急性/慢性负荷比 + 5 档伤病预警 + 周负荷趋势 + 跑量vs负荷对比 |
| 🔀 训练对比 | 两次训练数据对比 + 心率/配速曲线对比 + 进步总结 |
| 📅 训练日历 | 月度 Heatmap 热力图 + 按训练强度着色 + 日期详情面板 |
| 🎯 目标进度 | Riegel 公式完赛预估 + 达标概率 + 训练阶段建议 + 周跑量趋势 |
| 📚 计划模板 | 5 套预设训练计划（全马/半马/10K，入门到进阶）+ 一键应用 |
| 👟 跑鞋追踪 | 跑鞋 CRUD + 里程自动累计 + 磨损预警 + 与训练完成关联 |
| 💚 恢复追踪 | 每日睡眠/补水/补给/体感记录 + 趋势图表 |
| 🏆 PB 记录 | 6 个标准距离个人最好成绩（1K/3K/5K/10K/半马/全马）|
| 🧮 配速计算器 | 基于目标成绩计算 8 个训练区间配速（恢复/轻松/长跑/马拉松/节奏/阈值/间歇/重复）|
| 🎖️ 成就系统 | 27 个成就徽章（距离/坚持/时长/特殊 4 类）+ 进度追踪 + 激励 |
| 🔍 全局搜索 | ⌘K 快捷键 + 跨训练/跑鞋/PB/恢复记录搜索 + 键盘导航 + Tab 跳转 |
| 📜 历史归档 | 按周列表 + 详情视图（统计/AI 点评/每日对比）|
| 👤 跑者档案 | 基本信息/生理指标(含 Karvonen 心率区间)/训练目标/备注 |
| 💾 数据管理 | JSON 导出备份 + 导入恢复 + **🆕 AI 配置状态** + 清空数据 |

### 🎯 训练细节增强
- **今日训练焦点卡片**：渐变 Hero 卡片，三态配色（待完成橙红脉冲/已完成翠绿/休息日深灰）
- **赛事实时倒计时**：每秒更新，5 档紧迫度配色（比赛日/比赛周/冲刺/备战/长期）
- **热身/冷身指导**：根据训练类型动态生成热身步骤、冷身步骤、静态拉伸方案 + 目标心率
- **单次训练深度分析**：AI 基于折线图趋势做配速/心率/跑姿/体感 5 章节分析
- **课表导出**：Markdown 复制 + .md 下载 + 打印 PDF（精美排版）
- **数据校验**：单字段范围校验 + 跨字段一致性校验（心率/配速/距离）

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 16 (App Router) + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui (New York) + Lucide 图标 |
| 数据库 | Prisma ORM + SQLite |
| AI | DeepSeek API（deepseek-chat）+ DsBridge 多模态网关 + tesseract.js OCR |
| 桌面端 | Electron（内嵌 Next.js standalone 服务器）|
| 移动端 | Capacitor + Android（GitHub Actions 构建 APK）|
| 图表 | Recharts（折线/面积/柱状/饼图/雷达）|
| Markdown | react-markdown（AI 输出渲染）|

## 📁 项目结构

```
src/
├── app/
│   ├── api/                    # API 路由（28 组）
│   │   ├── runner/             # 跑者档案
│   │   ├── weeks/              # 训练周
│   │   ├── sessions/           # 训练课
│   │   ├── extract/            # VLM 图片数据识别
│   │   ├── review/             # LLM 周点评
│   │   ├── plan/               # LLM 快速课表生成
│   │   ├── chat-plan/          # 🆕 对话式课表生成
│   │   ├── adjust/             # LLM 本周微调
│   │   ├── stats/              # 跨周统计
│   │   ├── calendar/           # 月度日历
│   │   ├── goal/               # 目标进度
│   │   ├── templates/          # 训练计划模板
│   │   ├── shoes/              # 跑鞋管理
│   │   ├── recovery/           # 恢复记录
│   │   ├── records/            # PB 记录
│   │   ├── load/               # 负荷管理(ACWR)
│   │   ├── compare/            # 训练对比
│   │   ├── achievements/       # 成就徽章
│   │   ├── search/             # 全局搜索
│   │   ├── config/             # 🆕 AI 配置状态
│   │   ├── seed/               # 种子数据
│   │   └── data/               # 导入导出
│   ├── layout.tsx
│   └── page.tsx                # 主页面（17 Tab）
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   └── views/                  # 25 个视图组件
│       ├── upload-view.tsx     # 上传数据（VLM 识别 + 折线图）
│       ├── review-view.tsx     # AI 点评 + 对话式生成入口
│       ├── chat-plan-view.tsx  # 🆕 对话式课表生成
│       ├── trends-view.tsx     # 趋势分析
│       ├── load-view.tsx       # 负荷管理(ACWR)
│       ├── compare-view.tsx    # 训练对比
│       ├── calendar-view.tsx   # 训练日历
│       ├── goal-view.tsx       # 目标进度
│       ├── templates-view.tsx  # 计划模板
│       ├── shoes-view.tsx      # 跑鞋追踪
│       ├── recovery-view.tsx   # 恢复追踪
│       ├── records-view.tsx    # PB 记录
│       ├── pace-calculator-view.tsx  # 配速计算器
│       ├── achievements-view.tsx     # 成就徽章
│       ├── global-search.tsx         # 全局搜索
│       ├── history-view.tsx    # 历史归档
│       ├── profile-view.tsx    # 跑者档案
│       ├── data-view.tsx       # 数据管理 + AI 配置状态
│       ├── session-edit-dialog.tsx       # 课表编辑
│       ├── session-detail-dialog.tsx     # 单次训练详情 + AI 分析
│       ├── warmup-cooldown-dialog.tsx    # 热身冷身指导
│       ├── race-countdown.tsx            # 赛事倒计时
│       ├── progress-ring.tsx             # 进度环
│       └── export-utils.ts               # 导出工具
├── lib/
│   ├── ai.ts                   # AI 能力库（VLM + LLM + 对话式生成）
│   ├── ai-config.ts            # 🆕 AI 配置加载器（环境变量支持）
│   ├── db.ts                   # Prisma client
│   ├── training.ts             # 训练类型/格式化工具
│   ├── templates.ts            # 训练计划模板数据
│   ├── pace-calculator.ts      # 配速计算（Riegel 公式）
│   └── warmup-cooldown.ts      # 热身冷身方案生成
└── prisma/
    └── schema.prisma           # 9 个数据模型
```

## 🗄 数据模型

| 模型 | 说明 |
|------|------|
| Runner | 跑者档案（姓名/年龄/心率/目标赛事等）|
| TrainingWeek | 训练周（周期/阶段/目标）|
| TrainingSession | 训练课（计划距离/配速/强度/描述）|
| TrainingCompletion | 完成记录（实际数据 + rawExtract 折线图 + shoeId）|
| AIReview | AI 点评/计划/对话记录 |
| Shoe | 跑鞋（品牌/寿命/里程）|
| ShoeUsage | 跑鞋使用记录（关联完成记录）|
| RecoveryLog | 每日恢复记录（睡眠/补水/体感）|
| PersonalRecord | 个人最好成绩（6 个标准距离）|

## 🚀 快速开始

### 环境要求
- Node.js 18+ / Bun
- 已安装依赖（`bun install`）

### 开发运行
```bash
bun run dev          # 启动开发服务器（端口 3000）
bun run lint         # 代码检查
bun run db:push      # 推送 Prisma schema 到数据库
bun run db:generate  # 生成 Prisma Client
```

### 首次使用
1. 访问 `http://localhost:3000`，系统自动初始化示例跑者与本周课表
2. 前往「跑者档案」填写你的真实信息（姓名/心率/目标赛事等）
3. 在「上传数据」上传训练 App 截图，点击「AI 智能识别数据」
4. 核对识别结果（可手动修正），保存完成记录
5. 在「AI 点评」生成本周点评，或点击「对话式生成」与 AI 教练对话制定个性化课表

## 🔧 本地运行与 API 配置

PaceCoach 默认使用 Z.ai 官方 API。你可以通过以下方式自定义 API 端点，便于本地运行或使用其他兼容服务。

### 方式一：环境变量（推荐）

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
# 数据库
DATABASE_URL=file:/home/z/my-project/db/custom.db

# AI API 配置（可选 - 覆盖默认 .z-ai-config）
ZAI_BASE_URL=https://api.z.ai/api/paas/v4
ZAI_API_KEY=your_api_key_here

# 可选：用户标识
# ZAI_CHAT_ID=
# ZAI_USER_ID=
```

设置环境变量后，应用启动时会自动生成 `.z-ai-config` 文件，SDK 将使用你指定的 API 端点。

### 方式二：配置文件

在项目根目录创建 `.z-ai-config` 文件（参考 `.z-ai-config.example`）：
> ⚠️ 该机制为兼容 Z.ai 时代的遗留，现版本已迁移到 DeepSeek，一般无需配置。

### 配置优先级（从高到低）
1. **环境变量** `DEEPSEEK_API_KEY` / `DEEPSEEK_API_URL` / `DEEPSEEK_VISION_API_URL`
2. **项目根目录** `.env` 文件

### 查看当前配置

在「数据管理」Tab 可查看当前 AI 配置状态（配置来源、API 端点，apiKey 脱敏），或访问 `GET /api/config`。

### 本地部署步骤

```bash
# 1. 克隆项目
git clone https://github.com/JustPlayinger/PaceCoach.git
cd PaceCoach

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 DEEPSEEK_API_KEY（https://platform.deepseek.com 申请）
# 可选：DEEPSEEK_VISION_API_URL 指向本地 DsBridge 网关（见下方「截图识图」）

# 4. 初始化数据库
bun run db:push

# 5. 启动开发服务器
bun run dev
```

## 🖥️ 桌面版（Electron）

桌面版内嵌 Next.js standalone 服务器 + SQLite 数据库，离线可用（仅 DeepSeek 调用需联网）。

```powershell
# 打包桌面版（Windows）
powershell -ExecutionPolicy Bypass -File scripts/build-desktop.ps1
# 产物：desktop/release/PaceCoach Setup 1.0.0.exe（安装包） + PaceCoach 1.0.0.exe（便携版）
```

- 首次启动会弹出设置窗口，填写 DeepSeek API Key（本地保存）
- 数据库与配置存放在 `%APPDATA%\PaceCoach`（可写目录，升级不丢数据）
- 截图识图：本机运行 DsBridge 网关后识别最完整；否则自动用内置 OCR

## 📱 Android APK

APK 为纯前端客户端（静态导出），所有数据/AI/OCR 请求转发到**远程 PaceCoach 服务器**（首次使用在「数据管理」Tab 配置服务器地址，如 `https://your-server.com` 或局域网 `http://192.168.x.x:3000`）。

```bash
# 方式一：GitHub Actions 自动构建（推荐，无需本地 Android SDK）
# 推送到 main 分支后，Actions → Build Android APK → 下载产物

# 方式二：本机构建（需 Android Studio + JDK 21）
bash scripts/build-android.sh
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

> ⚠️ APK 需要搭配已部署的 PaceCoach 后端使用（可部署在任意 VPS，或本机通过内网穿透暴露）。

## 🖼️ 截图识图（DeepSeek 无多模态的解决方案）

DeepSeek API 官方不支持图片输入。PaceCoach 采用双路径：

| 路径 | 原理 | 优点 | 依赖 |
|------|------|------|------|
| ① DsBridge 网关 | 本地 OpenAI 兼容网关拦截 `image_url` → OCR/视觉模型 → 文本 → DeepSeek | 识别最完整（可读折线图）；方案 A 免费本地 OCR | 需安装并启动 [ds-multimodal-bridge](https://github.com/JustPlayinger/ds-multimodal-bridge) |
| ② 内置 OCR | tesseract.js（chi_sim+eng）服务端识别 → 模板/正则解析 → DeepSeek 文本解析补全 | 零依赖、离线可用 | 无（语言包已随仓库提供） |

应用启动时自动探测路径①（`http://127.0.0.1:8901/health`），不可达则走路径②，无需任何手动切换。

## 📖 使用指南

### 对话式课表生成（新）

1. 进入「AI 点评」Tab，点击「对话式生成」按钮
2. 像和真人教练聊天一样，描述你的情况：
   - 身体状况：伤病、疲劳、不适
   - 停跑恢复：停跑多久、恢复情况
   - 训练目标：目标赛事、日期、成绩
   - 时间安排：每周能训练几天
   - 特殊环境：高原、高温、工作压力
3. AI 教练会主动询问必要信息（每次 1-2 个问题）
4. 信息收集完整后，点击「生成个性化课表」
5. AI 基于对话内容生成量身定制的训练计划

### 上传训练数据
1. 在跑步 App（华为运动健康/Garmin/Strava/Keep 等）完成训练后，截图保存训练详情长图
2. 进入「上传数据」Tab，选择对应训练课
3. 拖拽或点击上传截图
4. 点击「AI 智能识别数据」，VLM 将自动提取：
   - 基础数据：距离/时长/配速/心率/步频/步幅/爬升/卡路里
   - 跑姿数据：VO2max/心率恢复/触地时间/垂直振幅/左右平衡
   - 折线图：心率曲线/配速曲线/步频曲线/海拔曲线/分段配速（各 15-25 点）
   - 趋势分析：curveAnalysis 文字描述
5. 识别结果自动填入表单，可手动修正
6. 选择使用的跑鞋（自动累计里程），填写 RPE/体感
7. 保存完成记录

### AI 训练点评
- 完成至少一次训练后，在「AI 点评」点击「生成本周点评」
- AI 将分析：完成度、强度匹配、**折线图趋势**（心率漂移/配速稳定性/步频变化）、心率区间、疲劳管理
- 点评含 0-100 评分 + markdown 详细分析 + 可执行建议
- 可继续点击「快速生成课表」或「对话式生成」制定下周计划

### 配速计算器
- 在「配速计算器」输入目标赛事与目标成绩
- 系统基于 Riegel 公式反推阈值配速，计算 8 个训练区间配速
- 支持快捷预设（全马 330/400、半马 145、10K 50、5K 25）

### 数据备份
- 在「数据管理」点击「导出 JSON」下载完整备份
- 可在新环境通过「导入数据」恢复（支持合并/替换模式）
- 同页可查看 AI 配置状态

## 🔬 折线图趋势分析（核心能力）

PaceCoach 特别重视训练折线图的时间序列数据，认为这些比单一平均值更能反映训练真实状态：

| 曲线 | 分析维度 |
|------|---------|
| 心率曲线 | 起步心率、稳态心率、心率漂移（每公里上升 bpm）、最大心率时机、异常飙升 |
| 配速曲线 | 配速稳定性、前后半程配速差（正/负分割）、掉速段、最快/最慢公里 |
| 步频曲线 | 步频稳定性、疲劳下降趋势、步频与配速关联 |
| 海拔曲线 | 上下坡对配速/心率的影响、爬升段表现 |
| 分段配速 | 每公里配速变化趋势、配速分布 |

VLM 识别的折线图数据会：
1. 在「上传数据」可视化展示（5 条曲线图）
2. 存入 `rawExtract` 字段持久化
3. 在「AI 点评」解析后传给 LLM，生成专门的「折线图趋势分析」章节
4. 在「单次训练详情」的 AI 深度分析中作为核心参考
5. 在「训练对比」中对比两次训练的曲线变化

## 📱 移动端打包（Android APK）

PaceCoach 支持 PWA 和 Capacitor 两种移动端方案。

> 📖 **完整打包指南**：请阅读 [MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md) —— 含环境准备、代码拉取、构建、安装到手机的全流程详细步骤。

### 方案一：PWA（渐进式 Web 应用）

PWA 让用户可以直接从浏览器"添加到主屏幕"安装应用，无需应用商店。

**已配置**：
- `public/manifest.json`：应用清单（名称/图标/主题色/快捷方式）
- `public/sw.js`：Service Worker（离线缓存 + 快速加载）
- PWA 图标：192/256/384/512px + maskable 自适应图标 + apple-touch-icon
- layout.tsx：meta 标签（apple-web-app-capable / theme-color / viewport）

**使用**：
1. 在手机浏览器（Chrome/Safari）打开应用
2. 浏览器菜单 → "添加到主屏幕" / "安装应用"
3. 从主屏幕启动，全屏沉浸式体验

### 方案二：Capacitor 打包 Android APK

将 Web 应用打包成真正的 Android 原生应用，可发布到应用商店。

**前置条件**：
- Android Studio + Android SDK
- Java JDK 17+
- 环境变量 `ANDROID_HOME` 指向 SDK 目录

**一键打包**：
```bash
bash scripts/build-android.sh
```

脚本会自动：
1. 临时切换 Next.js 为静态导出模式（`output: export`）
2. 构建静态文件到 `out/` 目录
3. 同步到 Capacitor Android 项目
4. 构建 debug APK

**产物**：`android/app/build/outputs/apk/debug/app-debug.apk`

**安装到设备**：
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**构建 Release 版本**（需要签名密钥）：
```bash
cd android
./gradlew assembleRelease
```

**Capacitor 配置**（`capacitor.config.ts`）：
- appId: `com.pacecoach.app`
- 应用名：PaceCoach
- 启动画面：emerald 绿色背景
- 状态栏：深色主题 + emerald 背景
- 键盘：自动调整布局

### 移动端优化

- **底部导航栏**：手机端显示 5 个快捷 Tab（课表/上传/AI/负荷/更多）
- **安全区域**：适配 iPhone 刘海屏和 Android 手势导航（env(safe-area-inset)）
- **禁止缩放**：viewport 设置 maximum-scale=1，防止误触缩放
- **触摸优化**：最小 44px 触摸目标
- **响应式布局**：所有页面 mobile-first 设计

## 📝 许可证

本项目为演示项目，仅供学习参考。

---

**PaceCoach** · 由 Z.ai VLM + LLM 驱动 · 科学周期化训练
