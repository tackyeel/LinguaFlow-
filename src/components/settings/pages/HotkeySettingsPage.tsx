import { useEffect, useState } from "react";
import { Check, Keyboard, RotateCcw, Settings2, X } from "lucide-react";
import { Button } from "../../ui/Button";
import { Keycap, PageHeader, SectionCard } from "../../ui/Material";
import { useConfigStore } from "../../../stores/configStore";
import type { HotkeyAction } from "../../../types/config";
import { eventToHotkey, findHotkeyConflict, getHotkeyActionLabel } from "../../../utils/hotkeys";

const hotkeyActions: Array<{ action: HotkeyAction; description: string }> = [
  { action: "inputTranslate", description: "打开输入翻译窗口。" },
  { action: "ocr", description: "捕获屏幕区域并识别文本。" },
  { action: "screenshotTranslate", description: "捕获屏幕区域并翻译识别结果。" }
];

export function HotkeySettingsPage() {
  const { config, updateConfig } = useConfigStore();
  const [recordingAction, setRecordingAction] = useState<HotkeyAction | null>(null);
  const [draftHotkey, setDraftHotkey] = useState("");

  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setDraftHotkey("");
        return;
      }

      const next = eventToHotkey(event);
      if (next) setDraftHotkey(next);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recordingAction]);

  const startRecording = (action: HotkeyAction) => {
    setRecordingAction(action);
    setDraftHotkey(config.hotkeys[action] ?? "");
  };

  const cancelRecording = () => {
    setRecordingAction(null);
    setDraftHotkey("");
  };

  const confirmRecording = (action: HotkeyAction) =>
    void updateConfig((draft) => {
      draft.hotkeys[action] = draftHotkey;
    }).then(cancelRecording);

  return (
    <>
      <PageHeader title="热键设置" description="在当前页面录制并确认全局快捷键。" />

      <SectionCard>
        {hotkeyActions.map(({ action, description }) => {
          const isRecording = recordingAction === action;
          const value = isRecording ? draftHotkey : config.hotkeys[action];
          const conflict = isRecording && draftHotkey ? findHotkeyConflict(config.hotkeys, action, draftHotkey) : null;

          return (
            <div
              key={action}
              className="flex flex-col gap-4 border-b border-border-subtle px-6 py-5 last:border-b-0 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  {isRecording ? <Keyboard size={16} className="text-accent" /> : null}
                  {getHotkeyActionLabel(action)}
                </div>
                <div className="mt-1 text-sm text-text-secondary">{description}</div>
                {isRecording ? (
                  <div className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-xs leading-5 text-text-secondary">
                    按下想使用的组合键，按 Esc 清空。确认之前不会保存。
                    {conflict ? <div className="mt-1 font-medium text-danger">该快捷键已被 {conflict} 占用。</div> : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <HotkeyPreview value={value} recording={isRecording} />
                {isRecording ? (
                  <>
                    <Button size="sm" variant="primary" icon={<Check size={15} />} disabled={!draftHotkey || Boolean(conflict)} onClick={() => confirmRecording(action)}>
                      确定
                    </Button>
                    <Button size="sm" variant="ghost" icon={<X size={15} />} onClick={cancelRecording}>
                      取消
                    </Button>
                  </>
                ) : (
                  <Button size="sm" icon={<Settings2 size={15} />} onClick={() => startRecording(action)}>
                    设置
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw size={15} />}
                  onClick={() => {
                    if (isRecording) {
                      setDraftHotkey("");
                      return;
                    }
                    void updateConfig((draft) => {
                      draft.hotkeys[action] = "";
                    });
                  }}
                >
                  清除
                </Button>
              </div>
            </div>
          );
        })}
      </SectionCard>
    </>
  );
}

function HotkeyPreview({ value, recording }: { value: string; recording: boolean }) {
  if (!value) return <Keycap muted>{recording ? "等待按键" : "未设置"}</Keycap>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.split("+").map((part, index, parts) => (
        <span key={`${part}-${index}`} className="flex items-center gap-2">
          <Keycap>{part}</Keycap>
          {index < parts.length - 1 ? <span className="text-text-muted">+</span> : null}
        </span>
      ))}
    </div>
  );
}
