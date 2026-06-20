# 太空战线幸存者

一款基于 Canvas 的竖版射击生存游戏：自动开火、击杀敌机获取经验、升级三选一强化能力，击败 Boss 获取宝物，尽可能存活更久。

**在线试玩：** https://ai-airplane-survivor.qiguangming.com （自定义域名，Cloudflare CDN）  
备用地址：https://baichijun.github.io/airplane-survivor/

---

## 项目特点

- **轻量自研引擎**：TypeScript + Vite + 原生 Canvas 2D，无 Phaser / Unity 等游戏引擎依赖
- **单仓库多端**：Web、Android APK、Capgo OTA 热更新共用同一套 `src/` 源码
- **移动端优先**：虚拟摇杆（八方向吸附）、触屏护盾、长屏动态适配、竖屏沉浸全屏
- **Roguelite 成长**：升级三选一、Boss 战、宝物系统、三档难度（困难 / 普通 / 简单）
- **自动化交付**：GitHub Pages 部署网页与 OTA 资源；GitHub Actions 构建 debug APK

## 技术亮点

| 模块 | 说明 |
|------|------|
| 渲染 | 逻辑画布 375×667 基准，长屏按视口扩展 `GAME_HEIGHT`，DPR 上限 2 |
| 输入 | 键盘 + 触摸；升级/宝物界面用「幻影飞机」飞入选项卡（含高度防误触） |
| 特效 | 击破爆破双模式（程序化光效 / 精灵图随机帧） |
| Android 壳 | Capacitor 8：竖屏、Splash、StatusBar 隐藏、双击返回退出 |
| OTA | `@capgo/capacitor-updater`：联网检查 manifest，后台下载 bundle，**下次冷启动**生效 |
| 字体 | `@fontsource` 本地化，APK 与离线环境可正常显示中文 |

## 技术栈

**前端：** TypeScript 5.6 · Vite 5.4 · Canvas 2D

**移动端：** Capacitor 8.4 · Capgo Updater 8.49 · Gradle 8.14.3 · Android SDK 36

**部署：** GitHub Pages · GitHub Actions

## 依赖清单

### npm 运行时

| 依赖 | 版本 |
|------|------|
| `@capacitor/core` | 8.4.1 |
| `@capacitor/android` | 8.4.1 |
| `@capacitor/app` | 8.1.0 |
| `@capacitor/screen-orientation` | 8.0.1 |
| `@capacitor/splash-screen` | 8.0.1 |
| `@capacitor/status-bar` | 8.0.2 |
| `@capgo/capacitor-updater` | 8.49.7 |
| `@fontsource/orbitron` | 5.2.8 |
| `@fontsource/noto-sans-sc` | 5.2.9 |

### npm 开发

| 依赖 | 版本 |
|------|------|
| `typescript` | 5.6.3 |
| `vite` | 5.4.21 |
| `@capacitor/cli` | 8.4.1 |
| `@capgo/cli` | 8.12.4 |

> 精确版本以 `package-lock.json` 为准。

### Android 原生

| 项 | 版本 |
|----|------|
| minSdk | 24 |
| compileSdk / targetSdk | 36 |
| Gradle Wrapper | 8.14.3 |
| Java（CI / 推荐） | 21 |

---

## 快速开始

### 环境要求

- **Node.js** 22+（CI 使用 22）
- **Android 打包（可选）**：Android Studio Otter 2025.2.1+、SDK Platform 36、Build-Tools、JDK 21

### 网页开发

```bash
npm install          # 安装依赖
npm run dev          # 本地开发（热更新）
npm run build        # 类型检查 + 生产构建
npm run preview      # 预览 dist/
```

### 网页 + OTA 发布（GitHub Pages）

```bash
# 1. 修改 package.json 的 version
# 2. 构建并生成 OTA 产物
npm run build:pages
# 产出：dist/、dist/updates/bundle.zip、dist/updates/manifest.json

# 3. push 到 main → 自动触发 .github/workflows/deploy.yml
git push origin main
```

**GitHub Pages：** 构建使用相对路径 `base: './'`，资源与页面同目录，避免子路径 `/airplane-survivor/` 下 404。

**微信域名校验等静态文件：** 放入 `public/`，构建后会出现在网站根目录（如 `public/xxx.txt` → `/airplane-survivor/xxx.txt`）。

### Android APK

```powershell
# 当前终端环境变量（Android SDK / JAVA_HOME）
. .\scripts\setup-android-env.ps1

# 持久化环境变量（本机只需一次）
powershell -ExecutionPolicy Bypass -File scripts/persist-android-env.ps1
```

**SDK 路径：** 复制 `android/local.properties.example` → `android/local.properties` 并填写 `sdk.dir`。

| 命令 | 说明 | 产物 |
|------|------|------|
| `npm run android:debug` | 构建 web + cap sync + debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| `npm run android:release` | 同上 + release 签名 | `android/app/build/outputs/apk/release/app-release.apk` |
| `npm run cap:open` | Android Studio 打开工程 | — |
| `npm run cap:sync` | 仅 build + 同步到 android/ | — |

**Release 签名（本机首次）：**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-release-keystore.ps1
npm run android:release
```

**Gradle 离线缓存（可选）：**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/seed-gradle-wrapper.ps1
```

**Android 说明：**

- 网页流程与 Android 互不影响，共用 `src/` 源码
- 返回键：2 秒内连按两次退出；竖屏锁定；全屏沉浸
- OTA：有网时检查 `updates/manifest.json`，版本更高则后台下载 `bundle.zip`，**下次冷启动**生效

### npm scripts 一览

| 脚本 | 作用 |
|------|------|
| `dev` | Vite 开发服务器 |
| `build` | `tsc && vite build` |
| `build:update` | 生成 Capgo OTA zip + manifest |
| `build:pages` | `build` + `build:update`（Pages 部署用） |
| `preview` | 预览生产构建 |
| `cap:sync` | build 并同步 Capacitor |
| `cap:open` | 打开 Android Studio |
| `android:debug` / `android:release` | 完整 APK 打包流程 |
| `loc` | 代码行数统计（需安装 scc） |

---

## CI/CD

| 工作流 | 触发 | 作用 |
|--------|------|------|
| `.github/workflows/deploy.yml` | push `main` | 构建 `build:pages`，部署 GitHub Pages（含 OTA） |
| `.github/workflows/android-build.yml` | push `main`（src/android 等路径） | 构建 debug APK，从 Artifacts 下载 |

---

## 玩法概要

| 操作 | 说明 |
|------|------|
| WASD / 方向键 / 虚拟摇杆 | 移动飞机 |
| 空格 / 护盾按钮 | 开启护盾 |
| 自动射击 | 持续向上开火 |
| 升级 / 宝物 | 经验满或击败 Boss 后暂停；幻影飞入选项框停留 0.5 秒确认（也可点击） |

主菜单可选 **困难 / 普通 / 简单** 三档难度。敌种随时间解锁，Boss 定期出现并可进入狂暴阶段。

---

## 项目结构

```
airplane-survivor/
├── index.html              # 页面入口
├── capacitor.config.ts     # Capacitor 配置
├── public/                 # 静态资源（构建后复制到 dist 根目录）
├── android/                # Android 原生工程
├── scripts/                # 构建与环境脚本
├── src/
│   ├── main.ts             # 入口
│   ├── liveUpdate.ts       # Capgo OTA
│   ├── native.ts           # Android 壳初始化
│   ├── config/             # 数值、升级、OTA 地址
│   ├── core/               # Engine、Input、Game 主循环
│   ├── entities/           # Player、Enemy、Boss、Bullet…
│   ├── systems/            # 战斗、碰撞、生成、Boss…
│   ├── effects/            # 击破特效
│   ├── types/
│   └── ui/                 # HUD、菜单、升级/宝物/设置界面
└── docs/                   # 补充文档
```

**功能 → 文件对照：** [docs/目录与功能说明.md](./docs/目录与功能说明.md)

---

## 文档

- [目录与功能说明](./docs/目录与功能说明.md)
- [虚拟摇杆与幻影选奖](./docs/20260608-虚拟摇杆与幻影选奖.md)

## 开发约定

- 注释与界面文案使用**简体中文**
- 变量名、类型名、文件名保持**英文**（见 `.cursor/rules/chinese-default.mdc`）

## 许可证

私有项目（`package.json` 中 `"private": true`）。
