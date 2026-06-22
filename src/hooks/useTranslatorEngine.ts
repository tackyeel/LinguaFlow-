import { useEffect, useMemo, useRef, useState } from "react";
import { useConfigStore } from "../stores/configStore";
import { captureScreenClip, runAiImageTranslate, runAiReply, runAiTranslate } from "../utils/ai";
import { appendHistoryEntry } from "../utils/history";
import { invokeCommand, isTauriRuntime, listenToTauriEvent } from "../utils/tauri";
import { translateWithService, type ServiceTranslateResult } from "../utils/translateServices";
import { resolveTranslationDirection, type ResolvedTranslationDirection } from "../utils/languageDirection";
import type { AiReplyCopyFormat } from "../types/config";

export type TranslatorStatus = "idle" | "focused" | "expanded" | "translating" | "success" | "error";

export interface TranslatorSections {
  natural: string;
  tone: string;
  slang: string;
  literal: string;
}

export interface ReplySections {
  recommended: string;
  casual: string;
  polite: string;
  meaning: string;
}

export interface ImageTranslationSections {
  description: string;
  recognized: string;
  translated: string;
  note: string;
}

interface TranslateOptions {
  forceAiReply?: boolean;
}

export function useTranslatorEngine() {
  const { config, updateConfig } = useConfigStore();
  const settings = config.translationSettings;
  const [sourceText, setSourceText] = useState("");
  const [translationText, setTranslationText] = useState("");
  const [aiExplanationText, setAiExplanationText] = useState("");
  const [aiReplyText, setAiReplyText] = useState("");
  const [imageTranslationText, setImageTranslationText] = useState("");
  const [imageTranslationPreview, setImageTranslationPreview] = useState("");
  const [imageTranslationSize, setImageTranslationSize] = useState("");
  const [error, setError] = useState("");
  const [translationRunning, setTranslationRunning] = useState(false);
  const [aiExplanationRunning, setAiExplanationRunning] = useState(false);
  const [aiReplyRunning, setAiReplyRunning] = useState(false);
  const [imageTranslationRunning, setImageTranslationRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const requestIdRef = useRef(0);
  const imageRequestIdRef = useRef(0);
  const ignoredClipboardTextRef = useRef("");

  const enabledServices = useMemo(
    () => config.services.translate.filter((service) => service.enabled),
    [config.services.translate]
  );
  const aiEnabled = settings.enableAiInTranslateWindow ?? true;
  const running = translationRunning || aiExplanationRunning || aiReplyRunning || imageTranslationRunning;

  useEffect(() => {
    if (!completed) return;
    const timer = window.setTimeout(() => setCompleted(false), 2200);
    return () => window.clearTimeout(timer);
  }, [completed]);

  useEffect(() => {
    if (!copyNotice) return;
    const timer = window.setTimeout(() => setCopyNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [copyNotice]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listenToTauriEvent<string>("translate:set-text", (text) => {
      const normalized = text.trim();
      if (!normalized) return;
      if (normalized === ignoredClipboardTextRef.current) {
        ignoredClipboardTextRef.current = "";
        return;
      }
      setSourceText(normalized);
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    const text = sourceText.trim();
    if (!text) {
      requestIdRef.current += 1;
      setTranslationText("");
      setAiExplanationText("");
      setAiReplyText("");
      setError("");
      setTranslationRunning(false);
      setAiExplanationRunning(false);
      setAiReplyRunning(false);
      setCompleted(false);
      setCopyNotice("");
      return;
    }

    const timer = window.setTimeout(() => {
      void performTranslate(text);
    }, 520);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sourceText,
    settings.sourceLanguage,
    settings.targetLanguage,
    aiEnabled,
    config.aiSettings.defaultServiceId,
    config.aiSettings.enableAiReply,
    config.aiSettings.replyTargetLanguage,
    config.aiSettings.replyStyle,
    config.aiSettings.shortMode,
    config.aiSettings.autoCopyAiReply,
    enabledServices.map((service) => `${service.id}:${service.provider}:${service.enabled}:${JSON.stringify(service.config ?? {})}`).join("|")
  ]);

  const performTranslate = async (text = sourceText.trim(), options: TranslateOptions = {}) => {
    if (!text) return;
    const shouldRunAiReply = config.aiSettings.enableAiReply || Boolean(options.forceAiReply);

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setTranslationRunning(enabledServices.length > 0);
    setAiExplanationRunning(aiEnabled);
    setAiReplyRunning(aiEnabled && shouldRunAiReply);
    setCompleted(false);
    setError("");
    setTranslationText("");
    setAiExplanationText("");
    setAiReplyText("");

    const direction = resolveTranslationDirection(text, settings);
    const errors: string[] = [];
    let successCount = 0;
    const serviceJobs = enabledServices.map(async (service) => {
      const result = await translateWithService({
        service,
        sourceText: text,
        sourceLanguage: direction.sourceLanguage,
        targetLanguage: direction.targetLanguage
      });
      if (requestId !== requestIdRef.current) return null;
      if (result.ok && result.content.trim()) {
        successCount += 1;
        setCompleted(true);
        void appendHistoryEntry({
          type: "translation",
          sourceText: text,
          resultText: result.content,
          sourceLanguage: direction.sourceLanguage,
          targetLanguage: direction.targetLanguage,
          serviceName: result.serviceName,
          isFavorite: false
        });
      } else if (result.error) {
        errors.push(result.error);
      }
      return result;
    });

    const markSuccess = () => {
      successCount += 1;
    };
    const aiJob = aiEnabled ? runAiJobs(requestId, text, direction, markSuccess, errors, shouldRunAiReply) : Promise.resolve();
    const [serviceSettled, aiSettled] = await Promise.all([Promise.allSettled(serviceJobs), Promise.allSettled([aiJob])]);
    if (requestId !== requestIdRef.current) return;
    setTranslationRunning(false);

    const serviceResults = serviceSettled
      .filter((item): item is PromiseFulfilledResult<NonNullable<Awaited<(typeof serviceJobs)[number]>>> => item.status === "fulfilled" && Boolean(item.value))
      .map((item) => item.value);
    if (enabledServices.length > 1 && serviceResults.length) {
      setTranslationText(serviceResults.map(formatServiceResult).join("\n\n"));
    } else {
      const firstResult = serviceResults.find((result) => result.ok && result.content.trim());
      setTranslationText(firstResult?.content.trim() ?? "");
    }

    const rejected = [...serviceSettled, ...aiSettled].find((item) => item.status === "rejected");
    const hasServiceBlocks = enabledServices.length > 1 && serviceResults.length > 0;
    if (successCount === 0 && errors.length && !hasServiceBlocks) {
      setError(errors[0]);
    } else if (successCount === 0 && rejected && !hasServiceBlocks) {
      setError(rejected.reason instanceof Error ? rejected.reason.message : String(rejected.reason));
    } else {
      setError("");
    }
    setCompleted(Boolean(text.trim()));
  };

  const runAiJobs = async (
    requestId: number,
    text: string,
    direction: ResolvedTranslationDirection,
    markSuccess: () => void,
    errors: string[],
    shouldRunAiReply: boolean
  ) => {
    const jobs: Promise<void>[] = [];

    jobs.push((async () => {
      const aiResult = await runAiTranslate({
        providerId: config.aiSettings.defaultServiceId,
        sourceText: text,
        sourceLanguage: direction.sourceLanguage,
        targetLanguage: direction.targetLanguage,
        scene: "dynamic-island"
      });
      if (requestId !== requestIdRef.current) return;
      const natural = extractNaturalTranslation(aiResult.content);
      markSuccess();
      setAiExplanationText(aiResult.content);
      setAiExplanationRunning(false);
      setCompleted(true);
      if (enabledServices.length === 0) {
        setTranslationText((current) => current || natural || aiResult.content);
      }
      void appendHistoryEntry({
        type: "ai_translate",
        sourceText: text,
        resultText: natural || aiResult.content,
        sourceLanguage: direction.sourceLanguage,
        targetLanguage: direction.targetLanguage,
        serviceName: aiResult.serviceName || "AI Translate",
        isFavorite: false
      });
    })().catch((caught) => {
      if (requestId !== requestIdRef.current) return;
      setAiExplanationRunning(false);
      errors.push(caught instanceof Error ? caught.message : String(caught));
    }));

    if (shouldRunAiReply) {
      jobs.push((async () => {
        const replyResult = await runAiReply({
          providerId: config.aiSettings.defaultServiceId,
          contextText: text,
          userIntent: text,
          targetLanguage: config.aiSettings.replyTargetLanguage,
          replyStyle: config.aiSettings.replyStyle,
          shortMode: config.aiSettings.shortMode
        });
        if (requestId !== requestIdRef.current) return;
        const replyToCopy = selectReplyForCopy(replyResult.content, settings.aiReplyCopyFormat);
        markSuccess();
        setAiReplyText(replyResult.content);
        setAiReplyRunning(false);
        setCompleted(true);
        void appendHistoryEntry({
          type: "ai_reply",
          sourceText: text,
          resultText: replyResult.content,
          sourceLanguage: direction.sourceLanguage,
          targetLanguage: config.aiSettings.replyTargetLanguage,
          serviceName: replyResult.serviceName || "AI Reply",
          isFavorite: false
        });
        if (replyToCopy && (config.aiSettings.autoCopyAiReply || settings.autoCopyAiReply)) {
          ignoredClipboardTextRef.current = replyToCopy.trim();
          const copied = await writeClipboardText(replyToCopy);
          if (copied) setCopyNotice("已自动复制回复");
        }
      })().catch((caught) => {
        if (requestId !== requestIdRef.current) return;
        setAiReplyRunning(false);
        errors.push(caught instanceof Error ? caught.message : String(caught));
      }));
    } else {
      setAiReplyRunning(false);
    }

    await Promise.allSettled(jobs);
  };

  const performImageTranslate = async () => {
    const requestId = imageRequestIdRef.current + 1;
    imageRequestIdRef.current = requestId;
    setImageTranslationRunning(true);
    setImageTranslationText("");
    setImageTranslationPreview("");
    setImageTranslationSize("");
    setError("");
    setCompleted(false);

    try {
      const screenshot = await captureScreenClip();
      if (requestId !== imageRequestIdRef.current) return;
      setImageTranslationPreview(screenshot.imageDataUrl);
      setImageTranslationSize(`${screenshot.width} x ${screenshot.height}`);

      const ocrText = screenshot.ocrText.trim();
      if (ocrText) {
        const direction = resolveTranslationDirection(ocrText, settings);
        setImageTranslationText(
          `【识别文字】\n${ocrText}\n\n【翻译结果】\n正在翻译 OCR 文本...\n\n【备注】\n已先使用 Windows 本地 OCR 提取文字。`
        );
        const result = await runAiTranslate({
          providerId: config.aiSettings.visionServiceId || config.aiSettings.defaultServiceId,
          sourceText: ocrText,
          sourceLanguage: direction.sourceLanguage,
          targetLanguage: direction.targetLanguage,
          scene: "ocr-text"
        });
        if (requestId !== imageRequestIdRef.current) return;
        const sections = parseTranslationSections(result.content);
        const translated = sections.natural || result.content;
        const note = [
          "已先使用 Windows 本地 OCR 提取文字，再交给 AI 翻译。",
          sections.tone ? `语气说明：${sections.tone}` : ""
        ].filter(Boolean).join("\n");
        setImageTranslationText(`【识别文字】\n${ocrText}\n\n【翻译结果】\n${translated}\n\n【备注】\n${note}`);
        setCompleted(true);
        void appendHistoryEntry({
          type: "ai_image_translate",
          sourceText: ocrText,
          resultText: translated,
          sourceLanguage: direction.sourceLanguage,
          targetLanguage: direction.targetLanguage,
          serviceName: result.serviceName || "AI OCR 翻译",
          isFavorite: false
        });
        return;
      }

      const result = await runAiImageTranslate({
        providerId: config.aiSettings.visionServiceId || config.aiSettings.defaultServiceId,
        imageDataUrl: screenshot.imageDataUrl,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage
      });
      if (requestId !== imageRequestIdRef.current) return;
      setImageTranslationText(result.content);
      setCompleted(true);
      void appendHistoryEntry({
        type: "ai_image_translate",
        sourceText: `截图识图 ${screenshot.width}x${screenshot.height}`,
        resultText: result.content,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        serviceName: result.serviceName || "AI 识图",
        isFavorite: false
      });
    } catch (caught) {
      if (requestId !== imageRequestIdRef.current) return;
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      if (requestId === imageRequestIdRef.current) {
        setImageTranslationRunning(false);
        setCompleted(true);
      }
    }
  };

  const clearAll = () => {
    requestIdRef.current += 1;
    imageRequestIdRef.current += 1;
    setSourceText("");
    setTranslationText("");
    setAiExplanationText("");
    setAiReplyText("");
    setImageTranslationText("");
    setImageTranslationPreview("");
    setImageTranslationSize("");
    setError("");
    setTranslationRunning(false);
    setAiExplanationRunning(false);
    setAiReplyRunning(false);
    setImageTranslationRunning(false);
    setCompleted(false);
    setCopyNotice("");
  };

  const copy = async (text: string) => {
    const copied = await writeClipboardText(text);
    if (copied) setCopyNotice("已复制");
    return copied;
  };

  const toggleAi = (checked: boolean) =>
    updateConfig((draft) => {
      draft.translationSettings.enableAiInTranslateWindow = checked;
    });

  const swapLanguages = () =>
    updateConfig((draft) => {
      if (draft.translationSettings.sourceLanguage === "auto") return;
      const source = draft.translationSettings.sourceLanguage;
      draft.translationSettings.sourceLanguage = draft.translationSettings.targetLanguage;
      draft.translationSettings.targetLanguage = source;
    });

  return {
    config,
    settings,
    sourceText,
    setSourceText,
    translationText,
    aiExplanationText,
    aiReplyText,
    imageTranslationText,
    imageTranslationPreview,
    imageTranslationSize,
    error,
    running,
    translationRunning,
    aiExplanationRunning,
    aiReplyRunning,
    imageTranslationRunning,
    completed,
    copyNotice,
    aiEnabled,
    performTranslate,
    performImageTranslate,
    clearAll,
    copy,
    toggleAi,
    swapLanguages,
    updateConfig
  };
}

export function parseTranslationSections(content: string): TranslatorSections {
  return {
    natural: extractSection(content, ["Natural translation", "自然翻译", "推荐翻译"]) || content.trim(),
    tone: extractSection(content, ["Tone explanation", "语气解释"]),
    slang: extractSection(content, ["Slang / difficult words", "难懂词", "梗解释", "Slang"]),
    literal: extractSection(content, ["Literal reference", "直译参考"])
  };
}

export function parseReplySections(content: string): ReplySections {
  return {
    recommended: extractSection(content, ["Recommended reply", "推荐回复"]) || extractFirstReply(content),
    casual: extractSection(content, ["Casual reply", "More casual", "更随便一点"]),
    polite: extractSection(content, ["Polite reply", "More polite", "更礼貌一点"]),
    meaning: extractSection(content, ["Meaning explanation", "意思解释"])
  };
}

export function parseImageTranslationSections(content: string): ImageTranslationSections {
  return {
    description: extractSection(content, ["Image content", "图片内容"]),
    recognized: extractSection(content, ["Recognized text", "OCR text", "识别文字"]),
    translated: extractSection(content, ["Translation", "Translated result", "翻译结果"]),
    note: extractSection(content, ["Notes", "Remark", "备注"])
  };
}

export function selectTranslationForCopy(content: string) {
  const normalized = content.trim();
  if (!normalized) return "";

  const sections = splitBracketSections(normalized);
  const firstSuccessful = sections.find((section) => section.content && !/translation failed|翻译失败/i.test(section.content));
  return firstSuccessful?.content || sections[0]?.content || normalized;
}

export function selectExplanationForCopy(content: string) {
  const sections = parseTranslationSections(content);
  return sections.natural || selectTranslationForCopy(content);
}

export function selectImageTranslationForCopy(content: string) {
  const sections = parseImageTranslationSections(content);
  return sections.translated || sections.recognized || selectTranslationForCopy(content);
}

function extractNaturalTranslation(content: string) {
  return parseTranslationSections(content).natural;
}

function extractSection(content: string, titles: string[]) {
  const headingTitles =
    "Natural translation|Tone explanation|Slang / difficult words|Literal reference|Recommended reply|Casual reply|More casual|Polite reply|More polite|Meaning explanation|Image content|Recognized text|OCR text|Translation|Translated result|Notes|Remark|自然翻译|推荐翻译|语气解释|难懂词|梗解释|直译参考|推荐回复|更随便一点|更礼貌一点|意思解释|图片内容|识别文字|翻译结果|备注";
  const nextSection = `\\n\\s*(?:【|\\[(?:${headingTitles})\\]|(?:${headingTitles})\\s*[:：])`;

  for (const title of titles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`(?:【${escaped}】|\\[${escaped}\\]|${escaped}\\s*[:：])\\s*([\\s\\S]*?)(?=${nextSection}|$)`, "i"),
      new RegExp(`${escaped}\\s*\\n+([\\s\\S]*?)(?=${nextSection}|$)`, "i")
    ];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match?.[1]?.trim()) return match[1].trim();
    }
  }
  return "";
}

function extractFirstReply(content: string) {
  const withoutHeading = content.replace(/^【[^】]+】\s*/m, "");
  return (
    withoutHeading
      .split("\n")
      .map((line) => line.replace(/^[-*\d.、\s]+/, "").trim())
      .find((line) => line && !line.startsWith("【") && !line.startsWith("[")) ?? ""
  );
}

export function selectReplyForCopy(content: string, format: AiReplyCopyFormat = "replyOnly") {
  const normalized = content.trim();
  if (!normalized) return "";
  if (format === "replyWithExplanation") return normalized;

  const sections = parseReplySections(normalized);
  return sections.recommended || extractFirstReply(normalized);
}

function splitBracketSections(content: string) {
  return Array.from(content.matchAll(/(?:^|\n)\s*【([^】]+)】\s*\n([\s\S]*?)(?=\n\s*【[^】]+】\s*\n|$)/g))
    .map((match) => ({
      title: match[1]?.trim() ?? "",
      content: match[2]?.trim() ?? ""
    }))
    .filter((section) => section.content);
}

function formatServiceResult(result: ServiceTranslateResult) {
  if (result.ok && result.content.trim()) {
    return `【${result.serviceName}】\n${result.content.trim()}`;
  }
  return `【${result.serviceName}】\n翻译失败：${result.error || "没有返回翻译结果"}`;
}

async function writeClipboardText(text: string) {
  const normalized = text.trim();
  if (!normalized) return false;

  if (isTauriRuntime()) {
    try {
      await invokeCommand("set_clipboard_text", { text: normalized });
      return true;
    } catch {
      await ignoreClipboardText(normalized);
    }
  } else {
    await ignoreClipboardText(normalized);
  }

  try {
    if (navigator.clipboard?.writeText && document.hasFocus()) {
      await navigator.clipboard.writeText(normalized);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = normalized;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

async function ignoreClipboardText(text: string) {
  if (!isTauriRuntime()) return;
  try {
    await invokeCommand("ignore_clipboard_text", { text });
  } catch {
    // Best-effort clipboard loop guard.
  }
}
