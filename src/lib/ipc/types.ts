// TS mirrors of Rust IPC types. Field names stay snake_case to match serde defaults.

/** Mirrors `AppError` in src-tauri/src/error.rs. */
export type AppError =
  | { kind: 'invalid_argument'; message: string }
  | { kind: 'window'; message: string };

/** Arguments of the `window_set_bounds` command (logical pixels). */
export interface WindowBounds {
  width: number;
  height: number;
}
