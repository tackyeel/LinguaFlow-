import type { TranslationSettings } from "../types/config";

export interface ResolvedTranslationDirection {
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage: string;
  swapped: boolean;
}

type LanguagePairSettings = Pick<TranslationSettings, "sourceLanguage" | "targetLanguage">;

const LATIN_LANGUAGES = new Set(["en", "fr", "de", "es"]);

const COMMON_WORDS: Record<string, string[]> = {
  en: [
    "a",
    "an",
    "and",
    "are",
    "good",
    "hello",
    "hi",
    "how",
    "i",
    "is",
    "it",
    "no",
    "ok",
    "okay",
    "please",
    "thanks",
    "thank",
    "that",
    "the",
    "this",
    "what",
    "we",
    "yes",
    "you"
  ],
  fr: ["avec", "bonjour", "ce", "est", "etre", "je", "la", "le", "les", "merci", "pas", "pour", "que", "salut", "suis", "tu", "vous"],
  de: ["aber", "auf", "bitte", "das", "der", "die", "du", "guten", "hallo", "ich", "ist", "mit", "nicht", "und", "was", "wie"],
  es: ["buenas", "como", "con", "de", "el", "es", "estoy", "gracias", "hola", "la", "los", "para", "por", "que", "si", "y", "yo"]
};

export function resolveTranslationDirection(text: string, settings: LanguagePairSettings): ResolvedTranslationDirection {
  const sourceLanguage = settings.sourceLanguage;
  const targetLanguage = settings.targetLanguage;
  const sourceBase = baseLanguage(sourceLanguage);
  const targetBase = baseLanguage(targetLanguage);

  if (!text.trim() || sourceLanguage === "auto" || sourceBase === targetBase) {
    return { sourceLanguage, targetLanguage, detectedLanguage: "", swapped: false };
  }

  const sourceScore = scoreLanguage(text, sourceBase);
  const targetScore = scoreLanguage(text, targetBase);
  const swapped = targetScore >= 2 && targetScore > sourceScore + 1;
  const detectedLanguage =
    targetScore > sourceScore + 1 ? targetLanguage : sourceScore > targetScore + 1 ? sourceLanguage : "";

  return {
    sourceLanguage: swapped ? targetLanguage : sourceLanguage,
    targetLanguage: swapped ? sourceLanguage : targetLanguage,
    detectedLanguage,
    swapped
  };
}

function baseLanguage(language: string) {
  return language.toLowerCase().split("-")[0];
}

function scoreLanguage(text: string, language: string) {
  switch (language) {
    case "zh":
      return countMatches(text, /[\u3400-\u9fff\uf900-\ufaff]/g) * 3;
    case "ja":
      return countMatches(text, /[\u3040-\u30ff]/g) * 6 + countMatches(text, /[\u3400-\u9fff\uf900-\ufaff]/g) * 1.5;
    case "ko":
      return countMatches(text, /[\uac00-\ud7af\u1100-\u11ff]/g) * 4;
    case "ru":
      return countMatches(text, /[\u0400-\u052f]/g) * 4;
    case "ar":
      return countMatches(text, /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/g) * 4;
    default:
      return LATIN_LANGUAGES.has(language) ? scoreLatinLanguage(text, language) : 0;
  }
}

function scoreLatinLanguage(text: string, language: string) {
  const latinCount = countMatches(text, /[A-Za-z\u00c0-\u024f]/g);
  if (!latinCount) return 0;

  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z]+/g) ?? [];
  const wordSet = new Set(words);
  const commonScore = (COMMON_WORDS[language] ?? []).filter((word) => wordSet.has(word)).length * 8;

  return latinCount * 0.5 + commonScore + scoreLanguageSpecificMarks(text, language);
}

function scoreLanguageSpecificMarks(text: string, language: string) {
  switch (language) {
    case "fr":
      return countMatches(text, /[\u00e0\u00e2\u00e6\u00e7\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u0153\u00f9\u00fb\u00fc\u00ff]/gi) * 8;
    case "de":
      return countMatches(text, /[\u00e4\u00f6\u00fc\u00df]/gi) * 8;
    case "es":
      return countMatches(text, /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\u00bf\u00a1]/gi) * 8;
    default:
      return 0;
  }
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}
