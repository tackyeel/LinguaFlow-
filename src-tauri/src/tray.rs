use tauri::{
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use crate::{config, window};

pub fn create_tray(app: &mut tauri::App) -> tauri::Result<()> {
  let open_translate = MenuItem::with_id(app, "open_translate", "打开翻译窗口", true, None::<&str>)?;
  let open_settings = MenuItem::with_id(app, "open_settings", "打开设置", true, None::<&str>)?;
  let toggle_clipboard =
    MenuItem::with_id(app, "toggle_clipboard", "暂停/开启剪贴板监听", true, None::<&str>)?;
  let history = MenuItem::with_id(app, "history", "查看历史记录", true, None::<&str>)?;
  let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
  let separator = PredefinedMenuItem::separator(app)?;

  let menu = Menu::with_items(
    app,
    &[
      &open_translate,
      &open_settings,
      &toggle_clipboard,
      &history,
      &separator,
      &quit,
    ],
  )?;

  TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .tooltip("LinguaFlow")
    .menu(&menu)
    .show_menu_on_left_click(false)
    .on_menu_event(|app, event| match event.id.as_ref() {
      "open_translate" => {
        let _ = window::show_window_by_label(app, "translate");
      }
      "open_settings" => {
        let _ = window::show_window_by_label(app, "settings");
      }
      "toggle_clipboard" => {
        let _ = config::toggle_clipboard_listen(app);
      }
      "history" => {
        let _ = window::show_history(app);
      }
      "quit" => app.exit(0),
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let app = tray.app_handle();
        let _ = window::show_window_by_label(app, "settings");
      }
    })
    .build(app)?;

  Ok(())
}
