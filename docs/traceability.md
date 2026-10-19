# Matriks Ketertelusuran

Status: **✗** belum ada · **◐** sebagian/baseline · **✓** terverifikasi (test hijau + validasi user).
Kolom modul berisi lokasi target. "baseline" berarti kode lama sudah ada tetapi belum sesuai standar.

| Kebutuhan | Prio | UC | Modul / file (target) | Test | Status |
|---|---|---|---|---|---|
| KF-001..007 | Must | UC-01 | `src/lib/notch/machine.ts`, `src/lib/notch/store.svelte.ts`, `Island.svelte`, `src-tauri/src/ipc/window.rs`, `domain/window.rs` | `machine.test.ts` (21), `domain::window::tests` (3) | ◐ test hijau, belum divalidasi user |
| KF-010..014 | Must | UC-02 | `app/media.rs`, `adapters/windows/smtc.rs`; baseline `media.rs` (stub Windows) | service + mock | ✗ |
| KF-020..023 | Should | UC-03 | `domain/lrc.rs`, `adapters/net/lrclib.rs` | unit parser, service + mock | ✗ |
| KF-030..034 | Must | UC-04 | `app/power.rs`, `adapters/windows/power.rs`; baseline `system.rs` (hardcode 100%) | service + mock | ✗ |
| KF-040..045 | Must | UC-05 | `domain/focus.rs`; baseline `timer.rs` | unit | ◐ |
| KF-050..052 | Should | UC-06 | `app/shelf.rs` | service | ✗ |
| KF-060..063 | Should | UC-07 | `domain/todo.rs`, `adapters/store/json.rs` | unit + store | ✗ |
| KF-070..073 | Should | UC-08 | `domain/water.rs` | unit (lintas tengah malam) | ✗ |
| KF-080..081 | Could | UC-09 | `adapters/windows/bluetooth.rs` | service + mock | ✗ |
| KF-090..093 | Must | UC-10 | `app/display.rs`, `adapters/windows/display.rs`; baseline `lib.rs` (posisi hardcode) | domain pemilihan monitor | ✗ |
| KF-100..104 | Should | UC-11 | `domain/ical.rs`, `adapters/net/calendar.rs` | unit parser + service | ✗ |
| KF-110..112 | Could | UC-12 | `adapters/windows/notifications.rs` (spike S-1); baseline `notifications.rs` (in-memory) | service + mock | ✗ |
| KF-120..122 | Could | UC-13 | `adapters/net/github.rs` | service + mock | ✗ |
| KF-130..131 | Could | UC-14 | `app/summary.rs` | service | ✗ |
| KF-140 | Could | UC-15 | (spike S-3) | — | ✗ |
| KF-150 | Won't | — | — | — | — |
| KF-160 | Won't | — | baseline `weather.rs`, `clipboard.rs`, `system.rs` | — | ◐ |
| KNF-001, 002 | Must | semua | ADR 0001 | ukur manual | ✗ |
| KNF-003 | Must | UC-01 | — | ukur manual | ✗ |
| KNF-004 | Must | UC-02 | — | log timestamp | ✗ |
| KNF-005 | Should | — | build | artefak CI | ✗ |
| KNF-006 | Must | semua | ADR 0004 | test adapter error | ✗ |
| KNF-007 | Must | UC-03, 11, 13 | `tauri.conf.json` CSP | review | ✗ |
| KNF-008 | Must | UC-01 | window menempel ukuran pil (`boundsFor`) | manual | ✗ belum diukur |
| KNF-009 | Must | UC-10 | — | log | ✗ |
| KNF-010 | Should | UC-01 | `machine.ts` (`ALERT_MIN_GAP_MS`) | `machine.test.ts` | ◐ |
| KNF-011 | Must | UC-13 | `SecretStore` | review | ✗ |
