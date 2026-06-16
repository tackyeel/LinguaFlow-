import { useState } from "react";
import { Bot, Eye, Languages, Plus, Puzzle, RadioTower, TestTube2, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { AI_PROVIDER_PRESETS, MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../../constants/languages";
import { useConfigStore } from "../../../stores/configStore";
import type { AiService, OcrService, ReplyStyle, TranslateService } from "../../../types/config";
import { Button } from "../../ui/Button";
import { Field, Section, SelectInput, Switch, TextArea, TextInput } from "../../ui/Form";
import { PageHeader } from "./GeneralSettings";

type ServiceTab = "translate" | "ai" | "ocr";

const tabs: Array<{ id: ServiceTab; label: string; icon: typeof Languages }> = [
  { id: "translate", label: "翻译", icon: Languages },
  { id: "ai", label: "AI 翻译", icon: Bot },
  { id: "ocr", label: "文字识别", icon: Eye }
];

export function ServiceSettingsPage() {
  const [tab, setTab] = useState<ServiceTab>("translate");

  return (
    <>
      <PageHeader title="服务设置" description="翻译、AI 翻译和文字识别使用独立 Tab 管理。" />
      <div className="flex flex-wrap gap-2 rounded-lg border border-line/10 bg-panel p-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={clsx(
                "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition",
                tab === item.id ? "bg-primary text-black" : "text-muted hover:bg-panel2 hover:text-text"
              )}
              onClick={() => setTab(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
      {tab === "translate" && <TranslateServicesTab />}
      {tab === "ai" && <AiServicesTab />}
      {tab === "ocr" && <OcrServicesTab />}
    </>
  );
}

function TranslateServicesTab() {
  const { config, updateConfig } = useConfigStore();

  const addBuiltIn = () =>
    void updateConfig((draft) => {
      const id = `translate-${Date.now()}`;
      draft.services.translate.push({
        id,
        type: "built-in",
        name: "新增内置翻译",
        enabled: false,
        iconText: "N"
      });
    });

  return (
    <Section title="翻译服务" description="拖拽排序图标已预留；启用、改名、删除会真实保存。">
      <div className="flex flex-wrap gap-2">
        <Button icon={<Plus size={16} />} onClick={addBuiltIn}>
          添加内置服务
        </Button>
        <Button icon={<Puzzle size={16} />} variant="secondary">
          添加外置插件
        </Button>
        <Button icon={<TestTube2 size={16} />} variant="ghost">
          测试服务
        </Button>
      </div>
      <div className="grid gap-3">
        {config.services.translate.map((service, index) => (
          <TranslateServiceRow key={service.id} service={service} index={index} />
        ))}
      </div>
    </Section>
  );
}

function TranslateServiceRow({ service, index }: { service: TranslateService; index: number }) {
  const { updateConfig } = useConfigStore();

  return (
    <div className="grid gap-3 rounded-md border border-line/10 bg-panel2/50 p-3 md:grid-cols-[40px_44px_minmax(180px,1fr)_auto] md:items-center">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-app text-muted" title="TODO: 拖拽排序">
        : :
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 font-bold text-primary">
        {service.iconText}
      </div>
      <TextInput
        value={service.name}
        onChange={(event) =>
          void updateConfig((draft) => {
            draft.services.translate[index].name = event.target.value;
          })
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Switch
          checked={service.enabled}
          onChange={(checked) =>
            void updateConfig((draft) => {
              draft.services.translate[index].enabled = checked;
            })
          }
        />
        <Button variant="ghost" icon={<TestTube2 size={16} />} title="TODO: 测试服务" />
        <Button
          variant="danger"
          icon={<Trash2 size={16} />}
          title="删除"
          onClick={() =>
            void updateConfig((draft) => {
              draft.services.translate = draft.services.translate.filter((item) => item.id !== service.id);
            })
          }
        />
      </div>
    </div>
  );
}

function AiServicesTab() {
  const { config, updateConfig } = useConfigStore();
  const [selectedProvider, setSelectedProvider] = useState("DeepSeek");

  const addProvider = () =>
    void updateConfig((draft) => {
      const id = `ai-${Date.now()}`;
      draft.services.ai.push({
        id,
        provider: selectedProvider,
        name: selectedProvider,
        enabled: false,
        baseUrl: selectedProvider === "Ollama" ? "http://localhost:11434/v1" : "",
        apiKey: "",
        model: "",
        temperature: 0.4,
        maxTokens: 1600,
        useProxy: false,
        customHeaders: ""
      });
      draft.aiSettings.defaultServiceId = id;
    });

  return (
    <>
      <Section title="Provider Adapter" description="OpenAI-Compatible、Gemini、Anthropic、Custom 四类适配器预留在后端结构中。">
        <Field label="添加供应商">
          <div className="flex flex-wrap justify-end gap-2">
            <SelectInput value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)}>
              {AI_PROVIDER_PRESETS.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </SelectInput>
            <Button icon={<Plus size={16} />} onClick={addProvider}>
              添加
            </Button>
          </div>
        </Field>
        <Field label="默认 AI 服务">
          <SelectInput
            value={config.aiSettings.defaultServiceId}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.aiSettings.defaultServiceId = event.target.value;
              })
            }
          >
            {config.services.ai.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </SelectInput>
        </Field>
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
        <Field label="short mode">
          <Switch
            checked={config.aiSettings.shortMode}
            onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.shortMode = checked))}
          />
        </Field>
        <Field label="启用 AI 代回">
          <Switch
            checked={config.aiSettings.enableAiReply}
            onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.enableAiReply = checked))}
          />
        </Field>
        <Field label="自动复制 AI 回复">
          <Switch
            checked={config.aiSettings.autoCopyAiReply}
            onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.autoCopyAiReply = checked))}
          />
        </Field>
      </Section>

      <Section title="AI 供应商">
        <div className="grid gap-4">
          {config.services.ai.map((service, index) => (
            <AiServicePanel key={service.id} service={service} index={index} />
          ))}
        </div>
      </Section>

      <Section title="提示词编辑器" description="默认 AI 翻译提示词和 AI 代回提示词可直接编辑并保存。">
        <Field label="AI 翻译提示词" alignTop>
          <TextArea
            className="min-h-72 font-mono text-xs"
            value={config.aiSettings.translationPrompt}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.aiSettings.translationPrompt = event.target.value;
              })
            }
          />
        </Field>
        <Field label="AI 代回提示词" alignTop>
          <TextArea
            className="min-h-72 font-mono text-xs"
            value={config.aiSettings.replyPrompt}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.aiSettings.replyPrompt = event.target.value;
              })
            }
          />
        </Field>
      </Section>
    </>
  );
}

function AiServicePanel({ service, index }: { service: AiService; index: number }) {
  const { updateConfig } = useConfigStore();

  return (
    <div className="rounded-md border border-line/10 bg-panel2/50 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 font-bold text-primary">
          {service.provider.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <TextInput
            value={service.name}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.services.ai[index].name = event.target.value;
              })
            }
          />
        </div>
        <Switch
          checked={service.enabled}
          onChange={(checked) =>
            void updateConfig((draft) => {
              draft.services.ai[index].enabled = checked;
            })
          }
        />
        <Button icon={<TestTube2 size={16} />} variant="ghost" title="TODO: 测试连接" />
        <Button
          variant="danger"
          icon={<Trash2 size={16} />}
          title="删除"
          onClick={() =>
            void updateConfig((draft) => {
              draft.services.ai = draft.services.ai.filter((item) => item.id !== service.id);
            })
          }
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput
          value={service.provider}
          placeholder="Provider"
          onChange={(event) =>
            void updateConfig((draft) => {
              draft.services.ai[index].provider = event.target.value;
            })
          }
        />
        <TextInput
          value={service.baseUrl}
          placeholder="Base URL"
          onChange={(event) =>
            void updateConfig((draft) => {
              draft.services.ai[index].baseUrl = event.target.value;
            })
          }
        />
        <TextInput
          value={service.apiKey}
          type="password"
          placeholder="API Key"
          onChange={(event) =>
            void updateConfig((draft) => {
              draft.services.ai[index].apiKey = event.target.value;
            })
          }
        />
        <TextInput
          value={service.model}
          placeholder="Model Name"
          onChange={(event) =>
            void updateConfig((draft) => {
              draft.services.ai[index].model = event.target.value;
            })
          }
        />
        <TextInput
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={service.temperature}
          placeholder="Temperature"
          onChange={(event) =>
            void updateConfig((draft) => {
              draft.services.ai[index].temperature = Number(event.target.value);
            })
          }
        />
        <TextInput
          type="number"
          min="1"
          value={service.maxTokens}
          placeholder="Max Tokens"
          onChange={(event) =>
            void updateConfig((draft) => {
              draft.services.ai[index].maxTokens = Number(event.target.value);
            })
          }
        />
      </div>
      <div className="mt-3 grid gap-3">
        <Field label="是否启用代理">
          <Switch
            checked={service.useProxy}
            onChange={(checked) =>
              void updateConfig((draft) => {
                draft.services.ai[index].useProxy = checked;
              })
            }
          />
        </Field>
        <Field label="customHeaders" alignTop>
          <TextArea
            className="min-h-20 font-mono text-xs"
            value={service.customHeaders}
            placeholder='{"X-Provider": "LinguaFlow"}'
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.services.ai[index].customHeaders = event.target.value;
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}

function OcrServicesTab() {
  const { config, updateConfig } = useConfigStore();

  const addOcrService = () =>
    void updateConfig((draft) => {
      draft.services.ocr.push({
        id: `ocr-${Date.now()}`,
        type: "plugin",
        name: "新增 OCR 服务",
        enabled: false,
        iconText: "N"
      });
    });

  return (
    <>
      <Section title="OCR 服务">
        <Button icon={<Plus size={16} />} onClick={addOcrService}>
          添加 OCR 服务
        </Button>
        <div className="grid gap-3">
          {config.services.ocr.map((service, index) => (
            <OcrServiceRow key={service.id} service={service} index={index} />
          ))}
        </div>
      </Section>

      <Section title="OCR 功能设置">
        <Field label="默认 OCR 引擎">
          <SelectInput
            value={config.ocrSettings.defaultEngine}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.ocrSettings.defaultEngine = event.target.value;
              })
            }
          >
            {config.services.ocr.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="识别语言">
          <SelectInput
            value={config.ocrSettings.language}
            onChange={(event) =>
              void updateConfig((draft) => {
                draft.ocrSettings.language = event.target.value;
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
        <Field label="自动检测语言">
          <Switch
            checked={config.ocrSettings.autoDetectLanguage}
            onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.autoDetectLanguage = checked))}
          />
        </Field>
        <Field label="OCR 后自动复制">
          <Switch
            checked={config.ocrSettings.copyAfterOcr}
            onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.copyAfterOcr = checked))}
          />
        </Field>
        <Field label="OCR 后自动翻译">
          <Switch
            checked={config.ocrSettings.translateAfterOcr}
            onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.translateAfterOcr = checked))}
          />
        </Field>
        <Field label="OCR 失败后切换备用服务">
          <Switch
            checked={config.ocrSettings.fallbackOnFailure}
            onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.fallbackOnFailure = checked))}
          />
        </Field>
      </Section>
    </>
  );
}

function OcrServiceRow({ service, index }: { service: OcrService; index: number }) {
  const { updateConfig } = useConfigStore();

  return (
    <div className="grid gap-3 rounded-md border border-line/10 bg-panel2/50 p-3 md:grid-cols-[40px_44px_minmax(180px,1fr)_auto] md:items-center">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-app text-muted" title="TODO: 拖拽排序">
        : :
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 font-bold text-primary">
        {service.iconText}
      </div>
      <TextInput
        value={service.name}
        onChange={(event) =>
          void updateConfig((draft) => {
            draft.services.ocr[index].name = event.target.value;
          })
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Switch
          checked={service.enabled}
          onChange={(checked) =>
            void updateConfig((draft) => {
              draft.services.ocr[index].enabled = checked;
            })
          }
        />
        <Button variant="ghost" icon={<TestTube2 size={16} />} title="TODO: 测试 OCR" />
        <Button
          variant="danger"
          icon={<Trash2 size={16} />}
          title="删除"
          onClick={() =>
            void updateConfig((draft) => {
              draft.services.ocr = draft.services.ocr.filter((item) => item.id !== service.id);
            })
          }
        />
      </div>
    </div>
  );
}
