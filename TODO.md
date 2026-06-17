# TODO

## Phase 1 Remaining Polish

- [ ] 为托盘菜单的“暂停/开启剪贴板监听”增加动态文字或勾选状态。
- [ ] 为翻译服务、OCR 服务实现真实拖拽排序。
- [x] 在 AI 设置页增加服务测试结果反馈。
- [ ] 增加端口变更后的本地 HTTP 服务热重启逻辑。

## Phase 2 Native Capabilities

- [x] 端口占用时自动尝试后续端口并写回 `runtimePort`。
- [x] OpenAICompatibleProvider 真实调用。
- [x] TranslateWindow AI 解释真实调用。
- [x] TranslateWindow 帮我回复真实调用。
- [x] AI 成功调用后写入本地 JSON 历史记录。
- [ ] 使用系统凭据管理器或加密存储 API Key。
- [ ] 使用 `tauri-plugin-global-shortcut` 注册输入翻译、文字识别、截图翻译热键。
- [ ] 实现 Windows 剪贴板监听和 `autoPopupAfterCopy` 触发。
- [ ] 实现 ScreenshotOverlayWindow 的全屏透明框选。
- [ ] 接入系统 OCR 和 Tesseract.js。
- [ ] 历史记录迁移到 SQLite。

## Phase 3 AI and Plugins

- [x] 实现 OpenAICompatibleProvider。
- [ ] 实现 GeminiProvider。
- [ ] 实现 AnthropicProvider。
- [ ] 实现 CustomProvider。
- [ ] 实现外置插件发现、加载和隔离执行。

## Dynamic Island Follow-up

- [x] Add independent `dynamic-island` Tauri window and mode switching from TranslateWindow.
- [x] Persist `translatorWindowMode` as `normal` / `dynamicIsland`.
- [x] Reuse existing translation, AI explanation, AI reply, auto-copy, language settings, and history write paths in Dynamic Island Mode.
- [ ] Enhance system-level outside-click detection beyond blur / Esc / collapse button for frameless transparent Dynamic Island windows.
