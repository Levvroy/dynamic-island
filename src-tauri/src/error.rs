use serde::Serialize;

/// Error returned by every command (ADR 0004). Serialized as `{ kind, message }`
/// so the frontend can branch on `kind`; mirrored in `src/lib/ipc/types.ts`.
#[derive(Debug, Serialize)]
#[serde(tag = "kind", content = "message", rename_all = "snake_case")]
pub enum AppError {
    InvalidArgument(String),
    Window(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::InvalidArgument(m) => write!(f, "invalid argument: {m}"),
            AppError::Window(m) => write!(f, "window: {m}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self {
        AppError::Window(e.to_string())
    }
}
