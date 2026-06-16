import { create } from "zustand";
import { defaultConfig } from "../constants/defaultConfig";
import type { AiProviderType, AppConfig } from "../types/config";
import { deepMerge } from "../utils/deepMerge";
import { invokeCommand, isTauriRuntime } from "../utils/tauri";

const STORAGE_KEY = "linguaflow.config";

interface ConfigStore {
  config: AppConfig;
  configPath: string;
  loading: boolean;
  saving: boolean;
  error: string;
  loadConfig: () => Promise<void>;
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
  async replaceConfig(config) {
    set({ config, saving: true, error: "" });

    try {
      let saved = config;
      if (isTauriRuntime()) {
        saved = await invokeCommand<AppConfig>("save_config", { config });
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config, null, 2));
      }

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
  config.services.ai = config.services.ai.map((service) => ({
    ...service,
    providerType: service.providerType ?? inferProviderType(service.provider)
  }));
  return config;
}

function inferProviderType(provider: string): AiProviderType {
  const lower = provider.toLowerCase();
  if (lower.includes("gemini")) return "GeminiProvider";
  if (lower.includes("anthropic")) return "AnthropicProvider";
  if (lower.includes("customprovider")) return "CustomProvider";
  return "OpenAICompatibleProvider";
}
