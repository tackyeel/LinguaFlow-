import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettingsWindow } from "../components/settings/SettingsWindow";
import { HotkeyRecorderWindow } from "../components/hotkeys/HotkeyRecorderWindow";
import { TranslateWindow } from "../components/translate/TranslateWindow";
import { ScreenshotOverlayWindow } from "../components/screenshot/ScreenshotOverlayWindow";
import { useConfigStore } from "../stores/configStore";
import { getCurrentWindowLabel } from "../utils/tauri";

type WindowLabel = "settings" | "translate" | "hotkey-recorder" | "screenshot-overlay";

export function App() {
  const [label, setLabel] = useState<WindowLabel>("settings");
  const { config, loading, loadConfig } = useConfigStore();

  useEffect(() => {
    void getCurrentWindowLabel().then((currentLabel) => {
      if (isWindowLabel(currentLabel)) setLabel(currentLabel);
    });
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
  }, [config.theme]);

  if (loading) {
    return (
      <div className="grid h-full place-items-center bg-app text-muted">
        <div className="flex items-center gap-3 rounded-lg border border-line/10 bg-panel px-4 py-3 text-sm">
          <Loader2 className="animate-spin text-primary" size={18} />
          正在加载 LinguaFlow
        </div>
      </div>
    );
  }

  if (label === "translate") return <TranslateWindow />;
  if (label === "hotkey-recorder") return <HotkeyRecorderWindow />;
  if (label === "screenshot-overlay") return <ScreenshotOverlayWindow />;
  return <SettingsWindow />;
}

function isWindowLabel(label: string): label is WindowLabel {
  return ["settings", "translate", "hotkey-recorder", "screenshot-overlay"].includes(label);
}
