import { useEffect, useState } from "react";
import {
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  History,
  Languages,
  Keyboard,
  PanelLeft,
  RadioTower,
  Settings,
  Sparkles
} from "lucide-react";
import { clsx } from "clsx";
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

const pages: Array<{ id: SettingsPage; label: string; icon: typeof Settings }> = [
  { id: "general", label: "常规设置", icon: Settings },
  { id: "translation", label: "翻译设置", icon: Languages },
  { id: "hotkeys", label: "热键设置", icon: Keyboard },
  { id: "services", label: "服务设置", icon: RadioTower },
  { id: "history", label: "历史记录", icon: History }
];

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
    <WindowFrame
      title="LinguaFlow"
      subtitle="托盘常驻 AI 翻译 / OCR / 截图翻译"
      compact
      actions={
        <>
          <Button
            variant="ghost"
            icon={<BookOpenText size={16} />}
            onClick={() => void showWindow("translate")}
            title="打开翻译窗口"
          >
            翻译
          </Button>
          {(config.firstRun || !config.setupCompleted) && (
            <Button
              variant="primary"
              icon={<CheckCircle2 size={16} />}
              onClick={() => void completeSetup()}
              title="完成初始设置"
            >
              完成设置
            </Button>
          )}
        </>
      }
    >
      <div className="grid h-full min-h-0 grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-line/10 bg-panel/60">
          <div className="border-b border-line/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-base font-bold text-black">
                LF
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">LinguaFlow</p>
                <p className="truncate text-xs text-muted">{saving ? "正在保存" : "配置已就绪"}</p>
              </div>
            </div>
          </div>
          <nav className="grid gap-1 p-2">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setActivePage(page.id)}
                  className={clsx(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm transition",
                    activePage === page.id
                      ? "bg-primary text-black"
                      : "text-muted hover:bg-panel2 hover:text-text"
                  )}
                >
                  <Icon size={17} />
                  <span className="truncate">{page.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-line/10 p-3">
            <div className="rounded-md bg-panel2/70 p-3 text-xs leading-5 text-muted">
              <div className="mb-2 flex items-center gap-2 text-text">
                <Sparkles size={14} className="text-primary" />
                第一阶段
              </div>
              <div className="break-all">{configPath}</div>
              {error ? <div className="mt-2 text-danger">{error}</div> : null}
            </div>
          </div>
        </aside>
        <section className="min-h-0 overflow-auto">
          <div className="mx-auto grid max-w-5xl gap-5 p-5">
            {activePage === "general" && <GeneralSettings />}
            {activePage === "translation" && <TranslationSettingsPage />}
            {activePage === "hotkeys" && <HotkeySettingsPage />}
            {activePage === "services" && <ServiceSettingsPage />}
            {activePage === "history" && <HistoryPage />}
          </div>
        </section>
      </div>
    </WindowFrame>
  );
}
