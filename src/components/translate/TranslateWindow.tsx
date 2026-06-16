import { useEffect, useMemo, useState } from "react";
import { Clipboard, Eraser, Languages, Pin, Settings, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Field, SelectInput, TextArea } from "../ui/Form";
import { WindowFrame } from "../ui/WindowFrame";
import { MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../constants/languages";
import { useConfigStore } from "../../stores/configStore";
import { setAlwaysOnTop, showWindow } from "../../utils/tauri";

export function TranslateWindow() {
  const { config, updateConfig } = useConfigStore();
  const [sourceText, setSourceText] = useState("");
  const [result, setResult] = useState("");
  const settings = config.translationSettings;

  const languageTitle = useMemo(() => {
    const source = MAINSTREAM_LANGUAGES.find((item) => item.code === settings.sourceLanguage)?.label ?? "自动检测";
    const target = MAINSTREAM_LANGUAGES.find((item) => item.code === settings.targetLanguage)?.label ?? "中文";
    return `${source} -> ${target}`;
  }, [settings.sourceLanguage, settings.targetLanguage]);

  useEffect(() => {
    void setAlwaysOnTop(settings.alwaysOnTop);
  }, [settings.alwaysOnTop]);

  const runTranslate = () => {
    const cleanText = sourceText.trim();
    if (!cleanText) {
      setResult("");
      return;
    }

    setResult(`【自然翻译】\nTODO: 接入真实翻译服务。\n\n【语气解释】\n当前窗口、输入区、结果区和按钮逻辑已可用。\n\n【直译参考】\n${cleanText}`);
  };

  return (
    <WindowFrame
      title="翻译窗口"
      subtitle={languageTitle}
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
        <div className="grid gap-3 rounded-lg border border-line/10 bg-panel p-3 md:grid-cols-2">
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
        <div className="grid min-h-0 gap-3 md:grid-cols-2">
          <TextArea
            className="h-full resize-none"
            placeholder="输入要翻译的文本"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
          />
          <pre className="min-h-0 overflow-auto whitespace-pre-wrap rounded-lg border border-line/10 bg-panel p-3 text-sm leading-6 text-text">
            {result || "翻译结果会显示在这里"}
          </pre>
        </div>
        <footer className="flex flex-wrap justify-end gap-2 rounded-lg border border-line/10 bg-panel p-3">
          <Button variant="primary" icon={<Languages size={16} />} onClick={runTranslate}>
            翻译
          </Button>
          <Button icon={<Sparkles size={16} />} onClick={runTranslate}>
            AI 解释
          </Button>
          <Button icon={<Sparkles size={16} />} onClick={runTranslate}>
            帮我回复
          </Button>
          <Button icon={<Clipboard size={16} />} onClick={() => void navigator.clipboard?.writeText(result)}>
            复制结果
          </Button>
          <Button
            variant="ghost"
            icon={<Eraser size={16} />}
            onClick={() => {
              setSourceText("");
              setResult("");
            }}
          >
            清空
          </Button>
        </footer>
      </div>
    </WindowFrame>
  );
}
