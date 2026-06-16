import type { HotkeyAction, HotkeyConfig } from "../types/config";

const ACTION_LABELS: Record<HotkeyAction, string> = {
  inputTranslate: "输入翻译",
  ocr: "文字识别",
  screenshotTranslate: "截图翻译"
};

export function getHotkeyActionLabel(action: HotkeyAction) {
  return ACTION_LABELS[action];
}

export function eventToHotkey(event: KeyboardEvent | React.KeyboardEvent): string {
  const key = normalizeKey(event.key);
  const parts = [
    event.ctrlKey ? "Ctrl" : "",
    event.altKey ? "Alt" : "",
    event.shiftKey ? "Shift" : "",
    event.metaKey ? "Meta" : ""
  ].filter(Boolean);

  if (key && !["Control", "Alt", "Shift", "Meta"].includes(key)) {
    parts.push(key);
  }

  return parts.join("+");
}

export function findHotkeyConflict(hotkeys: HotkeyConfig, action: HotkeyAction, value: string) {
  const normalized = value.toLowerCase();
  const entry = (Object.entries(hotkeys) as Array<[HotkeyAction, string]>).find(
    ([candidateAction, candidateValue]) =>
      candidateAction !== action && candidateValue.toLowerCase() === normalized
  );

  return entry ? getHotkeyActionLabel(entry[0]) : null;
}

function normalizeKey(key: string) {
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  if (key === "Escape") return "Esc";
  return key;
}
