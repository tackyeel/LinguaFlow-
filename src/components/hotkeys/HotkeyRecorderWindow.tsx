import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "../ui/Button";
import { WindowFrame } from "../ui/WindowFrame";
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

  return (
    <WindowFrame title="设置快捷键" subtitle={getHotkeyActionLabel(action)}>
      <div
        className="grid h-full place-items-center p-5 outline-none"
        tabIndex={0}
        onKeyDown={(event) => {
          event.preventDefault();
          const next = eventToHotkey(event);
          if (next) setValue(next);
        }}
      >
        <div className="w-full max-w-md rounded-lg border border-line/10 bg-panel p-5 shadow-glow">
          <p className="text-sm text-muted">请按下新的快捷键组合</p>
          <div className="my-5 grid h-20 place-items-center rounded-lg border border-line/10 bg-app font-mono text-2xl font-semibold text-primary">
            {value || "等待按键"}
          </div>
          {conflict ? <p className="mb-4 rounded-md bg-danger/15 p-3 text-sm text-danger">该快捷键已被 {conflict} 占用</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={() => setValue("")}>
              清除
            </Button>
            <Button variant="secondary" icon={<X size={16} />} onClick={() => void hideWindow("hotkey-recorder")}>
              取消
            </Button>
            <Button
              variant="primary"
              icon={<Check size={16} />}
              disabled={Boolean(conflict)}
              onClick={() =>
                void updateConfig((draft) => {
                  draft.hotkeys[action] = value;
                }).then(() => hideWindow("hotkey-recorder"))
              }
            >
              确认
            </Button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
