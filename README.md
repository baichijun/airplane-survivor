# 太空战线幸存者

一款基于 Canvas 的竖版射击生存游戏：自动开火、击杀敌机获取经验、升级三选一强化能力，尽可能存活更久。

技术栈：**TypeScript + Vite + 原生 Canvas 2D**，无游戏引擎依赖，适合移动端与桌面浏览器。Android 端通过 **Capacitor 8** 打包为可安装的 APK。

## 快速开始

### 网页（浏览器）

```bash
# 安装依赖
npm install

# 本地开发（热更新）
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建结果
npm run preview
```

开发服务器启动后，在浏览器打开终端提示的地址即可游玩。

### Android APK

**环境要求（首次搭建）：**

- Node.js **22+**
- [Android Studio](https://developer.android.com/studio) Otter 2025.2.1+（含 Android SDK Platform 35/36、Build-Tools、Platform-Tools）

**一键配置当前终端环境变量：**

```powershell
. .\scripts\setup-android-env.ps1
```

**持久化到用户环境变量（只需执行一次）：**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/persist-android-env.ps1
```

**Android SDK 路径：**

项目已包含本机 `android/local.properties`（已 gitignore）。其他机器请复制 `android/local.properties.example` 为 `android/local.properties`。

**日常打包：**

```bash
# 构建 web 并同步到 android/，再用 Gradle 产出 debug APK
npm run android:debug
```

产物路径：`android/app/build/outputs/apk/debug/app-debug.apk`

```bash
# 用 Android Studio 打开原生工程（模拟器 / 真机调试）
npm run cap:open

# Release APK（需先配置 android/keystore.properties，见 keystore.properties.example）
npm run android:release
```

**Release 签名（本机首次）：**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-release-keystore.ps1
npm run android:release
```

**说明：**

- 网页流程（`dev` / `build` / GitHub Pages）与 Android 互不影响，共用同一套 `src/` 源码。
- UI 字体已本地化（`@fontsource`），APK 可离线运行。
- 返回键：2 秒内连按两次退出；竖屏锁定；全屏沉浸。
- **OTA 热更新（Capgo）**：有网时检查 GitHub Pages 上的 `updates/manifest.json`，版本更高则后台下载 `bundle.zip`，**下次冷启动**生效；无网则用 APK 内置包或上次缓存。

**发布新版本（网页 + App 热更新）：**

1. 修改 `package.json` 的 `version`（如 `1.0.0` → `1.0.1`）
2. `npm run build:pages` — 生成 `dist/` 与 `dist/updates/bundle.zip`、`manifest.json`
3. push 到 `main` — GitHub Pages 自动部署；已安装 App 在联网启动后会拉取新 bundle

Gradle 离线缓存（可选）：`powershell -ExecutionPolicy Bypass -File scripts/seed-gradle-wrapper.ps1`

GitHub Actions 可在 `main` 分支相关文件变更时自动构建 debug APK（见 `.github/workflows/android-build.yml`），从 Artifacts 下载。

## 玩法概要

| 操作 | 说明 |
|------|------|
| WASD / 方向键 / 虚拟摇杆 | 移动飞机 |
| 暂停选奖励时触摸拖拽 | 移动飞机（升级/宝物界面） |
| 自动射击 | 无需按键，持续向上开火 |
| 升级 | 经验满后暂停，飞入选项框停留 0.5 秒确认（也可点击） |

敌机会随游戏时间变强、生成加快；约 30 秒解锁战斗机，60 秒解锁重甲机。主菜单可选**标准模式**或**简单模式**（初始生命 ×3，每 3 秒恢复 1 点生命）。

## 项目结构

源码按职责分层，核心逻辑在 `src/` 下：

```
airplane-survivor/
├── index.html          # 页面入口，挂载 canvas
├── capacitor.config.ts # Capacitor 壳配置
├── android/            # Android 原生工程（Capacitor 生成）
├── src/
│   ├── main.ts         # 程序入口
│   ├── liveUpdate.ts   # Capgo OTA 检查与 notifyAppReady
│   ├── native.ts       # Android 壳初始化（竖屏、全屏、返回键）
│   ├── fonts.css       # 离线字体
│   ├── style.css       # 全屏 canvas 样式
│   ├── config/         # 数值平衡、升级奖励
│   ├── core/           # 引擎、输入、游戏主循环
│   ├── entities/       # 玩家、敌机、子弹
│   ├── systems/        # 战斗、碰撞、生成、经验
│   ├── types/          # 公共类型定义
│   └── ui/             # HUD、菜单、升级/结束界面
├── dist/               # 构建产物（npm run build 生成）
└── docs/               # 项目文档
```

**想改某个功能该动哪个文件？** 请阅读 [docs/目录与功能说明.md](./docs/目录与功能说明.md)，里面有完整目录说明和「功能 → 文件」对照表。

## 文档

- [目录与功能说明](./docs/目录与功能说明.md) — 每个文件做什么、改功能时去哪里改

## 开发约定

- 注释与界面文案使用**简体中文**
- 变量名、类型名、文件名保持**英文**（见 `.cursor/rules/chinese-default.mdc`）
