export type ThemeName = "light" | "dark" | "blue";
export type TranslatorWindowMode = "normal" | "dynamicIsland";
export type ProxyProtocol = "http" | "https" | "socks5";
export type LanguageDetectEngine = "local" | "service" | "ai";
export type AiReplyCopyFormat = "replyOnly" | "replyWithExplanation";
export type ReplyStyle = "natural" | "friendly" | "casual" | "polite" | "playful";
export type HistoryType = "translation" | "ocr" | "aiReply" | "ai_translate" | "ai_reply" | "ai_image_translate";
export type AiProviderType =
  | "OpenAICompatibleProvider"
  | "GeminiProvider"
  | "AnthropicProvider"
  | "CustomProvider";

export interface ProxyConfig {
  enabled: boolean;
  protocol: ProxyProtocol;
  host: string;
  port: string;
  username: string;
  password: string;
  bypass: string;
}

export interface TranslationSettings {
  sourceLanguage: string;
  targetLanguage: string;
  languageDetectEngine: LanguageDetectEngine;
  aiForShortText: boolean;
  removeLineBreaks: boolean;
  trimSpaces: boolean;
  keepEmoji: boolean;
  keepSourceCase: boolean;
  rememberWindowSize: boolean;
  alwaysOnTop: boolean;
  autoHideOnBlur: boolean;
  focusResultAfterTranslate: boolean;
  autoCopyAiReply: boolean;
  aiReplyCopyFormat: AiReplyCopyFormat;
  enableAiInTranslateWindow?: boolean;
  resultOrder?: string[];
}

export interface HotkeyConfig {
  inputTranslate: string;
  ocr: string;
  screenshotTranslate: string;
}

export interface TranslateService {
  id: string;
  type: "built-in" | "plugin";
  name: string;
  enabled: boolean;
  iconText: string;
  provider?: string;
  description?: string;
  pluginPath?: string;
  config?: Record<string, string>;
}

export interface AiService {
  id: string;
  provider: string;
  providerType: AiProviderType;
  name: string;
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  useProxy: boolean;
  customHeaders: string;
}

export interface OcrService {
  id: string;
  type: "system" | "plugin";
  name: string;
  enabled: boolean;
  iconText: string;
  provider?: string;
  description?: string;
  pluginPath?: string;
}

export interface ServicesConfig {
  translate: TranslateService[];
  ai: AiService[];
  ocr: OcrService[];
}

export interface AiSettings {
  defaultServiceId: string;
  visionServiceId?: string;
  replyTargetLanguage: string;
  replyStyle: ReplyStyle;
  shortMode: boolean;
  enableAiReply: boolean;
  autoCopyAiReply: boolean;
  translationPrompt: string;
  replyPrompt: string;
}

export interface OcrSettings {
  defaultEngine: string;
  language: string;
  autoDetectLanguage: boolean;
  copyAfterOcr: boolean;
  translateAfterOcr: boolean;
  fallbackOnFailure: boolean;
}

export interface AppConfig {
  firstRun: boolean;
  setupCompleted: boolean;
  theme: ThemeName;
  startup: boolean;
  trayOnlyOnLaunch: boolean;
  animations: boolean;
  windowTransparency: boolean;
  clipboardListen: boolean;
  autoPopupAfterCopy: boolean;
  listenPort: number;
  runtimePort: number | null;
  minTextLength: number;
  translatorWindowMode: TranslatorWindowMode;
  proxy: ProxyConfig;
  translationSettings: TranslationSettings;
  hotkeys: HotkeyConfig;
  services: ServicesConfig;
  aiSettings: AiSettings;
  ocrSettings: OcrSettings;
}

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  sourceText: string;
  resultText: string;
  contextText?: string;
  sourceLanguage: string;
  targetLanguage: string;
  serviceName: string;
  createdAt: string;
  isFavorite: boolean;
}

export type HotkeyAction = keyof HotkeyConfig;
