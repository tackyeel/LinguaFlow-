# Development Log

## 2026-06-16

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
- 本机 `60828` 被 `D:\potfanyi\pot.exe` 占用，因此 runtime smoke 使用生成配置中的 `60829` 验证健康检查；项目默认值仍是 `60828`。
- Browser preview 通过：设置页五个导航项、服务页三个 Tab、热键页、翻译窗口、热键捕获窗口、截图/OCR 预留窗口均可渲染。

### 下一步计划

- 接入全局热键注册和剪贴板监听。
- 将历史记录从假数据迁移到 SQLite。
