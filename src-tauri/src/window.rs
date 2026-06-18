use tauri::{utils::config::Color, AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, Position, Size, WebviewWindow};

use crate::config;

const WINDOW_LABELS: [&str; 5] = ["settings", "translate", "dynamic-island", "hotkey-recorder", "screenshot-overlay"];
const DYNAMIC_ISLAND_COLLAPSED: (u32, u32) = (340, 64);
const DYNAMIC_ISLAND_EXPANDED: (u32, u32) = (724, 410);
const TRANSPARENT: Color = Color(0, 0, 0, 0);

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
  if label == "translate" {
    return show_translator_window(&app);
  }
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
pub fn minimize_window(window: WebviewWindow) -> Result<(), String> {
  window.minimize().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn toggle_maximize_window(window: WebviewWindow) -> Result<(), String> {
  let maximized = window.is_maximized().map_err(|error| error.to_string())?;
  if maximized {
    window.unmaximize().map_err(|error| error.to_string())
  } else {
    window.maximize().map_err(|error| error.to_string())
  }
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
  app.exit(0);
}

pub fn show_window_by_label(app: &AppHandle, label: &str) -> Result<(), String> {
  let window = app
    .get_webview_window(label)
    .ok_or_else(|| format!("window '{label}' was not found"))?;

  if label == "dynamic-island" {
    position_dynamic_island(app, false)?;
    window.set_background_color(Some(TRANSPARENT)).map_err(|error| error.to_string())?;
    window.set_shadow(false).map_err(|error| error.to_string())?;
    window.set_always_on_top(true).map_err(|error| error.to_string())?;
  }

  window.show().map_err(|error| error.to_string())?;
  window.unminimize().map_err(|error| error.to_string())?;
  window.set_focus().map_err(|error| error.to_string())?;
  Ok(())
}

pub fn show_translator_window(app: &AppHandle) -> Result<(), String> {
  let config_value = config::read_config_value(app)?;
  let mode = config_value
    .get("translatorWindowMode")
    .and_then(serde_json::Value::as_str)
    .unwrap_or("normal");

  if mode == "dynamicIsland" {
    if let Some(window) = app.get_webview_window("translate") {
      let _ = window.hide();
    }
    show_window_by_label(app, "dynamic-island")
  } else {
    if let Some(window) = app.get_webview_window("dynamic-island") {
      let _ = window.hide();
    }
    show_window_by_label(app, "translate")
  }
}

#[tauri::command]
pub fn resize_dynamic_island_window(app: AppHandle, expanded: bool) -> Result<(), String> {
  position_dynamic_island(&app, expanded)
}

#[tauri::command]
pub fn switch_translator_window_mode(app: AppHandle, mode: String) -> Result<(), String> {
  let normalized = if mode == "dynamicIsland" { "dynamicIsland" } else { "normal" };
  let mut config_value = config::read_config_value(&app)?;
  config_value["translatorWindowMode"] = serde_json::Value::String(normalized.to_string());
  let saved = config::save_config_value(&app, config_value)?;
  let _ = app.emit("config:updated", saved);

  if normalized == "dynamicIsland" {
    if let Some(window) = app.get_webview_window("translate") {
      let _ = window.hide();
    }
    show_window_by_label(&app, "dynamic-island")
  } else {
    if let Some(window) = app.get_webview_window("dynamic-island") {
      let _ = window.hide();
    }
    show_window_by_label(&app, "translate")
  }
}

fn position_dynamic_island(app: &AppHandle, expanded: bool) -> Result<(), String> {
  let window = app
    .get_webview_window("dynamic-island")
    .ok_or_else(|| "window 'dynamic-island' was not found".to_string())?;
  window.set_background_color(Some(TRANSPARENT)).map_err(|error| error.to_string())?;
  window.set_shadow(false).map_err(|error| error.to_string())?;
  let (width, height) = if expanded {
    DYNAMIC_ISLAND_EXPANDED
  } else {
    DYNAMIC_ISLAND_COLLAPSED
  };

  let monitor = window
    .primary_monitor()
    .map_err(|error| error.to_string())?
    .or_else(|| window.current_monitor().ok().flatten())
    .ok_or_else(|| "no monitor available for dynamic island positioning".to_string())?;
  let monitor_size = monitor.size();
  let monitor_position = monitor.position();
  let scale_factor = monitor.scale_factor();
  let physical_width = (width as f64 * scale_factor).round() as u32;
  let x = monitor_position.x + ((monitor_size.width.saturating_sub(physical_width)) / 2) as i32;
  let y = monitor_position.y;

  window
    .set_size(Size::Logical(LogicalSize {
      width: width as f64,
      height: height as f64,
    }))
    .map_err(|error| error.to_string())?;
  window
    .set_position(Position::Physical(PhysicalPosition { x, y }))
    .map_err(|error| error.to_string())?;
  Ok(())
}

pub fn show_history(app: &AppHandle) -> Result<(), String> {
  show_window_by_label(app, "settings")?;
  if let Some(window) = app.get_webview_window("settings") {
    let _ = window.emit("settings:navigate", "history");
  }
  Ok(())
}
