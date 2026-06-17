import type { HistoryEntry } from "../types/config";
import { invokeCommand, isTauriRuntime } from "./tauri";

const STORAGE_KEY = "linguaflow.history";

export async function getHistoryEntries() {
  if (isTauriRuntime()) {
    return invokeCommand<HistoryEntry[]>("get_history");
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
}

export async function appendHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt"> & Partial<Pick<HistoryEntry, "id" | "createdAt">>) {
  const normalized: HistoryEntry = {
    ...entry,
    id: entry.id ?? `history-${Date.now()}`,
    createdAt: entry.createdAt ?? new Date().toISOString()
  };

  if (isTauriRuntime()) {
    return invokeCommand<HistoryEntry>("append_history", { entry: normalized });
  }

  const current = await getHistoryEntries();
  const next = [normalized, ...current].slice(0, 500);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
  return normalized;
}

export async function clearHistoryEntries() {
  if (isTauriRuntime()) {
    await invokeCommand<void>("clear_history");
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, "[]");
}
