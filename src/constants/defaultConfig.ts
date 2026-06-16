import type { AppConfig, HistoryEntry } from "../types/config";
import { DEFAULT_AI_REPLY_PROMPT, DEFAULT_AI_TRANSLATION_PROMPT } from "./prompts";

export const defaultConfig: AppConfig = {
  firstRun: true,
  setupCompleted: false,
  theme: "dark",
  startup: false,
  trayOnlyOnLaunch: true,
  animations: true,
  windowTransparency: false,
  clipboardListen: false,
  autoPopupAfterCopy: false,
  listenPort: 60828,
  minTextLength: 2,
  proxy: {
    enabled: false,
    protocol: "http",
    host: "",
    port: "",
    username: "",
    password: "",
    bypass: "localhost,127.0.0.1"
  },
  translationSettings: {
    sourceLanguage: "auto",
    targetLanguage: "zh-CN",
    languageDetectEngine: "local",
    aiForShortText: false,
    removeLineBreaks: true,
    trimSpaces: true,
    keepEmoji: true,
    keepSourceCase: false,
    rememberWindowSize: true,
    alwaysOnTop: false,
    autoHideOnBlur: false,
    focusResultAfterTranslate: true,
    autoCopyAiReply: false,
    aiReplyCopyFormat: "replyOnly"
  },
  hotkeys: {
    inputTranslate: "Ctrl+Alt+T",
    ocr: "Ctrl+Alt+O",
    screenshotTranslate: "Ctrl+Alt+S"
  },
  services: {
    translate: [
      { id: "google", type: "built-in", name: "谷歌翻译", enabled: true, iconText: "G" },
      { id: "bing", type: "built-in", name: "必应翻译", enabled: true, iconText: "B" },
      { id: "lingva", type: "built-in", name: "Lingva 翻译", enabled: false, iconText: "L" }
    ],
    ai: [
      {
        id: "openai",
        provider: "OpenAI",
        name: "OpenAI",
        enabled: false,
        baseUrl: "https://api.openai.com/v1",
        apiKey: "",
        model: "gpt-4o-mini",
        temperature: 0.4,
        maxTokens: 1600,
        useProxy: false,
        customHeaders: ""
      }
    ],
    ocr: [
      { id: "system-ocr", type: "system", name: "系统 OCR", enabled: true, iconText: "S" },
      { id: "tesseract", type: "plugin", name: "Tesseract.js", enabled: false, iconText: "T" }
    ]
  },
  aiSettings: {
    defaultServiceId: "openai",
    replyTargetLanguage: "en",
    replyStyle: "natural",
    shortMode: true,
    enableAiReply: true,
    autoCopyAiReply: false,
    translationPrompt: DEFAULT_AI_TRANSLATION_PROMPT,
    replyPrompt: DEFAULT_AI_REPLY_PROMPT
  },
  ocrSettings: {
    defaultEngine: "system-ocr",
    language: "auto",
    autoDetectLanguage: true,
    copyAfterOcr: false,
    translateAfterOcr: false,
    fallbackOnFailure: true
  }
};

export const demoHistory: HistoryEntry[] = [
  {
    id: "h-1",
    type: "translation",
    sourceText: "That sounds kind of sus, but I'm in.",
    resultText: "听起来有点可疑，但我加入。",
    sourceLanguage: "en",
    targetLanguage: "zh-CN",
    serviceName: "AI 翻译",
    createdAt: new Date().toISOString(),
    isFavorite: true
  },
  {
    id: "h-2",
    type: "ocr",
    sourceText: "Screenshot text area",
    resultText: "截图文字区域",
    sourceLanguage: "en",
    targetLanguage: "zh-CN",
    serviceName: "系统 OCR",
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    isFavorite: false
  },
  {
    id: "h-3",
    type: "aiReply",
    sourceText: "我想轻松一点回复对方：今天晚点再说。",
    resultText: "Let's talk about it later today.",
    sourceLanguage: "zh-CN",
    targetLanguage: "en",
    serviceName: "AI 代回",
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    isFavorite: false
  }
];
