import type { TranslateService } from "../types/config";

export interface ServiceTranslateRequest {
  service: TranslateService;
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface ServiceTranslateResult {
  ok: boolean;
  serviceId: string;
  serviceName: string;
  content: string;
  error?: string;
}

export async function translateWithService({
  service,
  sourceText,
  sourceLanguage,
  targetLanguage
}: ServiceTranslateRequest): Promise<ServiceTranslateResult> {
  const serviceId = service.provider || service.id;

  try {
    const provider = serviceId.toLowerCase();
    if (provider.includes("google")) {
      return ok(service, await googleTranslate(sourceText, sourceLanguage, targetLanguage));
    }
    if (provider.includes("lingva")) {
      return ok(service, await lingvaTranslate(service, sourceText, sourceLanguage, targetLanguage));
    }
    if (provider.includes("bing")) {
      return ok(service, await googleTranslate(sourceText, sourceLanguage, targetLanguage));
    }

    const missing = requiredFields(provider).filter((field) => !service.config?.[field]?.trim());
    if (missing.length) {
      return fail(service, `请先在服务设置里填写：${missing.join("、")}`);
    }

    return fail(service, "该厂商配置已保存，真实接口签名会在下一步接入。");
  } catch (error) {
    return fail(service, error instanceof Error ? error.message : String(error));
  }
}

function ok(service: TranslateService, content: string): ServiceTranslateResult {
  return {
    ok: true,
    serviceId: service.provider || service.id,
    serviceName: service.name,
    content
  };
}

function fail(service: TranslateService, error: string): ServiceTranslateResult {
  return {
    ok: false,
    serviceId: service.provider || service.id,
    serviceName: service.name,
    content: "",
    error
  };
}

async function googleTranslate(text: string, sourceLanguage: string, targetLanguage: string) {
  const source = sourceLanguage === "auto" ? "auto" : normalizeLanguage(sourceLanguage);
  const target = normalizeLanguage(targetLanguage);
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", source);
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as unknown;
  const translated = Array.isArray(data) && Array.isArray(data[0])
    ? data[0].map((item) => (Array.isArray(item) ? item[0] : "")).join("")
    : "";
  if (!translated.trim()) throw new Error("没有返回翻译结果");
  return translated;
}

async function lingvaTranslate(service: TranslateService, text: string, sourceLanguage: string, targetLanguage: string) {
  const endpoint = (service.config?.endpoint || "https://lingva.ml").replace(/\/$/, "");
  const source = sourceLanguage === "auto" ? "auto" : normalizeLanguage(sourceLanguage);
  const target = normalizeLanguage(targetLanguage);
  const url = `${endpoint}/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(target)}/${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as { translation?: string };
  if (!data.translation?.trim()) throw new Error("没有返回翻译结果");
  return data.translation;
}

function normalizeLanguage(language: string) {
  if (language === "zh-CN") return "zh";
  return language;
}

function requiredFields(provider: string) {
  if (provider.includes("deepl")) return ["apiKey", "endpoint"];
  if (provider.includes("youdao")) return ["appKey", "appSecret"];
  if (provider.includes("baidu")) return ["appId", "appKey"];
  if (provider.includes("alibaba")) return ["accessKeyId", "accessKeySecret", "region"];
  if (provider.includes("tencent")) return ["secretId", "secretKey", "region"];
  if (provider.includes("caiyun")) return ["token"];
  if (provider.includes("volcengine")) return ["accessKeyId", "secretAccessKey", "region"];
  if (provider.includes("niutrans")) return ["apiKey"];
  if (provider.includes("yandex")) return ["apiKey"];
  return [];
}
