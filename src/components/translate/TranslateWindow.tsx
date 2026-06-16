import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clipboard, Eraser, Languages, Loader2, MessageSquareReply, Pin, Settings, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "../ui/Button";
import { Field, SelectInput, Switch, TextArea } from "../ui/Form";
import { WindowFrame } from "../ui/WindowFrame";
import { MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../constants/languages";
import { useConfigStore } from "../../stores/configStore";
import { runAiReply, runAiTranslate } from "../../utils/ai";
import { setAlwaysOnTop, showWindow } from "../../utils/tauri";
import type { ReplyStyle } from "../../types/config";

type TranslateMode = "translate" | "explain" | "reply";

const modes: Array<{ id: TranslateMode; label: string; icon: typeof Languages }> = [
  { id: "translate", label: "翻译", icon: Languages },
  { id: "explain", label: "AI 解释", icon: Sparkles },
  { id: "reply", label: "帮我回复", icon: MessageSquareReply }
];

export function TranslateWindow() {
  const { config, updateConfig } = useConfigStore();
  const [mode, setMode] = useState<TranslateMode>("explain");
  const [sourceText, setSourceText] = useState("");
  const [contextText, setContextText] = useState("");
  const [userIntent, setUserIntent] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const settings = config.translationSettings;

  const languageTitle = useMemo(() => {
    const source = MAINSTREAM_LANGUAGES.find((item) => item.code === settings.sourceLanguage)?.label ?? "自动检测";
    const target = MAINSTREAM_LANGUAGES.find((item) => item.code === settings.targetLanguage)?.label ?? "中文";
    return `${source} -> ${target}`;
  }, [settings.sourceLanguage, settings.targetLanguage]);

  useEffect(() => {
    void setAlwaysOnTop(settings.alwaysOnTop);
  }, [settings.alwaysOnTop]);

  const runTranslate = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await runAiTranslate({
        providerId: config.aiSettings.defaultServiceId,
        sourceText,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        scene: mode === "translate" ? "translation" : "chat-explanation"
      });
      setResult(response.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  };

  const runReply = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await runAiReply({
        providerId: config.aiSettings.defaultServiceId,
        contextText,
        userIntent,
        targetLanguage: config.aiSettings.replyTargetLanguage,
        replyStyle: config.aiSettings.replyStyle,
        shortMode: config.aiSettings.shortMode
      });
      setResult(response.content);

      if (config.aiSettings.autoCopyAiReply || settings.autoCopyAiReply) {
        const recommended = extractRecommendedReply(response.content);
        if (recommended) {
          await navigator.clipboard?.writeText(recommended);
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  };

  const runCurrentMode = () => {
    if (mode === "reply") return void runReply();
    return void runTranslate();
  };

  return (
    <WindowFrame
      title="翻译窗口"
      subtitle={mode === "reply" ? "AI 代替回复" : languageTitle}
      actions={
        <>
          <Button
            variant={settings.alwaysOnTop ? "primary" : "ghost"}
            icon={<Pin size={16} />}
            title="置顶"
            onClick={() =>
              void updateConfig((draft) => {
                draft.translationSettings.alwaysOnTop = !draft.translationSettings.alwaysOnTop;
              })
            }
          />
          <Button variant="ghost" icon={<Settings size={16} />} title="设置" onClick={() => void showWindow("settings")} />
        </>
      }
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-4">
        <div className="grid gap-3 rounded-lg border border-line/10 bg-panel p-3">
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={clsx(
                    "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition",
                    mode === item.id ? "bg-primary text-black" : "bg-panel2 text-muted hover:text-text"
                  )}
                  onClick={() => {
                    setMode(item.id);
                    setError("");
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {mode === "reply" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="回复目标语言">
                <SelectInput
                  value={config.aiSettings.replyTargetLanguage}
                  onChange={(event) =>
                    void updateConfig((draft) => {
                      draft.aiSettings.replyTargetLanguage = event.target.value;
                    })
                  }
                >
                  {TARGET_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="回复风格">
                <SelectInput
                  value={config.aiSettings.replyStyle}
                  onChange={(event) =>
                    void updateConfig((draft) => {
                      draft.aiSettings.replyStyle = event.target.value as ReplyStyle;
                    })
                  }
                >
                  <option value="natural">自然</option>
                  <option value="friendly">友好</option>
                  <option value="casual">随便</option>
                  <option value="polite">礼貌</option>
                  <option value="playful">吐槽</option>
                </SelectInput>
              </Field>
              <Field label="简短模式">
                <Switch
                  checked={config.aiSettings.shortMode}
                  onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.shortMode = checked))}
                />
              </Field>
              <Field label="自动复制推荐回复">
                <Switch
                  checked={config.aiSettings.autoCopyAiReply}
                  onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.autoCopyAiReply = checked))}
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="源语言">
                <SelectInput
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
                </SelectInput>
              </Field>
              <Field label="目标语言">
                <SelectInput
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
                </SelectInput>
              </Field>
            </div>
          )}
        </div>

        <div className="grid min-h-0 gap-3 md:grid-cols-2">
          {mode === "reply" ? (
            <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <TextArea
                className="h-full resize-none"
                placeholder="对方原文，可选"
                value={contextText}
                onChange={(event) => setContextText(event.target.value)}
              />
              <TextArea
                className="h-full resize-none"
                placeholder="我想表达的意思"
                value={userIntent}
                onChange={(event) => setUserIntent(event.target.value)}
              />
            </div>
          ) : (
            <TextArea
              className="h-full resize-none"
              placeholder={mode === "translate" ? "输入要翻译的文本" : "输入要翻译并解释语气的聊天文本"}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
            />
          )}
          <div className="min-h-0 overflow-auto rounded-lg border border-line/10 bg-panel p-3">
            {error ? (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm leading-6 text-danger">
                <AlertCircle size={16} className="mt-1 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            <pre className="whitespace-pre-wrap text-sm leading-6 text-text">
              {loading ? "AI 正在请求中..." : result || resultPlaceholder(mode)}
            </pre>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 rounded-lg border border-line/10 bg-panel p-3">
          <Button
            variant="primary"
            icon={loading ? <Loader2 className="animate-spin" size={16} /> : mode === "reply" ? <MessageSquareReply size={16} /> : <Sparkles size={16} />}
            disabled={loading}
            onClick={runCurrentMode}
          >
            {mode === "reply" ? "帮我回复" : mode === "explain" ? "AI 解释" : "翻译"}
          </Button>
          <Button icon={<Clipboard size={16} />} onClick={() => void navigator.clipboard?.writeText(result)} disabled={!result}>
            复制结果
          </Button>
          <Button
            variant="ghost"
            icon={<Eraser size={16} />}
            onClick={() => {
              setSourceText("");
              setContextText("");
              setUserIntent("");
              setResult("");
              setError("");
            }}
          >
            清空
          </Button>
        </footer>
      </div>
    </WindowFrame>
  );
}

function resultPlaceholder(mode: TranslateMode) {
  if (mode === "reply") {
    return "AI 代回结果会显示在这里：\n【推荐回复】\n...\n\n【更随便一点】\n...\n\n【更礼貌一点】\n...\n\n【意思解释】\n...";
  }
  return "AI 翻译结果会显示在这里：\n【自然翻译】\n...\n\n【语气解释】\n...\n\n【难懂词/梗解释】\n...\n\n【直译参考】\n...";
}

function extractRecommendedReply(content: string) {
  const match = content.match(/【推荐回复】\s*([\s\S]*?)(?=\n?【|$)/);
  return match?.[1]?.trim() ?? "";
}
