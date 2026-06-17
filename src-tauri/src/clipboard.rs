use std::{
  sync::{Mutex, OnceLock},
  thread,
  time::{Duration, Instant},
};

use arboard::Clipboard;
use tauri::{AppHandle, Emitter, Manager};

use crate::{config, window};

const POLL_INTERVAL: Duration = Duration::from_millis(700);
const MAX_CLIPBOARD_TEXT: usize = 20_000;
const IGNORE_TTL: Duration = Duration::from_secs(12);

static IGNORED_TEXTS: OnceLock<Mutex<Vec<IgnoredClipboardText>>> = OnceLock::new();

struct IgnoredClipboardText {
  text: String,
  created_at: Instant,
}

#[tauri::command]
pub fn ignore_clipboard_text(text: String) {
  let text = normalize_clipboard_text(&text);
  if text.is_empty() {
    return;
  }

  let mut ignored = ignored_texts().lock().unwrap_or_else(|poisoned| poisoned.into_inner());
  prune_ignored_texts(&mut ignored);
  ignored.push(IgnoredClipboardText {
    text,
    created_at: Instant::now(),
  });
}

#[tauri::command]
pub fn set_clipboard_text(text: String) -> Result<(), String> {
  ignore_clipboard_text(text.clone());
  let mut clipboard = Clipboard::new().map_err(|error| error.to_string())?;
  clipboard.set_text(text).map_err(|error| error.to_string())
}

pub fn start_clipboard_listener(app: AppHandle) {
  thread::spawn(move || {
    let mut last_text = String::new();

    loop {
      thread::sleep(POLL_INTERVAL);

      let Ok(config) = config::read_config_value(&app) else {
        continue;
      };

      let listen_enabled = config
        .get("clipboardListen")
        .and_then(|value| value.as_bool())
        .unwrap_or(false);
      if !listen_enabled {
        continue;
      }

      let min_len = config
        .get("minTextLength")
        .and_then(|value| value.as_u64())
        .unwrap_or(2) as usize;
      let Ok(mut clipboard) = Clipboard::new() else {
        continue;
      };
      let Ok(text) = clipboard.get_text() else {
        continue;
      };

      let text = normalize_clipboard_text(&text);
      if text.len() < min_len || text == last_text || text.len() > MAX_CLIPBOARD_TEXT {
        continue;
      }

      if should_ignore_clipboard_text(&text) {
        last_text = text;
        continue;
      }

      last_text = text.clone();

      if let Some(translate_window) = app.get_webview_window("translate") {
        let _ = translate_window.emit("translate:set-text", text.clone());
      }
      if let Some(dynamic_island_window) = app.get_webview_window("dynamic-island") {
        let _ = dynamic_island_window.emit("translate:set-text", text.clone());
      }

      let auto_popup = config
        .get("autoPopupAfterCopy")
        .and_then(|value| value.as_bool())
        .unwrap_or(false);
      if auto_popup {
        let _ = window::show_translator_window(&app);
      }
    }
  });
}

fn normalize_clipboard_text(text: &str) -> String {
  text.trim().replace("\r\n", "\n")
}

fn ignored_texts() -> &'static Mutex<Vec<IgnoredClipboardText>> {
  IGNORED_TEXTS.get_or_init(|| Mutex::new(Vec::new()))
}

fn should_ignore_clipboard_text(text: &str) -> bool {
  let mut ignored = ignored_texts().lock().unwrap_or_else(|poisoned| poisoned.into_inner());
  prune_ignored_texts(&mut ignored);

  if let Some(index) = ignored.iter().position(|item| item.text == text) {
    ignored.remove(index);
    return true;
  }

  false
}

fn prune_ignored_texts(ignored: &mut Vec<IgnoredClipboardText>) {
  let now = Instant::now();
  ignored.retain(|item| now.duration_since(item.created_at) <= IGNORE_TTL);
}
