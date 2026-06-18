mod ai;
mod clipboard;
mod config;
mod history;
mod hotkey;
mod screenshot;
mod server;
mod tray;
mod window;

use tauri::WindowEvent;

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      config::get_config,
      config::save_config,
      config::complete_setup,
      config::config_file_path,
      ai::test_ai_provider,
      ai::ai_translate,
      ai::ai_translate_image,
      ai::ai_reply,
      clipboard::ignore_clipboard_text,
      clipboard::set_clipboard_text,
      history::get_history,
      history::append_history,
      history::clear_history,
      screenshot::capture_screen_clip,
      window::show_window,
      window::hide_window,
      window::resize_dynamic_island_window,
      window::switch_translator_window_mode,
      window::minimize_window,
      window::toggle_maximize_window,
      window::quit_app
    ])
    .setup(|app| {
      config::ensure_config(app.handle())
        .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;
      tray::create_tray(app)?;
      clipboard::start_clipboard_listener(app.handle().clone());
      server::start_health_server(app.handle().clone())
        .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;
      window::apply_startup_visibility(app.handle())
        .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;
      Ok(())
    })
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running LinguaFlow");
}
