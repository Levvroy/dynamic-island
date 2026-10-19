use crate::domain::window::{top_center, validate_size, Rect};
use crate::error::AppError;
use tauri::{LogicalPosition, LogicalSize, WebviewWindow};

/// Resizes the notch window to hug the pill and re-centers it at the top of its monitor.
#[tauri::command]
pub async fn window_set_bounds(
    window: WebviewWindow,
    width: f64,
    height: f64,
) -> Result<(), AppError> {
    validate_size(width, height).map_err(AppError::InvalidArgument)?;
    apply_bounds(&window, width, height)
}

pub fn apply_bounds(window: &WebviewWindow, width: f64, height: f64) -> Result<(), AppError> {
    let monitor = window
        .current_monitor()?
        .or(window.primary_monitor()?)
        .ok_or_else(|| AppError::Window("no monitor available".into()))?;
    let scale = monitor.scale_factor();
    let area = Rect {
        x: monitor.position().x as f64 / scale,
        y: monitor.position().y as f64 / scale,
        width: monitor.size().width as f64 / scale,
        height: monitor.size().height as f64 / scale,
    };
    let r = top_center(area, width, height);
    window.set_size(LogicalSize::new(r.width, r.height))?;
    window.set_position(LogicalPosition::new(r.x, r.y))?;
    Ok(())
}
