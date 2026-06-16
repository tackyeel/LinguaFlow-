mod clipboard;
mod config;
mod hotkey;
mod server;
mod tray;
mod window;

use tauri::WindowEvent;

pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      config::get_config,
      config::save_config,
      config::complete_setup,
      config::config_file_path,
      window::show_window,
      window::hide_window,
      window::quit_app
    ])
    .setup(|app| {
      config::ensure_config(app.handle())
        .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;
      tray::create_tray(app)?;
      server::start_health_server(app.handle().clone());
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
