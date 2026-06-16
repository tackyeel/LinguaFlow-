export function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(`Tauri command "${command}" is unavailable in browser preview.`);
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

export async function showWindow(label: string) {
  if (!isTauriRuntime()) {
    const url = new URL(window.location.href);
    url.searchParams.set("window", label);
    window.open(url.toString(), label, "width=640,height=520");
    return;
  }

  await invokeCommand("show_window", { label });
}

export async function hideWindow(label?: string) {
  if (!isTauriRuntime()) {
    window.close();
    return;
  }

  await invokeCommand("hide_window", { label: label ?? null });
}

export async function getCurrentWindowLabel() {
  if (!isTauriRuntime()) {
    return new URLSearchParams(window.location.search).get("window") ?? "settings";
  }

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow().label;
}

export async function setAlwaysOnTop(enabled: boolean) {
  if (!isTauriRuntime()) return;

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().setAlwaysOnTop(enabled);
}

export async function listenToTauriEvent<T>(event: string, handler: (payload: T) => void) {
  if (!isTauriRuntime()) {
    return () => undefined;
  }

  const { listen } = await import("@tauri-apps/api/event");
  return listen<T>(event, ({ payload }) => handler(payload));
}
