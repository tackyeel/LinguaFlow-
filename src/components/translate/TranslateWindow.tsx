import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { ArrowDown, ArrowUp, Copy, Eraser, Loader2, Pin, Repeat2, Sparkles, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Select, Switch, Toast } from "../ui/Material";
import { MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../constants/languages";
import { useConfigStore } from "../../stores/configStore";
import { runAiReply, runAiTranslate } from "../../utils/ai";
import { appendHistoryEntry } from "../../utils/history";
import { hideWindow, invokeCommand, isTauriRuntime, listenToTauriEvent, setAlwaysOnTop, switchTranslatorWindowMode } from "../../utils/tauri";
import { translateWithService, type ServiceTranslateResult } from "../../utils/translateServices";
import type { TranslateService } from "../../types/config";

interface ResultPanel {
  id: string;
  name: string;
  iconText: string;
  content: string;
  copyText?: string;
  error?: string;
  loading?: boolean;
  ai?: boolean;
  reply?: boolean;
}

const RESULT_ORDER_STORAGE_KEY = "linguaflow.translate.resultOrder";

export function TranslateWindow() {
  const { config, updateConfig } = useConfigStore();
  const settings = config.translationSettings;
  const [sourceText, setSourceText] = useState("");
  const [panels, setPanels] = useState<ResultPanel[]>([]);
  const [draggingId, setDraggingId] = useState("");
  const [toast, setToast] = useState("");
  const [running, setRunning] = useState(false);
  const [localResultOrder, setLocalResultOrder] = useState<string[]>(readStoredResultOrder);
  const requestIdRef = useRef(0);
  const ignoredClipboardTextRef = useRef("");

  const enabledServices = useMemo(
    () => config.services.translate.filter((service) => service.enabled),
    [config.services.translate]
  );
  const aiEnabled = settings.enableAiInTranslateWindow ?? true;
  const resultOrder = localResultOrder.length ? localResultOrder : settings.resultOrder ?? [];

  const displayedPanels = useMemo(() => {
    const resultById = new Map(panels.map((panel) => [panel.id, panel]));
    const basePanels = enabledServices.map((service) => {
      const id = service.provider || service.id;
      return resultById.get(id) ?? serviceToPanel(service);
    });

    if (aiEnabled) {
      basePanels.push(
        resultById.get("ai") ?? {
          id: "ai",
          name: "AI 专属翻译",
          iconText: "AI",
          content: "",
          ai: true
        }
      );
      if (config.aiSettings.enableAiReply) {
        basePanels.push(
          resultById.get("ai-reply") ?? {
            id: "ai-reply",
            name: "AI 代替回复",
            iconText: "回",
            content: "",
            ai: true,
            reply: true
          }
        );
      }
    }

    return sortPanels(basePanels, resultOrder);
  }, [aiEnabled, config.aiSettings.enableAiReply, enabledServices, panels, resultOrder]);

  useEffect(() => {
    void setAlwaysOnTop(settings.alwaysOnTop);
  }, [settings.alwaysOnTop]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listenToTauriEvent<string>("translate:set-text", (text) => {
      if (!text.trim()) return;
      if (text.trim() === ignoredClipboardTextRef.current) {
        ignoredClipboardTextRef.current = "";
        return;
      }
      setSourceText(text);
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const text = sourceText.trim();
    if (!text) {
      requestIdRef.current += 1;
      setPanels([]);
      setRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void performTranslate(text);
    }, 500);
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

  const updatePanel = (requestId: number, panel: ResultPanel) => {
    if (requestId !== requestIdRef.current) return;
    setPanels((current) => [...current.filter((item) => item.id !== panel.id), panel]);
  };

  const performTranslate = async (text: string) => {
    if (!text.trim()) {
      setToast("请输入要翻译的文本");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setRunning(true);

    const loadingPanels = enabledServices.map((service) => serviceToPanel(service, true));
    if (aiEnabled) {
      loadingPanels.push({ id: "ai", name: "AI 专属翻译", iconText: "AI", content: "", loading: true, ai: true });
      if (config.aiSettings.enableAiReply) {
        loadingPanels.push({
          id: "ai-reply",
          name: "AI 代替回复",
          iconText: "回",
          content: "",
          loading: true,
          ai: true,
          reply: true
        });
      }
    }
    setPanels(loadingPanels);

    const servicePromises = enabledServices.map(async (service) => {
      const result = await translateWithService({
        service,
        sourceText: text,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage
      });
      updatePanel(requestId, resultToPanel(result, service));
      if (result.ok && result.content.trim()) {
        void appendHistoryEntry({
          type: "translation",
          sourceText: text,
          resultText: result.content,
          sourceLanguage: settings.sourceLanguage,
          targetLanguage: settings.targetLanguage,
          serviceName: result.serviceName,
          isFavorite: false
        });
      }
    });

    const aiPromise = aiEnabled ? runAiJobs(requestId, text) : Promise.resolve();
    await Promise.allSettled([...servicePromises, aiPromise]);
    if (requestId === requestIdRef.current) setRunning(false);
  };

  const runAiJobs = async (requestId: number, text: string) => {
    const jobs: Promise<void>[] = [];

    jobs.push((async () => {
      const aiResult = await runAiTranslate({
        providerId: config.aiSettings.defaultServiceId,
        sourceText: text,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        scene: "translation"
      });
      const cleaned = formatAiTranslation(aiResult.content);
      updatePanel(requestId, {
        id: "ai",
        name: "AI 专属翻译",
        iconText: "AI",
        content: cleaned,
        ai: true
      });
      void appendHistoryEntry({
        type: "ai_translate",
        sourceText: text,
        resultText: cleaned,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        serviceName: aiResult.serviceName || "AI 专属翻译",
        isFavorite: false
      });
    })().catch((error) => {
      updatePanel(requestId, {
        id: "ai",
        name: "AI 专属翻译",
        iconText: "AI",
        content: "",
        error: error instanceof Error ? error.message : String(error),
        ai: true
      });
    }));

    if (config.aiSettings.enableAiReply) {
      jobs.push((async () => {
        const replyResult = await runAiReply({
          providerId: config.aiSettings.defaultServiceId,
          contextText: text,
          userIntent: text,
          targetLanguage: config.aiSettings.replyTargetLanguage,
          replyStyle: config.aiSettings.replyStyle,
          shortMode: config.aiSettings.shortMode
        });
        const replies = formatAiReplies(replyResult.content);
        const firstReply = extractFirstReply(replies);
        updatePanel(requestId, {
          id: "ai-reply",
          name: "AI 代替回复",
          iconText: "回",
          content: replies,
          copyText: firstReply || replies,
          ai: true,
          reply: true
        });
        void appendHistoryEntry({
          type: "ai_reply",
          sourceText: text,
          resultText: replies,
          sourceLanguage: settings.sourceLanguage,
          targetLanguage: config.aiSettings.replyTargetLanguage,
          serviceName: replyResult.serviceName || "AI 代替回复",
          isFavorite: false
        });
        let replyTranslation = "";
        if (firstReply) {
          try {
            const translatedReply = await runAiTranslate({
              providerId: config.aiSettings.defaultServiceId,
              sourceText: firstReply,
              sourceLanguage: config.aiSettings.replyTargetLanguage,
              targetLanguage: settings.sourceLanguage === "auto" ? "zh-CN" : settings.sourceLanguage,
              scene: "reply-translation"
            });
            replyTranslation = extractNaturalTranslation(translatedReply.content);
            if (replyTranslation) {
              updatePanel(requestId, {
                id: "ai-reply",
                name: "AI 代替回复",
                iconText: "回",
                content: `${replies}\n\n【回复翻译】\n${replyTranslation}`,
                copyText: firstReply,
                ai: true,
                reply: true
              });
            }
          } catch {
            replyTranslation = "";
          }
        }
        if (firstReply && (config.aiSettings.autoCopyAiReply || settings.autoCopyAiReply)) {
          ignoredClipboardTextRef.current = firstReply.trim();
          const copied = await writeClipboardText(firstReply);
          setToast(copied ? "已复制 AI 回复" : "AI 回复已生成，复制失败");
        }
      })().catch((error) => {
        updatePanel(requestId, {
          id: "ai-reply",
          name: "AI 代替回复",
          iconText: "回",
          content: "",
          error: error instanceof Error ? error.message : String(error),
          ai: true,
          reply: true
        });
      }));
    }

    await Promise.allSettled(jobs);
  };

  const clearAll = () => {
    requestIdRef.current += 1;
    setSourceText("");
    setPanels([]);
    setRunning(false);
  };

  const toggleAi = (checked: boolean) =>
    void updateConfig((draft) => {
      draft.translationSettings.enableAiInTranslateWindow = checked;
      if (!checked) {
        draft.translationSettings.resultOrder = (draft.translationSettings.resultOrder ?? []).filter(
          (id) => id !== "ai" && id !== "ai-reply"
        );
      }
    });

  const switchToDynamicIsland = async () => {
    await updateConfig((draft) => {
      draft.translatorWindowMode = "dynamicIsland";
    });
    await switchTranslatorWindowMode("dynamicIsland");
  };

  const movePanel = (sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;
    const ids = displayedPanels.map((panel) => panel.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    saveOrder(next);
  };

  const movePanelByStep = (id: string, step: -1 | 1) => {
    const ids = displayedPanels.map((panel) => panel.id);
    const from = ids.indexOf(id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    saveOrder(next);
  };

  const saveOrder = (order: string[]) => {
    setLocalResultOrder(order);
    writeStoredResultOrder(order);
    void updateConfig((draft) => {
      draft.translationSettings.resultOrder = order;
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-app text-text-primary">
      <div className="drag-region h-8 shrink-0 border-b border-border-subtle bg-app">
        <div className="no-drag absolute left-2 top-1.5 z-10">
          <button
            type="button"
            title="置顶"
            className={`grid h-7 w-7 place-items-center rounded-full border shadow-sm transition ${
              settings.alwaysOnTop ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-secondary hover:text-accent"
            }`}
            onClick={() =>
              void updateConfig((draft) => {
                draft.translationSettings.alwaysOnTop = !draft.translationSettings.alwaysOnTop;
              })
            }
          >
            <Pin size={14} />
          </button>
        </div>
        <div className="no-drag absolute left-10 top-1.5 z-10">
          <button
            type="button"
            title="切换"
            className="grid h-7 w-7 place-items-center rounded-full border border-border bg-surface text-text-secondary shadow-sm transition hover:text-accent"
            onClick={() => void switchToDynamicIsland()}
          >
            <Repeat2 size={14} />
          </button>
        </div>
        <div className="no-drag absolute right-2 top-1.5 z-10">
          <button
            type="button"
            title="关闭"
            className="grid h-7 w-7 place-items-center rounded-full text-text-secondary transition hover:bg-danger-soft hover:text-danger"
            onClick={() => void hideWindow("translate")}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <section className="shrink-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-sm">
          <div className="grid grid-cols-[1fr_22px_1fr] items-center gap-1.5">
            <Select
              className="h-8 rounded-md px-2 text-xs"
              value={settings.sourceLanguage}
              onChange={(event) =>
                void updateConfig((draft) => {
                  draft.translationSettings.sourceLanguage = event.target.value;
                })
              }
            >
              {MAINSTREAM_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </Select>
            <div className="text-center text-xs text-text-muted">⇄</div>
            <Select
              className="h-8 rounded-md px-2 text-xs"
              value={settings.targetLanguage}
              onChange={(event) =>
                void updateConfig((draft) => {
                  draft.translationSettings.targetLanguage = event.target.value;
                })
              }
            >
              {TARGET_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </Select>
          </div>
        </section>

        <section className="shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
          <textarea
            className="h-24 w-full resize-none bg-transparent px-4 py-4 text-base leading-7 text-text-primary outline-none placeholder:text-text-muted"
            placeholder="输入要翻译的文本..."
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-3 py-2.5">
            <label className="flex h-8 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text-secondary shadow-sm">
              AI
              <Switch checked={aiEnabled} onChange={toggleAi} />
            </label>
            <Button variant="secondary" size="sm" icon={<Eraser size={15} />} onClick={clearAll}>
              清空
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={running ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              disabled={running}
              onClick={() => void performTranslate(sourceText.trim())}
            >
              翻译
            </Button>
          </div>
        </section>

        <section className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {displayedPanels.length ? (
            displayedPanels.map((panel) => (
              <ResultCard
                key={panel.id}
                panel={panel}
                dragging={draggingId === panel.id}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", panel.id);
                  setDraggingId(panel.id);
                }}
                onDragEnd={() => setDraggingId("")}
                onDrop={(event) => {
                  event.preventDefault();
                  movePanel(event.dataTransfer.getData("text/plain") || draggingId, panel.id);
                  setDraggingId("");
                }}
                onMoveUp={() => movePanelByStep(panel.id, -1)}
                onMoveDown={() => movePanelByStep(panel.id, 1)}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-text-secondary">
              翻译结果会按服务显示在这里。
            </div>
          )}
        </section>
      </div>
      {toast ? <Toast tone="neutral">{toast}</Toast> : null}
    </div>
  );
}

function ResultCard({
  panel,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown
}: {
  panel: ResultPanel;
  dragging: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const content = panel.error || panel.content;
  const copyText = panel.copyText || content;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`rounded-lg border border-border-subtle bg-surface shadow-sm transition ${dragging ? "opacity-50" : ""}`}
    >
      <header className="flex cursor-move items-center gap-2 rounded-t-lg bg-surface-hover px-3 py-1.5">
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent-soft px-1 text-[11px] font-semibold text-accent">
          {panel.iconText}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{panel.name}</span>
        <button type="button" className="grid h-6 w-6 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-text-primary" title="上移" onClick={onMoveUp}>
          <ArrowUp size={14} />
        </button>
        <button type="button" className="grid h-6 w-6 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-text-primary" title="下移" onClick={onMoveDown}>
          <ArrowDown size={14} />
        </button>
      </header>
      <div className="px-3 py-3">
        {panel.loading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 className="animate-spin text-accent" size={16} />
            正在翻译...
          </div>
        ) : (
          <p className={`min-h-6 whitespace-pre-wrap text-sm leading-6 ${panel.error ? "text-danger" : "text-text-primary"}`}>
            {content || "等待输入..."}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-text-secondary">
          <button
            type="button"
            title="复制"
            className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-surface-hover hover:text-text-primary"
            onClick={() => void writeClipboardText(copyText)}
          >
            <Copy size={16} />
          </button>
          {panel.ai ? <span className="ml-auto rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent">AI</span> : null}
        </div>
      </div>
    </article>
  );
}

function serviceToPanel(service: TranslateService, loading = false): ResultPanel {
  return {
    id: service.provider || service.id,
    name: service.name,
    iconText: service.iconText,
    content: "",
    loading
  };
}

function resultToPanel(result: ServiceTranslateResult, service?: TranslateService): ResultPanel {
  return {
    id: result.serviceId,
    name: result.serviceName,
    iconText: service?.iconText ?? result.serviceName.slice(0, 2).toUpperCase(),
    content: result.content,
    error: result.error
  };
}

function sortPanels(panels: ResultPanel[], order: string[]) {
  return [...panels].sort((left, right) => {
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);
    if (leftIndex === -1 && rightIndex === -1) return 0;
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

function formatAiTranslation(content: string) {
  const natural = extractSection(content, ["自然翻译", "Natural translation", "推荐翻译"]);
  const tone = extractSection(content, ["语气解释", "Tone explanation"]);
  const reply = extractSection(content, ["代替回复", "AI 代替回复", "Reply"]);
  return [
    natural ? `【自然翻译】\n${natural}` : "",
    tone ? `\n【语气解释】\n${tone}` : "",
    reply && reply !== "无" ? `\n【代替回复】\n${reply}` : ""
  ].filter(Boolean).join("\n").trim() || content;
}

function extractNaturalTranslation(content: string) {
  return extractSection(content, ["自然翻译", "Natural translation", "推荐翻译"]) || content.trim();
}

function formatAiReplies(content: string) {
  const recommended = extractSection(content, ["推荐回复", "Recommended reply"]);
  const casual = extractSection(content, ["更随便一点", "More casual"]);
  const polite = extractSection(content, ["更礼貌一点", "More polite"]);
  const replies = [
    recommended ? `【推荐回复】\n${recommended}` : "",
    casual ? `\n【轻松回复】\n${casual}` : "",
    polite ? `\n【礼貌回复】\n${polite}` : ""
  ].filter(Boolean);
  if (replies.length >= 2) return replies.join("\n").trim();
  const fallbackLines = content
    .split("\n")
    .map((line) => line.replace(/^[-*\d.、\s]+/, "").trim())
    .filter((line) => line && !line.startsWith("【") && !line.startsWith("["));
  const first = recommended || fallbackLines[0] || content.trim();
  const second = casual || polite || fallbackLines.find((line) => line !== first) || first;
  return [`【推荐回复】\n${first}`, `\n【另一种回复】\n${second}`].join("\n").trim();
}

function extractSection(content: string, titles: string[]) {
  for (const title of titles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:【${escaped}】|\\[${escaped}\\])\\s*([\\s\\S]*?)(?=\\n\\s*(?:【|\\[)|$)`, "i");
    const match = content.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}

function extractFirstReply(content: string) {
  return content
    .replace(/^【[^】]+】\s*/m, "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("【")) ?? "";
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
    // Clipboard ignore is a loop guard; copying should still work if it fails.
  }
}

function readStoredResultOrder() {
  try {
    const raw = window.localStorage.getItem(RESULT_ORDER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredResultOrder(order: string[]) {
  try {
    window.localStorage.setItem(RESULT_ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Config persistence is the primary storage; localStorage is only an immediate fallback.
  }
}
