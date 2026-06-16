import type { AiService } from "../types/config";
import { invokeCommand, isTauriRuntime } from "./tauri";

export interface AiCallResult {
  ok: boolean;
  content: string;
  serviceName: string;
}

export interface AiTranslateRequest {
  providerId?: string;
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  scene?: string;
}

export interface AiReplyRequest {
  providerId?: string;
  contextText?: string;
  userIntent: string;
  targetLanguage: string;
  replyStyle: string;
  shortMode: boolean;
}

export async function testAiProvider(provider: AiService) {
  validateProvider(provider);
  if (!isTauriRuntime()) {
    return {
      ok: true,
      message: "浏览器预览已通过本地校验；真实连接测试需要在 Tauri 应用中运行。",
      serviceName: provider.name,
      contentPreview: "preview-ok"
    };
  }

  return invokeCommand<{
    ok: boolean;
    message: string;
    serviceName: string;
    contentPreview: string;
  }>("test_ai_provider", { provider });
}

export async function runAiTranslate(request: AiTranslateRequest) {
  if (!request.sourceText.trim()) {
    throw new Error("原文为空，请先输入要翻译或解释的文本。");
  }

  if (!isTauriRuntime()) {
    throw new Error("真实 AI 翻译需要在 Tauri 应用中运行；浏览器预览不会发送 API Key。");
  }

  return invokeCommand<AiCallResult>("ai_translate", { request });
}

export async function runAiReply(request: AiReplyRequest) {
  if (!request.userIntent.trim()) {
    throw new Error("我想表达的意思为空，请先输入要生成的回复内容。");
  }

  if (!isTauriRuntime()) {
    throw new Error("真实 AI 代回需要在 Tauri 应用中运行；浏览器预览不会发送 API Key。");
  }

  return invokeCommand<AiCallResult>("ai_reply", { request });
}

function validateProvider(provider: AiService) {
  if (!provider.apiKey.trim()) {
    throw new Error("API Key 为空，请先填写 API Key。");
  }
  if (!provider.baseUrl.trim()) {
    throw new Error("Base URL 为空，请先填写 Base URL。");
  }
  if (!provider.model.trim()) {
    throw new Error("模型名为空，请先填写 Model Name。");
  }
}
