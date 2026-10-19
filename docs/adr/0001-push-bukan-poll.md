# ADR 0001 — Push event OS, bukan polling frontend

Status: Diterima · 2026-10-19 · Refs: KNF-001, KNF-004

## Konteks
Baseline mem-poll semua data sistem dari frontend lewat `setInterval` (1–60 detik), dan `get_cpu_usage` bahkan memakai `sleep(200ms)`. Polling membangunkan WebView2 dan Rust terus-menerus, sehingga bertentangan dengan KNF-001 (CPU < 0,5% saat Resting).

## Opsi
1. Polling dengan interval lebih jarang. Murah, tetapi latensi naik (melanggar KNF-004) dan CPU tetap terpakai.
2. Polling di backend, lalu emit hanya kalau ada perubahan. Lebih baik, tetapi tetap ada wake-up periodik.
3. **Berlangganan event OS** (SMTC, power, display), lalu backend emit event Tauri.

## Keputusan
Opsi 3. `setInterval` di frontend dilarang untuk data sistem. Pengecualiannya hanya dua: jam UI (1 Hz, hanya saat terlihat) dan progres lagu, yang dihitung lokal dari `position + (now − timestamp)`. Sumber tanpa event (kalender URL, GitHub) di-poll **di backend** dengan interval ≥ 5 menit dan backoff.

## Konsekuensi
+ CPU idle mendekati nol, dan latensi ditentukan oleh OS.
− Setiap adapter harus mengelola langganan dan unsubscribe. Lebih kompleks dan butuh test dengan mock.
