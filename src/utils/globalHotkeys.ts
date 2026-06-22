import type { HotkeyAction, HotkeyConfig } from "../types/config";
import { isTauriRuntime, showWindow, toggleTranslatorWindow } from "./tauri";

const ACTION_BY_HOTKEY = new Map<string, HotkeyAction>();

export async function registerGlobalHotkeys(hotkeys: HotkeyConfig) {
  if (!isTauriRuntime()) return () => undefined;

  const { register, unregisterAll } = await import("@tauri-apps/plugin-global-shortcut");
  await unregisterAll();
  ACTION_BY_HOTKEY.clear();

  const shortcuts = (Object.entries(hotkeys) as Array<[HotkeyAction, string]>)
    .map(([action, value]) => [action, normalizeShortcut(value)] as const)
    .filter(([, shortcut]) => Boolean(shortcut));

  for (const [action, shortcut] of shortcuts) {
    if (!ACTION_BY_HOTKEY.has(shortcut)) ACTION_BY_HOTKEY.set(shortcut, action);
  }

  const uniqueShortcuts = Array.from(ACTION_BY_HOTKEY.keys());
  if (uniqueShortcuts.length) {
    await register(
      uniqueShortcuts,
      (event) => {
        if (event.state !== "Pressed") return;
        const action = ACTION_BY_HOTKEY.get(event.shortcut) ?? ACTION_BY_HOTKEY.get(normalizeShortcut(event.shortcut));
        if (action) void runHotkeyAction(action);
      }
    );
  }

  return () => {
    void unregisterAll();
    ACTION_BY_HOTKEY.clear();
  };
}

function normalizeShortcut(value: string) {
  return value
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "ctrl" || lower === "control") return "CommandOrControl";
      if (lower === "esc") return "Escape";
      return part;
    })
    .join("+");
}

async function runHotkeyAction(action: HotkeyAction) {
  if (action === "inputTranslate") {
    await toggleTranslatorWindow();
    return;
  }

  window.localStorage.setItem("linguaflow.screenshotMode", action === "ocr" ? "ocr" : "translate");
  await showWindow("screenshot-overlay");
}
