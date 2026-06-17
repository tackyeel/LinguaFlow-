use serde_json::Value;
use std::fs;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn get_history(app: AppHandle) -> Result<Vec<Value>, String> {
  read_history(&app)
}

#[tauri::command]
pub fn append_history(app: AppHandle, entry: Value) -> Result<Value, String> {
  append_history_entry(&app, entry)
}

#[tauri::command]
pub fn clear_history(app: AppHandle) -> Result<(), String> {
  let path = history_path(&app)?;
  fs::write(path, "[]").map_err(|error| error.to_string())
}

pub fn append_history_entry(app: &AppHandle, entry: Value) -> Result<Value, String> {
  let mut history = read_history(&app).unwrap_or_default();
  let mut next = entry;

  if next.get("id").and_then(Value::as_str).unwrap_or("").is_empty() {
    next["id"] = Value::String(format!(
      "history-{}",
      std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis()
    ));
  }

  history.insert(0, next.clone());
  if history.len() > 500 {
    history.truncate(500);
  }

  let path = history_path(&app)?;
  let serialized = serde_json::to_string_pretty(&history).map_err(|error| error.to_string())?;
  fs::write(path, serialized).map_err(|error| error.to_string())?;
  Ok(next)
}

fn read_history(app: &AppHandle) -> Result<Vec<Value>, String> {
  let path = history_path(app)?;
  if !path.exists() {
    fs::write(&path, "[]").map_err(|error| error.to_string())?;
  }

  let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
  let value: Value =
    serde_json::from_str(raw.trim_start_matches('\u{feff}')).map_err(|error| error.to_string())?;
  Ok(value
    .as_array()
    .cloned()
    .unwrap_or_default()
    .into_iter()
    .filter(|item| item.is_object())
    .collect())
}

fn history_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
  let dir = app.path().app_config_dir().map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir.join("history.json"))
}
