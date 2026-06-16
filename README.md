# LinguaFlow

LinguaFlow 是一个 Windows 优先的 Tauri 2 + React + TypeScript 桌面翻译工具。第一阶段重点完成托盘常驻、首次启动设置、配置读写、设置 UI、翻译弹窗、热键捕获 UI、历史记录 UI 和本地健康检查接口。

## 安装依赖

```powershell
npm install
```

如果本机没有 Rust：

```powershell
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
& "$env:TEMP\rustup-init.exe" -y --profile minimal --default-toolchain stable
```

## 开发运行

```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
npm run tauri:dev
```

浏览器预览前端：

```powershell
npm run dev
```

## 构建

```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
npm run tauri:build
```

构建产物：

- `src-tauri/target/release/linguaflow.exe`
- `src-tauri/target/release/bundle/msi/LinguaFlow_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/LinguaFlow_0.1.0_x64-setup.exe`

## 配置文件位置

运行后会生成：

```text
%APPDATA%\com.linguaflow.desktop\config.json
```

所有设置页的开关、输入框、选择框、服务列表、AI 提示词和热键配置都会保存到该文件。

## 当前已完成功能

- Tauri 2 + React + TypeScript + Tailwind CSS + Zustand 项目结构。
- 首次启动显示设置窗口；完成设置后写入 `firstRun=false` 和 `setupCompleted=true`。
- 后续启动默认仅驻留系统托盘。
- 托盘图标、右键菜单、左键打开设置、菜单打开翻译窗口/设置/历史、退出逻辑。
- 点击窗口右上角关闭时隐藏窗口，不退出进程。
- `config.json` 读写、默认配置补齐和前端实时保存。
- 设置窗口五个页面：常规设置、翻译设置、热键设置、服务设置、历史记录。
- 服务设置二级 Tab：翻译、AI 翻译、文字识别。
- 热键捕获窗口 UI，支持组合键显示、冲突检查、保存。
- 翻译弹窗 UI，预留真实翻译、AI 解释和 AI 代回能力。
- 历史记录页面 UI 和本地假数据结构，字段已按 SQLite 预留。
- 本地 HTTP 健康检查：`GET /api/health`。

## 待办功能

- 接入真实翻译服务和 Provider Adapter 调用链。
- 接入 `tauri-plugin-global-shortcut` 做全局热键注册。
- 实现原生剪贴板监听和复制后自动弹窗。
- 实现截图框选、OCR、截图翻译流程。
- 用 SQLite 持久化历史记录。
- 外置插件加载、拖拽排序和服务测试。
