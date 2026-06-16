use std::thread;

use serde_json::{json, Value};
use tauri::AppHandle;
use tiny_http::{Header, Method, Request, Response, Server};

use crate::{ai, config};

const MAX_PORT_ATTEMPTS: u16 = 10;

pub fn start_health_server(app: AppHandle) -> Result<u16, String> {
  let requested_port = config::read_config_value(&app)
    .map(|value| config::listen_port(&value))
    .unwrap_or(60828);

  let mut last_error = String::new();

  for offset in 0..MAX_PORT_ATTEMPTS {
    let Some(port) = requested_port.checked_add(offset) else {
      break;
    };
    let address = format!("127.0.0.1:{port}");

    match Server::http(&address) {
      Ok(server) => {
        config::set_runtime_port(&app, port)?;
        thread::spawn(move || serve_local_api(server, port, app));
        return Ok(port);
      }
      Err(error) => {
        last_error = format!("{address}: {error}");
      }
    }
  }

  Err(format!(
    "无法启动本地 HTTP 服务：从端口 {requested_port} 开始连续尝试 {MAX_PORT_ATTEMPTS} 个端口均失败。最后错误：{last_error}"
  ))
}

fn serve_local_api(server: Server, port: u16, app: AppHandle) {
  for mut request in server.incoming_requests() {
    let response = handle_request(&mut request, port, app.clone());
    let _ = request.respond(response);
  }
}

fn handle_request(request: &mut Request, port: u16, app: AppHandle) -> Response<std::io::Cursor<Vec<u8>>> {
  let method = request.method().clone();
  let url = request.url().to_string();

  if method == Method::Get && url == "/api/health" {
    return json_response(200, json!({ "ok": true, "app": "LinguaFlow", "port": port }));
  }

  if method == Method::Post && url == "/api/translate/text" {
    let body = match read_request_body(request) {
      Ok(body) => body,
      Err(error) => return json_error(400, error),
    };
    let parsed = match serde_json::from_str::<ai::AiTranslateRequest>(&body) {
      Ok(parsed) => parsed,
      Err(error) => return json_error(400, format!("请求体格式错误：{error}")),
    };
    return match tauri::async_runtime::block_on(ai::ai_translate(app, parsed)) {
      Ok(result) => json_response(200, json!(result)),
      Err(error) => json_error(400, error),
    };
  }

  if method == Method::Post && url == "/api/ai/reply" {
    let body = match read_request_body(request) {
      Ok(body) => body,
      Err(error) => return json_error(400, error),
    };
    let parsed = match serde_json::from_str::<ai::AiReplyRequest>(&body) {
      Ok(parsed) => parsed,
      Err(error) => return json_error(400, format!("请求体格式错误：{error}")),
    };
    return match tauri::async_runtime::block_on(ai::ai_reply(app, parsed)) {
      Ok(result) => json_response(200, json!(result)),
      Err(error) => json_error(400, error),
    };
  }

  json_error(404, "not found")
}

fn read_request_body(request: &mut Request) -> Result<String, String> {
  let mut body = String::new();
  request
    .as_reader()
    .read_to_string(&mut body)
    .map_err(|error| format!("读取请求体失败：{error}"))?;
  Ok(body)
}

fn json_response(status: u16, value: Value) -> Response<std::io::Cursor<Vec<u8>>> {
  Response::from_string(value.to_string())
    .with_status_code(status)
    .with_header(json_header())
}

fn json_error(status: u16, error: impl Into<String>) -> Response<std::io::Cursor<Vec<u8>>> {
  json_response(status, json!({ "ok": false, "error": error.into() }))
}

fn json_header() -> Header {
  Header::from_bytes(&b"Content-Type"[..], &b"application/json; charset=utf-8"[..]).unwrap()
}
