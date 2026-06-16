import { ArrowLeftRight } from "lucide-react";
import { MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../../constants/languages";
import { useConfigStore } from "../../../stores/configStore";
import type { AiReplyCopyFormat, LanguageDetectEngine } from "../../../types/config";
import { Button } from "../../ui/Button";
import { Field, Section, SelectInput, Switch } from "../../ui/Form";
import { PageHeader } from "./GeneralSettings";

export function TranslationSettingsPage() {
  const { config, updateConfig } = useConfigStore();
  const settings = config.translationSettings;

  return (
    <>
      <PageHeader title="翻译设置" description="语言、检测、文本处理和翻译弹窗行为会保存为 language code。" />
      <Section title="语言">
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
        <Field label="交换语言">
          <Button
            icon={<ArrowLeftRight size={16} />}
            onClick={() =>
              void updateConfig((draft) => {
                const source = draft.translationSettings.sourceLanguage;
                if (source === "auto") return;
                draft.translationSettings.sourceLanguage = draft.translationSettings.targetLanguage;
                draft.translationSettings.targetLanguage = source;
              })
            }
          >
            交换
          </Button>
        </Field>
      </Section>

      <Section title="检测">
        <Field label="语种检测引擎">
          <SelectInput
            value={settings.languageDetectEngine}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.translationSettings.languageDetectEngine = event.target.value as LanguageDetectEngine;
              })
            }
          >
            <option value="local">本地检测</option>
            <option value="service">翻译服务检测</option>
            <option value="ai">AI 检测</option>
          </SelectInput>
        </Field>
        <Field label="短文本优先使用 AI 判断">
          <Switch
            checked={settings.aiForShortText}
            onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.aiForShortText = checked))}
          />
        </Field>
      </Section>

      <Section title="文本处理">
        <Field label="自动删除换行">
          <Switch
            checked={settings.removeLineBreaks}
            onChange={(checked) =>
              void updateConfig((draft) => void (draft.translationSettings.removeLineBreaks = checked))
            }
          />
        </Field>
        <Field label="自动清理多余空格">
          <Switch
            checked={settings.trimSpaces}
            onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.trimSpaces = checked))}
          />
        </Field>
        <Field label="保留表情符号">
          <Switch
            checked={settings.keepEmoji}
            onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.keepEmoji = checked))}
          />
        </Field>
        <Field label="保留原文大小写">
          <Switch
            checked={settings.keepSourceCase}
            onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.keepSourceCase = checked))}
          />
        </Field>
      </Section>

      <Section title="翻译窗口">
        <Field label="记住翻译窗口大小">
          <Switch
            checked={settings.rememberWindowSize}
            onChange={(checked) =>
              void updateConfig((draft) => void (draft.translationSettings.rememberWindowSize = checked))
            }
          />
        </Field>
        <Field label="窗口默认置顶">
          <Switch
            checked={settings.alwaysOnTop}
            onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.alwaysOnTop = checked))}
          />
        </Field>
        <Field label="失去焦点自动隐藏">
          <Switch
            checked={settings.autoHideOnBlur}
            onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.autoHideOnBlur = checked))}
          />
        </Field>
        <Field label="翻译完成后自动聚焦结果">
          <Switch
            checked={settings.focusResultAfterTranslate}
            onChange={(checked) =>
              void updateConfig((draft) => void (draft.translationSettings.focusResultAfterTranslate = checked))
            }
          />
        </Field>
      </Section>

      <Section title="AI 回复">
        <Field label="自动复制 AI 回复">
          <Switch
            checked={settings.autoCopyAiReply}
            onChange={(checked) =>
              void updateConfig((draft) => void (draft.translationSettings.autoCopyAiReply = checked))
            }
          />
        </Field>
        <Field label="复制内容格式">
          <SelectInput
            value={settings.aiReplyCopyFormat}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.translationSettings.aiReplyCopyFormat = event.target.value as AiReplyCopyFormat;
              })
            }
          >
            <option value="replyOnly">仅回复正文</option>
            <option value="replyWithExplanation">回复正文 + 解释</option>
          </SelectInput>
        </Field>
      </Section>
    </>
  );
}
