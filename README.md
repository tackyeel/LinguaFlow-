# LinguaFlow

LinguaFlow 是一个 Windows 优先的 Tauri 2 + React + TypeScript 桌面翻译工具。第一阶段完成托盘常驻、首次启动设置、配置读写、设置 UI、翻译弹窗、热键捕获 UI、历史记录 UI 和本地健康检查接口。第二阶段已接入真实 OpenAI-Compatible AI 翻译和 AI 代回能力。

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

运行 release exe：

```powershell
.\src-tauri\target\release\linguaflow.exe
```

## 配置和数据位置

配置文件：

```text
%APPDATA%\com.linguaflow.desktop\config.json
```

历史记录：

```text
%APPDATA%\com.linguaflow.desktop\history.json
```

所有设置页的开关、输入框、选择框、服务列表、AI 提示词和热键配置都会保存到 `config.json`。

安全提示：当前版本 API Key 存储在本地配置文件中，请不要共享 config.json。

## AI Provider 配置

进入 `服务设置 -> AI 翻译`：

1. 添加或选择一个 OpenAI-Compatible Provider。
2. 填写 `Base URL`、`API Key`、`Model Name`。
3. `Base URL` 支持两种写法：
   - `https://api.openai.com/v1`
   - `https://api.openai.com/v1/chat/completions`
4. 点击 `测试连接` 验证配置。
5. 在翻译窗口选择 `AI 解释` 或 `帮我回复` 使用真实 AI 调用。

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
- 翻译弹窗 UI，支持翻译、AI 解释、帮我回复三种模式。
- 历史记录页面读取本地 JSON 记录，字段已按 SQLite 预留。
- 本地 HTTP 健康检查：`GET /api/health`。
- 端口占用自动 fallback：优先监听 `listenPort`，占用时最多尝试后续 10 个端口，并写回 `runtimePort`。
- `/api/health` 返回实际监听端口。
- 本地 AI 调用接口：`POST /api/translate/text` 和 `POST /api/ai/reply`，用于本地集成和 smoke test。
- AI Provider 架构：`OpenAICompatibleProvider` 已真实可用；`GeminiProvider`、`AnthropicProvider`、`CustomProvider` 已预留占位。
- AI 翻译 / AI 解释：使用内置 AI 翻译提示词调用 OpenAI-Compatible `/chat/completions`。
- AI 代回：使用内置 AI 代回提示词调用 OpenAI-Compatible `/chat/completions`，支持自动复制【推荐回复】正文。
- AI 调用错误提示：覆盖 API Key/Base URL/模型为空、网络失败、401/403、404、429、5xx、返回格式异常和超时。
- AI 翻译和 AI 代回成功后写入本地 `history.json`。

## 待办功能

- 接入 GeminiProvider、AnthropicProvider、CustomProvider 的真实调用。
- 使用系统凭据管理器或加密存储 API Key。
- 接入 `tauri-plugin-global-shortcut` 做全局热键注册。
- 实现原生剪贴板监听和复制后自动弹窗。
- 实现截图框选、OCR、截图翻译流程。
- 用 SQLite 持久化历史记录。
- 外置插件加载、拖拽排序和服务测试。
