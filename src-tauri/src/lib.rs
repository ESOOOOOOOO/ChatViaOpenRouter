#![cfg_attr(mobile, tauri::mobile_entry_point)]

mod helpers;
mod api;
mod windows;

use tauri::{Emitter, LogicalPosition, Manager};
use helpers::{get_monitor_and_scale, monitor_size_in_dip, outer_size_in_dip};

/// 应用入口：注册插件、命令与窗口初始化
/// App entry: register plugins, commands, and window positioning.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            api::get_open_router_models,
            api::fetch_chat_title,
            api::proxy_stream,
            windows::exit,
            windows::show_chat_window,
            windows::hide_chat_window,
            windows::compress_chat_window,
            windows::expand_chat_window,
            windows::reset_main_window
        ])
        .setup(|app| {
            // ========== main 窗口初始化：左下角定位（DIP） / place main at bottom-left ==========
            let main_window = app.get_webview_window("main").unwrap();

            if let Some((monitor, scale)) = get_monitor_and_scale(&main_window) {
                // 边距（DIP）
                let margin_x_dip = 0.0;
                let margin_y_dip = 40.0;

                // 读取屏幕与窗口高度（DIP）
                let (_, monitor_h_dip) = monitor_size_in_dip(&monitor, scale);
                let (_, win_h_dip) = outer_size_in_dip(&main_window, scale)?;
                let pos_x = margin_x_dip;
                let pos_y = (monitor_h_dip - win_h_dip - margin_y_dip).max(0.0);

                main_window.set_position(LogicalPosition::new(pos_x, pos_y))?;
                main_window.show().unwrap();
            }

            // ========== chat 窗口初始化：只定位不改大小 / position only ==========
            let chat_window = app.get_webview_window("chat").unwrap();
            if let Some((monitor, scale)) = get_monitor_and_scale(&chat_window) {
                let (_monitor_w_dip, monitor_h_dip) = monitor_size_in_dip(&monitor, scale);
                let (_win_w_dip, win_h_dip) = outer_size_in_dip(&chat_window, scale)?;

                // 左下角，左 18.6 DIP，底 120 DIP
                // bottom-left: left 18.6 DIP, bottom 120 DIP
                let pos_x = 18.6;
                let pos_y = (monitor_h_dip - win_h_dip - 120.0).max(0.0);

                let _ = chat_window.set_position(LogicalPosition::new(pos_x, pos_y));
            }

            // ========== chat 失焦切回 main，并通知前端隐藏 chat ==========
            let app_handle = app.handle().clone();
            let chat_window = app.get_webview_window("chat").unwrap();
            chat_window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(focused) = event {
                    if !focused {
                        let handle = app_handle.clone();
                        let _ = handle.emit_to("chat", "should-hide-chat-window", ());
                        if let Some(main) = handle.get_webview_window("main") {
                            let _ = main.set_focus();
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
