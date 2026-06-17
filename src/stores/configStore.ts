import { create } from "zustand";
import { defaultConfig } from "../constants/defaultConfig";
import type { AiProviderType, AppConfig } from "../types/config";
import { deepMerge } from "../utils/deepMerge";
import { invokeCommand, isTauriRuntime } from "../utils/tauri";

const STORAGE_KEY = "linguaflow.config";
let lastSavedConfigJson = "";

interface ConfigStore {
  config: AppConfig;
  configPath: string;
  loading: boolean;
  saving: boolean;
  error: string;
  loadConfig: () => Promise<void>;
  syncConfig: (config: AppConfig) => void;
  updateConfig: (updater: (draft: AppConfig) => void) => Promise<void>;
  replaceConfig: (config: AppConfig) => Promise<void>;
  completeSetup: () => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: defaultConfig,
  configPath: "",
  loading: true,
  saving: false,
  error: "",
  async loadConfig() {
    set({ loading: true, error: "" });

    try {
      let loaded: unknown = null;
      let configPath = "浏览器预览使用 localStorage";

      if (isTauriRuntime()) {
        loaded = await invokeCommand<AppConfig>("get_config");
        configPath = await invokeCommand<string>("config_file_path");
      } else {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        loaded = raw ? JSON.parse(raw) : null;
      }

      const merged = normalizeConfig(deepMerge(defaultConfig, loaded ?? {}));
      set({ config: merged, configPath, loading: false });

      if (!loaded) {
        await get().replaceConfig(merged);
      }
    } catch (error) {
      set({
        config: defaultConfig,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },
  async updateConfig(updater) {
    const next = structuredClone(get().config);
    updater(next);
    await get().replaceConfig(next);
  },
  syncConfig(config) {
    const incoming = JSON.stringify(config);
    if (incoming === lastSavedConfigJson) return;
    set({ config: normalizeConfig(deepMerge(defaultConfig, config)), loading: false, saving: false, error: "" });
  },
  async replaceConfig(config) {
    set({ config, saving: true, error: "" });

    try {
      let saved = config;
      if (isTauriRuntime()) {
        saved = await invokeCommand<AppConfig>("save_config", { config });
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config, null, 2));
      }

      lastSavedConfigJson = JSON.stringify(saved);
      set({ config: normalizeConfig(deepMerge(defaultConfig, saved)), saving: false });
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },
  async completeSetup() {
    const next = structuredClone(get().config);
    next.firstRun = false;
    next.setupCompleted = true;

    if (isTauriRuntime()) {
      const saved = await invokeCommand<AppConfig>("complete_setup", { config: next });
      set({ config: normalizeConfig(deepMerge(defaultConfig, saved)), saving: false });
      return;
    }

    await get().replaceConfig(next);
  }
}));

function normalizeConfig(config: AppConfig): AppConfig {
  config.runtimePort ??= null;
  config.translatorWindowMode = config.translatorWindowMode === "dynamicIsland" ? "dynamicIsland" : "normal";
  config.services.translate = config.services.translate.map((service) => ({
    ...service,
    provider: service.provider ?? service.id,
    name: normalizeBuiltInServiceName(service.name, service.provider ?? service.id),
    description: service.description ?? (service.type === "plugin" ? "外置插件服务。" : "内置翻译服务。"),
    config: service.config ?? defaultTranslateServiceConfig(service.provider ?? service.id)
  }));
  config.services.ai = config.services.ai.map((service) => ({
    ...service,
    providerType: service.providerType ?? inferProviderType(service.provider)
  }));
  config.services.ocr = config.services.ocr.map((service) => ({
    ...service,
    provider: service.provider ?? service.id,
    name: normalizeOcrServiceName(service.name, service.provider ?? service.id),
    description: service.description ?? (service.type === "plugin" ? "外置 OCR 插件。" : "系统 OCR 服务。")
  }));
  return config;
}

function defaultTranslateServiceConfig(provider: string): Record<string, string> {
  const lower = provider.toLowerCase();
  if (lower.includes("google")) return { endpoint: "https://translate.googleapis.com" };
  if (lower.includes("bing")) return { endpoint: "https://api-edge.cognitive.microsofttranslator.com" };
  if (lower.includes("lingva")) return { endpoint: "https://lingva.ml" };
  if (lower.includes("deepl")) return { endpoint: "https://api-free.deepl.com/v2/translate", apiKey: "" };
  if (lower.includes("youdao")) return { appKey: "", appSecret: "" };
  if (lower.includes("baidu")) return { appId: "", appKey: "" };
  if (lower.includes("alibaba")) return { accessKeyId: "", accessKeySecret: "", region: "cn-hangzhou" };
  if (lower.includes("tencent")) return { secretId: "", secretKey: "", region: "ap-guangzhou" };
  if (lower.includes("caiyun")) return { token: "" };
  if (lower.includes("volcengine")) return { accessKeyId: "", secretAccessKey: "", region: "cn-north-1" };
  if (lower.includes("niutrans")) return { apiKey: "" };
  if (lower.includes("yandex")) return { apiKey: "" };
  return {};
}

function normalizeBuiltInServiceName(name: string, provider: string) {
  const lowerName = name.toLowerCase();
  const lowerProvider = provider.toLowerCase();
  if (lowerName.includes("璋") || lowerProvider === "google") return "谷歌翻译";
  if (lowerName.includes("蹇") || lowerProvider === "bing") return "必应翻译";
  if (lowerProvider === "lingva") return "Lingva 翻译";
  return name;
}

function normalizeOcrServiceName(name: string, provider: string) {
  if (name.includes("绯") || provider === "system-ocr" || provider === "system") return "系统 OCR";
  return name;
}

function inferProviderType(provider: string): AiProviderType {
  const lower = provider.toLowerCase();
  if (lower.includes("gemini")) return "GeminiProvider";
  if (lower.includes("anthropic")) return "AnthropicProvider";
  if (lower.includes("customprovider")) return "CustomProvider";
  return "OpenAICompatibleProvider";
}
