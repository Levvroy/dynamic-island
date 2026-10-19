# ADR 0002 — Satu state machine notch di frontend

Status: Diterima · 2026-10-19 · Refs: KF-001..007

## Konteks
Banyak fitur bersaing untuk satu area kecil (musik, alert charging, kalender, notifikasi). Tanpa model eksplisit, logika tampilan tersebar dan rawan konflik.

## Opsi
1. Setiap widget menentukan sendiri kapan tampil.
2. State machine di backend Rust.
3. **Satu state machine di frontend** dengan state eksplisit dan antrean alert berprioritas.

## Keputusan
Opsi 3. State: `Resting`, `Closed`, `Expanded(fitur)`, `Wide(lirik)`, `Alert(jenis)`. Transisi didokumentasikan di `architecture.md` §3 dan diuji dengan Vitest. Backend hanya mengirim fakta (event), sedangkan keputusan tampilan ada di frontend.

## Konsekuensi
+ Satu tempat untuk prioritas, durasi, dan antrean alert. Bisa diuji tanpa Tauri.
− Hover dan ukuran jendela perlu dikoordinasikan dengan backend (resize window), sehingga ada round-trip IPC.
