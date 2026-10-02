use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default();

  #[cfg(desktop)]
  {
    builder = builder.plugin(
      tauri_plugin_single_instance::init(|_app, _args, _cwd| {
        // Deep-link URL delivery is handled by the deep-link plugin.
      })
    );
  }

  builder = builder.plugin(tauri_plugin_deep_link::init());
  builder = builder.plugin(tauri_plugin_dialog::init());
  builder = builder.plugin(tauri_plugin_fs::init());
  builder = builder.plugin(tauri_plugin_shell::init());

  builder = builder.setup(|app| {
    #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
    {
      app.deep_link().register_all()?;
    }

    if cfg!(debug_assertions) {
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;
    }

    Ok(())
  });

  builder
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
