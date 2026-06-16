export const MAINSTREAM_LANGUAGES = [
  { code: "auto", label: "自动检测" },
  { code: "zh-CN", label: "中文" },
  { code: "en", label: "英语" },
  { code: "ja", label: "日语" },
  { code: "ko", label: "韩语" },
  { code: "fr", label: "法语" },
  { code: "de", label: "德语" },
  { code: "es", label: "西班牙语" },
  { code: "ru", label: "俄语" },
  { code: "ar", label: "阿拉伯语" }
] as const;

export const TARGET_LANGUAGES = MAINSTREAM_LANGUAGES.filter((language) => language.code !== "auto");

export const AI_PROVIDER_PRESETS = [
  "OpenAI",
  "DeepSeek",
  "Gemini",
  "Anthropic",
  "OpenRouter",
  "Groq",
  "SiliconFlow",
  "Kimi",
  "Zhipu",
  "DashScope",
  "Ollama",
  "LM Studio",
  "自定义 OpenAI-Compatible"
] as const;
