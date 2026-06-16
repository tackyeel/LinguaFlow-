use std::thread;
use tauri::AppHandle;
use tiny_http::{Header, Method, Response, Server};

use crate::config;

pub fn start_health_server(app: AppHandle) {
  let port = config::read_config_value(&app)
    .map(|value| config::listen_port(&value))
    .unwrap_or(60828);

  thread::spawn(move || {
    let address = format!("127.0.0.1:{port}");
    let Ok(server) = Server::http(&address) else {
      eprintln!("LinguaFlow local API failed to bind {address}");
      return;
    };

    for request in server.incoming_requests() {
      let is_health = request.method() == &Method::Get && request.url() == "/api/health";
      let response = if is_health {
        Response::from_string(r#"{"ok":true,"app":"LinguaFlow"}"#)
          .with_header(json_header())
      } else {
        Response::from_string(r#"{"ok":false,"error":"not found"}"#)
          .with_status_code(404)
          .with_header(json_header())
      };

      let _ = request.respond(response);
    }
  });
}

fn json_header() -> Header {
  Header::from_bytes(&b"Content-Type"[..], &b"application/json; charset=utf-8"[..]).unwrap()
}
