# TODO

## Phase 1 Remaining Polish

- [ ] 为托盘菜单的“暂停/开启剪贴板监听”增加动态文字或勾选状态。
- [ ] 为翻译服务、OCR 服务实现真实拖拽排序。
- [ ] 在设置页增加服务测试结果反馈。
- [ ] 增加端口变更后的本地 HTTP 服务重启逻辑。

## Phase 2 Native Capabilities

- [ ] 使用 `tauri-plugin-global-shortcut` 注册输入翻译、文字识别、截图翻译热键。
- [ ] 实现 Windows 剪贴板监听和 `autoPopupAfterCopy` 触发。
- [ ] 实现 ScreenshotOverlayWindow 的全屏透明框选。
- [ ] 接入系统 OCR 和 Tesseract.js。
- [ ] 历史记录迁移到 SQLite。

## Phase 3 AI and Plugins

- [ ] 实现 OpenAICompatibleProvider。
- [ ] 实现 GeminiProvider。
- [ ] 实现 AnthropicProvider。
- [ ] 实现 CustomProvider。
- [ ] 实现外置插件发现、加载和隔离执行。
