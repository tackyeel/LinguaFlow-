import { create } from "zustand";

export type UiLanguage = "zh-CN" | "en";

export const UI_LANGUAGE_OPTIONS: Array<{ value: UiLanguage; label: string }> = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" }
];

const STORAGE_KEY = "linguaflow.uiLanguage";

interface UiLanguageStore {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
}

function initialLanguage(): UiLanguage {
  if (typeof window === "undefined") return "zh-CN";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "zh-CN";
}

export const useUiLanguageStore = create<UiLanguageStore>((set) => ({
  language: initialLanguage(),
  setLanguage(language) {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    set({ language });
  }
}));
