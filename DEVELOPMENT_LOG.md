# Development Log

## 2026-06-16 第一阶段

### 完成内容

- 创建 LinguaFlow Tauri 2 + React + TypeScript + Tailwind CSS + Zustand 项目结构。
- 实现设置窗口、翻译窗口、热键捕获窗口、截图/OCR 预留窗口。
- 实现五个设置页面：常规设置、翻译设置、热键设置、服务设置、历史记录。
- 实现服务设置的三个二级 Tab：翻译、AI 翻译、文字识别。
- 实现 `config.json` 默认结构、读取、补齐、保存和完成初始设置逻辑。
- 实现系统托盘菜单、左键打开设置、右键菜单、关闭隐藏、托盘退出。
- 实现本地 HTTP 健康检查 `GET /api/health`。
- 生成原创 LinguaFlow ICO/PNG 图标。
- 安装 Rust toolchain 并完成 Tauri release build。
- 升级 Vite / React plugin 开发依赖，清理 npm audit 报告。

### 修改文件

- `package.json`
- `src/**`
- `src-tauri/**`
- `README.md`
- `TODO.md`
- `DEVELOPMENT_LOG.md`

### 遇到的问题

- 附件文本在终端中显示为 mojibake，需要按中文规格理解。
- 本机最初没有 Rust/Cargo。
- Tauri 2 Rust runner 需要 `src/lib.rs`，仅有 `main.rs` 会导致 manifest 解析失败。
- Rust `emit` 方法需要引入 `tauri::Emitter` trait。
- 老版 System.Drawing 没有 `FillRoundedRectangle`，图标生成改用 `GraphicsPath`。

### 如何修复

- 使用附件规格搭建项目，不依赖空工作目录。
- 通过 rustup 安装 minimal stable Rust toolchain。
- 将 Tauri runner 移到 `src-tauri/src/lib.rs`，`main.rs` 只调用 `linguaflow_lib::run()`。
- 为 `window.rs` 导入 `tauri::Emitter`。
- 使用兼容的 GDI+ path 绘制圆角图标。

### 检查结果

- `npm run check` 通过。
- `npm run build` 通过。
- `npm audit` 通过，0 vulnerabilities。
- `npm run tauri:build` 通过，生成 release exe、MSI 和 NSIS 安装包。
- Runtime smoke 通过：首次启动显示 `LinguaFlow 设置`，完成设置状态启动后仅托盘常驻，配置端口 `/api/health` 返回 `{"ok":true,"app":"LinguaFlow"}`。
- Browser preview 通过：设置页五个导航项、服务页三个 Tab、热键页、翻译窗口、热键捕获窗口、截图/OCR 预留窗口均可渲染。

## 2026-06-16 第二阶段

### 完成内容

- 创建 Git 仓库并提交第一阶段基线：`feat: complete first-phase LinguaFlow desktop shell`。
- 实现本地 HTTP 服务端口 fallback：优先监听 `listenPort`，占用时最多尝试后续 10 个端口，成功后写回 `runtimePort`。
- `/api/health` 返回实际监听端口。
- 实现 AI Provider 架构字段：provider id/name/type、baseUrl、apiKey、model、temperature、maxTokens、customHeaders、enabled、useProxy。
- 实现 `OpenAICompatibleProvider` 真实 `/chat/completions` 调用，兼容 `/v1` 和 `/v1/chat/completions` 两种 Base URL。
- 预留 `GeminiProvider`、`AnthropicProvider`、`CustomProvider` 占位错误提示。
- 实现 AI Provider 测试连接命令和设置页反馈。
- TranslateWindow 增加模式切换：翻译、AI 解释、帮我回复。
- AI 解释和帮我回复走真实 Tauri 后端 Provider 调用。
- 帮我回复支持对方原文、我想表达、回复风格、简短模式和自动复制【推荐回复】正文。
- AI 成功调用后写入本地 `history.json`，历史页改为读取本地历史并保留 SQLite 迁移预留。
- API Key 输入框使用密码框，并支持显示/隐藏。

### 修改文件

- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/src/ai.rs`
- `src-tauri/src/config.rs`
- `src-tauri/src/history.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/server.rs`
- `src/types/config.ts`
- `src/constants/defaultConfig.ts`
- `src/stores/configStore.ts`
- `src/utils/ai.ts`
- `src/utils/history.ts`
- `src/components/settings/pages/GeneralSettings.tsx`
- `src/components/settings/pages/ServiceSettingsPage.tsx`
- `src/components/settings/pages/HistoryPage.tsx`
- `src/components/translate/TranslateWindow.tsx`
- `README.md`
- `TODO.md`
- `DEVELOPMENT_LOG.md`

### 测试结果

- `npm run check` 通过。
- `npm run build` 通过。
- `npm audit` 通过，0 vulnerabilities。
- `cargo test` 通过，覆盖 OpenAI-Compatible URL 拼接、必填字段校验和 mock HTTP `/chat/completions` 调用解析。
- `npm run tauri:build` 通过，生成 release exe、MSI 和 NSIS 安装包。
- Runtime smoke 通过：临时占用 60828 后启动 LinguaFlow，应用自动监听 60829，`config.json.runtimePort=60829`，`/api/health` 返回 `{"app":"LinguaFlow","ok":true,"port":60829}`。
- Mock AI runtime smoke 通过：使用本地 OpenAI-Compatible mock 服务验证 `POST /api/translate/text` 返回【自然翻译】，`POST /api/ai/reply` 返回【推荐回复】，成功后写入 `history.json` 的 `ai_translate` 和 `ai_reply` 记录。
- 错误 smoke 通过：清空 API Key 后调用 AI 翻译返回 400，错误正文为 `API Key 为空，请在 AI 翻译设置中填写 API Key。`，应用未崩溃。
- Browser UI preview smoke 通过：常规设置显示配置端口和当前实际监听端口；AI Provider 页显示 provider type、Base URL、API Key、model、temperature、maxTokens、customHeaders、useProxy 和测试连接；修改 API Key 后刷新页面仍保留；API Key 默认 `password`，显示/隐藏可切换；空 API Key 测试连接错误显示在页面；TranslateWindow 三种模式可切换，帮我回复模式显示对方原文、我想表达、回复风格、简短模式、自动复制推荐回复和输入校验。真实 Tauri 后端调用由 release exe runtime smoke 覆盖。

### 还剩什么没做

- GeminiProvider、AnthropicProvider、CustomProvider 仍是占位。
- API Key 仍以本地 `config.json` 明文保存，后续需接系统凭据管理器或加密存储。
- 历史记录仍是 JSON 文件，后续迁移 SQLite。
- 端口设置变更后需要重启应用才会重启本地 HTTP 服务。
- 全局热键、剪贴板监听、截图 OCR 仍待实现。

## 2026-06-17 Dynamic Island Mode

### Completed

- Added `framer-motion` for spring-based Dynamic Island transitions.
- Added `DynamicIslandWindow`, `DynamicIsland`, `DynamicIslandPanel`, and `DynamicIslandResult`.
- Added `useTranslatorEngine` for Dynamic Island translation flow, reusing existing translation services, AI translation, AI reply, clipboard ignore, auto-copy AI reply setting, and history writes.
- Added `translatorWindowMode` config persistence with `normal` and `dynamicIsland` modes.
- Added a frameless transparent always-on-top Tauri window labeled `dynamic-island`.
- Added Tauri commands to switch translator modes and resize/reposition Dynamic Island at the top center of the primary display.
- Wired the existing TranslateWindow left-top switch button to enter Dynamic Island Mode and added an in-island button to return to the normal window.
- Implemented hover/click expand, blur/Esc/collapse-button collapse, collapsed translating/success/error/idle states, progress animation, and tabbed result panel.

### Verification

- `npm run check` passed.
- `npm run build` passed.
- `npm run tauri:build` passed and produced release exe, MSI, and NSIS bundles.

### Remaining

- System-level outside-click detection for transparent frameless windows is currently represented by blur, Esc, and the collapse button. A global outside-click detector remains as a follow-up.

### 2026-06-17 Desktop Fix

- Fixed Dynamic Island clipping on Windows display scaling by switching the Tauri resize path from physical pixels to logical pixels.
- Kept the Dynamic Island window on a stable expanded transparent canvas so React spring animation is not clipped by system window resizing.
- Forced the dynamic-island WebView background to transparent when the window is shown or repositioned.
- Updated clipboard auto-popup to respect `translatorWindowMode` and emit copied text to the dynamic-island window as well as the normal translate window.
