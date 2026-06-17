import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettingsWindow } from "../components/settings/SettingsWindow";
import { HotkeyRecorderWindow } from "../components/hotkeys/HotkeyRecorderWindow";
import { TranslateWindow } from "../components/translate/TranslateWindow";
import { DynamicIslandWindow } from "../components/dynamic-island/DynamicIslandWindow";
import { ScreenshotOverlayWindow } from "../components/screenshot/ScreenshotOverlayWindow";
import { useConfigStore } from "../stores/configStore";
import { useUiLanguageStore } from "../stores/uiLanguageStore";
import { registerGlobalHotkeys } from "../utils/globalHotkeys";
import { getCurrentWindowLabel, listenToTauriEvent } from "../utils/tauri";
import type { AppConfig } from "../types/config";

type WindowLabel = "settings" | "translate" | "dynamic-island" | "hotkey-recorder" | "screenshot-overlay";

export function App() {
  const [label, setLabel] = useState<WindowLabel>("settings");
  const { config, loading, loadConfig, syncConfig } = useConfigStore();
  const { language } = useUiLanguageStore();

  useEffect(() => {
    void getCurrentWindowLabel().then((currentLabel) => {
      if (isWindowLabel(currentLabel)) setLabel(currentLabel);
    });
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
  }, [config.theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let dispose: () => void = () => undefined;
    void listenToTauriEvent<AppConfig>("config:updated", (nextConfig) => {
      syncConfig(nextConfig);
    }).then((unlisten) => {
      dispose = unlisten;
    });
    return () => dispose();
  }, [syncConfig]);

  useEffect(() => {
    if (label !== "settings") return;

    let dispose: () => void = () => undefined;
    void registerGlobalHotkeys(config.hotkeys)
      .then((unregister) => {
        dispose = unregister;
      })
      .catch((error) => {
        console.error("Failed to register global hotkeys", error);
      });
    return () => dispose();
  }, [config.hotkeys, label]);

  if (loading) {
    return (
      <div className="grid h-full place-items-center bg-app text-muted">
        <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-5 py-4 text-sm text-text-secondary shadow-sm">
          <Loader2 className="animate-spin text-accent" size={18} />
          正在加载 LinguaFlow
        </div>
      </div>
    );
  }

  if (label === "translate") return <TranslateWindow />;
  if (label === "dynamic-island") return <DynamicIslandWindow />;
  if (label === "hotkey-recorder") return <HotkeyRecorderWindow />;
  if (label === "screenshot-overlay") return <ScreenshotOverlayWindow />;
  return <SettingsWindow />;
}

function isWindowLabel(label: string): label is WindowLabel {
  return ["settings", "translate", "dynamic-island", "hotkey-recorder", "screenshot-overlay"].includes(label);
}
