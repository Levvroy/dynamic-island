import { setWindowBounds } from '$lib/ipc/window';
import type { WindowBounds } from '$lib/ipc/types';
import {
  boundsFor,
  initialModel,
  nextWakeAt,
  reduce,
  shown,
  type NotchEvent,
  type NotchModel,
} from './machine';

// Matches the CSS size transition in Island.svelte; the window shrinks only after it ends.
const SHRINK_DELAY_MS = 320;
// Short grace period so brushing past the edge does not collapse the notch.
const LEAVE_DELAY_MS = 400;

export class NotchStore {
  model = $state<NotchModel>(initialModel());
  view = $derived(shown(this.model));

  #wake: ReturnType<typeof setTimeout> | undefined;
  #shrink: ReturnType<typeof setTimeout> | undefined;
  #leave: ReturnType<typeof setTimeout> | undefined;
  #bounds: WindowBounds = boundsFor({ kind: 'resting' });

  dispatch(e: NotchEvent): void {
    this.model = reduce(this.model, e);
    this.#schedule();
    this.#resize();
  }

  hoverEnter(): void {
    clearTimeout(this.#leave);
    this.dispatch({ type: 'hover.enter' });
  }

  hoverLeave(): void {
    clearTimeout(this.#leave);
    this.#leave = setTimeout(() => this.dispatch({ type: 'hover.leave' }), LEAVE_DELAY_MS);
  }

  destroy(): void {
    clearTimeout(this.#wake);
    clearTimeout(this.#shrink);
    clearTimeout(this.#leave);
  }

  #schedule(): void {
    clearTimeout(this.#wake);
    const at = nextWakeAt(this.model);
    if (at === null) return;
    this.#wake = setTimeout(() => this.dispatch({ type: 'tick', now: Date.now() }), Math.max(0, at - Date.now()));
  }

  #resize(): void {
    const target = boundsFor(this.view);
    const cur = this.#bounds;
    if (target.width === cur.width && target.height === cur.height) return;
    clearTimeout(this.#shrink);
    // Grow first so the CSS transition is never clipped, then settle on the exact size.
    const grown = { width: Math.max(cur.width, target.width), height: Math.max(cur.height, target.height) };
    this.#apply(grown);
    if (grown.width !== target.width || grown.height !== target.height) {
      this.#shrink = setTimeout(() => this.#apply(target), SHRINK_DELAY_MS);
    }
  }

  #apply(b: WindowBounds): void {
    this.#bounds = b;
    setWindowBounds(b).catch((err: unknown) => console.error('window_set_bounds failed', err));
  }
}
