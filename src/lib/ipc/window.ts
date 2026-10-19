import { invoke } from '@tauri-apps/api/core';
import type { WindowBounds } from './types';

export function setWindowBounds(bounds: WindowBounds): Promise<void> {
  return invoke<void>('window_set_bounds', { width: bounds.width, height: bounds.height });
}
