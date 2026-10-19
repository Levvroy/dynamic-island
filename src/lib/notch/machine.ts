// Pure notch state machine (ADR 0002). No timers, no Tauri: the store feeds it
// events and the current time, and schedules a `tick` at `nextWakeAt`.

export type FeatureId = 'media' | 'system' | 'weather' | 'notifications' | 'timer' | 'clipboard';

export type AlertKind =
  | 'charging'
  | 'calendar'
  | 'deadline'
  | 'focus'
  | 'notification'
  | 'github'
  | 'reminder'
  | 'summary';

export interface Alert {
  kind: AlertKind;
  duration_ms: number;
  payload?: Record<string, unknown>;
}

const PRIORITY: Record<AlertKind, number> = {
  charging: 8,
  calendar: 7,
  deadline: 6,
  focus: 5,
  notification: 4,
  github: 3,
  reminder: 2,
  summary: 1,
};

/** KNF-010: minimum gap between alert starts, except charging. */
export const ALERT_MIN_GAP_MS = 10_000;

export type Shown =
  | { kind: 'resting' }
  | { kind: 'closed' }
  | { kind: 'expanded'; feature: FeatureId }
  | { kind: 'wide' }
  | { kind: 'alert'; alert: Alert };

export interface NotchModel {
  mediaPlaying: boolean;
  selected: FeatureId;
  /** Hover-driven layer above the base state; null means show the base. */
  overlay: 'expanded' | 'wide' | null;
  active: { alert: Alert; until: number } | null;
  queue: Alert[];
  /** Alerts suppressed while a focus phase runs (KF-043). */
  held: Alert[];
  focusActive: boolean;
  lastShownAt: number | null;
}

export type NotchEvent =
  | { type: 'media.playing' }
  | { type: 'media.stopped' }
  | { type: 'select'; feature: FeatureId }
  | { type: 'hover.enter' }
  | { type: 'hover.leave' }
  | { type: 'lyrics.open'; available: boolean }
  | { type: 'lyrics.close' }
  | { type: 'alert'; alert: Alert; now: number }
  | { type: 'alert.timeout'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'focus.started' }
  | { type: 'focus.ended'; now: number };

export function initialModel(): NotchModel {
  return {
    mediaPlaying: false,
    selected: 'system',
    overlay: null,
    active: null,
    queue: [],
    held: [],
    focusActive: false,
    lastShownAt: null,
  };
}

export function shown(m: NotchModel): Shown {
  if (m.active) return { kind: 'alert', alert: m.active.alert };
  if (m.overlay === 'wide') return { kind: 'wide' };
  if (m.overlay === 'expanded') return { kind: 'expanded', feature: m.selected };
  return m.mediaPlaying ? { kind: 'closed' } : { kind: 'resting' };
}

/** When the store must send the next `tick`, or null if nothing is pending. */
export function nextWakeAt(m: NotchModel): number | null {
  if (m.active) return m.active.until;
  if (m.queue.length > 0 && m.lastShownAt !== null) return m.lastShownAt + ALERT_MIN_GAP_MS;
  return null;
}

function enqueue(queue: Alert[], items: Alert[]): Alert[] {
  // Stable sort keeps arrival order among equal priorities.
  return [...queue, ...items].sort((a, b) => PRIORITY[b.kind] - PRIORITY[a.kind]);
}

function promote(m: NotchModel, now: number): NotchModel {
  if (m.active || m.queue.length === 0) return m;
  const [head, ...rest] = m.queue;
  const gapOk = m.lastShownAt === null || now - m.lastShownAt >= ALERT_MIN_GAP_MS;
  if (head.kind !== 'charging' && !gapOk) return m;
  return { ...m, active: { alert: head, until: now + head.duration_ms }, queue: rest, lastShownAt: now };
}

function raise(m: NotchModel, a: Alert, now: number): NotchModel {
  if (m.focusActive && PRIORITY[a.kind] < PRIORITY.focus) {
    return { ...m, held: [...m.held, a] };
  }
  // Charging is the only alert that interrupts; everything else waits its turn.
  if (m.active && a.kind === 'charging' && m.active.alert.kind !== 'charging') {
    return {
      ...m,
      active: { alert: a, until: now + a.duration_ms },
      queue: enqueue(m.queue, [m.active.alert]),
      lastShownAt: now,
    };
  }
  return promote({ ...m, queue: enqueue(m.queue, [a]) }, now);
}

export function reduce(m: NotchModel, e: NotchEvent): NotchModel {
  switch (e.type) {
    case 'media.playing':
      return { ...m, mediaPlaying: true };
    case 'media.stopped':
      return { ...m, mediaPlaying: false, overlay: m.overlay === 'wide' ? 'expanded' : m.overlay };
    case 'select':
      return {
        ...m,
        selected: e.feature,
        overlay: m.overlay === 'wide' && e.feature !== 'media' ? 'expanded' : m.overlay,
      };
    case 'hover.enter':
      return { ...m, overlay: m.overlay ?? 'expanded' };
    case 'hover.leave':
      return { ...m, overlay: null };
    case 'lyrics.open':
      return m.overlay === 'expanded' && m.selected === 'media' && e.available
        ? { ...m, overlay: 'wide' }
        : m;
    case 'lyrics.close':
      return m.overlay === 'wide' ? { ...m, overlay: 'expanded' } : m;
    case 'alert':
      return raise(m, e.alert, e.now);
    case 'alert.timeout':
      return promote({ ...m, active: null }, e.now);
    case 'tick':
      if (m.active && e.now >= m.active.until) return promote({ ...m, active: null }, e.now);
      return promote(m, e.now);
    case 'focus.started':
      return { ...m, focusActive: true };
    case 'focus.ended':
      return promote({ ...m, focusActive: false, queue: enqueue(m.queue, m.held), held: [] }, e.now);
  }
}

/** Logical window size per state; the window hugs the pill so clicks outside it reach other apps (KF-007). */
export function boundsFor(s: Shown): { width: number; height: number } {
  switch (s.kind) {
    case 'resting':
      return { width: 200, height: 36 };
    case 'closed':
      return { width: 300, height: 36 };
    case 'expanded':
      return { width: 420, height: 300 };
    case 'wide':
      return { width: 560, height: 200 };
    case 'alert':
      return { width: 360, height: 64 };
  }
}
