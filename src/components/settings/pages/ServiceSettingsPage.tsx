import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bot, CheckCircle2, Eye, Languages, Plus, Puzzle, TestTube2, Trash2, Upload, X } from "lucide-react";
import { AI_PROVIDER_PRESETS, MAINSTREAM_LANGUAGES, TARGET_LANGUAGES } from "../../../constants/languages";
import { useConfigStore } from "../../../stores/configStore";
import type { AiProviderType, OcrService, ReplyStyle, TranslateService } from "../../../types/config";
import { testAiProvider } from "../../../utils/ai";
import { cn } from "../../../utils/cn";
import { Button } from "../../ui/Button";
import {
  EmptyState,
  PageHeader,
  PasswordInput,
  PromptEditor,
  ProviderCard,
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
  const { config, updateConfig, loadConfig } = useConfigStore();
  const [selectedProvider, setSelectedProvider] = useState("OpenAI");
  const [selectedId, setSelectedId] = useState(config.aiSettings.defaultServiceId || config.services.ai[0]?.id || "");
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState<boolean | null>(null);
  const selectedIndex = useMemo(() => Math.max(0, config.services.ai.findIndex((service) => service.id === selectedId)), [config.services.ai, selectedId]);
  const service = config.services.ai[selectedIndex];

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
    draft.aiSettings.defaultServiceId = id;
    setSelectedId(id);
  });

  const runTest = async () => {
    if (!service) return;
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

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium text-text-primary">Providers</h3>
            <div className="flex gap-2">
              <Select className="h-9 flex-1 sm:w-40" value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)}>
                {AI_PROVIDER_PRESETS.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                <option value="CustomProvider">Custom</option>
              </Select>
              <Button size="icon" icon={<Plus size={18} />} title="添加 Provider" onClick={addProvider} />
            </div>
          </div>
          <div className="space-y-3">
            {config.services.ai.map((item) => (
              <ProviderCard
                key={item.id}
                name={item.name || item.provider}
                description={item.id === config.aiSettings.defaultServiceId ? "Default translation engine" : item.baseUrl || item.providerType}
                badge={item.model || item.providerType.replace("Provider", "")}
                enabled={item.enabled}
                active={item.id === service?.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        </div>

        <SectionCard title="Provider Configuration" className="min-w-0">
          {service ? (
            <>
              <div className="grid grid-cols-1 gap-4 px-5 py-5 xl:grid-cols-2 xl:px-6">
                <LabeledSelect label="Provider Type" value={service.providerType} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].providerType = value as AiProviderType; })}>
                  <option value="OpenAICompatibleProvider">OpenAI Compatible</option>
                  <option value="GeminiProvider">Gemini</option>
                  <option value="AnthropicProvider">Anthropic</option>
                  <option value="CustomProvider">Custom</option>
                </LabeledSelect>
                <LabeledInput label="显示名称" value={service.name} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].name = value; })} />
                <LabeledInput label="Base URL" className="xl:col-span-2" value={service.baseUrl} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].baseUrl = value; })} />
                <label className="space-y-2 xl:col-span-2">
                  <span className="text-xs font-medium text-text-secondary">API Key</span>
                  <PasswordInput value={service.apiKey} placeholder="sk-..." onChange={(event) => void updateConfig((draft) => { draft.services.ai[selectedIndex].apiKey = event.target.value; })} />
                </label>
                <LabeledInput label="Model" value={service.model} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].model = value; })} />
                <LabeledInput label="Provider ID" value={service.provider} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].provider = value; })} />
                <RangeField label="Temperature" min={0} max={2} step={0.1} value={service.temperature} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].temperature = value; })} />
                <RangeField label="Max Tokens" min={1} max={8192} step={1} value={service.maxTokens} onChange={(value) => void updateConfig((draft) => { draft.services.ai[selectedIndex].maxTokens = value; })} />
                <label className="space-y-2 xl:col-span-2">
                  <span className="text-xs font-medium text-text-secondary">customHeaders</span>
                  <Textarea className="min-h-24 font-mono text-xs" value={service.customHeaders} onChange={(event) => void updateConfig((draft) => { draft.services.ai[selectedIndex].customHeaders = event.target.value; })} />
                </label>
              </div>
              <div className="border-t border-border-subtle px-6 py-4">
                <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <SettingRow title="启用 Provider" className="rounded-xl border border-border-subtle"><Switch checked={service.enabled} onChange={(checked) => void updateConfig((draft) => { draft.services.ai[selectedIndex].enabled = checked; })} /></SettingRow>
                  <SettingRow title="使用代理" className="rounded-xl border border-border-subtle"><Switch checked={service.useProxy} onChange={(checked) => void updateConfig((draft) => { draft.services.ai[selectedIndex].useProxy = checked; })} /></SettingRow>
                  <SettingRow title="默认服务" className="rounded-xl border border-border-subtle"><Switch checked={config.aiSettings.defaultServiceId === service.id} onChange={(checked) => void updateConfig((draft) => { if (checked) draft.aiSettings.defaultServiceId = service.id; })} /></SettingRow>
                </div>
                {message ? <div className={cn("mb-4 rounded-xl border px-4 py-3 text-sm", messageOk ? "border-success-soft bg-success-soft text-success" : "border-danger-soft bg-danger-soft text-danger")}>{message}</div> : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" onClick={() => void loadConfig().then(() => setMessage("已重新加载配置"))}>Discard</Button>
                  <Button variant="secondary" icon={<TestTube2 size={16} />} disabled={testing} onClick={() => void runTest()}>{testing ? "测试中" : "测试连接"}</Button>
                  <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => void updateConfig((draft) => { draft.services.ai = draft.services.ai.filter((item) => item.id !== service.id); })}>删除</Button>
                  <Button onClick={() => setMessage("已保存更改")}>Save Changes</Button>
                </div>
              </div>
            </>
          ) : <EmptyState title="还没有 AI Provider" description="添加一个 Provider 后即可配置 AI 翻译。" />}
        </SectionCard>
      </div>

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
