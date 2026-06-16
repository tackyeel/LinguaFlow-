use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

use crate::config;

const WINDOW_LABELS: [&str; 4] = ["settings", "translate", "hotkey-recorder", "screenshot-overlay"];

pub fn apply_startup_visibility(app: &AppHandle) -> Result<(), String> {
  let config = config::read_config_value(app)?;

  if config::should_show_settings(&config) {
    show_window_by_label(app, "settings")?;
  } else {
    for label in WINDOW_LABELS {
      if let Some(window) = app.get_webview_window(label) {
        let _ = window.hide();
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub fn show_window(app: AppHandle, label: String) -> Result<(), String> {
  show_window_by_label(&app, &label)
}

#[tauri::command]
pub fn hide_window(window: WebviewWindow, app: AppHandle, label: Option<String>) -> Result<(), String> {
  if let Some(label) = label {
    if let Some(target) = app.get_webview_window(&label) {
      target.hide().map_err(|error| error.to_string())?;
    }
    return Ok(());
  }

  window.hide().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
  app.exit(0);
}

pub fn show_window_by_label(app: &AppHandle, label: &str) -> Result<(), String> {
  let window = app
    .get_webview_window(label)
    .ok_or_else(|| format!("window '{label}' was not found"))?;

  window.show().map_err(|error| error.to_string())?;
  window.unminimize().map_err(|error| error.to_string())?;
  window.set_focus().map_err(|error| error.to_string())?;
  Ok(())
}

pub fn show_history(app: &AppHandle) -> Result<(), String> {
  show_window_by_label(app, "settings")?;
  if let Some(window) = app.get_webview_window("settings") {
    let _ = window.emit("settings:navigate", "history");
  }
  Ok(())
}
