import { Keyboard, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { Field, Section } from "../../ui/Form";
import { useConfigStore } from "../../../stores/configStore";
import type { HotkeyAction } from "../../../types/config";
import { getHotkeyActionLabel } from "../../../utils/hotkeys";
import { showWindow } from "../../../utils/tauri";
import { PageHeader } from "./GeneralSettings";

const hotkeyActions: HotkeyAction[] = ["inputTranslate", "ocr", "screenshotTranslate"];

export function HotkeySettingsPage() {
  const { config, updateConfig } = useConfigStore();

  const openRecorder = (action: HotkeyAction) => {
    window.localStorage.setItem("linguaflow.pendingHotkeyAction", action);
    void showWindow("hotkey-recorder");
  };

  return (
    <>
      <PageHeader title="热键设置" description="点击设置会打开独立热键捕获窗口，确认后保存到 config.json。" />
      <Section title="全局热键" description="TODO: 全局注册接入 Tauri 插件；第一阶段已完成捕获、冲突检查和保存。">
        {hotkeyActions.map((action) => (
          <Field key={action} label={getHotkeyActionLabel(action)}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex h-9 min-w-36 items-center justify-center rounded-md border border-line/10 bg-app px-3 font-mono text-sm text-primary">
                {config.hotkeys[action] || "未设置"}
              </span>
              <Button icon={<Settings2 size={16} />} onClick={() => openRecorder(action)}>
                设置
              </Button>
              <Button
                variant="ghost"
                icon={<RotateCcw size={16} />}
                onClick={() =>
                  void updateConfig((draft) => {
                    draft.hotkeys[action] = "";
                  })
                }
              >
                清除
              </Button>
            </div>
          </Field>
        ))}
      </Section>
      <Section title="功能目标">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["输入翻译", "弹出 TranslateWindow，让用户输入文字并翻译。"],
            ["文字识别", "TODO: 打开截图框选窗口，OCR 后显示识别文字。"],
            ["截图翻译", "TODO: 打开截图框选窗口，OCR 后自动翻译。"]
          ].map(([title, body]) => (
            <div key={title} className="rounded-md border border-line/10 bg-panel2/50 p-4">
              <Keyboard size={18} className="mb-3 text-primary" />
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
