use tauri::{command, AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Size};

use crate::helpers::{get_monitor_and_scale, monitor_size_in_dip, outer_size_in_dip};

/// 退出：关闭 chat 与 main 窗口
/// Exit: close both `chat` and `main` windows.
#[command]
pub async fn exit(app_handle: AppHandle) -> Result<String, String> {
    if let Some(chat_window) = app_handle.get_webview_window("chat") {
        if let Err(e) = chat_window.close() {
            eprintln!("Failed to close chat window: {}", e);
        }
    } else {
        eprintln!("Chat window not found.");
    }

    if let Some(main_window) = app_handle.get_webview_window("main") {
        if let Err(e) = main_window.close() {
            eprintln!("Failed to close main window: {}", e);
        }
    } else {
        eprintln!("Main window not found.");
    }

    println!("Windows closed successfully");
    Ok("Exit completed successfully".to_string())
}

/// 显示 chat 窗口并聚焦；隐藏 main
/// Show and focus the `chat` window; hide `main`.
#[command]
pub async fn show_chat_window(app_handle: AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main").unwrap();
    main_window.hide().unwrap();

    if let Some(chat_window) = app_handle.get_webview_window("chat") {
        match chat_window.show() {
            Ok(_) => {
                chat_window.set_focus().map_err(|e| e.to_string())?;
                if let Err(e) = chat_window.emit("chat-window-shown", ()) {
                    eprintln!("Failed to emit chat-window-shown event: {}", e);
                }
                Ok(())
            }
            Err(e) => Err(format!("无法显示聊天窗口: {}", e)),
        }
    } else {
        Err("未找到名为 'ChatWindow' 的窗口".into())
    }
}

/// 隐藏 chat 窗口；显示 main
/// Hide the `chat` window; show `main`.
#[command]
pub async fn hide_chat_window(app_handle: AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main").unwrap();
    main_window.show().unwrap();

    if let Some(chat_window) = app_handle.get_webview_window("chat") {
        match chat_window.hide() {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("无法隐藏聊天窗口: {}", e)),
        }
    } else {
        Err("未找到名为 'ChatWindow' 的窗口".into())
    }
}

/// 压缩 chat 窗口到固定尺寸并贴近左下
/// Compress `chat` window to fixed size and snap near bottom-left.
#[command]
pub async fn compress_chat_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(chat_window) = app_handle.get_webview_window("chat") {
        if let Some((monitor, scale)) = get_monitor_and_scale(&chat_window) {
            // 目标（DIP）/ Target size in DIP
            let target_w_dip = 360.0;
            let target_h_dip = 720.0;

            chat_window
                .set_size(Size::Logical(LogicalSize::new(target_w_dip, target_h_dip)))
                .unwrap();

            // 底部对齐 + 左边 18.6 DIP，底边距 120 DIP
            // Bottom aligned, left margin 18.6 DIP, bottom margin 120 DIP
            let margin_x_dip = 18.6;
            let margin_y_dip = 120.0;

            let (_, monitor_h_dip) = monitor_size_in_dip(&monitor, scale);
            let (_, win_h_dip) = outer_size_in_dip(&chat_window, scale)?;
            let pos_x = margin_x_dip;
            let pos_y = (monitor_h_dip - win_h_dip - margin_y_dip).max(0.0);

            let _ = chat_window.set_position(LogicalPosition::new(pos_x, pos_y));
        }
        Ok(())
    } else {
        Err("未找到名为 'chat' 的窗口".into())
    }
}

/// 扩展 chat 窗口：靠左底对齐，宽度占屏减边距
/// Expand `chat` window: bottom-left aligned, wide with margins.
#[command]
pub async fn expand_chat_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(chat_window) = app_handle.get_webview_window("chat") {
        if let Some((monitor, scale)) = get_monitor_and_scale(&chat_window) {
            let (monitor_w_dip, monitor_h_dip) = monitor_size_in_dip(&monitor, scale);

            // 统一 DIP 计算 / DIP-based math
            let total_margin_x_dip = 260.0;
            let extra_h_dip = 40.0;

            let new_width_dip = (monitor_w_dip - total_margin_x_dip).max(0.0);
            let new_height_dip = (monitor_h_dip * 0.854) + extra_h_dip;

            chat_window
                .set_size(Size::Logical(LogicalSize::new(new_width_dip, new_height_dip)))
                .unwrap();

            // 定位（底部对齐 + 左 130 DIP，底 40 DIP）
            // Position: bottom-aligned, left 130 DIP, bottom 40 DIP
            let margin_x_dip = 130.0;
            let margin_y_dip = 40.0;

            let (_, win_h_dip) = outer_size_in_dip(&chat_window, scale)?;
            let pos_x = margin_x_dip;
            let pos_y = (monitor_h_dip - win_h_dip - margin_y_dip).max(0.0);

            let _ = chat_window.set_position(LogicalPosition::new(pos_x, pos_y));
        }
        Ok(())
    } else {
        Err("未找到名为 'chat' 的窗口".into())
    }
}

/// 压缩主停靠区大小（隐藏）
/// Shrink main dock size (hide-like effect).
pub fn main_dock_hided(app_handle: AppHandle) -> Result<(), String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let w_dip = 3.0;
        let h_dip = 52.0;
        main_window
            .set_size(Size::Logical(LogicalSize::new(w_dip, h_dip)))
            .unwrap();
        Ok(())
    } else {
        Err("未找到名为 'chat' 的窗口".into())
    }
}

/// 恢复主停靠区大小
/// Restore main dock size.
pub fn main_should_recover(app_handle: AppHandle) -> Result<(), String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let w_dip = 52.0;
        let h_dip = 52.0;
        main_window
            .set_size(Size::Logical(LogicalSize::new(w_dip, h_dip)))
            .unwrap();
        Ok(())
    } else {
        Err("未找到名为 'chat' 的窗口".into())
    }
}

/// 重置主窗口（先缩后复，保持与原逻辑一致）
/// Reset main window (shrink then recover, same as original flow).
#[command]
pub fn reset_main_window(app_handle: AppHandle) {
    main_dock_hided(app_handle.clone()).unwrap();
    main_should_recover(app_handle.clone()).unwrap();
}
