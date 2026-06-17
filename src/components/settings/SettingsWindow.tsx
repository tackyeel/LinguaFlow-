import { useEffect, useState } from "react";
import { CheckCircle2, History, Keyboard, Languages, RadioTower, Settings, Sparkles } from "lucide-react";
import { AppShell, Sidebar, TopBar } from "../ui/Material";
import { Button } from "../ui/Button";
import { WindowFrame } from "../ui/WindowFrame";
import { GeneralSettings } from "./pages/GeneralSettings";
import { TranslationSettingsPage } from "./pages/TranslationSettingsPage";
import { HotkeySettingsPage } from "./pages/HotkeySettingsPage";
import { ServiceSettingsPage } from "./pages/ServiceSettingsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { useConfigStore } from "../../stores/configStore";
import { listenToTauriEvent, showWindow } from "../../utils/tauri";

type SettingsPage = "general" | "translation" | "hotkeys" | "services" | "history";

const pages: Array<{ id: SettingsPage; label: string; icon: JSX.Element }> = [
  { id: "general", label: "常规", icon: <Settings size={18} /> },
  { id: "translation", label: "翻译", icon: <Languages size={18} /> },
  { id: "hotkeys", label: "热键", icon: <Keyboard size={18} /> },
  { id: "services", label: "服务", icon: <RadioTower size={18} /> },
  { id: "history", label: "历史", icon: <History size={18} /> }
];

const pageTitle: Record<SettingsPage, string> = {
  general: "General Settings",
  translation: "Translation Settings",
  hotkeys: "Hotkey Settings",
  services: "Services",
  history: "History"
};

export function SettingsWindow() {
  const [activePage, setActivePage] = useState<SettingsPage>("general");
  const { config, configPath, saving, error, completeSetup } = useConfigStore();

  useEffect(() => {
    let dispose: () => void = () => undefined;
    void listenToTauriEvent<SettingsPage>("settings:navigate", (page) => {
      if (pages.some((item) => item.id === page)) setActivePage(page);
    }).then((unlisten) => {
      dispose = unlisten;
    });
    return () => dispose();
  }, []);

  return (
    <WindowFrame compact hideHeader>
      <AppShell
        sidebar={
          <Sidebar
            items={pages}
            activeId={activePage}
            onSelect={setActivePage}
            footer={
              <div className="text-xs leading-5 text-text-secondary">
                <div className="mb-2 flex items-center gap-2 font-medium text-text-primary">
                  <Sparkles size={14} className="text-accent" />
                  {saving ? "正在保存" : "配置已就绪"}
                </div>
                <div className="break-all">{configPath || "config.json"}</div>
                {error ? <div className="mt-2 text-danger">{error}</div> : null}
              </div>
            }
          />
        }
        topBar={
          <TopBar
            title={pageTitle[activePage]}
            actions={
              <>
                {(config.firstRun || !config.setupCompleted) && (
                  <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => void completeSetup()}>
                    完成设置
                  </Button>
                )}
                <Button variant="primary" size="sm" icon={<Languages size={16} />} onClick={() => void showWindow("translate")}>
                  打开翻译器
                </Button>
              </>
            }
          />
        }
      >
        {activePage === "general" && <GeneralSettings />}
        {activePage === "translation" && <TranslationSettingsPage />}
        {activePage === "hotkeys" && <HotkeySettingsPage />}
        {activePage === "services" && <ServiceSettingsPage />}
        {activePage === "history" && <HistoryPage />}
      </AppShell>
    </WindowFrame>
  );
}
