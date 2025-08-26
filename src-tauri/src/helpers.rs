use tauri::{ WebviewWindow};

/// 获取当前监视器与缩放比例（DPI 缩放）
/// Get current monitor and its scale factor.
///
/// 返回 `Some((monitor, scale))`，若失败返回 `None`。
/// Returns `Some((monitor, scale))`, or `None` on failure.
pub fn get_monitor_and_scale(window: &WebviewWindow) -> Option<(tauri::Monitor, f64)> {
    if let Ok(Some(m)) = window.current_monitor() {
        Some((m.clone(), m.scale_factor()))
    } else if let Ok(Some(m)) = window.primary_monitor() {
        Some((m.clone(), m.scale_factor()))
    } else {
        None
    }
}

/// 物理像素→逻辑像素（f64）
/// Physical pixels → logical (DIP) pixels (f64).
#[inline]
pub fn phys_to_dip_u32(v: u32, scale: f64) -> f64 {
    (v as f64) / scale
}

/// 获取窗口外部尺寸（逻辑像素）
/// Get window outer size in logical pixels (DIP).
///
/// 返回 `(width, height)`，出错返回字符串错误信息。
/// Returns `(width, height)` or an error string on failure.
pub fn outer_size_in_dip(window: &WebviewWindow, scale: f64) -> Result<(f64, f64), String> {
    let outer_phys = window.outer_size().map_err(|e| e.to_string())?;
    let outer_logical = outer_phys.to_logical::<f64>(scale);
    Ok((outer_logical.width, outer_logical.height))
}

/// 将监视器物理尺寸转换为逻辑尺寸（f64,f64）
/// Convert monitor physical size to logical (DIP) size (f64, f64).
pub fn monitor_size_in_dip(monitor: &tauri::Monitor, scale: f64) -> (f64, f64) {
    let s = monitor.size();
    (
        phys_to_dip_u32(s.width, scale),
        phys_to_dip_u32(s.height, scale),
    )
}
