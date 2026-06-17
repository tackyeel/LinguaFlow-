import { useMemo, useState } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "../ui/Button";
import { Dialog, Keycap } from "../ui/Material";
import { useConfigStore } from "../../stores/configStore";
import type { HotkeyAction } from "../../types/config";
import { eventToHotkey, findHotkeyConflict, getHotkeyActionLabel } from "../../utils/hotkeys";
import { hideWindow } from "../../utils/tauri";

export function HotkeyRecorderWindow() {
  const { config, updateConfig } = useConfigStore();
  const action = useMemo(
    () => (window.localStorage.getItem("linguaflow.pendingHotkeyAction") as HotkeyAction | null) ?? "inputTranslate",
    []
  );
  const [value, setValue] = useState(config.hotkeys[action] ?? "");
  const conflict = value ? findHotkeyConflict(config.hotkeys, action, value) : null;
  const parts = value ? value.split("+") : ["Ctrl", "Alt", "..."];

  return (
    <div
      className="drag-region h-screen w-screen"
      tabIndex={0}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      onKeyDown={(event) => {
        event.preventDefault();
        if (event.key === "Escape") {
          setValue("");
          return;
        }
        const next = eventToHotkey(event);
        if (next) setValue(next);
      }}
    >
      <Dialog className="no-drag max-w-[420px]">
        <div className="px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
              <Keyboard size={19} />
            </div>
            <div>
              <h1 className="text-xl font-medium text-text-primary">Record Shortcut</h1>
              <p className="mt-1 text-sm text-text-secondary">{getHotkeyActionLabel(action)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F7FAFF] p-5 text-center">
            <p className="text-sm text-text-secondary">按下你想使用的快捷键组合</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {parts.map((part, index) => (
                <span key={`${part}-${index}`} className="flex items-center gap-2">
                  <Keycap muted={part === "..."}>{part}</Keycap>
                  {index < parts.length - 1 ? <span className="text-lg text-text-secondary">+</span> : null}
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-text-muted">
              按 Esc 清除。组合键建议包含 Ctrl、Alt 或 Shift。
            </p>
          </div>

          <div className="mt-4 min-h-6 text-center">
            {conflict ? (
              <p className="text-sm font-medium text-danger">该快捷键已被 {conflict} 占用</p>
            ) : (
              <p className="text-sm text-text-secondary">{value ? "快捷键可用" : "等待按键输入"}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border-subtle bg-[#FBFBFF] px-6 py-4">
          <Button variant="ghost" onClick={() => void hideWindow("hotkey-recorder")}>
            取消
          </Button>
          <Button variant="secondary" onClick={() => setValue("")}>
            清除
          </Button>
          <Button
            variant="primary"
            disabled={Boolean(conflict) || !value}
            onClick={() =>
              void updateConfig((draft) => {
                draft.hotkeys[action] = value;
              }).then(() => hideWindow("hotkey-recorder"))
            }
          >
            确认
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
