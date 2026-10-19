import { describe, expect, it } from 'vitest';
import {
  ALERT_MIN_GAP_MS,
  initialModel,
  nextWakeAt,
  reduce,
  shown,
  type Alert,
  type NotchEvent,
  type NotchModel,
} from './machine';

const alert = (kind: Alert['kind'], duration_ms = 3000): Alert => ({ kind, duration_ms });

function run(events: NotchEvent[], from: NotchModel = initialModel()): NotchModel {
  return events.reduce(reduce, from);
}

describe('keadaan dasar', () => {
  // KF-001
  it('mulai dalam Resting', () => {
    expect(shown(initialModel())).toEqual({ kind: 'resting' });
  });

  // KF-002
  it('Resting → Closed saat media diputar, kembali saat berhenti', () => {
    const playing = run([{ type: 'media.playing' }]);
    expect(shown(playing)).toEqual({ kind: 'closed' });
    expect(shown(reduce(playing, { type: 'media.stopped' }))).toEqual({ kind: 'resting' });
  });
});

describe('hover', () => {
  // KF-003
  it('hover membuka Expanded untuk fitur terpilih', () => {
    const m = run([{ type: 'select', feature: 'timer' }, { type: 'hover.enter' }]);
    expect(shown(m)).toEqual({ kind: 'expanded', feature: 'timer' });
  });

  // KF-004
  it('hover.leave kembali ke Closed bila musik masih diputar', () => {
    const m = run([{ type: 'media.playing' }, { type: 'hover.enter' }, { type: 'hover.leave' }]);
    expect(shown(m)).toEqual({ kind: 'closed' });
  });

  // KF-004
  it('hover.leave kembali ke Resting tanpa musik', () => {
    const m = run([{ type: 'hover.enter' }, { type: 'hover.leave' }]);
    expect(shown(m)).toEqual({ kind: 'resting' });
  });

  // KF-002, KF-003
  it('media.playing saat Expanded tidak menutup Expanded', () => {
    const m = run([{ type: 'hover.enter' }, { type: 'media.playing' }]);
    expect(shown(m).kind).toBe('expanded');
  });
});

describe('lirik', () => {
  // KF-022
  it('Expanded(media) → Wide hanya bila lirik tersedia', () => {
    const base = run([{ type: 'select', feature: 'media' }, { type: 'hover.enter' }]);
    expect(shown(reduce(base, { type: 'lyrics.open', available: false })).kind).toBe('expanded');
    const wide = reduce(base, { type: 'lyrics.open', available: true });
    expect(shown(wide)).toEqual({ kind: 'wide' });
    expect(shown(reduce(wide, { type: 'lyrics.close' })).kind).toBe('expanded');
  });

  // KF-021
  it('lyrics.open diabaikan bila bukan fitur media', () => {
    const m = run([{ type: 'select', feature: 'timer' }, { type: 'hover.enter' }, { type: 'lyrics.open', available: true }]);
    expect(shown(m)).toEqual({ kind: 'expanded', feature: 'timer' });
  });

  // KF-004
  it('hover.leave dari Wide kembali ke dasar', () => {
    const m = run([
      { type: 'media.playing' },
      { type: 'select', feature: 'media' },
      { type: 'hover.enter' },
      { type: 'lyrics.open', available: true },
      { type: 'hover.leave' },
    ]);
    expect(shown(m)).toEqual({ kind: 'closed' });
  });
});

describe('alert', () => {
  // KF-005
  it('alert tampil lalu kembali ke keadaan sebelumnya', () => {
    const m = run([{ type: 'media.playing' }, { type: 'alert', alert: alert('reminder'), now: 0 }]);
    expect(shown(m)).toEqual({ kind: 'alert', alert: alert('reminder') });
    expect(shown(reduce(m, { type: 'alert.timeout', now: 3000 }))).toEqual({ kind: 'closed' });
  });

  // KF-005
  it('alert di atas Expanded kembali ke Expanded', () => {
    const m = run([
      { type: 'hover.enter' },
      { type: 'alert', alert: alert('deadline'), now: 0 },
      { type: 'alert.timeout', now: 3000 },
    ]);
    expect(shown(m).kind).toBe('expanded');
  });

  // KF-006
  it('alert berprioritas lebih rendah diantrekan', () => {
    const m = run([
      { type: 'alert', alert: alert('calendar'), now: 0 },
      { type: 'alert', alert: alert('reminder'), now: 100 },
    ]);
    expect(shown(m)).toEqual({ kind: 'alert', alert: alert('calendar') });
    expect(m.queue).toEqual([alert('reminder')]);
  });

  // KF-006
  it('charging menyela alert yang sedang tampil dan alert lama diantrekan', () => {
    const m = run([
      { type: 'alert', alert: alert('reminder'), now: 0 },
      { type: 'alert', alert: alert('charging'), now: 100 },
    ]);
    expect(shown(m)).toEqual({ kind: 'alert', alert: alert('charging') });
    expect(m.queue).toEqual([alert('reminder')]);
  });

  // KF-006
  it('antrean diurutkan berdasarkan prioritas', () => {
    const m = run([
      { type: 'alert', alert: alert('calendar'), now: 0 },
      { type: 'alert', alert: alert('summary'), now: 1 },
      { type: 'alert', alert: alert('deadline'), now: 2 },
      { type: 'alert', alert: alert('github'), now: 3 },
    ]);
    expect(m.queue.map((a) => a.kind)).toEqual(['deadline', 'github', 'summary']);
  });

  // KNF-010
  it('alert berikutnya ditunda sampai jeda minimum terpenuhi', () => {
    const m = run([
      { type: 'alert', alert: alert('calendar'), now: 0 },
      { type: 'alert', alert: alert('deadline'), now: 10 },
      { type: 'alert.timeout', now: 3000 },
    ]);
    expect(shown(m).kind).toBe('resting');
    expect(nextWakeAt(m)).toBe(ALERT_MIN_GAP_MS);
    const later = reduce(m, { type: 'tick', now: ALERT_MIN_GAP_MS });
    expect(shown(later)).toEqual({ kind: 'alert', alert: alert('deadline') });
  });

  // KNF-010
  it('alert baru tanpa alert aktif tetap menunggu jeda minimum', () => {
    const m = run([
      { type: 'alert', alert: alert('calendar'), now: 0 },
      { type: 'alert.timeout', now: 3000 },
      { type: 'alert', alert: alert('reminder'), now: 4000 },
    ]);
    expect(shown(m).kind).toBe('resting');
    expect(m.queue).toEqual([alert('reminder')]);
  });

  // KNF-010
  it('charging dikecualikan dari jeda minimum', () => {
    const m = run([
      { type: 'alert', alert: alert('calendar'), now: 0 },
      { type: 'alert.timeout', now: 3000 },
      { type: 'alert', alert: alert('charging'), now: 4000 },
    ]);
    expect(shown(m)).toEqual({ kind: 'alert', alert: alert('charging') });
  });

  // KF-005
  it('nextWakeAt menunjuk akhir durasi alert aktif', () => {
    const m = reduce(initialModel(), { type: 'alert', alert: alert('reminder', 5000), now: 1000 });
    expect(nextWakeAt(m)).toBe(6000);
  });

  // KF-005
  it('tidak ada jadwal bangun saat diam', () => {
    expect(nextWakeAt(initialModel())).toBeNull();
  });
});

describe('fokus', () => {
  // KF-043
  it('alert di bawah prioritas fokus ditahan selama fokus, dilepas setelahnya', () => {
    const m = run([
      { type: 'focus.started' },
      { type: 'alert', alert: alert('notification'), now: 0 },
    ]);
    expect(shown(m).kind).toBe('resting');
    expect(m.held).toEqual([alert('notification')]);
    const released = reduce(m, { type: 'focus.ended', now: 20_000 });
    expect(shown(released)).toEqual({ kind: 'alert', alert: alert('notification') });
    expect(released.held).toEqual([]);
  });

  // KF-043
  it('alert berprioritas tinggi tetap tampil selama fokus', () => {
    const m = run([{ type: 'focus.started' }, { type: 'alert', alert: alert('calendar'), now: 0 }]);
    expect(shown(m)).toEqual({ kind: 'alert', alert: alert('calendar') });
  });
});
