import { ArrowLeftRight, Image, Languages, MessageSquareReply, ScanText, Settings2 } from "lucide-react";
import { MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../../constants/languages";
import { useConfigStore } from "../../../stores/configStore";
import type { AiReplyCopyFormat, LanguageDetectEngine } from "../../../types/config";
import { Button } from "../../ui/Button";
import { PageHeader, SectionCard, Select, SettingRow, Switch } from "../../ui/Material";

export function TranslationSettingsPage() {
  const { config, updateConfig } = useConfigStore();
  const settings = config.translationSettings;

  return (
    <>
      <PageHeader
        title="翻译设置"
        description="管理默认语言、文本处理、弹窗行为和 AI 回复偏好。"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <SectionCard title="语言默认值" icon={<Languages size={18} />} className="lg:col-span-1">
          <div className="grid gap-5 px-6 py-6 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <label className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">源语言</span>
              <Select
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
            </label>
            <Button
              variant="secondary"
              size="icon"
              title="交换语言"
              icon={<ArrowLeftRight size={17} />}
              onClick={() =>
                void updateConfig((draft) => {
                  const source = draft.translationSettings.sourceLanguage;
                  if (source === "auto") return;
                  draft.translationSettings.sourceLanguage = draft.translationSettings.targetLanguage;
                  draft.translationSettings.targetLanguage = source;
                })
              }
            />
            <label className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">目标语言</span>
              <Select
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
            </label>
          </div>
        </SectionCard>

        <SectionCard title="检测" icon={<ScanText size={18} />}>
          <SettingRow title="语种检测引擎">
            <Select
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
            </Select>
          </SettingRow>
          <SettingRow title="短文本优先使用 AI 判断">
            <Switch
              checked={settings.aiForShortText}
              onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.aiForShortText = checked))}
            />
          </SettingRow>
        </SectionCard>

        <SectionCard title="文本处理" icon={<Settings2 size={18} />}>
          <SettingRow title="自动删除换行">
            <Switch
              checked={settings.removeLineBreaks}
              onChange={(checked) =>
                void updateConfig((draft) => void (draft.translationSettings.removeLineBreaks = checked))
              }
            />
          </SettingRow>
          <SettingRow title="自动清理多余空格">
            <Switch checked={settings.trimSpaces} onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.trimSpaces = checked))} />
          </SettingRow>
          <SettingRow title="保留表情符号">
            <Switch checked={settings.keepEmoji} onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.keepEmoji = checked))} />
          </SettingRow>
          <SettingRow title="保留原文大小写">
            <Switch
              checked={settings.keepSourceCase}
              onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.keepSourceCase = checked))}
            />
          </SettingRow>
        </SectionCard>

        <SectionCard title="翻译窗口" icon={<Image size={18} />}>
          <SettingRow title="记住翻译窗口大小">
            <Switch
              checked={settings.rememberWindowSize}
              onChange={(checked) =>
                void updateConfig((draft) => void (draft.translationSettings.rememberWindowSize = checked))
              }
            />
          </SettingRow>
          <SettingRow title="窗口默认置顶">
            <Switch checked={settings.alwaysOnTop} onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.alwaysOnTop = checked))} />
          </SettingRow>
          <SettingRow title="失去焦点自动隐藏">
            <Switch
              checked={settings.autoHideOnBlur}
              onChange={(checked) => void updateConfig((draft) => void (draft.translationSettings.autoHideOnBlur = checked))}
            />
          </SettingRow>
          <SettingRow title="翻译完成后聚焦结果">
            <Switch
              checked={settings.focusResultAfterTranslate}
              onChange={(checked) =>
                void updateConfig((draft) => void (draft.translationSettings.focusResultAfterTranslate = checked))
              }
            />
          </SettingRow>
        </SectionCard>

        <SectionCard title="AI 回复" icon={<MessageSquareReply size={18} />} className="lg:col-span-2">
          <SettingRow title="自动复制 AI 回复" description="仅复制【推荐回复】正文，不复制标题。">
            <Switch
              checked={settings.autoCopyAiReply}
              onChange={(checked) =>
                void updateConfig((draft) => void (draft.translationSettings.autoCopyAiReply = checked))
              }
            />
          </SettingRow>
          <SettingRow title="复制内容格式">
            <Select
              value={settings.aiReplyCopyFormat}
              onChange={(event) =>
                void updateConfig((draft) => {
                  draft.translationSettings.aiReplyCopyFormat = event.target.value as AiReplyCopyFormat;
                })
              }
            >
              <option value="replyOnly">仅回复正文</option>
              <option value="replyWithExplanation">回复正文 + 解释</option>
            </Select>
          </SettingRow>
        </SectionCard>
      </div>
    </>
  );
}
