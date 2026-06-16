use reqwest::{header::HeaderMap, Client, Proxy, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;
use tauri::AppHandle;

use crate::{config, history};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct AiProviderConfig {
  id: String,
  #[serde(default)]
  provider: String,
  #[serde(default)]
  provider_type: String,
  name: String,
  #[serde(default)]
  enabled: bool,
  #[serde(default)]
  base_url: String,
  #[serde(default)]
  api_key: String,
  #[serde(default)]
  model: String,
  #[serde(default = "default_temperature")]
  temperature: f64,
  #[serde(default = "default_max_tokens")]
  max_tokens: u32,
  #[serde(default)]
  custom_headers: String,
  #[serde(default)]
  use_proxy: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiTranslateRequest {
  #[serde(default)]
  provider_id: Option<String>,
  source_text: String,
  source_language: String,
  target_language: String,
  #[serde(default)]
  scene: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiReplyRequest {
  #[serde(default)]
  provider_id: Option<String>,
  #[serde(default)]
  context_text: String,
  user_intent: String,
  target_language: String,
  reply_style: String,
  short_mode: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCallResult {
  ok: bool,
  content: String,
  service_name: String,
}

#[tauri::command]
pub async fn test_ai_provider(app: AppHandle, provider: Value) -> Result<Value, String> {
  let config_value = config::read_config_value(&app)?;
  let provider = parse_provider(provider)?;
  let content = call_provider(
    &config_value,
    &provider,
    "You are a connection test endpoint. Reply with OK.",
    "Reply exactly: OK",
    Some(8),
  )
  .await?;

  Ok(json!({
    "ok": true,
    "message": "连接成功",
    "serviceName": provider.name,
    "contentPreview": content.chars().take(120).collect::<String>()
  }))
}

#[tauri::command]
pub async fn ai_translate(app: AppHandle, request: AiTranslateRequest) -> Result<AiCallResult, String> {
  let config_value = config::read_config_value(&app)?;
  let provider = selected_provider(&config_value, request.provider_id.as_deref())?;
  let prompt = config_value
    .pointer("/aiSettings/translationPrompt")
    .and_then(Value::as_str)
    .unwrap_or("")
    .replace("{{source_language}}", &request.source_language)
    .replace("{source_language}", &request.source_language)
    .replace("{{target_language}}", &request.target_language)
    .replace("{target_language}", &request.target_language)
    .replace("{{text}}", &request.source_text)
    .replace("{text}", &request.source_text)
    .replace("{{scene}}", &request.scene)
    .replace("{scene}", &request.scene);
  let user = format!(
    "源语言：{}\n目标语言：{}\n使用场景：{}\n用户文本：\n{}",
    request.source_language, request.target_language, request.scene, request.source_text
  );
  let content = call_provider(&config_value, &provider, &prompt, &user, None).await?;

  history::append_history_entry(
    &app,
    json!({
      "type": "ai_translate",
      "sourceText": request.source_text,
      "resultText": content,
      "sourceLanguage": request.source_language,
      "targetLanguage": request.target_language,
      "serviceName": provider.name,
      "createdAt": now_iso(),
      "isFavorite": false
    }),
  )?;

  Ok(AiCallResult {
    ok: true,
    content,
    service_name: provider.name,
  })
}

#[tauri::command]
pub async fn ai_reply(app: AppHandle, request: AiReplyRequest) -> Result<AiCallResult, String> {
  let config_value = config::read_config_value(&app)?;
  let provider = selected_provider(&config_value, request.provider_id.as_deref())?;
  let prompt = config_value
    .pointer("/aiSettings/replyPrompt")
    .and_then(Value::as_str)
    .unwrap_or("")
    .replace("{{context_text}}", &request.context_text)
    .replace("{context_text}", &request.context_text)
    .replace("{{user_intent}}", &request.user_intent)
    .replace("{user_intent}", &request.user_intent)
    .replace("{{target_language}}", &request.target_language)
    .replace("{target_language}", &request.target_language)
    .replace("{{reply_style}}", &request.reply_style)
    .replace("{reply_style}", &request.reply_style)
    .replace("{{short_mode}}", if request.short_mode { "true" } else { "false" })
    .replace("{short_mode}", if request.short_mode { "true" } else { "false" });
  let user = format!(
    "对方原文：\n{}\n\n我想表达的意思：\n{}\n\n目标语言：{}\n回复风格：{}\n简短模式：{}",
    request.context_text,
    request.user_intent,
    request.target_language,
    request.reply_style,
    if request.short_mode { "是" } else { "否" }
  );
  let content = call_provider(&config_value, &provider, &prompt, &user, None).await?;

  history::append_history_entry(
    &app,
    json!({
      "type": "ai_reply",
      "sourceText": request.user_intent,
      "contextText": request.context_text,
      "resultText": content,
      "sourceLanguage": "zh-CN",
      "targetLanguage": request.target_language,
      "serviceName": provider.name,
      "createdAt": now_iso(),
      "isFavorite": false
    }),
  )?;

  Ok(AiCallResult {
    ok: true,
    content,
    service_name: provider.name,
  })
}

async fn call_provider(
  config_value: &Value,
  provider: &AiProviderConfig,
  system_prompt: &str,
  user_prompt: &str,
  max_tokens_override: Option<u32>,
) -> Result<String, String> {
  validate_provider(provider)?;
  ensure_supported_provider(provider)?;

  let endpoint = normalize_chat_completions_url(&provider.base_url);
  let client = build_client(config_value, provider)?;
  let mut request = client
    .post(endpoint)
    .bearer_auth(provider.api_key.trim())
    .json(&json!({
      "model": provider.model,
      "messages": [
        { "role": "system", "content": system_prompt },
        { "role": "user", "content": user_prompt }
      ],
      "temperature": provider.temperature,
      "max_tokens": max_tokens_override.unwrap_or(provider.max_tokens)
    }));

  let headers = parse_custom_headers(&provider.custom_headers)?;
  if !headers.is_empty() {
    request = request.headers(headers);
  }

  let response = request.send().await.map_err(map_reqwest_error)?;
  let status = response.status();
  let body = response.text().await.map_err(map_reqwest_error)?;

  if !status.is_success() {
    return Err(map_status_error(status, &body));
  }

  extract_openai_content(&body)
}

fn selected_provider(config_value: &Value, provider_id: Option<&str>) -> Result<AiProviderConfig, String> {
  let requested_id = provider_id
    .filter(|id| !id.trim().is_empty())
    .map(str::to_owned)
    .or_else(|| {
      config_value
        .pointer("/aiSettings/defaultServiceId")
        .and_then(Value::as_str)
        .map(str::to_owned)
    });
  let providers = config_value
    .pointer("/services/ai")
    .and_then(Value::as_array)
    .ok_or_else(|| "没有配置 AI Provider。请先在 AI 翻译设置中添加供应商。".to_string())?;

  let provider_value = requested_id
    .as_deref()
    .and_then(|id| providers.iter().find(|item| item.get("id").and_then(Value::as_str) == Some(id)))
    .or_else(|| providers.iter().find(|item| item.get("enabled").and_then(Value::as_bool).unwrap_or(false)))
    .or_else(|| providers.first())
    .ok_or_else(|| "没有可用 AI Provider。请先在 AI 翻译设置中添加供应商。".to_string())?;

  parse_provider(provider_value.clone())
}

fn parse_provider(value: Value) -> Result<AiProviderConfig, String> {
  let mut provider: AiProviderConfig = serde_json::from_value(value).map_err(|error| error.to_string())?;
  if provider.provider_type.trim().is_empty() {
    provider.provider_type = infer_provider_type(&provider.provider);
  }
  if provider.name.trim().is_empty() {
    provider.name = provider.provider.clone();
  }
  Ok(provider)
}

fn infer_provider_type(provider: &str) -> String {
  let lower = provider.to_lowercase();
  if lower.contains("gemini") {
    "GeminiProvider".to_string()
  } else if lower.contains("anthropic") {
    "AnthropicProvider".to_string()
  } else if lower.contains("customprovider") {
    "CustomProvider".to_string()
  } else {
    "OpenAICompatibleProvider".to_string()
  }
}

fn ensure_supported_provider(provider: &AiProviderConfig) -> Result<(), String> {
  match provider.provider_type.as_str() {
    "OpenAICompatibleProvider" => Ok(()),
    "GeminiProvider" => Err("GeminiProvider 已预留，但第二阶段尚未实现真实调用。".to_string()),
    "AnthropicProvider" => Err("AnthropicProvider 已预留，但第二阶段尚未实现真实调用。".to_string()),
    "CustomProvider" => Err("CustomProvider 已预留，但第二阶段尚未实现真实调用。".to_string()),
    other => Err(format!("未知 Provider 类型：{other}")),
  }
}

fn validate_provider(provider: &AiProviderConfig) -> Result<(), String> {
  if provider.api_key.trim().is_empty() {
    return Err("API Key 为空，请在 AI 翻译设置中填写 API Key。".to_string());
  }
  if provider.base_url.trim().is_empty() {
    return Err("Base URL 为空，请在 AI 翻译设置中填写 Base URL。".to_string());
  }
  if provider.model.trim().is_empty() {
    return Err("模型名为空，请在 AI 翻译设置中填写 Model Name。".to_string());
  }
  Ok(())
}

fn normalize_chat_completions_url(base_url: &str) -> String {
  let trimmed = base_url.trim().trim_end_matches('/');
  if trimmed.to_lowercase().ends_with("/chat/completions") {
    trimmed.to_string()
  } else {
    format!("{trimmed}/chat/completions")
  }
}

fn build_client(config_value: &Value, provider: &AiProviderConfig) -> Result<Client, String> {
  let mut builder = Client::builder().timeout(Duration::from_secs(45));

  if provider.use_proxy {
    if let Some(proxy_url) = proxy_url(config_value) {
      let proxy = Proxy::all(proxy_url).map_err(|error| format!("代理配置无效：{error}"))?;
      builder = builder.proxy(proxy);
    }
  }

  builder.build().map_err(|error| format!("网络客户端初始化失败：{error}"))
}

fn proxy_url(config_value: &Value) -> Option<String> {
  let proxy = config_value.get("proxy")?;
  if !proxy.get("enabled").and_then(Value::as_bool).unwrap_or(false) {
    return None;
  }
  let host = proxy.get("host").and_then(Value::as_str).unwrap_or("").trim();
  let port = proxy.get("port").and_then(Value::as_str).unwrap_or("").trim();
  if host.is_empty() || port.is_empty() {
    return None;
  }
  let protocol = match proxy.get("protocol").and_then(Value::as_str).unwrap_or("http") {
    "socks5" => "socks5h",
    "https" => "https",
    _ => "http",
  };
  let username = proxy.get("username").and_then(Value::as_str).unwrap_or("").trim();
  let password = proxy.get("password").and_then(Value::as_str).unwrap_or("").trim();

  if username.is_empty() {
    Some(format!("{protocol}://{host}:{port}"))
  } else {
    Some(format!("{protocol}://{username}:{password}@{host}:{port}"))
  }
}

fn parse_custom_headers(raw: &str) -> Result<HeaderMap, String> {
  let mut headers = HeaderMap::new();
  let trimmed = raw.trim();
  if trimmed.is_empty() {
    return Ok(headers);
  }

  let value: Value = serde_json::from_str(trimmed).map_err(|error| format!("customHeaders 不是合法 JSON：{error}"))?;
  let object = value
    .as_object()
    .ok_or_else(|| "customHeaders 必须是 JSON 对象。".to_string())?;

  for (key, value) in object {
    if key.eq_ignore_ascii_case("authorization") || key.eq_ignore_ascii_case("content-type") {
      continue;
    }
    let Some(value) = value.as_str() else {
      return Err(format!("customHeaders.{key} 必须是字符串。"));
    };
    let header_name = reqwest::header::HeaderName::from_bytes(key.as_bytes())
      .map_err(|error| format!("customHeaders.{key} 名称无效：{error}"))?;
    let header_value = reqwest::header::HeaderValue::from_str(value)
      .map_err(|error| format!("customHeaders.{key} 值无效：{error}"))?;
    headers.insert(header_name, header_value);
  }

  Ok(headers)
}

fn extract_openai_content(body: &str) -> Result<String, String> {
  let value: Value = serde_json::from_str(body).map_err(|error| format!("返回内容格式异常：{error}"))?;
  let content = value
    .pointer("/choices/0/message/content")
    .and_then(Value::as_str)
    .or_else(|| value.pointer("/choices/0/text").and_then(Value::as_str))
    .map(str::trim)
    .filter(|content| !content.is_empty())
    .ok_or_else(|| "返回内容格式异常：没有找到 choices[0].message.content。".to_string())?;

  Ok(content.to_string())
}

fn map_reqwest_error(error: reqwest::Error) -> String {
  if error.is_timeout() {
    "请求超时，请检查网络或稍后重试。".to_string()
  } else if error.is_connect() || error.is_request() {
    format!("网络连接失败：{error}")
  } else {
    error.to_string()
  }
}

fn map_status_error(status: StatusCode, body: &str) -> String {
  let detail = body.chars().take(500).collect::<String>();
  match status.as_u16() {
    401 | 403 => format!("鉴权失败（{}）：请检查 API Key 或供应商权限。{}", status.as_u16(), detail_suffix(&detail)),
    404 => format!("接口地址错误（404）：请检查 Base URL 是否正确。{}", detail_suffix(&detail)),
    429 => format!("请求过多（429）：触发限流，请稍后重试。{}", detail_suffix(&detail)),
    500..=599 => format!("服务端错误（{}）：供应商暂时不可用。{}", status.as_u16(), detail_suffix(&detail)),
    code => format!("AI 服务请求失败（HTTP {code}）。{}", detail_suffix(&detail)),
  }
}

fn detail_suffix(detail: &str) -> String {
  if detail.trim().is_empty() {
    "".to_string()
  } else {
    format!(" 返回：{}", detail.trim())
  }
}

fn now_iso() -> String {
  let millis = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|duration| duration.as_millis())
    .unwrap_or(0);
  format!("{millis}")
}

fn default_temperature() -> f64 {
  0.4
}

fn default_max_tokens() -> u32 {
  1600
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::thread;
  use tiny_http::{Response, Server};

  #[test]
  fn normalizes_openai_compatible_urls() {
    assert_eq!(
      normalize_chat_completions_url("https://api.openai.com/v1"),
      "https://api.openai.com/v1/chat/completions"
    );
    assert_eq!(
      normalize_chat_completions_url("https://api.openai.com/v1/chat/completions"),
      "https://api.openai.com/v1/chat/completions"
    );
    assert_eq!(
      normalize_chat_completions_url("https://example.test/v1/"),
      "https://example.test/v1/chat/completions"
    );
  }

  #[test]
  fn validates_required_provider_fields() {
    let provider = AiProviderConfig {
      id: "test".to_string(),
      provider: "OpenAI".to_string(),
      provider_type: "OpenAICompatibleProvider".to_string(),
      name: "Test".to_string(),
      enabled: true,
      base_url: "".to_string(),
      api_key: "".to_string(),
      model: "".to_string(),
      temperature: 0.3,
      max_tokens: 64,
      custom_headers: "".to_string(),
      use_proxy: false,
    };

    assert!(validate_provider(&provider).unwrap_err().contains("API Key 为空"));
  }

  #[test]
  fn calls_openai_compatible_mock_server() {
    let server = Server::http("127.0.0.1:0").unwrap();
    let port = server.server_addr().to_ip().unwrap().port();

    let handle = thread::spawn(move || {
      let mut request = server.recv().unwrap();
      assert_eq!(request.method().as_str(), "POST");
      assert_eq!(request.url(), "/v1/chat/completions");
      assert_eq!(
        request
          .headers()
          .iter()
          .find(|header| header.field.equiv("authorization"))
          .map(|header| header.value.as_str()),
        Some("Bearer test-key")
      );

      let mut body = String::new();
      request.as_reader().read_to_string(&mut body).unwrap();
      assert!(body.contains("\"model\":\"mock-model\""));
      let response = Response::from_string(
        r#"{"choices":[{"message":{"content":"【自然翻译】\nHello"}}]}"#,
      )
      .with_header(
        tiny_http::Header::from_bytes(
          &b"Content-Type"[..],
          &b"application/json; charset=utf-8"[..],
        )
        .unwrap(),
      );
      request.respond(response).unwrap();
    });

    let provider = AiProviderConfig {
      id: "mock".to_string(),
      provider: "Mock".to_string(),
      provider_type: "OpenAICompatibleProvider".to_string(),
      name: "Mock".to_string(),
      enabled: true,
      base_url: format!("http://127.0.0.1:{port}/v1"),
      api_key: "test-key".to_string(),
      model: "mock-model".to_string(),
      temperature: 0.3,
      max_tokens: 64,
      custom_headers: "".to_string(),
      use_proxy: false,
    };
    let config_value = json!({ "proxy": { "enabled": false } });
    let result = tauri::async_runtime::block_on(call_provider(
      &config_value,
      &provider,
      "system",
      "user",
      None,
    ))
    .unwrap();

    handle.join().unwrap();
    assert!(result.contains("【自然翻译】"));
  }
}
