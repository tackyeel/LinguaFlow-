import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bot, CheckCircle2, ChevronDown, ChevronRight, Eye, Languages, Plus, Puzzle, TestTube2, Trash2, Upload, X } from "lucide-react";
import { AI_PROVIDER_PRESETS, MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../../constants/languages";
import { useConfigStore } from "../../../stores/configStore";
import type { AiProviderType, AiService, OcrService, ReplyStyle, TranslateService } from "../../../types/config";
import { testAiProvider } from "../../../utils/ai";
import { cn } from "../../../utils/cn";
import { Button } from "../../ui/Button";
import {
  EmptyState,
  PageHeader,
  PasswordInput,
  PromptEditor,
  SectionCard,
  SegmentedControl,
  Select,
  ServiceListItem,
  SettingRow,
  Switch,
  TextInput,
  Textarea
} from "../../ui/Material";

type ServiceTab = "translate" | "ai" | "ocr";

interface ServicePreset {
  id: string;
  name: string;
  provider: string;
  iconText: string;
  description: string;
  config: Record<string, string>;
}

const tabs: Array<{ value: ServiceTab; label: string }> = [
  { value: "translate", label: "翻译" },
  { value: "ai", label: "AI 翻译" },
  { value: "ocr", label: "OCR" }
];

const builtInTranslateServices: ServicePreset[] = [
  { id: "google", name: "谷歌翻译", provider: "google", iconText: "G", description: "免配置通用翻译服务。", config: { endpoint: "https://translate.googleapis.com" } },
  { id: "bing", name: "必应翻译", provider: "bing", iconText: "B", description: "免配置通用翻译服务。", config: { endpoint: "https://api-edge.cognitive.microsofttranslator.com" } },
  { id: "lingva", name: "Lingva", provider: "lingva", iconText: "L", description: "可自定义 Lingva 实例地址。", config: { endpoint: "https://lingva.ml" } },
  { id: "deepl", name: "DeepL", provider: "deepl", iconText: "D", description: "DeepL API 翻译。", config: { endpoint: "https://api-free.deepl.com/v2/translate", apiKey: "" } },
  { id: "youdao", name: "有道翻译", provider: "youdao", iconText: "有", description: "有道智云翻译。", config: { appKey: "", appSecret: "" } },
  { id: "baidu", name: "百度翻译", provider: "baidu", iconText: "百", description: "百度通用翻译 API。", config: { appId: "", appKey: "" } },
  { id: "alibaba", name: "阿里翻译", provider: "alibaba", iconText: "阿", description: "阿里云机器翻译。", config: { accessKeyId: "", accessKeySecret: "", region: "cn-hangzhou" } },
  { id: "tencent", name: "腾讯翻译君", provider: "tencent", iconText: "腾", description: "腾讯云机器翻译。", config: { secretId: "", secretKey: "", region: "ap-guangzhou" } },
  { id: "caiyun", name: "彩云小译", provider: "caiyun", iconText: "彩", description: "彩云小译 API。", config: { token: "" } },
  { id: "volcengine", name: "火山翻译", provider: "volcengine", iconText: "火", description: "火山引擎机器翻译。", config: { accessKeyId: "", secretAccessKey: "", region: "cn-north-1" } },
  { id: "niutrans", name: "小牛翻译", provider: "niutrans", iconText: "牛", description: "小牛翻译 API。", config: { apiKey: "" } },
  { id: "yandex", name: "Yandex", provider: "yandex", iconText: "Y", description: "Yandex Translate API。", config: { apiKey: "" } }
];

export function ServiceSettingsPage() {
  const [tab, setTab] = useState<ServiceTab>("translate");

  return (
    <>
      <PageHeader title="服务设置" description="管理翻译、AI Provider 和文字识别服务。" />
      <div className="mb-7 flex justify-center">
        <SegmentedControl value={tab} onChange={setTab} options={tabs} />
      </div>
      {tab === "translate" && <TranslateServicesTab />}
      {tab === "ai" && <AiServicesTab />}
      {tab === "ocr" && <OcrServicesTab />}
    </>
  );
}

function TranslateServicesTab() {
  const { config, updateConfig } = useConfigStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const pluginInputRef = useRef<HTMLInputElement | null>(null);
  const installedProviders = new Set(config.services.translate.map((service) => service.provider || service.id));

  const addBuiltIn = (preset: ServicePreset) =>
    void updateConfig((draft) => {
      if (draft.services.translate.some((service) => (service.provider || service.id) === preset.provider)) return;
      draft.services.translate.push({
        id: `${preset.provider}-${Date.now()}`,
        type: "built-in",
        name: preset.name,
        enabled: true,
        iconText: preset.iconText,
        provider: preset.provider,
        description: preset.description,
        config: preset.config
      });
    }).then(() => {
      setPickerOpen(false);
      setMessage(`${preset.name} 已添加`);
    });

  const installPlugin = async (file: File) => {
    const raw = await file.text().catch(() => "");
    const manifest = parsePluginManifest(raw);
    const name = manifest.name || manifest.title || file.name.replace(/\.(potext|json)$/i, "");
    const provider = manifest.id || manifest.provider || `plugin-${Date.now()}`;
    await updateConfig((draft) => {
      draft.services.translate.push({
        id: `${provider}-${Date.now()}`,
        type: "plugin",
        name,
        enabled: true,
        iconText: manifest.iconText || "P",
        provider,
        pluginPath: file.name,
        description: manifest.description || "外置插件服务。",
        config: manifest
      });
    });
    setMessage(`${name} 插件已安装`);
  };

  return (
    <>
      <SectionCard title="翻译服务" description="从内置服务列表选择，也可以安装外置插件文件。" icon={<Languages size={18} />}>
        <div className="flex flex-wrap gap-2 border-b border-border-subtle px-6 py-4">
          <Button icon={<Plus size={16} />} onClick={() => setPickerOpen(true)}>添加内置服务</Button>
          <Button icon={<Puzzle size={16} />} variant="secondary" onClick={() => pluginInputRef.current?.click()}>添加外置插件</Button>
          <input
            ref={pluginInputRef}
            className="hidden"
            type="file"
            accept=".potext,.json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) void installPlugin(file);
            }}
          />
        </div>
        {message ? <div className="border-b border-border-subtle bg-success-soft px-6 py-3 text-sm font-medium text-success">{message}</div> : null}
        {config.services.translate.length ? (
          config.services.translate.map((service, index) => <TranslateServiceRow key={service.id} service={service} index={index} />)
        ) : (
          <EmptyState title="还没有翻译服务" description="添加一个内置服务或外置插件后会显示在这里。" />
        )}
      </SectionCard>

      {pickerOpen ? <ServicePicker installedProviders={installedProviders} onClose={() => setPickerOpen(false)} onAdd={addBuiltIn} /> : null}
    </>
  );
}

function ServicePicker({ installedProviders, onClose, onAdd }: { installedProviders: Set<string>; onClose: () => void; onAdd: (preset: ServicePreset) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <div className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-lg bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
          <h3 className="text-lg font-semibold text-text-primary">添加服务</h3>
          <Button size="icon" variant="ghost" icon={<X size={18} />} title="关闭" onClick={onClose} />
        </div>
        <div className="max-h-[58vh] space-y-3 overflow-auto px-6 py-5">
          {builtInTranslateServices.map((preset) => {
            const installed = installedProviders.has(preset.provider);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={installed}
                onClick={() => onAdd(preset)}
                className="flex w-full items-center gap-4 rounded-lg bg-surface-hover px-4 py-3 text-left transition hover:bg-surface-selected disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft font-semibold text-accent">{preset.iconText}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary">{preset.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-text-secondary">{preset.description}</span>
                </span>
                {installed ? <CheckCircle2 size={18} className="text-success" /> : <Plus size={18} className="text-text-muted" />}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end border-t border-border-subtle px-6 py-4">
          <Button variant="ghost" onClick={onClose}>取消</Button>
        </div>
      </div>
    </div>
  );
}

function TranslateServiceRow({ service, index }: { service: TranslateService; index: number }) {
  const { updateConfig } = useConfigStore();
  const [expanded, setExpanded] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const fields = Object.keys(service.config ?? {});

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <ServiceListItem
        icon={service.iconText}
        name={
          <div>
            <TextInput
              value={service.name}
              onChange={(event) => void updateConfig((draft) => { draft.services.translate[index].name = event.target.value; })}
            />
            <div className="mt-1 text-xs text-text-secondary">{service.description || service.provider}</div>
          </div>
        }
      >
        <Switch checked={service.enabled} onChange={(checked) => void updateConfig((draft) => { draft.services.translate[index].enabled = checked; })} />
        <Button size="icon" variant="ghost" icon={<TestTube2 size={16} />} title="测试服务" onClick={() => setTestMessage(validateTranslateService(service))} />
        <Button size="icon" variant="ghost" icon={<Eye size={16} />} title="配置" onClick={() => setExpanded((value) => !value)} />
        <Button
          variant="danger"
          size="icon"
          icon={<Trash2 size={16} />}
          title="删除"
          onClick={() => void updateConfig((draft) => { draft.services.translate = draft.services.translate.filter((item) => item.id !== service.id); })}
        />
      </ServiceListItem>
      {expanded ? (
        <div className="grid gap-3 px-6 pb-5 md:grid-cols-2">
          {fields.length ? fields.map((field) => (
            <label key={field} className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">{field}</span>
              <TextInput
                value={service.config?.[field] ?? ""}
                type={field.toLowerCase().includes("secret") || field.toLowerCase().includes("key") || field.toLowerCase().includes("token") ? "password" : "text"}
                onChange={(event) => void updateConfig((draft) => {
                  draft.services.translate[index].config ??= {};
                  draft.services.translate[index].config![field] = event.target.value;
                })}
              />
            </label>
          )) : <div className="text-sm text-text-secondary">该服务没有额外配置项。</div>}
        </div>
      ) : null}
      {testMessage ? <div className="px-6 pb-3 text-xs font-medium text-success">{testMessage}</div> : null}
    </div>
  );
}

function AiServicesTab() {
  const { config, updateConfig } = useConfigStore();
  const [selectedProvider, setSelectedProvider] = useState("OpenAI");
  const [expandedId, setExpandedId] = useState(config.aiSettings.defaultServiceId || config.services.ai[0]?.id || "");

  const addProvider = () => void updateConfig((draft) => {
    const providerType = providerTypeForPreset(selectedProvider);
    const id = `ai-${Date.now()}`;
    draft.services.ai.push({
      id,
      provider: selectedProvider,
      providerType,
      name: selectedProvider,
      enabled: true,
      baseUrl: defaultBaseUrl(selectedProvider),
      apiKey: "",
      model: defaultModel(selectedProvider),
      temperature: 0.3,
      maxTokens: 2048,
      useProxy: false,
      customHeaders: ""
    });
    draft.aiSettings.defaultServiceId ||= id;
    draft.aiSettings.visionServiceId ||= id;
    setExpandedId(id);
  });

  return (
    <div className="space-y-6">
      <SectionCard title="模型管理" description="像控制台一样管理 AI Provider。默认折叠，只展开正在调整的模型。" icon={<Bot size={18} />}>
        <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">AI 模型列表</div>
            <div className="mt-1 text-xs text-text-secondary">
              共 {config.services.ai.length} 个 Provider。AI 解释和 AI 回复共用文本模型，AI 识图可单独选择识图模型。
            </div>
          </div>
          <div className="flex min-w-0 gap-2">
            <Select className="h-9 min-w-0 flex-1 md:w-56" value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)}>
              {AI_PROVIDER_PRESETS.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
              <option value="CustomProvider">Custom</option>
            </Select>
            <Button icon={<Plus size={16} />} onClick={addProvider}>添加模型</Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border-subtle bg-surface-hover/40 px-5 py-4 md:grid-cols-2 md:px-6">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-text-secondary">文本模型（AI 解释 / AI 回复）</span>
            <Select
              value={config.aiSettings.defaultServiceId}
              onChange={(event) => void updateConfig((draft) => {
                draft.aiSettings.defaultServiceId = event.target.value;
              })}
            >
              {config.services.ai.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name || service.provider} · {service.model || "未填写模型"}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-text-secondary">识图模型（AI 识图 / OCR 后翻译）</span>
            <Select
              value={config.aiSettings.visionServiceId || config.aiSettings.defaultServiceId}
              onChange={(event) => void updateConfig((draft) => {
                draft.aiSettings.visionServiceId = event.target.value;
              })}
            >
              {config.services.ai.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name || service.provider} · {service.model || "未填写模型"}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {config.services.ai.length ? (
          <div className="divide-y divide-border-subtle">
            {config.services.ai.map((service, index) => (
              <AiProviderPanel
                key={service.id}
                service={service}
                index={index}
                expanded={expandedId === service.id}
                isTextDefault={config.aiSettings.defaultServiceId === service.id}
                isVisionDefault={(config.aiSettings.visionServiceId || config.aiSettings.defaultServiceId) === service.id}
                onToggle={() => setExpandedId((current) => (current === service.id ? "" : service.id))}
              />
            ))}
          </div>
        ) : (
          <div className="p-5 md:p-6">
            <EmptyState title="还没有 AI Provider" description="添加一个模型后即可配置 AI 翻译。" />
          </div>
        )}
      </SectionCard>

      <SectionCard title="AI 回复偏好" icon={<Bot size={18} />}>
        <SettingRow title="回复目标语言"><Select value={config.aiSettings.replyTargetLanguage} onChange={(event) => void updateConfig((draft) => { draft.aiSettings.replyTargetLanguage = event.target.value; })}>{TARGET_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}</Select></SettingRow>
        <SettingRow title="回复风格"><Select value={config.aiSettings.replyStyle} onChange={(event) => void updateConfig((draft) => { draft.aiSettings.replyStyle = event.target.value as ReplyStyle; })}><option value="natural">自然</option><option value="friendly">友好</option><option value="casual">随意</option><option value="polite">礼貌</option><option value="playful">俏皮</option></Select></SettingRow>
        <SettingRow title="简短模式"><Switch checked={config.aiSettings.shortMode} onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.shortMode = checked))} /></SettingRow>
        <SettingRow title="启用 AI 代回"><Switch checked={config.aiSettings.enableAiReply} onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.enableAiReply = checked))} /></SettingRow>
        <SettingRow title="自动复制 AI 回复"><Switch checked={config.aiSettings.autoCopyAiReply} onChange={(checked) => void updateConfig((draft) => void (draft.aiSettings.autoCopyAiReply = checked))} /></SettingRow>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PromptEditor title="AI 翻译提示词" value={config.aiSettings.translationPrompt} onChange={(value) => void updateConfig((draft) => { draft.aiSettings.translationPrompt = value; })} />
        <PromptEditor title="AI 代回提示词" value={config.aiSettings.replyPrompt} onChange={(value) => void updateConfig((draft) => { draft.aiSettings.replyPrompt = value; })} />
      </div>
    </div>
  );
}

function AiProviderPanel({
  service,
  index,
  expanded,
  isTextDefault,
  isVisionDefault,
  onToggle
}: {
  service: AiService;
  index: number;
  expanded: boolean;
  isTextDefault: boolean;
  isVisionDefault: boolean;
  onToggle: () => void;
}) {
  const { config, updateConfig } = useConfigStore();
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState<boolean | null>(null);

  const runTest = async () => {
    setTesting(true);
    setMessage("");
    setMessageOk(null);
    try {
      const result = await testAiProvider(service);
      setMessageOk(Boolean(result.ok));
      setMessage(`${result.message}${result.contentPreview ? `：${result.contentPreview}` : ""}`);
    } catch (error) {
      setMessageOk(false);
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setTesting(false);
    }
  };

  const deleteProvider = () => void updateConfig((draft) => {
    draft.services.ai = draft.services.ai.filter((item) => item.id !== service.id);
    if (draft.aiSettings.defaultServiceId === service.id) {
      draft.aiSettings.defaultServiceId = draft.services.ai[0]?.id ?? "";
    }
    if (draft.aiSettings.visionServiceId === service.id) {
      draft.aiSettings.visionServiceId = draft.aiSettings.defaultServiceId;
    }
  });

  const providerKind = service.providerType.replace("Provider", "") || "Provider";
  const hasApiKey = Boolean(service.apiKey.trim());

  return (
    <article className={cn("bg-surface transition", expanded && "bg-surface-hover/45")}>
      <div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-6">
        <button type="button" className="min-w-0 text-left" onClick={onToggle}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            </span>
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", isTextDefault || isVisionDefault ? "bg-accent" : "bg-border")} />
            <span className="min-w-0">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-text-primary">{service.name || service.provider || "未命名模型"}</span>
                {isTextDefault ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">文本默认</span> : null}
                {isVisionDefault ? <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">识图默认</span> : null}
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary">{providerKind}</span>
              </span>
              <span className="mt-1 block truncate text-xs text-text-secondary">{service.model || "未填写模型名"} · {service.baseUrl || "未填写 Base URL"}</span>
            </span>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", hasApiKey ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {hasApiKey ? "Key 已配置" : "缺少 Key"}
          </span>
          <Button size="icon" variant="ghost" icon={<TestTube2 size={16} />} title="测试连接" disabled={testing} onClick={() => void runTest()} />
          <Button size="icon" variant="ghost" icon={<Trash2 size={16} />} title="删除" onClick={deleteProvider} />
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border-subtle px-5 pb-5 pt-4 md:px-6">
          <div className="grid gap-4 xl:grid-cols-2">
            <LabeledSelect label="Provider Type" value={service.providerType} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].providerType = value as AiProviderType; })}>
              <option value="OpenAICompatibleProvider">OpenAI Compatible</option>
              <option value="GeminiProvider">Gemini</option>
              <option value="AnthropicProvider">Anthropic</option>
              <option value="CustomProvider">Custom</option>
            </LabeledSelect>
            <LabeledInput label="显示名称" value={service.name} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].name = value; })} />
            <LabeledInput label="Base URL" className="xl:col-span-2" value={service.baseUrl} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].baseUrl = value; })} />
            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs font-medium text-text-secondary">API Key</span>
              <PasswordInput value={service.apiKey} placeholder="sk-..." onChange={(event) => void updateConfig((draft) => { draft.services.ai[index].apiKey = event.target.value; })} />
            </label>
            <LabeledInput label="Model" value={service.model} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].model = value; })} />
            <LabeledInput label="Provider ID" value={service.provider} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].provider = value; })} />
            <RangeField label="Temperature" min={0} max={2} step={0.1} value={service.temperature} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].temperature = value; })} />
            <RangeField label="Max Tokens" min={1} max={8192} step={1} value={service.maxTokens} onChange={(value) => void updateConfig((draft) => { draft.services.ai[index].maxTokens = value; })} />
            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs font-medium text-text-secondary">customHeaders</span>
              <Textarea className="min-h-24 font-mono text-xs" value={service.customHeaders} onChange={(event) => void updateConfig((draft) => { draft.services.ai[index].customHeaders = event.target.value; })} />
            </label>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <SettingRow title="使用代理" className="rounded-xl border border-border-subtle bg-surface"><Switch checked={service.useProxy} onChange={(checked) => void updateConfig((draft) => { draft.services.ai[index].useProxy = checked; })} /></SettingRow>
            <SettingRow title="文本默认" className="rounded-xl border border-border-subtle bg-surface"><Switch checked={isTextDefault} onChange={(checked) => void updateConfig((draft) => { if (checked) draft.aiSettings.defaultServiceId = service.id; })} /></SettingRow>
            <SettingRow title="识图默认" className="rounded-xl border border-border-subtle bg-surface"><Switch checked={isVisionDefault} onChange={(checked) => void updateConfig((draft) => { if (checked) draft.aiSettings.visionServiceId = service.id; })} /></SettingRow>
          </div>

          {message ? (
            <div className={cn("mt-4 rounded-xl border px-4 py-3 text-sm", messageOk ? "border-success-soft bg-success-soft text-success" : "border-danger-soft bg-danger-soft text-danger")}>
              {message}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" icon={<TestTube2 size={16} />} disabled={testing} onClick={() => void runTest()}>{testing ? "测试中" : "测试连接"}</Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={deleteProvider}>删除模型</Button>
            <Button onClick={() => setMessage("已保存更改")}>保存更改</Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function OcrServicesTab() {
  const { config, updateConfig } = useConfigStore();
  const addOcrService = () => void updateConfig((draft) => { draft.services.ocr.push({ id: `ocr-${Date.now()}`, type: "plugin", name: "外置 OCR 插件", enabled: false, iconText: "P", provider: "plugin", description: "外置 OCR 插件配置" }); });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <SectionCard title="OCR 服务" icon={<Eye size={18} />}>
        <div className="border-b border-border-subtle px-6 py-4"><Button icon={<Upload size={16} />} onClick={addOcrService}>添加 OCR 插件</Button></div>
        {config.services.ocr.map((service, index) => <OcrServiceRow key={service.id} service={service} index={index} />)}
      </SectionCard>
      <SectionCard title="OCR 功能设置">
        <SettingRow title="默认 OCR 引擎"><Select value={config.ocrSettings.defaultEngine} onChange={(event) => void updateConfig((draft) => { draft.ocrSettings.defaultEngine = event.target.value; })}>{config.services.ocr.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</Select></SettingRow>
        <SettingRow title="识别语言"><Select value={config.ocrSettings.language} onChange={(event) => void updateConfig((draft) => { draft.ocrSettings.language = event.target.value; })}>{MAINSTREAM_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}</Select></SettingRow>
        <SettingRow title="自动检测语言"><Switch checked={config.ocrSettings.autoDetectLanguage} onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.autoDetectLanguage = checked))} /></SettingRow>
        <SettingRow title="OCR 后自动复制"><Switch checked={config.ocrSettings.copyAfterOcr} onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.copyAfterOcr = checked))} /></SettingRow>
        <SettingRow title="OCR 后自动翻译"><Switch checked={config.ocrSettings.translateAfterOcr} onChange={(checked) => void updateConfig((draft) => void (draft.ocrSettings.translateAfterOcr = checked))} /></SettingRow>
      </SectionCard>
    </div>
  );
}

function OcrServiceRow({ service, index }: { service: OcrService; index: number }) {
  const { updateConfig } = useConfigStore();
  return (
    <ServiceListItem icon={service.iconText} name={<TextInput value={service.name} onChange={(event) => void updateConfig((draft) => { draft.services.ocr[index].name = event.target.value; })} />}>
      <Switch checked={service.enabled} onChange={(checked) => void updateConfig((draft) => { draft.services.ocr[index].enabled = checked; })} />
      <Button variant="danger" size="icon" icon={<Trash2 size={16} />} title="删除" onClick={() => void updateConfig((draft) => { draft.services.ocr = draft.services.ocr.filter((item) => item.id !== service.id); })} />
    </ServiceListItem>
  );
}

function LabeledInput({ label, value, onChange, className }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return <label className={cn("space-y-2", className)}><span className="text-xs font-medium text-text-secondary">{label}</span><TextInput value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function LabeledSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="space-y-2"><span className="text-xs font-medium text-text-secondary">{label}</span><Select value={value} onChange={(event) => onChange(event.target.value)}>{children}</Select></label>;
}

function RangeField({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="rounded-2xl border border-border-subtle bg-surface-hover px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-text-primary"><span>{label}</span><span className="text-accent">{value}</span></div>
      <input className="h-2 w-full accent-accent" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function parsePluginManifest(raw: string): Record<string, string> {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function validateTranslateService(service: TranslateService) {
  const missing = Object.entries(service.config ?? {}).filter(([key, value]) => key !== "endpoint" && !value.trim()).map(([key]) => key);
  if (missing.length) return `请先填写：${missing.join("、")}`;
  return service.enabled ? "服务配置可用。" : "服务已保存，但当前未启用。";
}

function providerTypeForPreset(provider: string): AiProviderType {
  if (provider === "Gemini") return "GeminiProvider";
  if (provider === "Anthropic") return "AnthropicProvider";
  if (provider === "CustomProvider") return "CustomProvider";
  return "OpenAICompatibleProvider";
}

function defaultBaseUrl(provider: string) {
  if (provider === "OpenAI") return "https://api.openai.com/v1";
  if (provider === "Ollama") return "http://localhost:11434/v1";
  if (provider === "LM Studio") return "http://localhost:1234/v1";
  return "";
}

function defaultModel(provider: string) {
  if (provider === "OpenAI") return "gpt-4o-mini";
  if (provider === "Ollama") return "llama3.1";
  return "";
}
